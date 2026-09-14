import type { ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Check, Minus } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export interface CheckboxProps {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  state?: "default" | "error";
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  label,
  description,
  disabled,
  state = "default",
  style,
}: CheckboxProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const on = checked === true || checked === "indeterminate";

  const box = (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: checked === "indeterminate" ? "mixed" : checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange?.(!checked)}
      style={({ pressed }) => [
        styles.box,
        on && styles.boxOn,
        pressed && styles.boxPressed,
        state === "error" && styles.boxError,
        disabled && styles.boxDisabled,
      ]}
    >
      {checked === "indeterminate" ? (
        <Minus size={iconSize.xs} color={theme.colors.onActionPrimary} strokeWidth={3} />
      ) : on ? (
        <Check size={iconSize.xs} color={theme.colors.onActionPrimary} strokeWidth={3} />
      ) : null}
    </Pressable>
  );

  if (!label && !description) return <View style={style}>{box}</View>;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: checked === "indeterminate" ? "mixed" : checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange?.(!checked)}
      style={[styles.row, style]}
    >
      {box}
      <View style={styles.text}>
        {label != null && <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>}
        {description != null && <Text style={styles.description}>{description}</Text>}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  box: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderStrong,
    borderRadius: t.radii.sm,
    marginTop: 1,
  },
  boxOn: { backgroundColor: t.colors.actionPrimary, borderColor: t.colors.actionPrimary },
  boxPressed: { borderColor: t.colors.actionPrimary },
  boxError: { borderColor: t.colors.error },
  boxDisabled: { opacity: t.opacity.disabled },
  row: { flexDirection: "row", gap: t.spacing[3], alignItems: "flex-start" },
  text: { flex: 1, gap: t.spacing[0.5] },
  label: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  labelDisabled: { color: t.colors.textDisabled },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
}));
