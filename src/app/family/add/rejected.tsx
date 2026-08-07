import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, Icon } from '@/components/ui';

/** Add family — 18+ rejected: adults must create their own account (PRD). */
export default function AgeRejectedScreen() {
  const router = useRouter();
  const { name, age } = useLocalSearchParams<{ name?: string; age?: string }>();

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        <View className="mb-5 h-[100px] w-[100px] items-center justify-center rounded-full bg-[#fef2f2]">
          <Icon name="cross" size={40} color="#ef4444" />
        </View>
        <Text accessibilityRole="header" className="mb-[6px] text-[18px] font-bold text-primary">
          Adults Need Their Own Account
        </Text>
        <Text className="max-w-[270px] text-center text-[14px] leading-[21px] text-muted">
          {name ?? 'This person'} is {age ?? '18 or more'} years old. Family onboarding is only for
          dependents under 18. Please ask them to register independently.
        </Text>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Go Back" variant="outline" onPress={() => router.back()} />
      </View>
    </ScreenContainer>
  );
}
