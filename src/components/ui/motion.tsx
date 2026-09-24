import { useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";

/**
 * Motion primitives (ported from the ui-native showcase).
 * All primitives run on the native driver (transform/opacity only).
 */

/** Looping scale pulse — "live" elements: face ring, scanning targets. */
export function Pulse({
  children,
  to = 1.05,
  ms = 1100,
  style,
}: {
  children: ReactNode;
  to?: number;
  ms?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: to, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, to, ms]);
  return <Animated.View style={[style, { transform: [{ scale: v }] }]}>{children}</Animated.View>;
}

/** Opacity blink — recording indicator, unread dot. */
export function Blink({
  children,
  ms = 750,
  min = 0.25,
  style,
}: {
  children: ReactNode;
  ms?: number;
  min?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: min, duration: ms, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: ms, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, ms, min]);
  return <Animated.View style={[style, { opacity: v }]}>{children}</Animated.View>;
}

/** One-shot scale+fade entrance — success reveals, hero elements. */
export function PopIn({
  children,
  delay = 0,
  ms = 340,
  from = 0.6,
  style,
}: {
  children: ReactNode;
  delay?: number;
  ms?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: ms,
      delay,
      easing: Easing.out(Easing.back(1.7)),
      useNativeDriver: true,
    }).start();
  }, [v, delay, ms]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** One-shot rise+fade entrance — staggered content blocks on screen load. */
export function FadeUp({
  children,
  delay = 0,
  ms = 300,
  dy = 12,
  style,
}: {
  children: ReactNode;
  delay?: number;
  ms?: number;
  dy?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: ms,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delay, ms]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Vertical scan sweep — fills its parent (position absolute), a bright line
 * travels top→bottom→top. Drop inside the viewfinder/document-art container.
 */
export function ScanLine({ ms = 1900, color }: { ms?: number; color?: string }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [h, setH] = useState(0);
  const [v] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, ms]);

  const travel = Math.max(0, h - 3);
  return (
    <View
      style={styles.scanHost}
      pointerEvents="none"
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
    >
      <Animated.View
        style={[
          styles.scanLine,
          { backgroundColor: color ?? theme.colors.actionPrimary },
          { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }] },
        ]}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  scanHost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  scanLine: {
    height: 5,
    borderRadius: t.radii.full,
    marginHorizontal: t.spacing[4],
    shadowColor: t.colors.actionPrimary,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
}));
