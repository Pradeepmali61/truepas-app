import { useRouter } from 'expo-router';
import { CircleCheck, CircleHelp, Eye, ScanFace, SwitchCamera, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Alert, Card, CardContent, FlowSteps, ScreenHeader } from '@/components/composite';
import { LivenessGuideDial, StepDots } from '@/components/truepas';
import { Badge, CoreButton, FadeUp, IconButton, PopIn, Pulse, RowIcon, ScanLine, Spinner, Typography } from '@/components/ui';
import { useEnrollFace, useUpdateFace } from '@/features/auth/mutations';
import { useLivenessSession } from '@/features/liveness/useLivenessSession';
import { flowGuards } from '@/services/flowGuards';
import { alpha, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

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
  /** Members under 10 may use the rear camera too (a parent holds the phone
   *  while the child faces it). When true, a front/back toggle shows in the
   *  challenge header. Default: front camera only (ages 10+). */
  allowBackCamera?: boolean;
}

// Calibration thresholds (per guide §4.5 — tune on real devices)
const BLINK_CLOSED_THRESHOLD = 0.35;
const BLINK_OPEN_THRESHOLD = 0.6;
const YAW_THRESHOLD = 12; // degrees

/** Step preview row for the intro screen — leading chip + title + step label. */
function StepRow({ leading, title, subtitle }: { leading: ReactNode; title: string; subtitle: string }) {
  const theme = useThemeTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[2] }}>
      {leading}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Typography variant="body">{title}</Typography>
        <Typography variant="body-sm" color="secondary">{subtitle}</Typography>
      </View>
    </View>
  );
}

/** Detection frame — light sunken box + corner brackets + brand glow behind a
 *  filled face ring, scanline sweeping (design: verification.tsx `FaceFrame`).
 *  `camera` renders as an absolute layer under the overlays. */
