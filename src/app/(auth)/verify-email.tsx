import { useLocalSearchParams, useRouter } from 'expo-router';

import { OtpVerification } from '@/features/auth/components/OtpVerification';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';

/** Verify email OTP — registration flow step 4 (contract v1.1.0).
 *  Email verification returns AuthResponse; dispatch sessionStarted and
 *  route to biometric consent (faceEnrolled is false at this point). */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <OtpVerification
      title="Verify Email"
      heading="Check your inbox"
      sentTo={`Code sent to ${email ?? 'your email'}`}
      icon="inbox"
      progress={35}
      purpose="email"
      identifier={{ email: email ?? '' }}
      onVerified={async (response) => {
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
