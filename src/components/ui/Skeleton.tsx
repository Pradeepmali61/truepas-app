import { useEffect, useState } from "react";
import { Animated, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface SkeletonProps {
  variant?: "rect" | "text" | "circle";
  width?: number | string;
  height?: number;
  lines?: number;
  /** Optional border radius override (dp). */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

function usePulse() {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

export function Skeleton({ variant = "rect", width, height, lines = 1, radius, style }: SkeletonProps) {
  const styles = useStyles();
  const opacity = usePulse();

  if (variant === "text" && lines > 1) {
    return (
      <View style={styles.group} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: lines }, (_, i) => (
          <Bone
            key={i}
            opacity={opacity}
            style={[styles.text, { width: i === lines - 1 ? "75%" : "100%" }]}
          />
        ))}
      </View>
    );
  }

  return (
    <Bone
      opacity={opacity}
      style={[
        variant === "circle" && styles.circle,
        variant === "text" && styles.text,
        variant === "rect" && styles.rect,
        width != null && { width: typeof width === "number" ? width + 2 : width } as ViewStyle,
        height != null && { height: height + 2 },
        radius != null && { borderRadius: radius },
        style,
      ]}
    />
  );
}

function Bone({ opacity, style }: { opacity: Animated.Value; style: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <Animated.View
      style={[styles.bone, style, { opacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const useStyles = makeStyles((t) => ({
  bone: { backgroundColor: t.colors.surfaceSunken },
  rect: { borderRadius: t.radii.md, minHeight: 18 },
  text: { borderRadius: t.radii.sm, height: 14 },
  circle: { borderRadius: t.radii.full, width: 42, height: 42 },
  group: { gap: t.spacing[2] },
}));
