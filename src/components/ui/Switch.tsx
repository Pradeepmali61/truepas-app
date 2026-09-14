import type { ReactNode } from "react";
import { Switch as RNSwitch, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";

export interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Switch({ value, onValueChange, label, description, disabled, style }: SwitchProps) {
  const styles = useStyles();
  const theme = useThemeTokens();

  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: theme.colors.borderStrong, true: theme.colors.actionPrimary }}
      thumbColor={theme.colors.onActionPrimary}
      ios_backgroundColor={theme.colors.borderStrong}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value, disabled }}
    />
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
  row: { flexDirection: "row", gap: t.spacing[3], alignItems: "center" },
  text: { flex: 1, gap: t.spacing[0.5] },
  label: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  labelDisabled: { color: t.colors.textDisabled },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
}));
