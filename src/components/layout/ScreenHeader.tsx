import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

/** Consistent secondary screen header: ← centered title (optional right action) */
export function ScreenHeader({ title, rightAction }: ScreenHeaderProps) {
  const router = useRouter();
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
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="back" size={24} color={Colors.ink} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.ink }}>
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
