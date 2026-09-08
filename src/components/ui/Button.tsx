import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { fontScale, scale as scaleSize } from '@/utils/responsive';
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
  primary: 'bg-primary rounded-btn w-full items-center',
  secondary: 'bg-surface rounded-btn w-full items-center',
  outline: 'bg-transparent border-[1.5px] border-line rounded-btn w-full items-center',
  danger: 'bg-primary rounded-btn w-full items-center',
  link: 'items-center',
};

const LABEL_COLOR: Record<Variant, string> = {
  primary: '#ffffff',
  secondary: Colors.primary,
  outline: Colors.ink,
  danger: '#ffffff',
  link: Colors.primary,
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
        className={`${CONTAINER[variant]} ${disabled ? 'opacity-50' : 'active:opacity-80'} ${className}`}
        style={variant !== 'link' ? { paddingVertical: scaleSize(14, 12, 18) } : { padding: scaleSize(8) }}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? Colors.primary : '#fff'} />
        ) : (
          <View className="flex-row items-center gap-2">
            {icon ? <Icon name={icon} size={scaleSize(18, 16, 22)} color={iconColor ?? LABEL_COLOR[variant]} /> : null}
            <Text
              allowFontScaling={false}
              style={{
                fontSize: fontScale(variant === 'link' ? 14 : 16),
                fontWeight: variant === 'link' ? '500' : '700',
                color: LABEL_COLOR[variant],
                textDecorationLine: variant === 'link' ? 'underline' : undefined,
              }}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
