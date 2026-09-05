import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { setRegistrationToken } from '@/api/client';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, IconName, OtpRow, ProgressTrack } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useVerifyOtp } from '@/features/auth/mutations';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import type { OtpPurpose, VerifyOtpRequest, VerifyOtpResponse } from '@/types/domain';

interface OtpVerificationProps {
  title: string;
  heading: string;
  sentTo: string;
  icon: IconName;
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
}: OtpVerificationProps) {
  const [code, setCode] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { seconds, reset } = useCountdown(RESEND_SECONDS);
  const shakeX = useSharedValue(0);
  const verifyOtp = useVerifyOtp();

  const handleChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
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

  const handleResend = () => {
    reset();
    setCode('');
    setVerifyState('idle');
    setErrorMsg('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const shakeStyle = { transform: [{ translateX: shakeX }] };

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
      <TopBar title={title} />
      <ProgressTrack percent={progress} />
      <View className="flex-1 items-center justify-center p-5">
        {verifyState === 'success' ? (
          <View className="items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: Colors.successBg }}>
              <Icon name="checkCircle" size={48} color={Colors.success} />
            </View>
            <Text className="text-[18px] font-bold text-ink">Verified!</Text>
            <Text className="mt-1 text-[14px] text-muted">Redirecting...</Text>
          </View>
        ) : (
          <>
            <Icon name={icon} size={40} />
            <Text accessibilityRole="header" className="mb-[6px] mt-4 text-[18px] font-bold text-primary">
              {heading}
            </Text>
            <Text className="mb-[6px] text-[14px] text-muted">{sentTo}</Text>
            <Animated.View style={shakeStyle} className="w-full items-center">
              <Pressable accessibilityLabel="Enter one time password" className="w-full items-center">
                <OtpRow length={OTP_LENGTH} value={code} />
                <TextInput
                  value={code}
                  onChangeText={handleChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoFocus
                  maxLength={OTP_LENGTH}
                  className="absolute h-full w-full opacity-0"
                  accessibilityLabel="One time password input"
                />
              </Pressable>
            </Animated.View>

            {verifyState === 'error' ? (
              <Text className="mt-2 text-[13px] font-medium" style={{ color: Colors.error }}>
                {errorMsg}
              </Text>
            ) : null}

            {seconds > 0 ? (
              <Text className="mt-2 text-[14px] font-medium text-muted">
                Resend code in {formatCountdown(seconds)}
              </Text>
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel="Resend code" onPress={handleResend}>
                <Text className="mt-2 text-[14px] font-medium text-primary underline">Resend code</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button
          label={verifyState === 'success' ? 'Verified' : 'Verify'}
          onPress={handleVerify}
          loading={verifyState === 'loading'}
          disabled={code.length !== OTP_LENGTH || verifyState === 'loading' || verifyState === 'success'}
        />
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
