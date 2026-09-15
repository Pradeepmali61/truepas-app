import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { setRegistrationToken } from '@/api/client';
import { OtpInput, ScreenHeader } from '@/components/composite';
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
  progress: number;
  purpose: OtpPurpose;
  /** Identifier fields to send with the OTP verification. */
  identifier?: { registrationId?: string; phone?: string; countryCode?: string; email?: string };
  /**
   * Called after successful verification. Receives the full response
   * so the caller can decide what to do (e.g., dispatch sessionStarted
   * for email purpose, or store registrationToken for phone purpose).
   */
  onVerified: (response: VerifyOtpResponse) => void;
  /**
   * Actually re-sends the OTP (backend has no generic resend endpoint, so each
   * screen re-calls the endpoint that originally triggered the code — e.g.
   * register for phone, account-details for email). When omitted the resend
   * button is hidden instead of pretending to resend.
   */
  onResend?: () => Promise<void>;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

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
}: OtpVerificationProps) {
  const router = useRouter();
  const theme = useThemeTokens();
  const [code, setCode] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const { seconds, reset } = useCountdown(RESEND_SECONDS);
  const shakeX = useSharedValue(0);
  const verifyOtp = useVerifyOtp();

  const handleChange = (value: string) => {
    setCode(value);
    if (verifyState === 'error') {
      setVerifyState('idle');
      setErrorMsg('');
    }
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) return;
    setVerifyState('loading');
    try {
      const payload: VerifyOtpRequest = {
        otp: code,
        purpose,
        ...identifier,
      };
      console.log('[OTP] Verifying:', { purpose, registrationId: identifier?.registrationId, otpLength: code.length, payload: JSON.stringify(payload) });
      if (purpose === 'phone' && !identifier?.registrationId) {
        console.error('[OTP] Missing registrationId for phone verification — backend will return 404');
      }
      const response = await verifyOtp.mutateAsync(payload);
      console.log('[OTP] Response:', JSON.stringify(response));

      // Store registration token if present (phone verification during registration)
      if (response.registrationToken) {
        setRegistrationToken(response.registrationToken);
      }

      setVerifyState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => onVerified(response), 600);
    } catch (err: any) {
      console.error('[OTP] Error:', {
        message: err?.message,
        status: err?.response?.status,
        url: err?.config?.url,
        data: JSON.stringify(err?.response?.data),
      });
      setVerifyState('error');
      setErrorMsg(err?.message ?? 'Invalid verification code. Please try again.');
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
      // Fresh code sent — restart the cooldown and clear any partial entry.
      reset();
      setCode('');
      setVerifyState('idle');
    } catch (err: any) {
      setVerifyState('error');
      setErrorMsg(err?.message ?? 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const shakeStyle = { transform: [{ translateX: shakeX }] };

  return (
    <ScreenContainer scroll={false} background={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScreenHeader title={title} onBack={router.back} />
        <View style={{ paddingHorizontal: theme.spacing[4] }}>
          <Progress value={progress} accessibilityLabel="Verification progress" />
        </View>
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
                    state={verifyState === 'error' ? 'error' : 'default'}
                    accessibilityLabel="One time password"
                  />
                </Animated.View>

                {verifyState === 'error' ? (
                  <Typography variant="body-sm" style={{ color: theme.colors.error }} center>
                    {errorMsg}
                  </Typography>
                ) : null}

                {seconds > 0 ? (
                  <Typography variant="body-sm" color="muted">
                    Resend code in {formatCountdown(seconds)}
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
            disabled={code.length !== OTP_LENGTH || verifyState === 'loading' || verifyState === 'success'}
            accessibilityLabel="Verify code"
            onPress={handleVerify}>
            {verifyState === 'success' ? 'Verified' : 'Verify'}
          </CoreButton>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
