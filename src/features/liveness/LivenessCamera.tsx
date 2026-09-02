import { CameraView } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useEnrollFace, useUpdateFace } from '@/features/auth/mutations';
import { useLivenessSession } from '@/features/liveness/useLivenessSession';
import { faceEnrollmentCompleted } from '@/features/auth/slice';
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
 * Full liveness challenge camera component using expo-camera.
 *
 * Flow:
 *  1. Request camera permissions
 *  2. Create liveness challenge (server-provided sequence)
 *  3. For each challenge step: capture frame → submit evidence
 *  4. After all steps: capture high-res frame → finalize
 *  5. Call face enroll/update with session credentials
 */
export function LivenessCamera({ mode, personId, onSuccess, onError }: LivenessCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const stepStartTime = useRef<number>(Date.now());
  const dispatch = useAppDispatch();

  const liveness = useLivenessSession();
  const enrollFace = useEnrollFace();
  const updateFace = useUpdateFace();

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Start liveness challenge when camera is ready
  useEffect(() => {
    if (permission?.granted && liveness.phase === 'idle') {
      liveness.startSession(personId).catch((err) => {
        onError(err?.message ?? 'Failed to start liveness challenge');
      });
    }
  }, [permission, liveness, personId, onError]);

  const captureAndSubmit = useCallback(async () => {
    if (!cameraRef.current || capturing || liveness.phase !== 'challenging') return;
    setCapturing(true);
    stepStartTime.current = Date.now();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      const frameBase64 = photo.base64 ?? '';
      const durationMs = Date.now() - stepStartTime.current;

      await liveness.submitEvidence(frameBase64, durationMs);
    } catch (err: any) {
      onError(err?.message ?? 'Failed to capture frame');
    } finally {
      setCapturing(false);
    }
  }, [capturing, liveness, onError]);

  const captureAndFinalize = useCallback(async () => {
    if (!cameraRef.current || capturing || liveness.phase !== 'finalizing') return;
    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
      });
      const frameBase64 = photo.base64 ?? '';

      const result = await liveness.finalize(frameBase64);
      if (result.status !== 'passed') {
        onError(result.message || 'Liveness verification failed');
        return;
      }

      // Enroll or update face with session credentials
      const facePayload = {
        livenessSessionId: result.session_id,
        sessionToken: liveness.sessionToken ?? '',
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
      onError(err?.message ?? 'Face enrollment failed');
    } finally {
      setCapturing(false);
    }
  }, [capturing, liveness, mode, personId, enrollFace, updateFace, dispatch, onSuccess, onError]);

  // Permission denied
  if (permission && !permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <Text className="mb-4 text-center text-[16px] text-white">Camera permission is required for face verification.</Text>
        <Pressable
          onPress={requestPermission}
          className="rounded-btn bg-primary px-6 py-3">
          <Text className="text-[14px] font-bold text-white">Grant Permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Loading
  if (liveness.phase === 'creating' || liveness.phase === 'idle') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-white">Preparing liveness challenge...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (liveness.phase === 'failed') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <Text className="mb-4 text-center text-[16px] text-white">{liveness.error ?? 'Liveness check failed'}</Text>
        <Pressable
          onPress={() => liveness.reset()}
          className="rounded-btn bg-primary px-6 py-3">
          <Text className="text-[14px] font-bold text-white">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isChallenging = liveness.phase === 'challenging';
  const isFinalizing = liveness.phase === 'finalizing';

  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View className="flex-1">
        <CameraView
          ref={cameraRef}
          facing="front"
          className="flex-1"
          mirror
        />

        {/* Face overlay guide */}
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <View className="h-[220px] w-[220px] items-center justify-center rounded-full border-4 border-white/60" />
        </View>

        {/* Instruction overlay */}
        <View className="absolute top-[60px] left-0 right-0 items-center px-6">
          <View className="rounded-btn bg-black/60 px-4 py-2">
            <Text className="text-[15px] font-semibold text-white text-center">
              {isFinalizing ? 'Hold still...' : liveness.instruction}
            </Text>
          </View>
          {isChallenging && liveness.challenge && (
            <Text className="mt-2 text-[12px] text-white/70">
              Step {liveness.currentStepIndex + 1} of {liveness.challenge.challenge_sequence.length}
            </Text>
          )}
        </View>
      </View>

      {/* Capture button */}
      <View className="items-center pb-[30px]">
        {capturing ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFinalizing ? "Capture final photo" : "Capture liveness frame"}
            onPress={isFinalizing ? captureAndFinalize : captureAndSubmit}
            className="h-16 w-16 rounded-full border-4 border-primary bg-white active:opacity-80"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
