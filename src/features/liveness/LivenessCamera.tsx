import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
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

import { toApiError } from '@/api/errors';
import { Icon } from '@/components/ui';
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
  /** Called on unrecoverable error. Recoverable failures (step rejected,
   *  429 rate limit, network) are handled in-place by the built-in failed
   *  UI with a retry cooldown, so this rarely fires. */
  onError?: (message: string) => void;
}

// Calibration thresholds (per guide Â§4.5 â€” tune on real devices)
const BLINK_CLOSED_THRESHOLD = 0.35;
const BLINK_OPEN_THRESHOLD = 0.6;
const YAW_THRESHOLD = 12; // degrees

/** Per-action UI copy â€” big icon + short title + helper line so the user
 *  instantly knows what to do. Backend `ui_copy` is shown as the subtitle. */
const ACTION_UI: Record<string, { title: string; helper: string; icon: string; iconRotate: string }> = {
  blink: {
    title: 'Blink your eyes',
    helper: 'Close and open both eyes',
    icon: 'eyeClosed',
    iconRotate: '0deg',
  },
  turn_left: {
    title: 'Look left',
    helper: 'Slowly turn your head left',
    icon: 'chevron',
    iconRotate: '180deg',
  },
  turn_right: {
    title: 'Look right',
    helper: 'Slowly turn your head right',
    icon: 'chevron',
    iconRotate: '0deg',
  },
};

/** Arc path along the camera ring (radius 154 inside the 316px ring box).
 *  Angle 0 = 12 o'clock, increasing clockwise. */
