import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { FormField, Alert as InlineAlert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input, Link, Typography } from '@/components/ui';
import { useForgotPassword, useResetPassword, useVerifyOtp } from '@/features/auth/mutations';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  // `?step=reset` lets the dev screen jump straight to the reset form (seeds a
  // placeholder code so the OtpInput renders filled like the reference).
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>(
    stepParam === 'reset' ? 'reset' : stepParam === 'otp' ? 'otp' : 'email'
  );
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(stepParam === 'reset' ? '123456' : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const forgotPassword = useForgotPassword();
  const verifyOtp = useVerifyOtp();
  const resetPassword = useResetPassword();

  const handleSendOtp = async () => {
    if (!email) { setError('Enter your email'); return; }
    setError('');
    try {
      await forgotPassword.mutateAsync({ email });
      setStep('otp');
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not send code. Please try again.');
    }
  };

  const handleVerifyOtp = async (value?: string) => {
    const code = typeof value === 'string' ? value : otp;
    if (code.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setError('');
    try {
      await verifyOtp.mutateAsync({ otp: code, email, purpose: 'password_reset' });
      setStep('reset');
    } catch (err: any) {
      setError(toApiError(err).message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = () => {
    // Resend issues a NEW code and expires the previous one — clear the
    // stale digits so the user enters the fresh code.
    setOtp('');
    setError('');
    void handleSendOtp();
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) { setError('All fields are required'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    try {
      await resetPassword.mutateAsync({ email, otp, newPassword });
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not reset password. Please try again.');
    }
  };

  return (
    <ScreenContainer scroll background={false}>
      <ScreenHeader title={step === 'reset' ? 'Choose a new password' : 'Reset password'} onBack={router.back} />
      <View style={{ padding: theme.spacing[4], paddingTop: theme.spacing[6], gap: theme.spacing[4] }}>
        {step === 'email' && (
          <>
            <View style={{ gap: theme.spacing[1] }}>
              <Typography variant="h2">Find your account</Typography>
              <Typography variant="body" color="secondary">
                Enter your account email. If it exists, we'll send a reset code.
              </Typography>
            </View>
            <FormField label="Email" error={error || undefined}>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="ada@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />}
              />
            </FormField>
            <Button label="Send reset code" size="lg" loading={forgotPassword.isPending} onPress={handleSendOtp} />
          </>
        )}

        {step === 'otp' && (
          <>
            <View style={{ gap: theme.spacing[1] }}>
              <Typography variant="h2">Check your email</Typography>
              <Typography variant="body" color="secondary">
                We sent a 6-digit code to {email}. Enter it below.
              </Typography>
            </View>
            <FormField label="Code" error={error || undefined}>
              <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
            </FormField>
            <Button label="Verify" size="lg" loading={verifyOtp.isPending} onPress={() => void handleVerifyOtp()} />
            <View style={{ alignItems: 'center' }}>
              <Link onPress={handleResend} accessibilityLabel="Resend code">
                {forgotPassword.isPending ? 'Sending…' : 'Resend code'}
              </Link>
            </View>
          </>
        )}

        {step === 'reset' && (
          <>
            <FormField label="Reset code" required helperText="6-digit code emailed to you.">
              <OtpInput value={otp} disabled />
            </FormField>
            <FormField label="New password" required error={error || undefined}>
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                secureTextEntry={!showNew}
                autoCapitalize="none"
                autoCorrect={false}
                iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
                iconRight={
                  <Pressable onPress={() => setShowNew((v) => !v)}>
                    {showNew
                      ? <EyeOff size={iconSize.sm} color={theme.colors.textMuted} />
                      : <Eye size={iconSize.sm} color={theme.colors.textMuted} />}
                  </Pressable>
                }
              />
            </FormField>
            <FormField label="Confirm new password" required>
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
                iconRight={
                  <Pressable onPress={() => setShowConfirm((v) => !v)}>
                    {showConfirm
                      ? <EyeOff size={iconSize.sm} color={theme.colors.textMuted} />
                      : <Eye size={iconSize.sm} color={theme.colors.textMuted} />}
                  </Pressable>
                }
              />
            </FormField>
            <InlineAlert variant="warning" title="Sessions revoked">
              You'll be signed out of every device after the reset.
            </InlineAlert>
            <Button label="Reset password" size="lg" loading={resetPassword.isPending} onPress={handleReset} />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
