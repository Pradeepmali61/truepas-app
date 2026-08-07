import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, InfoBanner, ProgressTrack } from '@/components/ui';

/** Face scan intro — mandatory gate, no skip (PRD v2.0). */
export default function FaceScanScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Sign Up" />
      <ProgressTrack percent={75} />
      <View className="flex-1 items-center justify-center p-5">
        <View className="my-6 h-[220px] w-[220px] items-center justify-center rounded-full border-4 border-primary bg-surface">
          <Icon name="face" size={54} />
        </View>
        <Text accessibilityRole="header" className="mb-1 mt-[6px] text-[18px] font-bold text-primary">
          Let&apos;s scan your face
        </Text>
        <Text className="mb-[6px] max-w-[260px] text-center text-[14px] text-muted">
          Good lighting · No glasses/mask · Eye-level camera
        </Text>
        <View className="max-w-[280px]">
          <InfoBanner variant="warn" leading="warning">
            This step is mandatory and cannot be skipped
          </InfoBanner>
        </View>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Start Face Scan" onPress={() => router.push('/(onboarding)/face-enrolled')} />
      </View>
    </ScreenContainer>
  );
}
