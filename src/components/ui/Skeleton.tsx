import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  className?: string;
}

/** Pulsing skeleton loader for query loading states. */
export function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityLabel="Loading"
      className={`bg-canvas ${className}`}
      style={[{ width, height, borderRadius: radius }, style]}
    />
  );
}
