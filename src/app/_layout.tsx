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
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace('/(auth)/login');
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
          <ThemeProvider scheme="system" palette="violetLedger">
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
