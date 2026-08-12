import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { stiffness: 300, damping: 30 });
      backdropOpacity.value = withTiming(0.5, { duration: 200 });
    } else {
      translateY.value = withSpring(400, { stiffness: 300, damping: 30 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000' }, backdropStyle]}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.bgWhite,
            borderTopLeftRadius: Radius.sheet,
            borderTopRightRadius: Radius.sheet,
            paddingBottom: insets.bottom + 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 16,
          },
          sheetStyle,
        ]}>
        <View className="items-center pt-3">
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.divider }} />
        </View>
        {title ? (
          <Text className="px-5 pb-3 pt-4 text-[18px] font-bold text-ink">{title}</Text>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}
