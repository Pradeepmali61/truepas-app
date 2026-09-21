import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { SessionExpiredError, setOnSessionExpired } from '@/api/client';
import { ToastProvider } from '@/components/composite';
import { DevFloatingButton } from '@/components/layout/DevFloatingButton';
import { sessionEnded } from '@/features/auth/slice';
import { clearAllDocumentImages } from '@/services/documentImageStore';
import { clearAllProfileImages } from '@/services/profileImageStore';
import { store } from '@/store';
import { ThemeProvider, useTheme, useTruepasFonts } from '@/theme';

import '@/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A dead session can't be fixed by retrying — it would just re-fire
      // the refresh failure and the session-expired handler.
      retry: (failureCount, error) =>
        !(error instanceof SessionExpiredError) && failureCount < 2,
      staleTime: 60_000,
    },
  },
});

// The API client fires this when the refresh token is missing or rejected.
// Without it the app stayed "authenticated" in Redux while every request
// 401'd — the repeated NO_REFRESH_TOKEN / "couldn't load" error loop.
setOnSessionExpired(() => {
  queryClient.clear();
  store.dispatch(sessionEnded());
  // Forced logout gets the same filesystem teardown as a manual logout —
  // captured document/member photos must not outlive the session.
  void Promise.allSettled([clearAllDocumentImages(), clearAllProfileImages()]);
  if (router.canDismiss()) {
    router.dismissAll();
  }
  // reason → the login screen explains why the session ended instead of
  // dumping the user on a bare login form.
  router.replace({ pathname: '/(auth)/login', params: { reason: 'session-expired' } } as never);
});

function RootShell({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useTruepasFonts();
  const { resolvedScheme } = useTheme();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />;
  }

  return (
    <>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider scheme="system" palette="violetLedger" typeface="grotesk">
            <ToastProvider>
              <RootShell>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#ffffff' },
                  }}>
                  <Stack.Screen name="dev" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
                {/* Dev-only overlay — absent from preview/production builds */}
                <DevFloatingButton />
              </RootShell>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
