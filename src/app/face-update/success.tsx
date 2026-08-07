import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, Icon } from '@/components/ui';

/** Update face — success. */
export default function FaceUpdateSuccessScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        <View className="h-[90px] w-[90px] items-center justify-center rounded-full bg-[#ecfdf5]">
          <Icon name="checkCircle" size={40} />
        </View>
        <Text accessibilityRole="header" className="mb-2 mt-5 text-[20px] font-bold text-primary">
          Face Updated!
        </Text>
        <Text className="mb-6 text-[14px] text-muted">
          Your face template has been updated successfully
        </Text>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Done" onPress={() => router.dismissTo('/(tabs)')} />
      </View>
    </ScreenContainer>
  );
}
