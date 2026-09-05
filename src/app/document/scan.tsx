import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { setScanResult } from '@/services/scanStore';

type ScanStep = 'front' | 'selfie' | 'done';

/** Document scan — captures front of document (+ selfie for portrait documents) using expo-camera.
 *  Per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6:
 *  - Capture frontImageBase64 (required)
 *  - Capture selfieImageBase64 (for face match on portrait documents)
 *  - Images sent as base64 in the /verify call (NOT as object keys)
 *  - Regula runs server-side for OCR + authenticity + face match
 *  Family mode: when `family` param is set, routes to family/add/processing
 *  after capture instead of the user document processing screen. Birth
 *  certificates (0-4) skip the selfie step — no portrait, no face match. */
export default function DocumentScanScreen() {
  const router = useRouter();
  const { type, family, personId, name, dob, relationship, band } = useLocalSearchParams<{
    type?: string;
    family?: string;
    personId?: string;
    name?: string;
    dob?: string;
    relationship?: string;
    band?: string;
  }>();
  const isFamilyMode = family === '1';
  const isDocOnly = type === 'birthCertificate';
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [step, setStep] = useState<ScanStep>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  // Request permission on mount if not yet determined
  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (!photo?.uri) return;

      // Per KYC guide §6.3: resize to ~1600px + JPEG 0.8 before sending.
      // Raw camera captures are 2-6 MB of base64 each; large payloads get
      // dropped by proxies in transit, which the backend reports as
      // 503 "Document images are required".
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      const base64 = manipulated.base64 ?? '';
      if (!base64) return;

      if (step === 'front') {
        setFrontImage(base64);
        // Doc-only documents (birthCertificate, 0-4) have no portrait — skip selfie
        setStep(isDocOnly ? 'done' : 'selfie');
      } else if (step === 'selfie') {
        setSelfieImage(base64);
        setStep('done');
      }
    } catch {
      // Ignore capture errors — let user retry
    } finally {
      setCapturing(false);
    }
  };

  const handleContinue = () => {
    // Store captured images for processing screen
    setScanResult({
      documentImageBase64: frontImage ?? undefined,
      selfieBase64: selfieImage ?? undefined,
    });

    if (isFamilyMode) {
      // Family flow — member is created (or document added) AFTER document capture
      router.replace({
        pathname: '/family/add/processing',
        params: {
          type: type ?? 'idCard',
          personId: personId ?? '',
          name: name ?? '',
          dob: dob ?? '',
          relationship: relationship ?? '',
          band: band ?? '',
        },
      });
      return;
    }

    router.push({
      pathname: '/document/processing',
      params: { type: type ?? 'passport' },
    });
  };

  const handleRetake = () => {
    if (step === 'selfie') {
      setFrontImage(null);
      setStep('front');
    } else if (step === 'done') {
      setSelfieImage(null);
      setStep('selfie');
    }
  };

  // Permission not yet determined — show loading
  if (permission === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-white">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <Text className="mb-4 text-center text-[16px] text-white">
          Camera permission is required for document scanning.
        </Text>
        <Pressable onPress={requestPermission} className="rounded-btn bg-primary px-6 py-3">
          <Text className="text-[14px] font-bold text-white">Grant Permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Done — show review and continue
  if (step === 'done') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <Text className="mb-2 text-[20px] font-bold text-white">Capture Complete!</Text>
        <Text className="mb-8 text-center text-[14px] text-white/70 px-6">
          Document and selfie captured successfully.{"\n"}
          Tap continue to verify.
        </Text>
        <View className="flex-row gap-3">
          <Pressable onPress={handleRetake} className="rounded-btn border border-white/30 px-6 py-3">
            <Text className="text-[14px] font-bold text-white">Retake Selfie</Text>
          </Pressable>
          <Pressable onPress={handleContinue} className="rounded-btn bg-primary px-6 py-3">
            <Text className="text-[14px] font-bold text-white">Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isFront = step === 'front';
  const facing = isFront ? 'back' : 'front';

  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View className="flex-1">
        <CameraView
          ref={cameraRef}
          facing={facing}
          active={true}
          style={{ flex: 1 }}
          mirror={!isFront}
        />

        {/* Frame overlay */}
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          {isFront ? (
            <View className="h-[175px] w-[280px] items-center justify-center rounded-btn border-[3px] border-dashed border-white/70" />
          ) : (
            <View className="h-[220px] w-[220px] items-center justify-center rounded-full border-4 border-white/60" />
          )}
        </View>

        {/* Instruction */}
        <View className="absolute top-[60px] left-0 right-0 items-center px-6">
          <View className="rounded-btn bg-black/60 px-4 py-2">
            <Text className="text-[15px] font-semibold text-white text-center">
              {isFront ? 'Scan Front of Document' : 'Capture Your Selfie'}
            </Text>
          </View>
          <Text className="mt-2 text-[12px] text-white/70">
            {isFront ? 'Align document within the frame' : 'Look at the camera and hold still'}
          </Text>
        </View>

        {/* Step indicator */}
        <View className="absolute bottom-[100px] left-0 right-0 items-center">
          <Text className="text-[12px] text-white/50">
            {isDocOnly ? 'Document photo' : `Step ${isFront ? '1' : '2'} of 2`}
          </Text>
        </View>
      </View>

      {/* Capture button */}
      <View className="items-center pb-[30px]">
        {capturing ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFront ? "Capture document" : "Capture selfie"}
            onPress={handleCapture}
            className="h-16 w-16 rounded-full border-4 border-primary bg-white active:opacity-80"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
