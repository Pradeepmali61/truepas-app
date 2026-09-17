import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { setRegistrationToken } from '@/api/client';
import { toApiError } from '@/api/errors';
import { Alert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CoreButton, Link, Progress, RowIcon, Typography } from '@/components/ui';
import { useVerifyOtp } from '@/features/auth/mutations';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { OtpPurpose, VerifyOtpRequest, VerifyOtpResponse } from '@/types/domain';

interface OtpVerificationProps {
  title: string;
  heading: string;
  sentTo: string;
  icon: ReactNode;
  /** Optional — omitted for flows outside the registration progress (e.g. password reset). */
  progress?: number;
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

export function OtpVerification({
  title,
  heading,
  sentTo,
  icon,
  progress,
  purpose,
  identifier,
  onVerified,
  onResend,
  onBack,
}: OtpVerificationProps) {
  const router = useRouter();
  const theme = useThemeTokens();
  const [code, setCode] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_OTP_ATTEMPTS);
  const { seconds: resendSeconds, reset: resetResendCooldown } = useCountdown(RESEND_SECONDS);
  const { seconds: otpSecondsLeft, reset: resetOtpTtl } = useCountdown(OTP_TTL_SECONDS);
  const locked = attemptsLeft <= 0;
  const expired = otpSecondsLeft === 0;
  const shakeX = useSharedValue(0);
  const verifyOtp = useVerifyOtp();

  const handleChange = (value: string) => {
    setCode(value);
    if (verifyState === 'error') {
      setVerifyState('idle');
      setErrorMsg('');
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
      setTimeout(() => onVerified(response, otp), 600);
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
        setErrorMsg('Too many incorrect attempts. This code is no longer valid — request a new one.');
      } else {
        setErrorMsg(apiErr.message || 'Invalid verification code. Please try again.');
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
    if (!onResend || resending) return;
    setErrorMsg('');
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
    } catch (err: any) {
      setVerifyState('error');
      setErrorMsg(toApiError(err).message || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const shakeStyle = { transform: [{ translateX: shakeX }] };

  return (
    <ScreenContainer scroll={false} background={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScreenHeader title={title} onBack={onBack ?? router.back} />
        {progress != null ? (
          <View style={{ paddingHorizontal: theme.spacing[4] }}>
            <Progress value={progress} accessibilityLabel="Verification progress" />
          </View>
        ) : null}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing[5],
              gap: theme.spacing[3],
            }}>
            {verifyState === 'success' ? (
              <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
                <RowIcon
                  tone="success"
                  icon={<CircleCheck size={iconSize.xl} color={theme.colors.onSuccessSubtle} />}
                />
                <Typography variant="h3">Verified!</Typography>
                <Typography variant="body-sm" color="secondary">
                  Redirecting...
                </Typography>
              </View>
            ) : (
              <>
                <RowIcon tone="primary" icon={icon} />
                <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
                  <Typography variant="h3" center>
                    {heading}
                  </Typography>
                  <Typography variant="body-sm" color="secondary" center>
                    {sentTo}
                  </Typography>
                </View>
                <Animated.View style={[shakeStyle, { width: '100%', alignItems: 'center' }]}>
                  <OtpInput
                    length={OTP_LENGTH}
                    value={code}
                    onChange={handleChange}
                    onComplete={handleVerify}
                    autoFocus
                    disabled={locked || expired || verifyState === 'loading'}
                    state={verifyState === 'error' ? 'error' : 'default'}
                    accessibilityLabel="One time password"
                  />
                </Animated.View>

                {verifyState === 'error' ? (
                  <Typography variant="body-sm" style={{ color: theme.colors.error }} center>
                    {errorMsg}
                  </Typography>
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

                {!expired ? (
                  <Typography variant="body-sm" color="muted">
                    Code expires in {formatCountdown(otpSecondsLeft)}
                  </Typography>
                ) : null}

                {resendSeconds > 0 ? (
                  <Typography variant="body-sm" color="muted">
                    Resend code in {formatCountdown(resendSeconds)}
                  </Typography>
                ) : onResend ? (
                  <Link onPress={handleResend} accessibilityLabel="Resend code" disabled={resending}>
                    {resending ? 'Sending…' : 'Resend code'}
                  </Link>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
        <View
          style={{
            padding: theme.spacing[4],
            borderTopWidth: theme.sizes.fieldBorderWidth,
            borderTopColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface,
          }}>
          <CoreButton
            fullWidth
            size="lg"
            loading={verifyState === 'loading'}
            disabled={code.length !== OTP_LENGTH || verifyState === 'loading' || verifyState === 'success' || locked || expired}
            accessibilityLabel="Verify code"
            onPress={() => handleVerify()}>
            {verifyState === 'success' ? 'Verified' : 'Verify'}
          </CoreButton>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
