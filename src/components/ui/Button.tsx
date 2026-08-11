import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { Icon, IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'link';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: IconName;
  iconColor?: string;
}

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary rounded-btn p-[14px] w-full items-center',
  secondary: 'bg-surface rounded-btn p-[14px] w-full items-center',
  outline: 'bg-transparent border-[1.5px] border-line rounded-btn p-[14px] w-full items-center',
  danger: 'bg-primary rounded-btn p-[14px] w-full items-center',
  link: 'items-center p-2',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white text-[16px] font-bold',
  secondary: 'text-primary text-[16px] font-bold',
  outline: 'text-ink text-[16px] font-bold',
  danger: 'text-white text-[16px] font-bold',
  link: 'text-primary text-[14px] font-medium underline',
};

const DEFAULT_ICON_COLOR: Record<Variant, string> = {
  primary: '#ffffff',
  secondary: Colors.primary,
  outline: Colors.ink,
  danger: '#ffffff',
  link: Colors.primary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  icon,
  iconColor,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 90 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Animated.View style={[animatedStyle, variant !== 'link' ? { width: '100%' as const } : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`${CONTAINER[variant]} ${disabled ? 'opacity-50' : 'active:opacity-80'} ${className}`}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? Colors.primary : '#fff'} />
        ) : (
          <View className="flex-row items-center gap-2">
            {icon ? <Icon name={icon} size={18} color={iconColor ?? DEFAULT_ICON_COLOR[variant]} /> : null}
            <Text allowFontScaling={false} className={LABEL[variant]}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
