import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { setRegistrationToken } from '@/api/client';
import { toApiError } from '@/api/errors';
import { Alert, OtpInput } from '@/components/composite';
import { useToast } from '@/components/composite/Toast';
import { CoreButton, IconButton, Link, NeuWell, Typography } from '@/components/ui';
import { useVerifyOtp } from '@/features/auth/mutations';
import { useCountdown } from '@/hooks/useCountdown';
import { makeStyles, useThemeTokens } from '@/theme';
import type { OtpPurpose, VerifyOtpRequest, VerifyOtpResponse } from '@/types/domain';

interface OtpVerificationProps {
  title: string;
  heading: string;
  sentTo: string;
  purpose: OtpPurpose;
  /** Identifier fields to send with the OTP verification. */
  identifier?: { registrationId?: string; phone?: string; countryCode?: string; email?: string };
  /**
   * Called after successful verification. Receives the full response and the
   * verified code (password-reset needs it for /auth/reset-password) so the
   * caller can decide what to do (e.g., dispatch sessionStarted for email
   * purpose, or store registrationToken for phone purpose).
   */
  onVerified: (response: VerifyOtpResponse, code: string) => void;
  /**
   * Actually re-sends the OTP (backend has no generic resend endpoint, so each
   * screen re-calls the endpoint that originally triggered the code — e.g.
   * register for phone, account-details for email). When omitted the resend
   * button is hidden instead of pretending to resend.
   */
  onResend?: () => Promise<void>;
  /** Overrides the header back action (e.g. returning to a previous in-screen step). */
  onBack?: () => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
/** Backend contract: max 5 wrong attempts, OTP expires after 10 minutes. */
const MAX_OTP_ATTEMPTS = 5;
const OTP_TTL_SECONDS = 10 * 60;


/** Reads a server-provided attempts-remaining count if the backend sends one. */
function attemptsRemainingFrom(err: unknown): number | null {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const value = data?.attemptsRemaining ?? data?.attempts_remaining ?? data?.remainingAttempts;
  return typeof value === 'number' && value >= 0 ? value : null;
}

type VerifyState = 'idle' | 'loading' | 'error' | 'success';

/** Layout mirrors UI-design-repo VerifyOtpScreen 1:1. */
export function OtpVerification({
  title,
  heading,
  sentTo,
  purpose,
  identifier,
  onVerified,
  onResend,
  onBack,
}: OtpVerificationProps) {
  const styles = useStyles();
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [resending, setResending] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_OTP_ATTEMPTS);
  const { seconds: resendSeconds, reset: resetResendCooldown } = useCountdown(RESEND_SECONDS);
  const { seconds: otpSecondsLeft, reset: resetOtpTtl } = useCountdown(OTP_TTL_SECONDS);
  const locked = attemptsLeft <= 0;
  const expired = otpSecondsLeft === 0;
  const shakeX = useSharedValue(0);
  const verifyOtp = useVerifyOtp();
  const goBack = onBack ?? router.back;

  const handleChange = (value: string) => {
    setCode(value);
    if (verifyState === 'error') {
      setVerifyState('idle');
    }
  };

