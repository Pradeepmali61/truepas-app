import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';

const PROCESSING_MS = 2500;

/** Delete account — processing across PostgreSQL, S3, ROC (PRD). */
export default function DeleteProcessingScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/account/delete/success'), PROCESSING_MS);
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
          Deleting your data…
        </Text>
        <View className="mt-4">
          <View className="my-[6px] flex-row items-center gap-2">
            <Icon name="check" size={14} color="#2727d6" />
            <Text className="text-[13px] text-muted">Account data removed (PostgreSQL)</Text>
          </View>
          <View className="my-[6px] flex-row items-center gap-2">
            <Icon name="check" size={14} color="#2727d6" />
            <Text className="text-[13px] text-muted">Images deleted (S3)</Text>
          </View>
          <View className="my-[6px] flex-row items-center gap-2">
            <Icon name="hourglass" size={14} color="#2727d6" />
            <Text className="text-[13px] text-muted">Removing face template (ROC)…</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
