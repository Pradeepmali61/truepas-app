import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, Icon, InfoBanner } from '@/components/ui';

/** Update face — ROC retry error. Never marks success on failure (PRD). */
export default function FaceUpdateErrorScreen() {
  const router = useRouter();
  const { message } = useLocalSearchParams<{ message?: string }>();

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        <View className="mb-5 h-[100px] w-[100px] items-center justify-center rounded-full bg-[#fef2f2]">
          <Icon name="warning" size={32} />
        </View>
        <Text accessibilityRole="header" className="mb-[6px] text-[18px] font-bold text-primary">
          Registration Failed
        </Text>
        <Text className="mb-4 max-w-[270px] text-center text-[14px] leading-[21px] text-muted">
          {message ?? "We couldn't complete your face update. Please try again later."}
        </Text>
        <View className="max-w-[280px]">
          <InfoBanner variant="danger" leading="warning">
            Your face has NOT been marked as updated. Please retry.
          </InfoBanner>
        </View>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Retry Now" onPress={() => router.replace('/face-update/camera')} />
        <View className="mt-3">
          <Button label="Try Again Later" variant="link" onPress={() => router.dismissTo('/(tabs)')} />
        </View>
      </View>
    </ScreenContainer>
  );
}
