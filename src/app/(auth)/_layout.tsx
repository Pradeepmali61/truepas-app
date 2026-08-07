import { Redirect, Stack } from 'expo-router';

import { useAppSelector } from '@/store';

export default function AuthLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);

  if (status === 'authenticated') {
    return <Redirect href={faceEnrolled ? '/(tabs)' : '/(onboarding)/consent'} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }} />;
}
