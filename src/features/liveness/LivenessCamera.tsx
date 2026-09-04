import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
    type CameraRef,
} from 'react-native-vision-camera';
import {
    createFaceDetectorOutput,
    type Face,
} from 'react-native-vision-camera-face-detector';
import { runOnJS } from 'react-native-worklets';

import { Colors } from '@/constants/theme';
import { useEnrollFace, useUpdateFace } from '@/features/auth/mutations';
import { faceEnrollmentCompleted } from '@/features/auth/slice';
import { useLivenessSession } from '@/features/liveness/useLivenessSession';
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

// Calibration thresholds (per guide §4.5 — tune on real devices)
const BLINK_CLOSED_THRESHOLD = 0.35;
const BLINK_OPEN_THRESHOLD = 0.6;
const YAW_THRESHOLD = 12; // degrees

/**
 * Full liveness challenge camera using react-native-vision-camera v5
 * + ML Kit face detector.
 *
 * Flow (per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §4):
 *  1. Request camera permissions
 *  2. Create liveness challenge (server-provided sequence)
 *  3. Frame processor auto-detects blink/turn via ML Kit face landmarks
 *  4. When action detected → automatically submit evidence (metadata only, NO image)
 *  5. After all steps: capture high-res photo → finalize
 *  6. Call face enroll/update with session credentials
 *
 * NO manual button press — detection is fully automatic.
 */
