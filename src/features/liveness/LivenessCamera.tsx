import { Camera } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useEnrollFace, useUpdateFace } from '@/features/auth/mutations';
import { faceEnrollmentCompleted } from '@/features/auth/slice';
import RegulaFaceService, { isRegulaFaceAvailable } from '@/services/RegulaFaceService';
import { useAppDispatch } from '@/store';

interface LivenessCameraProps {
  /** "enroll" for first-time enrollment, "update" for face update flow. */
  mode: 'enroll' | 'update';
  /** Family member personId (for family face enrollment). */
  personId?: string;
  /** Called after successful face enrollment/update. */
  onSuccess: () => void;
  /** Called on unrecoverable error. */
  onError: (message: string) => void;
}

/**
 * Liveness camera component using Regula Face SDK.
 *
 * Flow:
 *  1. Initialize Regula Face SDK with license
 *  2. Request camera permission
 *  3. Call startLiveness() — Regula opens native camera UI automatically
 *  4. Regula runs random challenges (blink, smile, head turn) + anti-spoofing
 *  5. Auto-captures selfie when all checks pass
 *  6. Call face enroll/update with captured selfie base64
 *
 * Falls back to a message if Regula native module is unavailable (Expo Go).
 */
export function LivenessCamera({ mode, personId, onSuccess, onError }: LivenessCameraProps) {
  const [initializing, setInitializing] = useState(true);
  const [livenessRunning, setLivenessRunning] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const enrollFace = useEnrollFace();
  const updateFace = useUpdateFace();

  // Initialize Regula Face SDK on mount
  useEffect(() => {
    if (!isRegulaFaceAvailable()) {
      setNativeAvailable(false);
      setInitializing(false);
      return;
    }

    (async () => {
      try {
        await RegulaFaceService.initialize();
      } catch (err: any) {
        setError(err?.message ?? 'Failed to initialize Face SDK');
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const startLivenessCheck = async () => {
    // Check camera permission first
    const { status } = await Camera.getCameraPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required for face verification.');
        return;
      }
    }

    setLivenessRunning(true);
    setError(null);

    try {
      // Regula opens native camera UI, runs challenges, auto-captures selfie
      const result = await RegulaFaceService.startLiveness();

      if (!result.passed) {
        setError('Liveness check failed. Please try again.');
        setLivenessRunning(false);
        return;
      }

      // Enroll or update face with captured selfie
      const facePayload = {
        selfieBase64: result.image,
        livenessPassed: true,
        personId,
      };

      if (mode === 'enroll') {
        await enrollFace.mutateAsync(facePayload);
        if (!personId) {
          dispatch(faceEnrollmentCompleted());
        }
      } else {
        await updateFace.mutateAsync(facePayload);
      }

      onSuccess();
    } catch (err: any) {
      const msg = err?.message ?? 'Face enrollment failed';
      setError(msg);
      onError(msg);
    } finally {
      setLivenessRunning(false);
    }
  };

  // Initializing state
  if (initializing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-white">Initializing Face SDK...</Text>
      </SafeAreaView>
    );
  }

  // Native module not available (Expo Go)
  if (!nativeAvailable) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <View className="px-6 items-center">
          <Text className="text-center text-[16px] font-bold text-white">
            Development Build Required
          </Text>
          <Text className="mt-2 text-center text-[14px] text-white/70">
            Regula Face SDK requires a development build.{"\n"}
            Run: npx expo run:android
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state with retry
  if (error && !livenessRunning) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <Text className="mb-4 text-center text-[16px] text-white px-6">{error}</Text>
        <Pressable
          onPress={() => {
            setError(null);
            startLivenessCheck();
          }}
          className="rounded-btn bg-primary px-6 py-3">
          <Text className="text-[14px] font-bold text-white">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Ready state — show start button (Regula will open its own camera UI)
  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-6">
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#F5F3FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
          <Text style={{ fontSize: 48 }}>🤳</Text>
        </View>

        <Text accessibilityRole="header" className="mb-2 text-[22px] font-bold text-white text-center">
          Face Liveness Check
        </Text>
        <Text className="mb-8 text-center text-[15px] text-white/70">
          The camera will open automatically and guide you.{"\n"}
          Follow the prompts: blink, smile, or turn your head.{"\n"}
          Your selfie will be captured automatically.
        </Text>

        {livenessRunning ? (
          <View className="items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="mt-4 text-[14px] text-white">Liveness check in progress...</Text>
          </View>
        ) : null}
      </View>

      {!livenessRunning ? (
        <View className="px-6 pb-[30px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start liveness check"
            onPress={startLivenessCheck}
            className="rounded-btn bg-primary py-4 items-center active:opacity-80">
            <Text className="text-[16px] font-bold text-white">Start Face Scan</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
