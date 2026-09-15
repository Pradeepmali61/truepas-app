import { useRouter } from 'expo-router';
import { Camera as CameraIcon, CircleCheck, Eye, ScanFace, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
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
import { Alert, Card, CardContent, ScreenHeader } from '@/components/composite';
import { Badge, Blink, CoreButton, IconButton, PopIn, Pulse, RowIcon, ScanLine, Spinner, Typography } from '@/components/ui';
import { useEnrollFace, useUpdateFace } from '@/features/auth/mutations';
import { faceEnrollmentCompleted } from '@/features/auth/slice';
import { useLivenessSession } from '@/features/liveness/useLivenessSession';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
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

/** Contract field row — caps label over value (IDs/scores use mono). */
function KV({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: theme.letterSpacing.caps,
        }}>
        {label}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.medium,
          color: theme.colors.textPrimary,
          ...(mono ? { fontFamily: theme.fontFamily.mono.medium } : null),
        }}>
        {value}
      </Text>
    </View>
  );
}

/** Step progress dots — completed + current steps are filled. */
function StepDots({ total, current }: { total: number; current: number }) {
  const theme = useThemeTokens();
  return (
    <View
      style={{ flexDirection: 'row', gap: theme.spacing[1], justifyContent: 'center', paddingVertical: theme.spacing[2] }}
      accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            { width: 6, height: 6, borderRadius: theme.radii.full, backgroundColor: theme.colors.border },
            i < current && { backgroundColor: theme.colors.actionPrimary },
            i === current && { width: 18, backgroundColor: theme.colors.actionPrimary },
          ]}
        />
      ))}
    </View>
  );
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
  const theme = useThemeTokens();
  const [capturing, setCapturing] = useState(false);
  // Challenge is created on mount; the intro screen renders until the user
  // taps "Start verification" — then the camera mounts and detection begins.
  const [started, setStarted] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
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
          dispatch(faceEnrollmentCompleted());
        }
      } else {
        await updateFace.mutateAsync(facePayload);
      }
      console.log('[Liveness] Face enrollment SUCCESS');
      await settleCameraThen(onSuccess);
    } catch (err: any) {
      console.error('[Liveness] Face enrollment failed:', err?.message);
      liveness.reset();
    } finally {
      setEnrolling(false);
    }
  }, [enrolling, liveness, mode, personId, enrollFace, updateFace, dispatch, onSuccess, settleCameraThen]);

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

  // Session countdown — expires_in_seconds is a snapshot at challenge
  // creation; tick it down locally so the expiring-session warning is real.
  const [sessionLeft, setSessionLeft] = useState<number | null>(null);
  const sessionId = liveness.challenge?.session_id;
  useEffect(() => {
    const total = liveness.challenge?.expires_in_seconds;
    if (total == null) return;
    setSessionLeft(total);
    const t = setInterval(() => setSessionLeft((s) => (s == null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [sessionId, liveness.challenge?.expires_in_seconds]);

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
        <CoreButton onPress={requestPermission} accessibilityLabel="Grant camera permission">
          Grant Permission
        </CoreButton>
      </SafeAreaView>
    );
  }

  // No camera device
  if (!device) {
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

  // Loading / creating session
  if (liveness.phase === 'creating' || liveness.phase === 'idle') {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
        edges={['top', 'bottom']}>
        <Spinner size="lg" label="Preparing liveness challenge" />
        <Typography variant="body-sm" color="secondary" style={{ marginTop: theme.spacing[4] }}>
          Preparing liveness challenge...
        </Typography>
      </SafeAreaView>
    );
  }

  // Error state â€” friendly message (from toApiError) + retry cooldown so a
  // 429 isn't hammered (each immediate retry burns more rate-limit quota).
  if (liveness.phase === 'failed') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Face verification" />
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2], marginTop: theme.spacing[6] }}>
            <PopIn from={0.5}>
              <RowIcon tone="error" icon={<TriangleAlert size={iconSize.xl} color={theme.colors.onErrorSubtle} />} />
            </PopIn>
            <Typography variant="h3">We couldn&apos;t verify liveness</Typography>
            <Badge variant="error">Failed</Badge>
          </View>
          <Alert variant="warning" title="Try again in better light">
            {liveness.error ?? 'Move to a brighter spot and keep your face inside the ring for the whole step.'}
          </Alert>
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
            {cooldownLeft > 0 ? `Restart in ${cooldownLeft}s` : 'Restart verification'}
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

  // Intro — challenge created. Render the server-provided challenge_sequence
  // + ui_copy in returned order (never hard-coded); camera starts on tap.
  if (liveness.phase === 'challenging' && !started) {
    const sequence = liveness.challenge?.challenge_sequence ?? [];
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Face verification" onBack={() => router.back()} />
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
            <RowIcon tone="primary" icon={<ScanFace size={iconSize.xl} color={theme.colors.actionPrimary} />} />
            <Typography variant="h3" center>Prove it&apos;s really you</Typography>
            <Typography variant="body" color="secondary" center>
              We&apos;ll ask you to do {sequence.length} quick {sequence.length === 1 ? 'action' : 'actions'} on camera. It takes about 10 seconds.
            </Typography>
          </View>
          <Card>
            <CardContent style={{ gap: 12 }}>
              {sequence.map((step, i) => (
                <StepRow
                  key={`${step}-${i}`}
                  leading={<RowIcon icon={<Eye size={iconSize.md} color={theme.colors.textSecondary} />} />}
                  title={liveness.challenge?.ui_copy[step] ?? step}
                  subtitle={`Step ${i + 1}`}
                />
              ))}
            </CardContent>
          </Card>
          <Alert variant="info" title="Good conditions help">
            Even lighting, hold the phone at eye level, remove hats and glasses.
          </Alert>
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
            accessibilityLabel="Start verification"
            iconLeft={<CameraIcon size={iconSize.sm} color={theme.colors.onActionPrimary} />}
            onPress={() => {
              // Restart step timing — evidence duration must not include the
              // time spent reading this intro.
              beginStep();
              setStarted(true);
            }}>
            Start verification
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }
  const isFinalizing = liveness.phase === 'finalizing';
  const steps = liveness.challenge?.challenge_sequence ?? [];
  const action = liveness.currentChallenge;
  const actionUi = (action && ACTION_UI[action]) ?? null;

  // Chip copy per phase — server ui_copy (liveness.instruction) is the
  // primary instruction text; ACTION_UI titles are the local fallback.
  const chipText = isFinalizing
    ? 'Hold still'
    : stepDone
      ? 'Done!'
      : liveness.instruction || actionUi?.title || 'Follow the instruction';
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
        <ScreenHeader title="Face verification" />
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2], marginTop: theme.spacing[6] }}>
            <Pulse to={1.08} ms={800}>
              <RowIcon tone="primary" icon={<ScanFace size={iconSize.lg} color={theme.colors.actionPrimary} />} />
            </Pulse>
            <Typography variant="h3">Verifying…</Typography>
            <Typography variant="body-sm" color="secondary" center>
              Uploading your final frame and running anti-spoof checks. Don&apos;t close the app.
            </Typography>
          </View>
          <CoreButton loading disabled fullWidth>
            Verifying
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

  // Passed — one-time liveness result; user confirms face enrollment.
  // Camera stays mounted off-screen so settleCameraThen can stop it cleanly.
  if (liveness.phase === 'passed' && liveness.result) {
    const result = liveness.result;
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Face verification" />
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2], marginTop: theme.spacing[6] }}>
            <PopIn>
              <RowIcon tone="success" icon={<CircleCheck size={iconSize.xl} color={theme.colors.onSuccessSubtle} />} />
            </PopIn>
            <Typography variant="h3">Liveness verified</Typography>
            <Badge variant="success">Passed</Badge>
          </View>
          <Card>
            <CardContent style={{ gap: 10 }}>
              <KV label="Session" value={result.session_id} mono />
              <KV label="Anti-spoof score" value={String(result.antispoof_score)} mono />
              <KV label="Next step" value={mode === 'enroll' ? 'Face enrollment' : 'Face update'} />
            </CardContent>
          </Card>
          <Alert variant="info" title="One-time result">
            This liveness result is consumed by face enrollment — if enrollment fails you&apos;ll start a new challenge.
          </Alert>
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
            {mode === 'enroll' ? 'Enroll my face' : 'Update my face'}
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
          <IconButton
            accessibilityLabel="Close liveness check"
            icon={<X size={iconSize.md} color={theme.colors.textPrimary} />}
            onPress={() => router.back()}
          />
        }
      />
      <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[3] }}>
        {/* Viewfinder — dark rounded frame, live camera behind overlays */}
        <View
          style={{
            aspectRatio: 3 / 4,
            borderRadius: theme.radii.xl,
            backgroundColor: theme.colors.textPrimary,
            overflow: 'hidden',
          }}>
          <Camera
            ref={cameraRef}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            device={device}
            isActive={cameraActive}
            outputs={[photoOutput, faceDetectorOutput]}
            mirrorMode="auto"
          />
          <ScanLine color={theme.colors.accent} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[8] }}>
            <Pulse to={1.04} ms={900}>
              <View
                style={{
                  width: 168,
                  height: 208,
                  borderRadius: 104,
                  borderWidth: 3,
                  borderColor: theme.colors.actionPrimary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ScanFace size={56} color={theme.colors.onActionPrimary} />
              </View>
            </Pulse>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[2],
                borderRadius: theme.radii.full,
                backgroundColor: stepDone ? theme.colors.success : theme.colors.actionPrimary,
                maxWidth: '88%',
              }}>
              <Blink ms={650}>
                <View style={{ width: 8, height: 8, borderRadius: theme.radii.full, backgroundColor: theme.colors.onActionPrimary }} />
              </Blink>
              <Text style={{ color: theme.colors.onActionPrimary, fontFamily: theme.fontFamily.sans.semibold, fontSize: theme.fontSize.base }}>
                {chipText}
              </Text>
            </View>
          </View>
        </View>
        <StepDots total={steps.length} current={liveness.currentStepIndex} />
        {sessionExpiring ? (
          <Alert variant="warning" title="Session expiring">
            Expires in {sessionLeft} seconds.
          </Alert>
        ) : null}
        <Typography variant="caption" color="muted" center>
          {sessionLabel} · front camera
        </Typography>
      </View>
    </SafeAreaView>
  );
}