function FaceFrame({ camera, pulseMs = 1200 }: { camera?: ReactNode; pulseMs?: number }) {
  const theme = useThemeTokens();
  const corner = {
    position: 'absolute' as const,
    width: 26,
    height: 26,
    borderColor: theme.colors.actionPrimary,
  };
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 4 / 5,
        borderRadius: theme.radii['2xl'],
        backgroundColor: theme.colors.surfaceSunken,
        overflow: 'hidden',
      }}>
      {camera}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[8] }}>
        <View
          style={{
            position: 'absolute',
            width: 190,
            height: 190,
            borderRadius: theme.radii.full,
            backgroundColor: alpha(theme.colors.actionPrimary, 0.18),
          }}
        />
        <ScanLine color={theme.colors.accent} />
        <Pulse to={1.04} ms={pulseMs}>
          <View
            style={{
              width: 150,
              height: 190,
              borderRadius: 95,
              borderWidth: 3,
              borderColor: theme.colors.actionPrimary,
              backgroundColor: theme.colors.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ScanFace size={56} color={theme.colors.onActionPrimary} />
          </View>
        </Pulse>
      </View>
      <View style={[corner, { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }]} />
      <View style={[corner, { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }]} />
      <View style={[corner, { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }]} />
      <View style={[corner, { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 }]} />
    </View>
  );
}

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
export function LivenessCamera({ mode, personId, onSuccess, onError, allowBackCamera }: LivenessCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const theme = useThemeTokens();
  const [capturing, setCapturing] = useState(false);
  // Challenge is created on mount; the guided dial renders as soon as the
  // challenge arrives and detection begins immediately (no intro gate).
  const [enrolling, setEnrolling] = useState(false);
  // Camera preview is stopped briefly before navigating away — unmounting an
  // ACTIVE Camera on the new architecture (Fabric) can dispatch a
  // topCameraReady event after the JS view is gone, which crashes the app.
  const [cameraActive, setCameraActive] = useState(true);
  const router = useRouter();

  const liveness = useLivenessSession();
  const enrollFace = useEnrollFace();
  const updateFace = useUpdateFace();
  // Absolute overlays ignore SafeAreaView padding — apply insets manually
  const insets = useSafeAreaInsets();

  // Under-10 members may flip to the rear camera (parent holds the phone);
  // everyone else stays front-only per the age-band spec.
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const photoOutput = usePhotoOutput();

  const cameraRef = useRef<CameraRef>(null);

  // Per-step tracking refs
  const stepStartedAt = useRef<number>(0);
  const lastClientTs = useRef<number>(0);
  const eyesWereClosed = useRef(false);
  const submittingRef = useRef(false);
  const lastSampleTs = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transient UX hints (too-fast action, multiple faces) shown under the dial
  const [hint, setHint] = useState<string | null>(null);
  const [multiFace, setMultiFace] = useState(false);
  // True once requestPermission() comes back denied - shows a Settings button
  const [permDenied, setPermDenied] = useState(false);
  // No camera after a few seconds = device has none / it's busy — don't leave
  // the user staring at "Loading camera..." forever.
  const [deviceTimedOut, setDeviceTimedOut] = useState(false);

  useEffect(() => {
    if (device || deviceTimedOut) return;
    const t = setTimeout(() => setDeviceTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [device, deviceTimedOut]);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Clear any pending hint timer on unmount
  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  // ── In-place failure handling (fixes the 429 retry loop) ─────────────
  // Failures fail the session LOCALLY instead of navigating away:
  //  1. phase leaves 'challenging' immediately → the frame processor's
  //     onFaceSample guard stops re-submitting evidence (previously a 429
  //     on evidence kept the phase 'challenging' and resubmitted every
  //     ~100ms during the 400ms navigation settle window).
  //  2. The built-in failed UI shows toApiError's friendly copy with a
  //     retry cooldown — 10s after a 429 (retrying sooner only burns more
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
  // reset (Try Again) — depends on phase so idle→start works every time.
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

  // Handle face sample — auto-detect actions (called from JS thread via Worklets)
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
      console.log('[Liveness] Blink: eyes REOPENED — blink complete!');
    } else if (action === 'turn_left' || action === 'turn_right') {
      // ML Kit yaw: positive = subject turns to their LEFT, negative = to their RIGHT
      if (action === 'turn_right' && yaw > -YAW_THRESHOLD) return;
      if (action === 'turn_left' && yaw < YAW_THRESHOLD) return;
      console.log(`[Liveness] Turn detected: yaw=${yaw.toFixed(1)}° crossed threshold ${YAW_THRESHOLD}°`);
    } else {
      // Unknown challenge type from the server - never submit evidence for an
      // action we didn't actually detect (any turn would otherwise "pass" it).
      console.error('[Liveness] Unknown challenge action:', action);
      liveness.failSession('Unsupported verification step. Please update the app.');
      return;
    }

    // Action detected — check timing
    const durationMs = Date.now() - stepStartedAt.current;
    const { min_ms, max_ms } = liveness.challenge.step_time_limits;
    console.log(`[Liveness] Action detected: duration=${durationMs}ms (limits: ${min_ms}-${max_ms}ms)`);
    if (durationMs < min_ms) {
      // Too fast - not a failure, just ask them to hold the pose. The hint
      // auto-clears so the next (slower) attempt isn't blocked.
      setHint('Hold that pose a moment...');
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), 1500);
      return;
    }
    if (durationMs > max_ms) {
      // too slow — fail the session locally so the retry UI shows and
      // sample processing stops (phase leaves 'challenging').
      console.error('[Liveness] Step timed out:', durationMs, '>', max_ms);
      liveness.failSession('Time limit exceeded. Please try again.');
      return;
    }

    // Ensure strictly increasing client_ts_ms
    const clientTsMs = Math.max(Date.now(), lastClientTs.current + 1);
    lastClientTs.current = clientTsMs;

    // Submit evidence — metadata only, NO image (per guide §4.2)
    submittingRef.current = true;
    try {
      console.log(`[Liveness] Submitting evidence for step ${liveness.currentStepIndex}: ${action}`);
      await liveness.submitEvidence(durationMs, clientTsMs);
      console.log('[Liveness] Evidence accepted');
    } catch (err: any) {
      console.error('[Liveness] Evidence submit failed:', err?.message, JSON.stringify(err?.response?.data));
      console.error('[Liveness] Sent request was:', JSON.stringify({
        url: err?.config?.url,
        method: err?.config?.method,
        data: err?.config?.data,
        contentType: err?.config?.headers?.['Content-Type'] ?? err?.config?.headers?.get?.('Content-Type'),
      }));
      // Fail in place — leaves 'challenging' so the frame processor stops
      // resubmitting evidence (the old navigation path left the phase
      // unchanged and caused a 429 resubmission storm).
      failWithCooldown(err, 'Liveness step rejected');
    } finally {
      submittingRef.current = false;
    }
  }, [liveness, failWithCooldown]);

  // Create a runOnJS wrapper for the face sample handler.
  // IMPORTANT: runOnJS(fn) binds fn at creation time — passing onFaceSample directly
  // would forever call the FIRST-render closure with stale liveness state
  // (phase 'idle'), so no action would ever be detected. Route through a ref
  // so the wrapper always invokes the latest callback.
  const onFaceSampleRef = useRef(onFaceSample);
  useEffect(() => {
    onFaceSampleRef.current = onFaceSample;
  });
  /* eslint-disable react-hooks/refs -- created once via lazy state init; the
     runOnJS wrapper reads the latest handler through the ref when samples
     arrive (it only runs on face events, never during render). */
  const [onFaceSampleJS] = useState(() =>
    runOnJS((leftEyeOpen: number, rightEyeOpen: number, yaw: number) => {
      onFaceSampleRef.current(leftEyeOpen, rightEyeOpen, yaw);
    }),
  );
  /* eslint-enable react-hooks/refs */

  // Face detection via a dedicated CameraOutput (NOT a frame processor).
  // The library manages its own YUV output stream so ML Kit always gets a
  // supported frame format — the useFrameOutput + detectFaces(frame) path
  // crashes on Android with "Only JPEG and YUV_420_888 are supported now"
  // because frame output buffers are RGBA.
  // The handler only touches refs + the stable runOnJS wrapper, so a plain
  // useCallback stays current — the memoized output can call it directly.
  const handleFaces = useCallback((faces: Face[]) => {
    setMultiFace(faces.length > 1);
    const face = faces[0];
    // Ambiguous frame - don't let a second person satisfy the challenge.
    if (!face || faces.length > 1) return;

    // Throttle: ~10 samples/sec
    const now = Date.now();
    if (now - lastSampleTs.current < 100) return;
    lastSampleTs.current = now;

    const leftEye = face.leftEyeOpenProbability ?? 1;
    const rightEye = face.rightEyeOpenProbability ?? 1;
    const yaw = face.yawAngle ?? 0;
    console.log(`[Liveness] Sample: leftEye=${leftEye.toFixed(2)} rightEye=${rightEye.toFixed(2)} yaw=${yaw.toFixed(1)}°`);

    onFaceSampleJS(leftEye, rightEye, yaw);
  }, [onFaceSampleJS]);

  /* eslint-disable react-hooks/refs -- the output is created once for the
     Camera's outputs prop; its callbacks run on native face events and read
     the throttle/sample refs only then, never during render. */
  const faceDetectorOutput = useMemo(
    () =>
      createFaceDetectorOutput({
        performanceMode: 'fast',
        runClassifications: true,
        runLandmarks: false,
        onFacesDetected: handleFaces,
        onError: (error) => {
          console.warn('Face detection error:', error.message);
        },
      }),
    [handleFaces],
  );
  /* eslint-enable react-hooks/refs */

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

      // Send the captured file straight into multipart FormData - no base64
      // round-trip (a high-res frame as a base64 string spikes memory).
      const fileUri = photoFile.filePath.startsWith('file://')
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;

      console.log('[Liveness] Calling finalize API...');
      const result = await liveness.finalize(fileUri);
      console.log('[Liveness] Finalize result:', JSON.stringify(result));

      if (result.status !== 'passed') {
        console.error('[Liveness] Finalize not passed:', result.status, result.message);
        // finalize() already flipped the phase to 'failed' — just set the
        // retry cooldown and stay in place (no navigation).
        setCooldownLeft(3);
        return;
      }

      // Passed — the dedicated "Liveness verified" screen offers the enroll
      // button; enrollment runs on tap via enrollFaceNow (result is a
      // one-time credential consumed by face enrollment).
    } catch (err: any) {
      console.error('[Liveness] captureAndFinalize ERROR:', err?.message, err?.response?.data ? JSON.stringify(err.response.data) : '', err?.stack);
      failWithCooldown(err, 'Face enrollment failed');
    } finally {
      setCapturing(false);
    }
  }, [capturing, liveness, failWithCooldown, photoOutput]);

  // Enroll/update the face with the liveness session credentials.
  // Per guide §5.2: send only livenessSessionId + sessionToken + personId.
  // If enrollment fails the liveness result is already consumed — start a
  // NEW challenge (reset → idle → auto-creates a fresh session).
  const enrollFaceNow = useCallback(async () => {
    if (enrolling || liveness.phase !== 'passed' || !liveness.result) return;
    setEnrolling(true);
    console.log('[Liveness] Enrolling face, mode:', mode, 'personId:', personId);
    try {
      const facePayload = {
        livenessSessionId: liveness.result.session_id,
        sessionToken: liveness.sessionToken ?? '',
        personId,
      };
      if (mode === 'enroll') {
        await enrollFace.mutateAsync(facePayload);
        if (!personId) {
          // Don't flip faceEnrolled yet — face-enrolled must actually render
          // (the onboarding layout redirects the moment it goes true) and the
          // flag proves the success screen followed a real enrollment.
          flowGuards.grant('onboarding:face-enrolled');
        }
      } else {
        await updateFace.mutateAsync(facePayload);
      }
      console.log('[Liveness] Face enrollment SUCCESS');
      await settleCameraThen(onSuccess);
    } catch (err: any) {
      console.error('[Liveness] Face enrollment failed:', err?.message);
      // The liveness session is single-use — consumed whether enroll
      // succeeded or not — so the failed screen's Try Again starts a NEW
      // challenge rather than retrying a dead credential.
      failWithCooldown(err, 'Face enrollment failed');
    } finally {
      setEnrolling(false);
    }
  }, [enrolling, liveness, mode, personId, enrollFace, updateFace, onSuccess, settleCameraThen, failWithCooldown]);

  // Auto-finalize when phase becomes 'finalizing'
  useEffect(() => {
    if (liveness.phase === 'finalizing' && !capturing) {
      const timer = setTimeout(() => {
        captureAndFinalize();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [liveness.phase, capturing, captureAndFinalize]);

  // ── UI animation hooks (MUST be before any early return) ──────────────
  // Session countdown — expires_in_seconds is a snapshot at challenge
  // creation; tick it down locally so the expiring-session warning is real.
  const [sessionLeft, setSessionLeft] = useState<number | null>(null);
  const sessionId = liveness.challenge?.session_id;
  useEffect(() => {
    const total = liveness.challenge?.expires_in_seconds;
    if (total == null) return;
    // Seed on a microtask — synchronous setState inside an effect body is not
    // allowed (react-hooks/set-state-in-effect).
    queueMicrotask(() => setSessionLeft(total));
    const t = setInterval(() => setSessionLeft((s) => (s == null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [sessionId, liveness.challenge?.expires_in_seconds]);

  // Proactively fail an expired session — otherwise the user keeps doing
  // steps and the next evidence submit dies with a cryptic server error.
  useEffect(() => {
    if (sessionLeft === 0 && liveness.phase === 'challenging') {
      // queueMicrotask: a synchronous setState inside the effect body trips
      // react-hooks/set-state-in-effect (same pattern as the seed above).
      queueMicrotask(() => failSession('Your session expired — please try again.'));
    }
  }, [sessionLeft, liveness.phase, failSession]);

  // Permission not granted
  if (!hasPermission) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing[8],
        }}
        edges={['top', 'bottom']}>
        <Typography variant="body" center style={{ marginBottom: theme.spacing[4] }}>
          Camera permission is required for face verification.
        </Typography>
        <CoreButton
          onPress={async () => {
            const granted = await requestPermission();
            // Permanently denied -> the dialog won't show again; send the
            // user to system settings instead of a dead button.
            if (!granted) setPermDenied(true);
          }}
          accessibilityLabel="Grant camera permission">
          Grant Permission
        </CoreButton>
        {permDenied ? (
          <CoreButton
            variant="outline"
            style={{ marginTop: theme.spacing[3] }}
            onPress={() => void Linking.openSettings()}
            accessibilityLabel="Open app settings">
            Open Settings
          </CoreButton>
        ) : null}
      </SafeAreaView>
    );
  }

  // No camera device
  if (!device) {
    if (deviceTimedOut) {
      return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ScreenHeader title="Face verification" onBack={() => router.back()} />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: theme.spacing[4],
              gap: theme.spacing[4],
            }}>
            <Alert variant="error" title="Camera unavailable">
              No usable camera was found — it may be busy in another app or unavailable on this device.
            </Alert>
            <CoreButton
              fullWidth
              size="lg"
              accessibilityLabel="Go back"
              onPress={() => router.back()}>
              Go Back
            </CoreButton>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
        edges={['top', 'bottom']}>
        <Spinner size="lg" label="Loading camera" />
        <Typography variant="body-sm" color="secondary" style={{ marginTop: theme.spacing[4] }}>
          Loading camera...
        </Typography>
      </SafeAreaView>
    );
  }

  // Face detection — challenge is being created (POST /cb/liveness/v2/challenge).
  // Static detection frame + scanline while the session prepares.
  if (liveness.phase === 'creating' || liveness.phase === 'idle') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Face verification" onBack={() => router.back()} />
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <FaceFrame />
          <StepDots total={liveness.challenge?.challenge_sequence?.length || 4} current={0} />
          <Typography variant="caption" color="muted" center>
            Center your face in the frame
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  // Error state — friendly message (from toApiError) + retry cooldown so a
  // 429 isn't hammered (each immediate retry burns more rate-limit quota).
  if (liveness.phase === 'failed') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, padding: theme.spacing[4], justifyContent: 'center', gap: theme.spacing[5] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
            <PopIn from={0.5}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: theme.radii.full,
                  backgroundColor: theme.colors.errorSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...theme.shadows.lg,
                }}>
                <TriangleAlert size={40} color={theme.colors.onErrorSubtle} />
              </View>
            </PopIn>
            <Typography variant="h2" center>
              Verification unsuccessful
            </Typography>
            <Typography color="secondary" center>
              {liveness.error ?? 'We couldn’t confidently verify your identity.'}
            </Typography>
          </View>
          <Card>
            <CardContent style={{ gap: 10 }}>
              <StepRow
                leading={
                  <RowIcon
                    tone="warning"
                    icon={<Eye size={iconSize.md} color={theme.colors.onWarningSubtle} />}
                  />
                }
                title="Face not clearly visible"
                subtitle="Poor lighting or camera movement"
              />
              <StepRow
                leading={
                  <RowIcon
                    tone="neutral"
                    icon={<CircleHelp size={iconSize.md} color={theme.colors.textSecondary} />}
                  />
                }
                title="Why did this happen?"
                subtitle="Lighting · camera movement · identity mismatch"
              />
            </CardContent>
          </Card>
        </View>
        <View
          style={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[3],
            paddingBottom: theme.spacing[4] + insets.bottom,
            borderTopWidth: theme.sizes.fieldBorderWidth,
            borderTopColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface,
            gap: theme.spacing[2],
          }}>
          <CoreButton
            fullWidth
            size="lg"
            disabled={cooldownLeft > 0}
            accessibilityLabel="Restart liveness verification"
            onPress={() => liveness.reset()}>
            {cooldownLeft > 0 ? `Try again in ${cooldownLeft}s` : 'Try Again'}
          </CoreButton>
          <CoreButton
            fullWidth
            variant="ghost"
            accessibilityLabel="Get help"
            onPress={() => router.push('/help' as never)}>
            Get help
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }

  const isFinalizing = liveness.phase === 'finalizing';
  const steps = liveness.challenge?.challenge_sequence ?? [];
  const action = liveness.currentChallenge;
  const expiresIn = sessionLeft ?? liveness.challenge?.expires_in_seconds;
  const sessionLabel = expiresIn != null
    ? `Session expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}`
    : 'Liveness session';
  const sessionExpiring = sessionLeft != null && sessionLeft > 0 && sessionLeft <= 60;

  // Finalize — high-res frame upload + anti-spoof checks. The Camera stays
  // mounted off-screen: photoOutput.capturePhotoToFile still needs it.
  if (isFinalizing) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Verifying" />
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[5], justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
            <PopIn>
              <RowIcon tone="primary" icon={<ScanFace size={iconSize.lg} color={theme.colors.actionPrimary} />} />
            </PopIn>
            <Typography variant="h3">Verifying…</Typography>
          </View>
          <Card>
            <CardContent style={{ gap: 14 }}>
              <FlowSteps
                steps={[
                  { label: 'Scanning', state: 'done' },
                  { label: 'Detecting face', state: 'done' },
                  { label: 'Checking liveness', state: 'active' },
                  { label: 'Matching identity', state: 'pending' },
                ]}
              />
            </CardContent>
          </Card>
          <Typography variant="caption" color="muted" center>
            Don&apos;t close the app — this takes a few seconds.
          </Typography>
        </View>
        <View style={{ position: 'absolute', top: -2000, left: -2000, width: 400, height: 533 }}>
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            device={device}
            isActive={cameraActive}
            outputs={[photoOutput, faceDetectorOutput]}
            mirrorMode="auto"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Passed — one-time liveness result; user confirms face enrollment.
  // Camera stays mounted off-screen so settleCameraThen can stop it cleanly.
  if (liveness.phase === 'passed' && liveness.result) {
    const result = liveness.result;
    // antispoof_score is 0–1 from the BFF; render as a percentage.
    const confidencePct = (result.antispoof_score <= 1 ? result.antispoof_score * 100 : result.antispoof_score).toFixed(1);
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, padding: theme.spacing[4], justifyContent: 'center', gap: theme.spacing[5] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
            <PopIn>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: theme.radii.full,
                  backgroundColor: theme.colors.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...theme.shadows.lg,
                }}>
                <CircleCheck size={44} color={theme.colors.onActionPrimary} />
              </View>
            </PopIn>
            <Typography variant="h2">You&apos;re verified</Typography>
            <Typography color="secondary" center>
              Your identity has been successfully confirmed.
            </Typography>
            <Text
              style={{
                fontFamily: theme.fontFamily.mono.bold,
                fontSize: theme.fontSize['4xl'],
                color: theme.colors.textPrimary,
                letterSpacing: theme.letterSpacing.tight,
              }}>
              {confidencePct}%
            </Text>
            <Typography variant="caption" color="muted">
              Verification confidence
            </Typography>
          </View>
          <FadeUp delay={140}>
            <Card>
              <CardContent style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body">Risk level</Typography>
                  <Badge variant="success">LOW</Badge>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body">Liveness</Typography>
                  <Badge variant="success">PASS</Badge>
                </View>
              </CardContent>
            </Card>
          </FadeUp>
        </View>
        <View
          style={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[3],
            paddingBottom: theme.spacing[4] + insets.bottom,
            borderTopWidth: theme.sizes.fieldBorderWidth,
            borderTopColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface,
          }}>
          <CoreButton
            fullWidth
            size="lg"
            loading={enrolling}
            accessibilityLabel={mode === 'enroll' ? 'Enroll my face' : 'Update my face'}
            onPress={enrollFaceNow}>
            Continue
          </CoreButton>
        </View>
        <View style={{ position: 'absolute', top: -2000, left: -2000, width: 400, height: 533 }}>
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            device={device}
            isActive={cameraActive}
            outputs={[photoOutput, faceDetectorOutput]}
            mirrorMode="auto"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title="Face verification"
        subtitle={liveness.sessionId ? `Session ${liveness.sessionId}` : undefined}
        actions={
          <View style={{ flexDirection: 'row', gap: theme.spacing[1] }}>
            {allowBackCamera ? (
              <IconButton
                accessibilityLabel={cameraPosition === 'front' ? 'Switch to back camera' : 'Switch to front camera'}
                icon={<SwitchCamera size={iconSize.md} color={theme.colors.textPrimary} />}
                onPress={() => setCameraPosition((p) => (p === 'front' ? 'back' : 'front'))}
              />
            ) : null}
            <IconButton
              accessibilityLabel="Close liveness check"
              icon={<X size={iconSize.md} color={theme.colors.textPrimary} />}
              onPress={() => router.back()}
            />
          </View>
        }
      />
      <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[3] }}>
        {/* Guided dial (design-repo E·DIAL) — per-step ring segments, countdown
            drain and a demonstrator head performing the active challenge. The
            camera runs off-screen; face-detector output still gets frames. */}
        <LivenessGuideDial
          steps={steps}
          currentIndex={liveness.currentStepIndex}
          labels={{
            ...(liveness.challenge?.ui_copy ?? {}),
            ...(action && liveness.instruction ? { [action]: liveness.instruction } : {}),
          }}
          stepMs={liveness.challenge?.step_time_limits.max_ms ?? 6000}
          style={{ width: '100%' }}
        />
        {sessionExpiring ? (
          <Alert variant="warning" title="Session expiring">
            Expires in {sessionLeft} seconds.
          </Alert>
        ) : null}
        {multiFace ? (
          <Typography variant="caption" center style={{ color: theme.colors.error }}>
            Only one person in the frame
          </Typography>
        ) : hint ? (
          <Typography variant="caption" color="muted" center>
            {hint}
          </Typography>
        ) : null}
        <Typography variant="caption" color="muted" center>
          {sessionLabel} · {cameraPosition} camera
        </Typography>
      </View>
      {/* Camera mounted off-screen during the challenge — same trick the
          finalize/passed phases use so detection + photo capture keep working. */}
      <View style={{ position: 'absolute', top: -2000, left: -2000, width: 400, height: 533 }}>
        <Camera
          ref={cameraRef}
          style={{ flex: 1 }}
          device={device}
          isActive={cameraActive}
          outputs={[photoOutput, faceDetectorOutput]}
          mirrorMode="auto"
        />
      </View>
    </SafeAreaView>
  );
}