export function LivenessCamera({ mode, personId, onSuccess, onError }: LivenessCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [capturing, setCapturing] = useState(false);
  const dispatch = useAppDispatch();

  const liveness = useLivenessSession();
  const enrollFace = useEnrollFace();
  const updateFace = useUpdateFace();

  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput();

  const cameraRef = useRef<CameraRef>(null);

  // Per-step tracking refs
  const stepStartedAt = useRef<number>(0);
  const lastClientTs = useRef<number>(0);
  const eyesWereClosed = useRef(false);
  const submittingRef = useRef(false);
  const lastSampleTs = useRef(0);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Start liveness challenge when permission is granted
  const phaseRef = useRef(liveness.phase);
  phaseRef.current = liveness.phase;
  useEffect(() => {
    if (hasPermission && phaseRef.current === 'idle') {
      liveness.startSession(personId).catch((err) => {
        onError(err?.message ?? 'Failed to start liveness challenge');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, personId]);

  const beginStep = useCallback(() => {
    stepStartedAt.current = Date.now();
    eyesWereClosed.current = false;
    submittingRef.current = false;
  }, []);

  // Begin step when challenge phase starts or step advances
  useEffect(() => {
    if (liveness.phase === 'challenging') {
      beginStep();
    }
  }, [liveness.phase, liveness.currentStepIndex, beginStep]);

  // Handle face sample — auto-detect actions (called from JS thread via Worklets)
  const onFaceSample = useCallback(async (leftEyeOpen: number, rightEyeOpen: number, yaw: number) => {
    if (liveness.phase !== 'challenging' || !liveness.challenge || submittingRef.current) return;
    const action = liveness.currentChallenge;
    if (!action) return;

    // Detect the action
    if (action === 'blink') {
      // blink = eyes closed, then open again
      if (leftEyeOpen < BLINK_CLOSED_THRESHOLD && rightEyeOpen < BLINK_CLOSED_THRESHOLD) {
        eyesWereClosed.current = true;
      }
      if (!eyesWereClosed.current || leftEyeOpen < BLINK_OPEN_THRESHOLD || rightEyeOpen < BLINK_OPEN_THRESHOLD) {
        return; // eyes not yet fully open after closing
      }
    } else {
      // turn = |yaw| must cross the threshold; sign picks the direction
      if (action === 'turn_left' && yaw > -YAW_THRESHOLD) return;
      if (action === 'turn_right' && yaw < YAW_THRESHOLD) return;
    }

    // Action detected — check timing
    const durationMs = Date.now() - stepStartedAt.current;
    const { min_ms, max_ms } = liveness.challenge.step_time_limits;
    if (durationMs < min_ms) return; // too fast — keep waiting
    if (durationMs > max_ms) {
      // too slow — step timed out
      onError('Too slow — the check timed out. Please try again.');
      return;
    }

    // Ensure strictly increasing client_ts_ms
    const clientTsMs = Math.max(Date.now(), lastClientTs.current + 1);
    lastClientTs.current = clientTsMs;

    // Submit evidence — metadata only, NO image (per guide §4.2)
    submittingRef.current = true;
    try {
      await liveness.submitEvidence(durationMs);
    } catch (err: any) {
      onError(err?.message ?? 'Liveness step rejected');
    } finally {
      submittingRef.current = false;
    }
  }, [liveness, onError]);

  // Create a runOnJS wrapper for the face sample handler
  const onFaceSampleJS = useRef(runOnJS(onFaceSample)).current;

  // Face detection via a dedicated CameraOutput (NOT a frame processor).
  // The library manages its own YUV output stream so ML Kit always gets a
  // supported frame format — the useFrameOutput + detectFaces(frame) path
  // crashes on Android with "Only JPEG and YUV_420_888 are supported now"
  // because frame output buffers are RGBA.
  // Created once; the latest handler is read through a ref.
  const handleFacesRef = useRef<(faces: Face[]) => void>(() => {});
  handleFacesRef.current = (faces) => {
    const face = faces[0];
    if (!face) return;

    // Throttle: ~10 samples/sec
    const now = Date.now();
    if (now - lastSampleTs.current < 100) return;
    lastSampleTs.current = now;

    onFaceSampleJS(
      face.leftEyeOpenProbability ?? 1,
      face.rightEyeOpenProbability ?? 1,
      face.yawAngle ?? 0,
    );
  };

  const faceDetectorOutput = useMemo(
    () =>
      createFaceDetectorOutput({
        performanceMode: 'fast',
        runClassifications: true,
        runLandmarks: false,
        onFacesDetected: (faces) => handleFacesRef.current(faces),
        onError: (error) => {
          console.warn('Face detection error:', error.message);
        },
      }),
    [],
  );

  // Capture high-res photo for finalize
  const captureAndFinalize = useCallback(async () => {
    if (capturing || liveness.phase !== 'finalizing') return;
    setCapturing(true);

    try {
      // Use capturePhotoToFile to get a file path, then read as base64
      const photoFile = await photoOutput.capturePhotoToFile(
        { flashMode: 'off' },
        {},
      );

      if (!photoFile) {
        onError('Failed to capture photo');
        return;
      }

      // Read file as base64 using expo-file-system
      const FileSystem = await import('expo-file-system');
      const frameBase64 = await FileSystem.readAsStringAsync(photoFile.filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await liveness.finalize(frameBase64);
      if (result.status !== 'passed') {
        onError(result.message || 'Liveness verification failed');
        return;
      }

      // Enroll or update face with session credentials
      // Per guide §5.2: send only livenessSessionId + sessionToken + personId
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
  }, [capturing, liveness, mode, personId, enrollFace, updateFace, dispatch, onSuccess, onError, photoOutput]);

  // Auto-finalize when phase becomes 'finalizing'
  useEffect(() => {
    if (liveness.phase === 'finalizing' && !capturing) {
      const timer = setTimeout(() => {
        captureAndFinalize();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [liveness.phase, capturing, captureAndFinalize]);

  // Permission not granted
  if (!hasPermission) {
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

  // No camera device
  if (!device) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-white">Loading camera...</Text>
      </SafeAreaView>
    );
  }

  // Loading / creating session
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
        <Text className="mb-4 text-center text-[16px] text-white px-6">{liveness.error ?? 'Liveness check failed'}</Text>
        <Pressable
          onPress={() => liveness.reset()}
          className="rounded-btn bg-primary px-6 py-3">
          <Text className="text-[14px] font-bold text-white">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Active challenge or finalizing — camera with frame processor, NO capture button
  const isChallenging = liveness.phase === 'challenging';
  const isFinalizing = liveness.phase === 'finalizing';

  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        device={device}
        isActive
        outputs={[photoOutput, faceDetectorOutput]}
        mirrorMode="auto"
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

      {/* Bottom status — no button, detection is automatic */}
      <View className="absolute bottom-[40px] left-0 right-0 items-center">
        {isFinalizing ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="mt-2 text-[14px] text-white">Capturing photo...</Text>
          </>
        ) : (
          <Text className="text-[12px] text-white/50 text-center">
            Follow the instruction — detection is automatic
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
