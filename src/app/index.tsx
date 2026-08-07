import { Redirect } from 'expo-router';

import { useAppSelector } from '@/store';

/** Entry gate: unauthenticated → welcome; no face → mandatory enrollment (PRD); else tabs. */
export default function Index() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);

  if (__DEV__) {
    return <Redirect href="/dev" />;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }
  return <Redirect href="/(tabs)" />;
}
