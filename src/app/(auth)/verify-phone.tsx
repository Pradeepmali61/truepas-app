import { useLocalSearchParams, useRouter } from 'expo-router';

import { OtpVerification } from '@/features/auth/components/OtpVerification';

/** Verify phone OTP — registration flow step 2. Stores registrationToken and
 *  navigates to account-details (NOT verify-email, per contract v1.1.0). */
export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { phone, countryCode, registrationId } = useLocalSearchParams<{
    phone?: string;
    countryCode?: string;
    registrationId?: string;
  }>();

  return (
    <OtpVerification
      title="Verify Phone"
      heading="Enter verification code"
      sentTo={`Sent to ${countryCode ?? '+1'} ${phone ?? '(555) 123-4567'}`}
      icon="smartphone"
      progress={25}
      purpose="phone"
      identifier={{ registrationId: registrationId ?? '' }}
      onVerified={() => router.push('/(auth)/account-details')}
    />
  );
}
