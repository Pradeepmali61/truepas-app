import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { BrandMark } from '@/components/app';
import { FormField, Alert as InlineAlert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Field, SoftCard, useKitStyles } from '@/components/truepas';
import { Button, Input, Link, Typography } from '@/components/ui';
import { useForgotPassword, useResetPassword } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const kit = useKitStyles();
  // `?step=reset` lets the dev screen jump straight to the reset form.
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<'email' | 'reset'>(stepParam === 'reset' ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const toast = useToast();

  const handleSendOtp = async () => {
    if (!email) { setError('Enter your email'); return; }
    setError('');
    try {
      await forgotPassword.mutateAsync({ email });
      setStep('reset');
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not send code. Please try again.');
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
    if (otp.length !== 6) { setError('Enter the 6-digit code from your email'); return; }
    if (!newPassword || !confirmPassword) { setError('All fields are required'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    try {
      await resetPassword.mutateAsync({ email, otp, newPassword });
      toast.show('success', 'Your password has been reset successfully.');
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not reset password. Please try again.');
    }
  };

  return (
    <ScreenContainer scroll background={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {step === 'email' && (
          <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing[4] }}>
            <SoftCard style={[kit.loginCard, { width: '100%', maxWidth: 380, alignSelf: 'center' }]}>
              <View style={kit.loginHead}>
                <BrandMark compact />
                <View style={{ gap: 6 }}>
                  <Typography variant="h2">Forgot password</Typography>
                  <Typography color="secondary">
                    Enter the email linked to your account.
                  </Typography>
                </View>
              </View>

              <Field label="Email">
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  state={error ? 'error' : 'default'}
                  iconLeft={<Mail size={iconSize.md} color={theme.colors.actionPrimary} />}
                />
                {error ? (
                  <Typography variant="body-sm" color="error">
                    {error}
                  </Typography>
                ) : null}
              </Field>

              <Button
                label="Send reset link"
                size="lg"
                loading={forgotPassword.isPending}
                onPress={handleSendOtp}
              />

              <Text style={[kit.helper, kit.centerText]}>
                Remembered it?{' '}
                <Text style={kit.link} onPress={router.back} accessibilityRole="link">
                  Back to sign in
                </Text>
              </Text>
            </SoftCard>
          </View>
        )}

        {step === 'reset' && (
          <>
            <ScreenHeader title="Choose a new password" onBack={router.back} />
            <View style={{ padding: theme.spacing[4], paddingTop: theme.spacing[6], gap: theme.spacing[4] }}>
              <FormField label="Reset code" required error={error || undefined} helperText={error ? undefined : "6-digit code emailed to you."}>
                <OtpInput value={otp} onChange={setOtp} />
              </FormField>
              <View style={{ alignItems: 'center' }}>
                <Link onPress={handleResend} accessibilityLabel="Resend code">
                  {forgotPassword.isPending ? 'Sending…' : 'Resend code'}
                </Link>
              </View>
              <FormField label="New password" required>
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
                You&apos;ll be signed out of every device after the reset.
              </InlineAlert>
              <Button label="Reset password" size="lg" loading={resetPassword.isPending} onPress={handleReset} />
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
