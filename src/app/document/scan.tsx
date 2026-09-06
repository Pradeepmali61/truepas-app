import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import {
    RegulaScanCancelled,
    initializeRegula,
    isRegulaAvailable,
    scanDocument,
} from '@/features/documents/regulaScanner';
import { setScanResult } from '@/services/scanStore';

type ScanStep = 'front' | 'selfie' | 'done';

// Frame dimensions shown on the camera overlay (manual fallback path only —
// must match the JSX below). The Regula scanner crops natively and does not
// use these.
const FRONT_FRAME = { width: 280, height: 175 };
const SELFIE_FRAME = { width: 220, height: 220 };

/** Document scan — captures front of document (+ selfie for portrait documents).
 *  Document capture uses the Regula Document Reader native scanner (edge
 *  detection, auto-capture, perspective-corrected cropping) when the native
 *  modules are present, falling back to the manual expo-camera flow in Expo Go.
 *  Selfie capture always uses expo-camera.
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
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });

  // ── Regula native scanner state ──────────────────────────────────────────
  const regulaAvailable = useMemo(() => isRegulaAvailable(), []);
  const [useRegula, setUseRegula] = useState(regulaAvailable);
  const [regulaReady, setRegulaReady] = useState(false);
  const [regulaBusy, setRegulaBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Request permission on mount if not yet determined
  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Initialize Regula on mount (native builds only)
  useEffect(() => {
    if (!regulaAvailable) return;
    initializeRegula()
      .then(() => setRegulaReady(true))
      .catch((e: any) => {
        console.error('[Scan] Regula init failed:', e?.message);
        setScanError(e?.message ?? 'Document scanner failed to initialize');
      });
  }, [regulaAvailable]);

  // ── Regula scan (native scanner UI) ──────────────────────────────────────
  const handleRegulaScan = async () => {
    if (regulaBusy || !regulaReady) return;
    setRegulaBusy(true);
    setScanError(null);
    try {
      const base64 = await scanDocument();
      setFrontImage(base64);
      // Doc-only documents (birthCertificate, 0-4) have no portrait — skip selfie
      setStep(isDocOnly ? 'done' : 'selfie');
    } catch (e: any) {
      if (e instanceof RegulaScanCancelled) return; // user closed the scanner
      console.error('[Scan] Regula scan failed:', e?.message);
      setScanError(e?.message ?? 'Scan failed. Please try again.');
    } finally {
      setRegulaBusy(false);
    }
  };

  // ── Manual expo-camera capture (fallback path) ───────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (!photo?.uri) return;

      // The camera preview fills the view with "cover" scaling (center-crop):
      // the preview shows only the middle portion of the full sensor photo.
      // To crop exactly what's inside the on-screen frame, map the frame's
      // view coordinates into photo coordinates via the cover transform.
      //
      // IMPORTANT: On Android, takePictureAsync often returns the photo in the
      // sensor's native landscape orientation (e.g. 4032×3024) even when the
      // phone is held in portrait and the preview shows portrait. We must
      // swap width/height so the photo's orientation matches the view's.
      let photoWidth = photo.width ?? 0;
      let photoHeight = photo.height ?? 0;
      const viewWidth = cameraLayout.width || photoWidth;
      const viewHeight = cameraLayout.height || photoHeight;

      // Detect orientation mismatch: photo is landscape but view is portrait (or vice versa)
      const photoIsLandscape = photoWidth > photoHeight;
      const viewIsLandscape = viewWidth > viewHeight;
      if (photoIsLandscape !== viewIsLandscape && photoWidth > 0 && photoHeight > 0) {
        console.log('[Scan] Photo orientation mismatch — swapping w/h. Original:', photoWidth, 'x', photoHeight);
        [photoWidth, photoHeight] = [photoHeight, photoWidth];
      }

      const frame = step === 'front' ? FRONT_FRAME : SELFIE_FRAME;

      // Cover transform: scale the photo so it covers the view, centered.
      const coverScale = Math.max(viewWidth / photoWidth, viewHeight / photoHeight);
      const offsetX = (viewWidth - photoWidth * coverScale) / 2; // ≤ 0
      const offsetY = (viewHeight - photoHeight * coverScale) / 2; // ≤ 0

      // Frame is centered in the camera view
      const frameViewX = (viewWidth - frame.width) / 2;
      const frameViewY = (viewHeight - frame.height) / 2;

      // View coords → photo coords (inverse of the cover transform)
      const cropX = (frameViewX - offsetX) / coverScale;
      const cropY = (frameViewY - offsetY) / coverScale;
      const cropW = frame.width / coverScale;
      const cropH = frame.height / coverScale;

      console.log('[Scan] crop mapping:', JSON.stringify({
        step,
        photo: { w: photoWidth, h: photoHeight },
        view: { w: viewWidth, h: viewHeight },
        coverScale: Number(coverScale.toFixed(3)),
        offset: { x: Number(offsetX.toFixed(1)), y: Number(offsetY.toFixed(1)) },
        crop: { x: Math.round(cropX), y: Math.round(cropY), w: Math.round(cropW), h: Math.round(cropH) },
      }));

      // Clamp the crop rect to the photo bounds and round to integers
      const clampedX = Math.max(0, Math.min(cropX, photoWidth));
      const clampedY = Math.max(0, Math.min(cropY, photoHeight));
      const crop = {
        originX: Math.round(clampedX),
        originY: Math.round(clampedY),
        width: Math.round(Math.max(0, Math.min(cropW, photoWidth - clampedX))),
        height: Math.round(Math.max(0, Math.min(cropH, photoHeight - clampedY))),
      };

      // Build actions: crop first, then resize to ~1600px wide
      const actions: ImageManipulator.Action[] = [];
      if (crop.width > 0 && crop.height > 0) {
        actions.push({ crop });
      }
      actions.push({ resize: { width: 1600 } });

      // Per KYC guide §6.3: resize to ~1600px + JPEG 0.8 before sending.
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        actions,
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
  // Regula handles the front step with its own native scanner UI; the manual
  // camera view is used for the selfie step and as the fallback.
  const showRegulaUI = isFront && useRegula;
  const facing = isFront ? 'back' : 'front';

  // ── Regula native scanner UI (front step) ────────────────────────────────
  if (showRegulaUI) {
    return (
      <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-[20px] font-bold text-white">Scan Front of Document</Text>
          <Text className="mb-10 text-center text-[14px] text-white/70">
            The scanner will detect the document edges automatically and capture
            when it is aligned and in focus.
          </Text>

          {regulaBusy ? (
            <View className="items-center gap-4">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="text-[13px] text-white/60">Scanner open — align the document…</Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open document scanner"
              onPress={handleRegulaScan}
              disabled={!regulaReady}
              className={`rounded-btn bg-primary px-10 py-4 ${!regulaReady ? 'opacity-50' : 'active:opacity-80'}`}>
              <Text className="text-[16px] font-bold text-white">
                {regulaReady ? 'Scan Document' : 'Preparing Scanner…'}
              </Text>
            </Pressable>
          )}

          {scanError ? (
            <Text className="mt-6 text-center text-[13px]" style={{ color: Colors.error }}>
              {scanError}
            </Text>
          ) : null}

          {/* Fallback to the manual camera if the native scanner fails */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use manual camera capture"
            onPress={() => {
              setUseRegula(false);
              setScanError(null);
            }}
            className="mt-8 px-4 py-2">
            <Text className="text-[13px] text-white/50 underline">Use manual camera instead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Manual expo-camera UI (selfie step + front fallback) ─────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View
        className="flex-1"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}>
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
