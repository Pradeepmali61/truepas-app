import { useLocalSearchParams, useRouter } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { useEffect } from 'react';

import { api } from '@/api';
import { clearRegistrationToken } from '@/api/client';
import { OtpVerification } from '@/features/auth/components/OtpVerification';
import { sessionStarted } from '@/features/auth/slice';
import { accountDetailsStore } from '@/services/accountDetailsStore';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Verify email OTP — registration flow step 4 (contract v1.1.0).
 *  Email verification returns AuthResponse; dispatch sessionStarted and
 *  route to biometric consent (faceEnrolled is false at this point). */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useThemeTokens();
  const { email } = useLocalSearchParams<{ email?: string }>();

  useEffect(() => {
    console.log('[VerifyEmail] Params received:', { email });
    if (!email) {
      // Direct navigation (dev-screen jump / reload on this route) — the OTP
      // screen is useless without the email. Send the user back to register
      // instead of rendering a broken OTP form.
      console.warn('[VerifyEmail] Missing email param — redirecting to register.');
      router.replace('/(auth)/register');
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  return (
    <OtpVerification
      title="Verify Email"
      heading="Check your inbox"
      sentTo={`Code sent to ${email ?? 'your email'}`}
      icon={<Inbox size={iconSize.lg} color={theme.colors.actionPrimary} />}
      progress={35}
      purpose="email"
      identifier={{ email: email ?? '' }}
      onResend={async () => {
        // The backend has no dedicated resend endpoint — the email OTP is sent
        // by POST /auth/account-details. Re-submit the stashed payload (the
        // registration token is still in api/client memory) to trigger a
        // fresh email.
        const payload = accountDetailsStore.get();
        if (!payload) {
          throw new Error('Registration session expired. Please sign up again.');
        }
        await api.completeAccountDetails(payload);
      }}
      onVerified={async (response) => {
        console.log('[VerifyEmail] Verification response:', JSON.stringify({
          ok: response.ok,
          nextStep: response.nextStep,
          hasUser: !!response.user,
          hasAccessToken: !!response.accessToken,
        }));
        // Registration session fully consumed — release the in-memory token
        // and the stashed account-details payload.
        clearRegistrationToken();
        accountDetailsStore.clear();
        // Email verification during registration returns AuthResponse fields
        // (user, accessToken, refreshToken) embedded in VerifyOtpResponse.
        if (response.user && response.accessToken) {
          await secureStorage.setRefreshToken(response.refreshToken ?? '');
          dispatch(
            sessionStarted({
              user: response.user,
              accessToken: response.accessToken,
            }),
          );
        }
        // Navigate to consent — the auth layout will redirect to consent
        // because faceEnrolled is false
        router.replace('/(onboarding)/consent');
      }}
    />
  );
}
