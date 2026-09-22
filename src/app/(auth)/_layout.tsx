import { Redirect, Stack } from 'expo-router';

import { useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';

export default function AuthLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);
  const t = useThemeTokens();

  if (status === 'authenticated') {
    return <Redirect href={faceEnrolled ? '/(tabs)' : '/(onboarding)/consent'} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: t.colors.background },
      }}
    />
  );
}
