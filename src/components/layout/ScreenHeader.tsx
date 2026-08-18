import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
}

/** Consistent left-aligned secondary screen header: ← Title */
export function ScreenHeader({ title }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View style={{
      height: 68,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
    }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="back" size={24} color={Colors.ink} />
      </Pressable>
      <Text style={{ marginLeft: 8, fontSize: 21, fontWeight: '700', color: Colors.ink }}>
        {title}
      </Text>
    </View>
  );
}
