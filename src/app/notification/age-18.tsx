import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, InfoBanner } from '@/components/ui';

/** Age-18 transition notification — dependent must create own account (PRD). */
export default function Age18NotificationScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Notification" />
      <View className="flex-1 px-6">
        <View className="items-center pb-4 pt-6">
          <Icon name="cake" size={44} />
        </View>
        <View className="rounded-card border border-[#fde68a] bg-[#fff9e6] px-[18px] py-4">
          <View className="flex-row items-start gap-3">
            <Icon name="cake" size={24} />
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-ink">Max Kim is now 18</Text>
              <Text className="mt-1 text-[12px] leading-[18px] text-muted">
                Your family member Max Kim has turned 18. They need to create their own independent
                Truepas account to manage their identity verification.
              </Text>
            </View>
          </View>
        </View>
        <View className="-mx-6 mt-4">
          <InfoBanner variant="warn" leading="info">
            Max&apos;s data will be retained for 30 days after removal. They must register
            independently to continue using Truepas.
          </InfoBanner>
        </View>
        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Remove from Family" onPress={() => router.dismissTo('/(tabs)/family')} />
          <View className="mt-[10px]">
            <Button label="Remind in 7 Days" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
