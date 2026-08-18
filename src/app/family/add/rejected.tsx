import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Icon } from '@/components/ui';
import { Elevation } from '@/constants/theme';

/** Add family — 18+ rejected: adults must create their own account (PRD). */
export default function AgeRejectedScreen() {
  const router = useRouter();
  const { name, age } = useLocalSearchParams<{ name?: string; age?: string }>();

  return (
    <ScreenContainer scroll={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScreenHeader title="Add Family Member" />
      <View className="flex-1 items-center justify-center p-5">
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FEF2F2',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          ...Elevation.small,
        }}>
          <Icon name="cross" size={40} color="#EF4444" />
        </View>
        <Text accessibilityRole="header" className="mb-[6px] text-[22px] font-bold text-ink">
          Adults need their own account
        </Text>
        <Text className="max-w-[270px] text-center text-[15px] leading-[21px] text-muted">
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
