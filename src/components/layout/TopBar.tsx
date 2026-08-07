import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

/** App top bar matching `.app-topbar` (title 18/700, 36px touch targets). */
export function TopBar({ title, showBack = true, rightSlot }: TopBarProps) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center">
          <Icon name="back" size={24} />
        </Pressable>
      ) : (
        <View className="w-9" />
      )}
      <Text accessibilityRole="header" className="text-[18px] font-bold text-ink">
        {title}
      </Text>
      {rightSlot ?? <View className="w-9" />}
    </View>
  );
}
