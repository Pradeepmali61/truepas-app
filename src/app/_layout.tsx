import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { ToastProvider } from '@/components/composite';
import { DevFloatingButton } from '@/components/layout/DevFloatingButton';
import { store } from '@/store';
import { ThemeProvider, useTheme, useTruepasFonts } from '@/theme';

import '@/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000,
    },
  },
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
