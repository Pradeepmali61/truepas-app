import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';

/** Regula document scan — dark camera UI. Camera integration lands with the Regula SDK. */
export default function DocumentScanScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#111111]" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center">
        <Text className="mb-3 text-[14px] font-semibold text-white">Scan Front of Passport</Text>
        <View className="h-[175px] w-[280px] items-center justify-center rounded-btn border-[3px] border-dashed border-primary">
          <Icon name="documents" size={40} />
        </View>
        <Text className="mt-3 text-[12px] text-muted">Align document within the frame</Text>
      </View>
      <View className="items-center pb-[30px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capture document"
          onPress={() => router.push('/document/processing')}
          className="h-16 w-16 rounded-full border-4 border-primary bg-white active:opacity-80"
        />
      </View>
    </SafeAreaView>
  );
}
