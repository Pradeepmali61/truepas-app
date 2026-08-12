import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { Icon, IconName } from './Icon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
}

const VARIANT_CONFIG: Record<ToastVariant, { bg: string; icon: IconName; iconColor: string }> = {
  success: { bg: Colors.successBg, icon: 'checkCircle', iconColor: Colors.success },
  error: { bg: Colors.errorBg, icon: 'warning', iconColor: Colors.error },
  warning: { bg: Colors.warningBg, icon: 'warning', iconColor: Colors.warning },
  info: { bg: Colors.infoBg, icon: 'info', iconColor: Colors.info },
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: number) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { stiffness: 300, damping: 30 });
    opacity.value = withTiming(1, { duration: 200 });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(-100, { stiffness: 300, damping: 30 });
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, translateY, opacity, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const config = VARIANT_CONFIG[toast.variant];

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          marginTop: insets.top + 8,
        },
      ]}
      className="mx-4">
      <Pressable onPress={() => onDismiss(toast.id)} accessibilityRole="button" accessibilityLabel={toast.message}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: config.bg,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 8,
          }}>
          <Icon name={config.icon} size={22} color={config.iconColor} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: Colors.ink }}>
            {toast.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
