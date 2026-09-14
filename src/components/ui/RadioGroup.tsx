import type { ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  state?: "default" | "error";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function RadioGroup({
  options,
  value,
  onValueChange,
  disabled,
  state = "default",
  accessibilityLabel,
  style,
}: RadioGroupProps) {
  const styles = useStyles();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[styles.group, style]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const itemDisabled = disabled || opt.disabled;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: itemDisabled }}
            disabled={itemDisabled}
            onPress={() => onValueChange?.(opt.value)}
            style={styles.row}
          >
            <View
              style={[
                styles.dot,
                selected && styles.dotOn,
                state === "error" && styles.dotError,
                itemDisabled && styles.dotDisabled,
              ]}
            >
              {selected && <View style={styles.dotInner} />}
            </View>
            <View style={styles.text}>
              <Text style={[styles.label, itemDisabled && styles.labelDisabled]}>{opt.label}</Text>
              {opt.description != null && <Text style={styles.description}>{opt.description}</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  group: { gap: t.spacing[4] },
  row: { flexDirection: "row", gap: t.spacing[3], alignItems: "flex-start" },
  dot: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.full,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderStrong,
    backgroundColor: t.colors.surface,
    marginTop: 1,
  },
  dotOn: { borderColor: t.colors.actionPrimary },
  dotError: { borderColor: t.colors.error },
  dotDisabled: { opacity: t.opacity.disabled },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
  },
  text: { flex: 1, gap: t.spacing[0.5] },
  label: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  labelDisabled: { color: t.colors.textDisabled },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
}));
