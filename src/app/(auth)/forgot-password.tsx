import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { BrandMark } from '@/components/app';
import { FormField, Alert as InlineAlert, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Field, SoftCard, useKitStyles } from '@/components/truepas';
import { Button, Input, Typography } from '@/components/ui';
import { OtpVerification } from '@/features/auth/components/OtpVerification';
import { useForgotPassword, useResetPassword } from '@/features/auth/mutations';
import { newPasswordSchema } from '@/features/auth/schemas';
import { useToast } from '@/hooks/useToast';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

type Step = 'email' | 'otp' | 'reset';

/** Forgot password — contract §7 three-step recovery:
 *  1. POST /auth/forgot-password {email} → OTP emailed (always 202)
 *  2. POST /auth/verify-otp {email, otp, purpose:'password_reset'} → OTP validated
 *     before the user types a new password (attempts counted here)
 *  3. POST /auth/reset-password {email, otp, newPassword} → resets, revokes sessions */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const kit = useKitStyles();
  // `?step=reset` lets the dev screen jump straight to the password form.
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<Step>(stepParam === 'reset' ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const toast = useToast();

  // The OTP step needs the email for both verify and resend — a direct
  // navigation without one falls back to the email step.
  const effectiveStep: Step = step === 'otp' && !email ? 'email' : step;

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Enter a valid email address'); return; }
    setError('');
    setEmail(trimmed);
    try {
      await forgotPassword.mutateAsync({ email: trimmed });
      setStep('otp');
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not send code. Please try again.');
    }
  };

  const handleReset = async () => {
    // The OTP is verified on the previous step — landing here without it
    // (dev `?step=reset` jump) means the session is incomplete.
    if (!email || !verifiedOtp) { setError('Your reset session is incomplete — request a new code.'); return; }
    if (!newPassword || !confirmPassword) { setError('All fields are required'); return; }
    const passwordCheck = newPasswordSchema.safeParse(newPassword);
    if (!passwordCheck.success) { setError(passwordCheck.error.issues[0].message); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    try {
      await resetPassword.mutateAsync({ email, otp: verifiedOtp, newPassword });
      toast.show('success', 'Your password has been reset successfully.');
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not reset password. Please try again.');
    }
  };

  // The OTP step is a full screen — it renders its own container/header.
  if (effectiveStep === 'otp') {
    return (
      <OtpVerification
        title="Reset password"
        heading="Check your inbox"
        sentTo={`We emailed a reset code to ${email}`}
        purpose="password_reset"
        identifier={{ email }}
        onBack={() => setStep('email')}
        onResend={async () => {
          await forgotPassword.mutateAsync({ email });
        }}
        onVerified={(_response, code) => {
          setVerifiedOtp(code);
          setError('');
          setStep('reset');
        }}
      />
    );
  }

  return (
    <ScreenContainer scroll background={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {effectiveStep === 'email' && (
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
                label="Send code"
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

        {effectiveStep === 'reset' && (
          <>
            <ScreenHeader title="Choose a new password" onBack={router.back} />
            <View style={{ padding: theme.spacing[4], paddingTop: theme.spacing[6], gap: theme.spacing[4] }}>
              {error ? (
                <Typography variant="body-sm" color="error">
                  {error}
                </Typography>
              ) : null}
              <FormField label="New password" required helperText="8+ characters with uppercase, lowercase, number & symbol.">
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
