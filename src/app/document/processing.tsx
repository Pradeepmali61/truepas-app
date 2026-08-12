import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';

const PROCESSING_MS = 2500;

/** Document processing — selfie + document portrait matching in progress. */
export default function DocumentProcessingScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/document/verified'), PROCESSING_MS);
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
