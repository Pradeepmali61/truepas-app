import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  light?: boolean;
}

/** Consistent secondary screen header: ← centered title (optional right action) */
export function ScreenHeader({ title, rightAction, light = false }: ScreenHeaderProps) {
  const router = useRouter();
  const color = light ? '#FFFFFF' : Colors.ink;
  return (
    <View style={{
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{
          position: 'absolute',
          left: 16,
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="back" size={22} color={color} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color }}>
          {title}
        </Text>
      </View>
      {rightAction ? (
        <View style={{ position: 'absolute', right: 8 }}>
          {rightAction}
        </View>
      ) : null}
    </View>
  );
}
