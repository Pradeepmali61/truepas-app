import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, Icon } from '@/components/ui';

/** Document verified success — shows outcome, returns to Identity dashboard. */
export default function DocumentVerifiedScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <LinearGradient
        colors={['#ffffff', '#93c5fd']}
        style={StyleSheet.absoluteFill}
      />
      <View className="flex-1 items-center justify-center p-5">
        <View className="h-[90px] w-[90px] items-center justify-center rounded-full bg-[#ecfdf5]">
          <Icon name="checkCircle" size={40} />
        </View>
        <Text accessibilityRole="header" className="mb-2 mt-5 text-[20px] font-bold text-primary">
          Identity Verified!
        </Text>
        <Text className="mb-4 text-center text-[14px] text-muted">
          Your Driving License has been verified successfully
        </Text>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Go to Identity Dashboard" onPress={() => router.dismissTo('/(tabs)')} />
      </View>
    </ScreenContainer>
  );
}
