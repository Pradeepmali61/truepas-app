import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { FormField, Alert as InlineAlert, ScreenHeader, Section } from '@/components/composite';
import { Button, Input, Typography } from '@/components/ui';
import { OtpVerification } from '@/features/auth/components/OtpVerification';
import { useForgotPassword, useResetPassword } from '@/features/auth/mutations';
import { newPasswordSchema } from '@/features/auth/schemas';
import { useKeyboardScrollPad } from '@/hooks/useKeyboardScrollPad';
import { useToast } from '@/hooks/useToast';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

type Step = 'email' | 'otp' | 'reset';

/** Forgot password — contract §7 three-step recovery:
 *  1. POST /auth/forgot-password {email} → OTP emailed (always 202)
 *  2. POST /auth/verify-otp {email, otp, purpose:'password_reset'} → OTP validated
 *     before the user types a new password (attempts counted here)
 *  3. POST /auth/reset-password {email, otp, newPassword} → resets, revokes sessions
 *  Visuals ported 1:1 from UI-design-repo ForgotPasswordScreen +
 *  ResetPasswordScreen (design splits them across two routes; our real flow
 *  keeps them as steps inside this screen). */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const kbd = useKeyboardScrollPad();
  // `?step=reset` lets the dev screen jump straight to the password form.
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<Step>(stepParam === 'reset' ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmError, setConfirmError] = useState<string>();

  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const toast = useToast();

  // The OTP step needs the email for both verify and resend — a direct
  // navigation without one falls back to the email step.
  const effectiveStep: Step = step === 'otp' && !email ? 'email' : step;

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError(undefined);
    setEmail(trimmed);
    try {
      await forgotPassword.mutateAsync({ email: trimmed });
      toast.show('info', 'Check your inbox — if the account exists, a reset code is on its way.');
      setStep('otp');
    } catch (err: any) {
      toast.show('error', toApiError(err).message || 'Could not send code. Please try again.');
    }
  };

  const handleReset = async () => {
    // The OTP is verified on the previous step — landing here without it
    // (dev `?step=reset` jump) means the session is incomplete.
    if (!email || !verifiedOtp) {
      toast.show('error', 'Your reset session is incomplete — request a new code.');
      return;
    }
    const passwordCheck = newPasswordSchema.safeParse(newPassword);
    setPasswordError(
      !newPassword
        ? 'Enter a new password'
        : !passwordCheck.success
          ? passwordCheck.error.issues[0].message
          : undefined,
    );
    setConfirmError(confirmPassword !== newPassword ? "Passwords don't match" : undefined);
    if (!newPassword || !passwordCheck.success || confirmPassword !== newPassword) return;
    try {
      await resetPassword.mutateAsync({ email, otp: verifiedOtp, newPassword });
      toast.show('success', 'Your password has been reset successfully.');
      router.replace('/(auth)/login');
    } catch (err: any) {
      toast.show('error', toApiError(err).message || 'Could not reset password. Please try again.');
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
          setStep('reset');
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScreenHeader
          title={effectiveStep === 'email' ? 'Reset password' : 'Choose a new password'}
          onBack={router.back}
        />
        <ScrollView
          {...kbd.scrollProps}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[4],
            gap: theme.spacing[6],
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {effectiveStep === 'email' && (
            <>
              <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
                <Typography variant="h3" center>
                  Find your account
                </Typography>
                <Typography color="secondary" center>
                  Enter your account email. If it exists, we&apos;ll send a reset code.
                </Typography>
              </View>

              <FormField label="Email" error={emailError}>
                <Input
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError(undefined);
                  }}
                  placeholder="ada@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  iconLeft={<Mail size={iconSize.md} color={theme.colors.actionPrimary} />}
                />
              </FormField>
            </>
          )}

          {effectiveStep === 'reset' && (
            <>
              <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
                <Typography variant="h3" center>
                  Almost done
                </Typography>
                <Typography color="secondary" center>
                  Set a new password for {email || 'your account'}.
                </Typography>
              </View>

              <Section>
                <FormField label="New password" required error={passwordError}>
                  <Input
                    value={newPassword}
                    onChangeText={(v) => {
                      setNewPassword(v);
                      setPasswordError(undefined);
                    }}
                    placeholder="New password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    iconLeft={<Lock size={iconSize.md} color={theme.colors.actionPrimary} />}
                  />
                </FormField>
                <FormField label="Confirm new password" required error={confirmError}>
                  <Input
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      setConfirmError(undefined);
                    }}
                    placeholder="Repeat password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    iconLeft={<Lock size={iconSize.md} color={theme.colors.actionPrimary} />}
                  />
                </FormField>
              </Section>

              <InlineAlert variant="warning" title="Sessions revoked">
                You&apos;ll be signed out of every device after the reset.
              </InlineAlert>
            </>
          )}
        </ScrollView>

        <View
          {...kbd.footerProps}
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[6],
            paddingBottom: theme.spacing[4] + insets.bottom,
            gap: theme.spacing[2],
          }}>
          {effectiveStep === 'email' ? (
            <Button
              label="Send reset code"
              size="lg"
              loading={forgotPassword.isPending}
              disabled={!email.trim()}
              onPress={() => void handleSendOtp()}
            />
          ) : (
            <Button
              label="Reset password"
              size="lg"
              loading={resetPassword.isPending}
              disabled={!newPassword || !confirmPassword}
              onPress={() => void handleReset()}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
