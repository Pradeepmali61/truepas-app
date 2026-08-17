import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { getNeuBoxShadow, Neumorphism } from '@/constants/theme';
import { Icon, IconName } from './Icon';

type NeuButtonType = 'elevated_soft' | 'elevated_flat';

interface NeuButtonProps {
  label: string;
  onPress?: () => void;
  type?: NeuButtonType;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: IconName;
  iconColor?: string;
  baseColor?: string;
}

const SHADOW_DISTANCE = 6;
const SHADOW_BLUR = 12;

export function NeuButton({
  label,
  onPress,
  type = 'elevated_soft',
  disabled = false,
  className = '',
  textClassName = '',
  icon,
  iconColor,
  baseColor = Neumorphism.base,
}: NeuButtonProps) {
  const colors = Neumorphism.getColors(baseColor);
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(0.96, { duration: 90 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        className={`p-4 w-full items-center justify-center ${disabled ? 'opacity-50' : ''} ${className}`}
        style={[
          { borderRadius: Neumorphism.radius, backgroundColor: colors.base },
          Platform.OS === 'web' ? ({ boxShadow: getNeuBoxShadow(baseColor) } as any) : null,
          Platform.OS === 'android' ? { elevation: 6 } : null,
        ]}>
        {Platform.OS === 'ios' && (
          <>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: Neumorphism.radius,
                  backgroundColor: colors.base,
                  shadowColor: colors.dark,
                  shadowOffset: { width: SHADOW_DISTANCE, height: SHADOW_DISTANCE },
                  shadowOpacity: 0.35,
                  shadowRadius: SHADOW_BLUR,
                },
              ]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: Neumorphism.radius,
                  backgroundColor: colors.base,
                  shadowColor: colors.light,
                  shadowOffset: { width: -SHADOW_DISTANCE, height: -SHADOW_DISTANCE },
                  shadowOpacity: 0.85,
                  shadowRadius: SHADOW_BLUR,
                },
              ]}
            />
          </>
        )}
        {Platform.OS === 'android' ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: Neumorphism.radius,
                backgroundColor: type === 'elevated_soft' ? colors.fillStart : colors.fillEnd,
              },
            ]}
          />
        ) : (
          <LinearGradient
            colors={type === 'elevated_soft' ? [colors.fillStart, colors.fillEnd] : [colors.fillEnd, colors.fillStart]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
            style={[StyleSheet.absoluteFill, { borderRadius: Neumorphism.radius }]}
          />
        )}
        {type === 'elevated_flat' && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: 8,
              bottom: 8,
              borderRadius: Neumorphism.radius - 6,
              borderWidth: 1,
              borderTopColor: colors.light,
              borderLeftColor: colors.light,
              borderBottomColor: colors.dark,
              borderRightColor: colors.dark,
              overflow: 'hidden',
            }}>
            {Platform.OS === 'android' ? (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.pressedStart }]}
              />
            ) : (
              <LinearGradient
                colors={[colors.pressedStart, colors.pressedEnd]}
                start={{ x: 0.2, y: 0.2 }}
                end={{ x: 0.8, y: 0.8 }}
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        )}
        <View className="flex-row items-center gap-2 z-10">
          {icon ? <Icon name={icon} size={18} color={iconColor ?? colors.dark} /> : null}
          <Text allowFontScaling={false} className={`text-[16px] font-bold text-ink ${textClassName}`}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
