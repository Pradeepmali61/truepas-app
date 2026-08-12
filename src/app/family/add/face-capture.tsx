import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';

/** Add family — step 3: selfie + face enrollment for ages 5-17 (PRD). */
export default function FamilyFaceCaptureScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const firstName = name ?? 'Member';

  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center">
        <Text className="mb-3 text-[14px] font-semibold text-primary-light">
          Capture {firstName}&apos;s Face
        </Text>
        <View className="h-[220px] w-[220px] items-center justify-center rounded-full border-4 border-primary">
          <Icon name="face" size={70} />
        </View>
        <View className="mt-[14px] flex-row items-center gap-1">
          <Icon name="check" size={14} color={Colors.primary} />
          <Text accessibilityLiveRegion="polite" className="text-[13px] text-primary">Face Detected</Text>
        </View>
        <Text className="mt-2 max-w-[240px] text-center text-[12px] text-muted">
          Enrolling face template in ROC for future verification
        </Text>
      </View>
      <View className="items-center pb-[30px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capture face"
          onPress={() => router.dismissTo('/(tabs)/family')}
          className="h-16 w-16 rounded-full border-4 border-primary bg-white active:opacity-80"
        />
      </View>
    </SafeAreaView>
  );
}
