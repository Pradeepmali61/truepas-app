import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

/** Document processing — polls verification session until completed.
 *  In production, a verification session would have been created on the
 *  scan screen. Here we poll until the session reaches a terminal state. */
export default function DocumentProcessingScreen() {
  const router = useRouter();
  const pollCount = useRef(0);

  useEffect(() => {
    const poll = async () => {
      // In production, the sessionId would come from the scan screen
      // via route params. For now, we simulate the polling flow.
      pollCount.current += 1;

      if (pollCount.current >= MAX_POLL_ATTEMPTS) {
        // Timeout — go to mismatch (or a timeout screen)
        router.replace('/document/mismatch');
        return;
      }

      // Simulate: after 2 polls, consider it approved
      if (pollCount.current >= 2) {
        router.replace('/document/verified');
        return;
      }
    };

    const timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        <ActivityIndicator size={80} color={Colors.primary} />
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="mb-1 mt-5 text-[16px] font-bold text-primary">
          Verifying document…
        </Text>
        <Text className="text-[14px] text-muted">Extracting details &amp; matching your face</Text>
        <View className="mt-4">
          <View className="my-1 flex-row items-center gap-2">
            <Icon name="check" size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">Document scanned</Text>
          </View>
          <View className="my-1 flex-row items-center gap-2">
            <Icon name="check" size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">Selfie captured</Text>
          </View>
          <View className="my-1 flex-row items-center gap-2">
            <Icon name="hourglass" size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">Matching faces…</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
