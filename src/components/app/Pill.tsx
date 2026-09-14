import { Text, View } from "react-native";
import { makeStyles, useThemeTokens } from "@/theme";

export type PillVariant = "default" | "warn" | "fail" | "active" | "gray";

interface PillProps {
  label: string;
  variant?: PillVariant;
}

/** Status pill — themed version of the legacy `.pill`. */
export function Pill({ label, variant = "default" }: PillProps) {
  const styles = useStyles();
  const theme = useThemeTokens();

  const bg = {
    default: theme.colors.actionPrimarySubtle,
    warn: theme.colors.warningSubtle,
    fail: theme.colors.errorSubtle,
    active: theme.colors.actionPrimary,
    gray: theme.colors.surfaceSunken,
  }[variant];

  const fg = {
    default: theme.colors.actionPrimary,
    warn: theme.colors.warning,
    fail: theme.colors.error,
    active: theme.colors.onActionPrimary,
    gray: theme.colors.textMuted,
  }[variant];

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  pill: { borderRadius: t.radii.sm, paddingHorizontal: t.spacing[2], paddingVertical: t.spacing[1] },
  label: { fontSize: t.fontSize.xs, fontWeight: t.fontWeight.medium },
}));
