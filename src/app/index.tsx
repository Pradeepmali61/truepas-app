import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { api } from '@/api';
import { getOrRefreshAccessToken } from '@/api/client';
import { Colors } from '@/constants/theme';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';

/** Entry gate: restores the session from the persisted refresh token,
 *  then routes — unauthenticated → welcome; no face → mandatory
 *  enrollment (PRD); else tabs. */
export default function Index() {
  const dispatch = useAppDispatch();
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary} />
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
