import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TRACK_W = 48;
const TRACK_H = 28;
const KNOB = 22;
const INSET = 3;
const TRAVEL = TRACK_W - KNOB - INSET * 2;

export function Switch({ value = false, onValueChange, label, description, disabled, style }: SwitchProps) {
  const styles = useStyles();
  const x = useRef(new Animated.Value(value ? TRAVEL : 0)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: value ? TRAVEL : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 160,
    }).start();
  }, [value, x]);

  const control = (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.track,
        value && styles.trackOn,
        disabled && styles.trackDisabled,
        pressed && !disabled && styles.trackPressed,
      ]}
    >
      <Animated.View style={[styles.knob, value && styles.knobOn, { transform: [{ translateX: x }] }]} />
    </Pressable>
  );

  if (!label && !description) return <View style={style}>{control}</View>;

  return (
    <View style={[styles.row, style]}>
      {control}
      <View style={styles.text}>
        {label != null && <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>}
        {description != null && <Text style={styles.description}>{description}</Text>}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.borderStrong,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.textMuted,
    justifyContent: "center",
    paddingHorizontal: INSET,
    ...t.shadows.sm,
  },
  trackOn: {
    backgroundColor: t.colors.actionPrimary,
    borderColor: t.colors.actionPrimaryPressed,
  },
  trackDisabled: { opacity: t.opacity.disabled },
  trackPressed: { opacity: 0.9 },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
    ...t.shadows.sm,
  },
  knobOn: { backgroundColor: t.colors.onActionPrimary },
  row: { flexDirection: "row", gap: t.spacing[3], alignItems: "center" },
  text: { flex: 1, gap: t.spacing[0.5] },
  label: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  labelDisabled: { color: t.colors.textDisabled },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
}));
