import { makeStyles, useThemeTokens } from "@/theme";
import { Check } from "lucide-react-native";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

interface CheckboxRowProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Row-style checkbox with a label — backward-compatible API
 * (`checked` / `onToggle` / `label`) used by consent + family-add screens.
 */
export function CheckboxRow({ checked, onToggle, label, style }: CheckboxRowProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.row, style]}
      onTouchEnd={() => onToggle(!checked)}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? theme.colors.actionPrimary : theme.colors.borderStrong },
          checked && { backgroundColor: theme.colors.actionPrimary },
        ]}
      >
        {checked ? <Check size={16} color={theme.colors.onActionPrimary} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", alignItems: "flex-start", gap: t.spacing[3], paddingHorizontal: t.spacing[6] },
  box: {
    width: 22,
    height: 22,
    borderRadius: t.radii.sm,
    borderWidth: t.sizes.fieldBorderWidth,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  label: { flex: 1, fontSize: t.fontSize.sm, color: t.colors.textPrimary, lineHeight: 22 },
}));
