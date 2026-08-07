import { useRouter } from 'expo-router';

import { OtpVerification } from '@/features/auth/components/OtpVerification';

export default function VerifyEmailScreen() {
  const router = useRouter();
  return (
    <OtpVerification
      title="Verify Email"
      heading="Check your inbox"
      sentTo="Code sent to jane.doe@email.com"
      icon="inbox"
      progress={35}
      onVerified={() => router.push('/(auth)/account-details')}
    />
  );
}
