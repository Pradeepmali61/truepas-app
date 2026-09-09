import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { OtpVerification } from '@/features/auth/components/OtpVerification';

/** Verify phone OTP — registration flow step 2. Stores registrationToken and
 *  navigates to account-details (NOT verify-email, per contract v1.1.0).
 *  Resend re-calls POST /auth/register (the backend has no dedicated resend
 *  endpoint) — a fresh registrationId is returned and used for verification. */
export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { phone, countryCode, registrationId } = useLocalSearchParams<{
    phone?: string;
    countryCode?: string;
    registrationId?: string;
  }>();
  // Resend creates a NEW registration session — keep it in state so the
  // verify call uses the latest registrationId, not the stale param.
  const [activeRegistrationId, setActiveRegistrationId] = useState(registrationId ?? '');

  useEffect(() => {
    console.log('[VerifyPhone] Params received:', { phone, countryCode, registrationId });
    if (!registrationId) {
      console.error('[VerifyPhone] Missing registrationId! OTP verification will fail with 404.');
    }
  }, [phone, countryCode, registrationId]);

  return (
    <OtpVerification
      title="Verify Phone"
      heading="Enter verification code"
      sentTo={`Sent to ${countryCode ?? '+1'} ${phone ?? '(555) 123-4567'}`}
      icon="smartphone"
      progress={25}
      purpose="phone"
      identifier={{ registrationId: activeRegistrationId, phone: phone ?? '', countryCode: countryCode ?? '' }}
      onResend={async () => {
        const res = await api.register({
          phone: phone ?? '',
          countryCode: countryCode ?? '+1',
        });
        if (res.registrationId) {
          console.log('[VerifyPhone] Resent — new registrationId:', res.registrationId);
          setActiveRegistrationId(res.registrationId);
        }
      }}
      onVerified={() => router.push('/(auth)/account-details')}
    />
  );
}
