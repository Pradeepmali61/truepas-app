import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AnimatedCardProps extends Omit<PressableProps, 'style'> {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  scale?: number;
}

export function AnimatedCard({ onPress, children, style, scale = 0.97, ...rest }: AnimatedCardProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const onPressIn = () => {
    scaleValue.value = withSpring(scale, { stiffness: 400, damping: 25 });
  };
  const onPressOut = () => {
    scaleValue.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} {...rest}>
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
