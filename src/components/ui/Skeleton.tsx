import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
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

export function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }: SkeletonProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const translateX = useSharedValue(-width.valueOf());
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
    } else {
      const w = typeof width === 'number' ? width : 200;
      translateX.value = withRepeat(withTiming(w, { duration: 1000 }), -1, false);
    }
  }, [reducedMotion, width, translateX, opacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (reducedMotion) {
    return (
      <Animated.View
        accessibilityLabel="Loading"
        className={`bg-canvas ${className}`}
        style={[{ width, height, borderRadius: radius }, pulseStyle]}
      />
    );
  }

  const w = typeof width === 'number' ? width : 200;

  return (
    <View
      accessibilityLabel="Loading"
      className={`bg-canvas ${className}`}
      style={{ width, height, borderRadius: radius, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: w * 0.5,
            backgroundColor: 'rgba(255,255,255,0.15)',
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
}
