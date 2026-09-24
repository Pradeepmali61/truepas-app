import { useEffect, useState } from "react";
import { Animated, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface ProgressProps {
  /** 0–100. Omit for indeterminate. */
  value?: number;
  size?: "sm" | "md";
  variant?: "primary" | "success" | "warning" | "error";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Progress({ value, size = "md", variant = "primary", accessibilityLabel = "Progress", style }: ProgressProps) {
  const styles = useStyles();
  const indeterminate = value === undefined;
  const [width] = useState(() => new Animated.Value(indeterminate ? 40 : Math.min(100, Math.max(0, value))));

  useEffect(() => {
    if (indeterminate) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(width, { toValue: 40, duration: 0, useNativeDriver: false }),
          Animated.timing(width, { toValue: 100, duration: 600, useNativeDriver: false }),
          Animated.timing(width, { toValue: 40, duration: 0, useNativeDriver: false }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(width, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, indeterminate, width]);

  return (
    <View
      style={[styles.track, styles[size], style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: Math.round(value) }}
    >
      <Animated.View
        style={[
          styles.fill,
          styles[variant],
          { width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
        ]}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: t.colors.actionSecondary,
    borderRadius: t.radii.full,
  },
  sm: { height: 6 },
  md: { height: 10 },
  fill: { height: "100%", borderRadius: t.radii.full },
  primary: { backgroundColor: t.colors.actionPrimary },
  success: { backgroundColor: t.colors.success },
  warning: { backgroundColor: t.colors.warning },
  error: { backgroundColor: t.colors.error },
}));
