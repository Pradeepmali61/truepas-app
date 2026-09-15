import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { getOrRefreshAccessToken } from '@/api/client';
import { Spinner } from '@/components/ui';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';

/** Entry gate: restores the session from the persisted refresh token,
 *  then routes — unauthenticated → welcome; no face → mandatory
 *  enrollment (PRD); else tabs. */
export default function Index() {
  const dispatch = useAppDispatch();
  const theme = useThemeTokens();
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (refreshToken) {
          const accessToken = await getOrRefreshAccessToken();
          const user = await api.getUser();
          if (!cancelled) {
            dispatch(sessionStarted({ user, accessToken, refreshToken }));
          }
        }
      } catch {
        // No valid session — fall through to the unauthenticated route.
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (restoring) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <Spinner size="lg" label="Restoring session" />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }
  return <Redirect href="/(tabs)" />;
}
