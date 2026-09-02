import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

/** Document scan — camera capture for document verification.
 *  Captures front of document, then navigates to processing.
 *  In production, this would also capture back + selfie, then create
 *  a verification session with the uploaded object keys. */
export default function DocumentScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      // In production: upload to object store, get object key,
      // create verification session, start verification
      // For now: navigate to processing
      router.push('/document/processing');
    } catch {
      router.push('/document/processing');
    } finally {
      setCapturing(false);
    }
  };

  if (permission && !permission.granted) {
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

  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View className="flex-1">
        <CameraView
          ref={cameraRef}
          facing="back"
          className="flex-1"
        />

        {/* Document frame overlay */}
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <View className="h-[175px] w-[280px] items-center justify-center rounded-btn border-[3px] border-dashed border-white/70" />
        </View>

        {/* Instruction */}
        <View className="absolute top-[60px] left-0 right-0 items-center px-6">
          <View className="rounded-btn bg-black/60 px-4 py-2">
            <Text className="text-[15px] font-semibold text-white text-center">
              Scan Front of Document
            </Text>
          </View>
          <Text className="mt-2 text-[12px] text-white/70">Align document within the frame</Text>
        </View>
      </View>

      {/* Capture button */}
      <View className="items-center pb-[30px]">
        {capturing ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture document"
            onPress={handleCapture}
            className="h-16 w-16 rounded-full border-4 border-primary bg-white active:opacity-80"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