  const handleVerify = async (submitted?: string) => {
    const otp = submitted ?? code;
    if (otp.length !== OTP_LENGTH || verifyState === 'loading' || verifyState === 'success' || locked || expired) return;
    setVerifyState('loading');
    try {
      const payload: VerifyOtpRequest = {
        otp,
        purpose,
        ...identifier,
      };
      // Never log the raw payload — it carries the OTP code.
      console.log('[OTP] Verifying:', { purpose, registrationId: identifier?.registrationId, otpLength: otp.length });
      if (purpose === 'phone' && !identifier?.registrationId) {
        console.error('[OTP] Missing registrationId for phone verification — backend will return 404');
      }
      const response = await verifyOtp.mutateAsync(payload);
      // Response can carry session tokens (registrationToken/accessToken) — redact them.
      console.log('[OTP] Response:', JSON.stringify({
        ...response,
        registrationToken: response.registrationToken ? '***' : undefined,
        accessToken: response.accessToken ? '***' : undefined,
        refreshToken: response.refreshToken ? '***' : undefined,
      }));

      // Store registration token if present (phone verification during registration)
      if (response.registrationToken) {
        setRegistrationToken(response.registrationToken);
      }

      setVerifyState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onVerified(response, otp);
    } catch (err: any) {
      console.error('[OTP] Error:', {
        message: err?.message,
        status: err?.response?.status,
        url: err?.config?.url,
        data: JSON.stringify(err?.response?.data),
      });
      const apiErr = toApiError(err);
      setVerifyState('error');
      if (apiErr.status === 429) {
        // 429 on verify means the code is burned — waiting won't help, resend will.
        setAttemptsLeft(0);
        toast({
          variant: 'error',
          title: 'Incorrect code',
          description: 'Too many incorrect attempts. This code is no longer valid — request a new one.',
        });
      } else {
        toast({
          variant: 'error',
          title: 'Incorrect code',
          description: apiErr.message || 'Check the latest code and try again.',
        });
        // Count only real rejections (4xx), not network/5xx failures or a stale
        // registration session (404). Prefer a server-provided remaining count.
        if (apiErr.status !== null && apiErr.status >= 400 && apiErr.status < 500 && apiErr.status !== 404) {
          setAttemptsLeft((prev) => attemptsRemainingFrom(err) ?? Math.max(0, prev - 1));
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setCode('');
    }
  };

  const handleResend = async () => {
    if (!onResend || resending || resendSeconds > 0) return;
    setResending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await onResend();
      // Fresh code sent — restart both timers, restore attempts and clear entry.
      resetResendCooldown();
      resetOtpTtl();
      setAttemptsLeft(MAX_OTP_ATTEMPTS);
      setCode('');
      setVerifyState('idle');
      toast({ variant: 'success', title: 'Code resent' });
    } catch (err: any) {
      toast({
        variant: 'error',
        title: "Couldn't resend",
        description: toApiError(err).message || 'Wait a moment and try again.',
      });
    } finally {
      setResending(false);
    }
  };

  const shakeStyle = { transform: [{ translateX: shakeX }] };
  const countdown = `${String(Math.floor(resendSeconds / 60)).padStart(2, '0')}:${String(
    resendSeconds % 60,
  ).padStart(2, '0')}`;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <IconButton
            icon={<ArrowLeft size={theme.iconSize.md} color={theme.colors.actionPrimary} />}
            variant="ghost"
            onPress={goBack}
            accessibilityLabel="Back"
          />
          <View style={styles.headerText}>
            <Typography variant="h4" numberOfLines={1}>
              {title}
            </Typography>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.body}>
            <View style={styles.center}>
              <Typography variant="h3" center>
                {heading}
              </Typography>
              <Typography color="secondary" center>
                {sentTo}
              </Typography>
            </View>

            <Animated.View style={shakeStyle}>
              <OtpInput
                length={OTP_LENGTH}
                value={code}
                onChange={handleChange}
                onComplete={handleVerify}
                autoFocus
                disabled={locked || expired || verifyState === 'loading'}
                state={verifyState === 'error' ? 'error' : 'default'}
                accessibilityLabel="Verification code"
              />
            </Animated.View>

            {__DEV__ ? (
              <NeuWell radius={theme.radii.full} style={styles.demoPill}>
                <Typography variant="caption" color="muted" style={styles.mono}>
                  Example code: 123456
                </Typography>
              </NeuWell>
            ) : null}

            {expired ? (
              <Alert variant="warning" title="Code expired">
                This code is no longer valid — request a new one.
              </Alert>
            ) : locked ? (
              <Alert variant="error" title="Code locked">
                Too many incorrect attempts — request a new code.
              </Alert>
            ) : attemptsLeft <= 2 ? (
              <Alert variant="warning" title={`${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining`} />
            ) : null}

            <View style={styles.center}>
              <Typography variant="body-sm" color="muted" center>
                Didn&apos;t get it?{' '}
                {onResend ? (
                  <Link onPress={handleResend} disabled={resendSeconds > 0 || resending}>
                    {resending ? 'Sending…' : 'Resend code'}
                  </Link>
                ) : null}
                {resendSeconds > 0 ? <Text style={styles.mono}> ({countdown})</Text> : null}
              </Typography>
            </View>

            {purpose === 'email' ? (
              <View style={styles.center}>
                <Typography variant="body-sm" color="muted">
                  Wrong address? <Link onPress={goBack}>Go back</Link>
                </Typography>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: theme.spacing[4] + insets.bottom }]}>
          <CoreButton
            fullWidth
            size="lg"
            loading={verifyState === 'loading'}
            disabled={
              code.length !== OTP_LENGTH ||
              verifyState === 'loading' ||
              verifyState === 'success' ||
              locked ||
              expired
            }
            accessibilityLabel="Verify code"
            onPress={() => handleVerify()}>
            Verify
          </CoreButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: t.sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing[4],
    gap: t.spacing[2],
  },
  headerText: { flex: 1, alignItems: 'center', gap: 1 },
  headerRight: { minWidth: t.sizes.touchTarget },
  scrollContent: { flexGrow: 1, paddingBottom: t.spacing[6] },
  body: { flex: 1, gap: t.spacing[6], paddingHorizontal: t.spacing[4], paddingTop: t.spacing[4] },
  center: { alignItems: 'center', gap: t.spacing[1] },
  demoPill: {
    alignSelf: 'center',
    paddingVertical: t.spacing[1],
    paddingHorizontal: t.spacing[3],
  },
  mono: { fontFamily: t.fontFamily.mono.medium },
  footer: {
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[4],
    gap: t.spacing[2],
  },
}));
