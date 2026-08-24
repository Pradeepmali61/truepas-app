import { useRouter } from 'expo-router';

import { OtpVerification } from '@/features/auth/components/OtpVerification';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  return (
    <OtpVerification
      title="Verify Phone"
      heading="Enter verification code"
      sentTo="Sent to +1 (555) 123-4567"
      icon="smartphone"
      progress={25}
      onVerified={() => router.push('/(auth)/verify-email')}
    />
  );
}