function sideArcPath(startDeg: number, endDeg: number): string {
  const r = 154;
  const c = 158;
  const polar = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };
  const s = polar(startDeg);
  const e = polar(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

/**
 * Full liveness challenge camera using react-native-vision-camera v5
 * + ML Kit face detector.
 *
 * Flow (per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md Â§4):
 *  1. Request camera permissions
 *  2. Create liveness challenge (server-provided sequence)
 *  3. Frame processor auto-detects blink/turn via ML Kit face landmarks
 *  4. When action detected â†’ automatically submit evidence (metadata only, NO image)
 *  5. After all steps: capture high-res photo â†’ finalize
 *  6. Call face enroll/update with session credentials
 *
 * NO manual button press â€” detection is fully automatic.
 */
export function LivenessCamera({ mode, personId, onSuccess }: LivenessCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [capturing, setCapturing] = useState(false);
  // Camera preview is stopped briefly before navigating away â€” unmounting an
  // ACTIVE Camera on the new architecture (Fabric) can dispatch a
  // topCameraReady event after the JS view is gone, which crashes the app.
  const [cameraActive, setCameraActive] = useState(true);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const liveness = useLivenessSession();
  const enrollFace = useEnrollFace();
  const updateFace = useUpdateFace();
  // Absolute overlays ignore SafeAreaView padding â€” apply insets manually
  const insets = useSafeAreaInsets();

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

  // â”€â”€ In-place failure handling (fixes the 429 retry loop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Failures fail the session LOCALLY instead of navigating away:
  //  1. phase leaves 'challenging' immediately â†’ the frame processor's
  //     onFaceSample guard stops re-submitting evidence (previously a 429
  //     on evidence kept the phase 'challenging' and resubmitted every
  //     ~100ms during the 400ms navigation settle window).
  //  2. The built-in failed UI shows toApiError's friendly copy with a
  //     retry cooldown â€” 10s after a 429 (retrying sooner only burns more
  //     rate-limit quota), 3s for other failures.
  const { failSession } = liveness;
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const failWithCooldown = useCallback((err: unknown, fallback: string) => {
    const apiErr = toApiError(err);
    setCooldownLeft(apiErr.status === 429 ? 10 : 3);
    failSession(apiErr.message || fallback);
  }, [failSession]);

  // 1s countdown while the failed UI is visible; Try Again stays disabled
  // until it reaches 0. setState runs inside the interval callback (not
  // synchronously in the effect body) to avoid cascading renders.
  useEffect(() => {
    if (liveness.phase !== 'failed' || cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [liveness.phase, cooldownLeft]);

  // Start liveness challenge when permission is granted, and restart after
  // reset (Try Again) â€” depends on phase so idleâ†’start works every time.
  useEffect(() => {
    if (hasPermission && liveness.phase === 'idle') {
      liveness.startSession(personId).catch((err) => {
        failWithCooldown(err, 'Failed to start liveness challenge');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, personId, liveness.phase]);

  const beginStep = useCallback(() => {
    stepStartedAt.current = Date.now();
    eyesWereClosed.current = false;
    submittingRef.current = false;
  }, []);

  // Stop the preview, let the native camera settle, then navigate. Prevents
  // the Fabric "Unsupported top level event type topCameraReady" crash that
  // happens when an active Camera unmounts mid-event-dispatch.
  const settleCameraThen = useCallback(async (navigate: () => void) => {
    setCameraActive(false);
    await new Promise((resolve) => setTimeout(resolve, 400));
    navigate();
  }, []);

  // Begin step when challenge phase starts or step advances
  useEffect(() => {
    if (liveness.phase === 'challenging') {
      beginStep();
    }
  }, [liveness.phase, liveness.currentStepIndex, beginStep]);

  // Handle face sample â€” auto-detect actions (called from JS thread via Worklets)
  const onFaceSample = useCallback(async (leftEyeOpen: number, rightEyeOpen: number, yaw: number) => {
    if (liveness.phase !== 'challenging' || !liveness.challenge || submittingRef.current) return;
    const action = liveness.currentChallenge;
    if (!action) return;

    // Detect the action
    if (action === 'blink') {
      // blink = eyes closed, then open again
      if (leftEyeOpen < BLINK_CLOSED_THRESHOLD && rightEyeOpen < BLINK_CLOSED_THRESHOLD) {
        if (!eyesWereClosed.current) {
          console.log('[Liveness] Blink: eyes CLOSED detected, waiting for reopen...');
        }
        eyesWereClosed.current = true;
      }
      if (!eyesWereClosed.current || leftEyeOpen < BLINK_OPEN_THRESHOLD || rightEyeOpen < BLINK_OPEN_THRESHOLD) {
        return; // eyes not yet fully open after closing
      }
      console.log('[Liveness] Blink: eyes REOPENED â€” blink complete!');
    } else {
      // ML Kit yaw: positive = subject turns to their LEFT, negative = to their RIGHT
      if (action === 'turn_right' && yaw > -YAW_THRESHOLD) return;
      if (action === 'turn_left' && yaw < YAW_THRESHOLD) return;
      console.log(`[Liveness] Turn detected: yaw=${yaw.toFixed(1)}Â° crossed threshold ${YAW_THRESHOLD}Â°`);
    }

    // Action detected â€” check timing
    const durationMs = Date.now() - stepStartedAt.current;
    const { min_ms, max_ms } = liveness.challenge.step_time_limits;
    console.log(`[Liveness] Action detected: duration=${durationMs}ms (limits: ${min_ms}-${max_ms}ms)`);
    if (durationMs < min_ms) return; // too fast â€” keep waiting
    if (durationMs > max_ms) {
      // too slow â€” fail the session locally so the retry UI shows and
      // sample processing stops (phase leaves 'challenging').
      console.error('[Liveness] Step timed out:', durationMs, '>', max_ms);
      liveness.failSession('Time limit exceeded. Please try again.');
      return;
    }

    // Ensure strictly increasing client_ts_ms
    const clientTsMs = Math.max(Date.now(), lastClientTs.current + 1);
    lastClientTs.current = clientTsMs;

    // Submit evidence â€” metadata only, NO image (per guide Â§4.2)
    submittingRef.current = true;
    try {
      console.log(`[Liveness] Submitting evidence for step ${liveness.currentStepIndex}: ${action}`);
      await liveness.submitEvidence(durationMs);
      console.log('[Liveness] Evidence accepted');
    } catch (err: any) {
      console.error('[Liveness] Evidence submit failed:', err?.message, JSON.stringify(err?.response?.data));
      console.error('[Liveness] Sent request was:', JSON.stringify({
        url: err?.config?.url,
        method: err?.config?.method,
        data: err?.config?.data,
        contentType: err?.config?.headers?.['Content-Type'] ?? err?.config?.headers?.get?.('Content-Type'),
      }));
      // Fail in place â€” leaves 'challenging' so the frame processor stops
      // resubmitting evidence (the old navigation path left the phase
      // unchanged and caused a 429 resubmission storm).
      failWithCooldown(err, 'Liveness step rejected');
    } finally {
      submittingRef.current = false;
    }
  }, [liveness, failWithCooldown]);

  // Create a runOnJS wrapper for the face sample handler.
  // IMPORTANT: runOnJS(fn) binds fn at creation time â€” passing onFaceSample directly
  // would forever call the FIRST-render closure with stale liveness state
  // (phase 'idle'), so no action would ever be detected. Route through a ref
  // so the wrapper always invokes the latest callback.
  const onFaceSampleRef = useRef(onFaceSample);
  onFaceSampleRef.current = onFaceSample;
  const onFaceSampleJS = useRef(
    runOnJS((leftEyeOpen: number, rightEyeOpen: number, yaw: number) => {
      onFaceSampleRef.current(leftEyeOpen, rightEyeOpen, yaw);
    }),
  ).current;

  // Face detection via a dedicated CameraOutput (NOT a frame processor).
  // The library manages its own YUV output stream so ML Kit always gets a
  // supported frame format â€” the useFrameOutput + detectFaces(frame) path
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

    const leftEye = face.leftEyeOpenProbability ?? 1;
    const rightEye = face.rightEyeOpenProbability ?? 1;
    const yaw = face.yawAngle ?? 0;
    console.log(`[Liveness] Sample: leftEye=${leftEye.toFixed(2)} rightEye=${rightEye.toFixed(2)} yaw=${yaw.toFixed(1)}Â°`);

    onFaceSampleJS(leftEye, rightEye, yaw);
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
    console.log('[Liveness] captureAndFinalize: starting photo capture...');

    try {
      // Use capturePhotoToFile to get a file path, then read as base64
      const photoFile = await photoOutput.capturePhotoToFile(
        { flashMode: 'off' },
        {},
      );

      if (!photoFile) {
        console.error('[Liveness] capturePhotoToFile returned null');
        failWithCooldown(new Error('Failed to capture photo'), 'Failed to capture photo');
        return;
      }
      console.log('[Liveness] Photo captured:', photoFile.filePath);

      // Read file as base64 using SDK 57 File API (readAsStringAsync is deprecated & throws)
      // File API requires an absolute URI (file:// prefix on Android)
      const { File } = await import('expo-file-system');
      const filePath = photoFile.filePath.startsWith('file://')
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;
      const photoFileRef = new File(filePath);
      const frameBase64 = await photoFileRef.base64();
      console.log('[Liveness] Frame base64 length:', frameBase64.length);

      console.log('[Liveness] Calling finalize API...');
      const result = await liveness.finalize(frameBase64);
      console.log('[Liveness] Finalize result:', JSON.stringify(result));

      if (result.status !== 'passed') {
        console.error('[Liveness] Finalize not passed:', result.status, result.message);
        // finalize() already flipped the phase to 'failed' â€” just set the
        // retry cooldown and stay in place (no navigation).
        setCooldownLeft(3);
        return;
      }

      // Enroll or update face with session credentials
      // Per guide Â§5.2: send only livenessSessionId + sessionToken + personId
      const facePayload = {
        livenessSessionId: result.session_id,
        sessionToken: liveness.sessionToken ?? '',
        personId,
      };
      console.log('[Liveness] Enrolling face, mode:', mode, 'personId:', personId);

      if (mode === 'enroll') {
        await enrollFace.mutateAsync(facePayload);
        if (!personId) {
          dispatch(faceEnrollmentCompleted());
        }
      } else {
        await updateFace.mutateAsync(facePayload);
      }

      console.log('[Liveness] Face enrollment SUCCESS');
      await settleCameraThen(onSuccess);
    } catch (err: any) {
      console.error('[Liveness] captureAndFinalize ERROR:', err?.message, err?.response?.data ? JSON.stringify(err.response.data) : '', err?.stack);
      failWithCooldown(err, 'Face enrollment failed');
    } finally {
      setCapturing(false);
    }
  }, [capturing, liveness, mode, personId, enrollFace, updateFace, dispatch, onSuccess, failWithCooldown, photoOutput]);

  // Auto-finalize when phase becomes 'finalizing'
  useEffect(() => {
    if (liveness.phase === 'finalizing' && !capturing) {
      const timer = setTimeout(() => {
        captureAndFinalize();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [liveness.phase, capturing, captureAndFinalize]);

  // â”€â”€ UI animation hooks (MUST be before any early return) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Brief "step done" flash when the step index advances
  const [stepDone, setStepDone] = useState(false);
  const prevStepRef = useRef(0);
  prevStepRef.current = liveness.currentStepIndex;
  useEffect(() => {
    if (liveness.phase === 'challenging' && liveness.currentStepIndex > prevStepRef.current) {
      setStepDone(true);
      const t = setTimeout(() => setStepDone(false), 900);
      prevStepRef.current = liveness.currentStepIndex;
      return () => clearTimeout(t);
    }
    prevStepRef.current = liveness.currentStepIndex;
  }, [liveness.phase, liveness.currentStepIndex]);

  // Permission not granted
  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FBFF]" edges={['top', 'bottom']}>
        <Text className="mb-4 text-center text-[16px] text-[#111827]">Camera permission is required for face verification.</Text>
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
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FBFF]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-[#6B7280]">Loading camera...</Text>
      </SafeAreaView>
    );
  }

  // Loading / creating session
  if (liveness.phase === 'creating' || liveness.phase === 'idle') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FBFF]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-[#6B7280]">Preparing liveness challenge...</Text>
      </SafeAreaView>
    );
  }

  // Error state â€” friendly message (from toApiError) + retry cooldown so a
  // 429 isn't hammered (each immediate retry burns more rate-limit quota).
  if (liveness.phase === 'failed') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FBFF]" edges={['top', 'bottom']}>
        <Text className="mb-4 text-center text-[16px] text-[#111827] px-6">{liveness.error ?? 'Liveness check failed'}</Text>
        <Pressable
          onPress={() => liveness.reset()}
          disabled={cooldownLeft > 0}
          accessibilityRole="button"
          accessibilityLabel="Try liveness check again"
          accessibilityState={{ disabled: cooldownLeft > 0 }}
          className={`rounded-btn bg-primary px-6 py-3 ${cooldownLeft > 0 ? 'opacity-50' : 'active:opacity-80'}`}>
          <Text className="text-[14px] font-bold text-white">
            {cooldownLeft > 0 ? `Try Again in ${cooldownLeft}s` : 'Try Again'}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Active challenge or finalizing â€” camera with frame processor, NO capture button
  const isFinalizing = liveness.phase === 'finalizing';
  const steps = liveness.challenge?.challenge_sequence ?? [];
  const action = liveness.currentChallenge;
  const actionUi = (action && ACTION_UI[action]) ?? null;

  // Progress arcs on the LEFT + RIGHT sides of the camera circle only.
  // Progress flows clockwise: the right arc fills first (topâ†’bottom), then
  // the left arc (bottomâ†’top). Whole ring turns green once capturing.
  const progress = steps.length
    ? (isFinalizing ? 1 : Math.min(liveness.currentStepIndex / steps.length, 1))
    : 0;
  const rightFill = Math.min(progress * 2, 1);
  const leftFill = Math.max(0, Math.min(progress * 2 - 1, 1));
  const arcFillColor = isFinalizing ? '#34D399' : Colors.primary;

  // Pill + helper copy per phase
  const pillText = isFinalizing
    ? 'Hold still'
    : stepDone
      ? 'Done!'
      : actionUi
        ? actionUi.title
        : (liveness.instruction || 'Follow the instruction');
  const helperText = isFinalizing
    ? 'Capturing your photo'
    : stepDone
      ? null
      : actionUi
        ? actionUi.helper
        : null;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FBFF]" edges={['top', 'bottom']}>
      {/* Close button â€” top right */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close liveness check"
        style={{ position: 'absolute', top: insets.top + 14, right: 20, zIndex: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="cross" size={24} color="#111827" />
      </Pressable>

      <View className="flex-1 items-center justify-center px-6">
        {/* Camera circle + progress arcs (Regula-style) */}
        <View style={{ width: 316, height: 316, alignItems: 'center', justifyContent: 'center' }}>
          {/* Progress ring â€” left + right side arcs only (gaps at 12 and 6
              o'clock). Right arc fills first, then the left one. */}
          <Svg width={316} height={316} style={{ position: 'absolute' }} pointerEvents="none">
            {/* Gray tracks */}
            <Path d={sideArcPath(8, 172)} stroke="rgba(17,24,39,0.10)" strokeWidth={4} strokeLinecap="round" fill="none" />
            <Path d={sideArcPath(188, 352)} stroke="rgba(17,24,39,0.10)" strokeWidth={4} strokeLinecap="round" fill="none" />
            {/* Filled progress */}
            {rightFill > 0 && (
              <Path d={sideArcPath(8, 8 + 164 * rightFill)} stroke={arcFillColor} strokeWidth={4} strokeLinecap="round" fill="none" />
            )}
            {leftFill > 0 && (
              <Path d={sideArcPath(188, 188 + 164 * leftFill)} stroke={arcFillColor} strokeWidth={4} strokeLinecap="round" fill="none" />
            )}
          </Svg>
          {/* Camera clipped inside the circle */}
          <View style={{ width: 280, height: 280, borderRadius: 140, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
            <Camera
              ref={cameraRef}
              style={{ width: '100%', height: '100%' }}
              device={device}
              isActive={cameraActive}
              outputs={[photoOutput, faceDetectorOutput]}
              mirrorMode="auto"
            />
            {/* Face guide overlay â€” head outline, eyes, nose, mouth so the
                user knows exactly where to position their face */}
            <Svg width={280} height={280} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
              <Ellipse cx={140} cy={132} rx={66} ry={84} stroke="#FFFFFF" strokeWidth={5} fill="none" />
              <Circle cx={112} cy={118} r={9} fill="#FFFFFF" />
              <Circle cx={168} cy={118} r={9} fill="#FFFFFF" />
              <Path d="M 140 118 L 140 168" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
              <Path d="M 112 190 Q 140 200 168 190" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
        </View>

        {/* Instruction pill */}
        <View
          style={{
            marginTop: 40,
            maxWidth: '85%',
            paddingHorizontal: 22, paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: stepDone ? '#059669' : 'rgba(17,24,39,0.06)',
          }}>
          <Text style={[styles.pillText, stepDone && { color: '#FFFFFF' }]}>
            {isFinalizing ? 'Hold still' : stepDone ? 'Done!' : actionUi ? actionUi.title : (liveness.instruction || 'Follow the instruction')}
          </Text>
        </View>
        {!!helperText && !stepDone && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pillText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});

