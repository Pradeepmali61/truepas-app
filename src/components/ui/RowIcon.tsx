import type { ReactNode } from "react";
import { View } from "react-native";
import { useThemeTokens } from "../../theme";

export type RowIconTone = "neutral" | "primary" | "success" | "warning" | "error" | "info";

export interface RowIconProps {
  icon: ReactNode;
  tone?: RowIconTone;
}

/** Small square icon chip used on list rows (ported from ui-native showcase). */
export function RowIcon({ icon, tone = "neutral" }: RowIconProps) {
  const theme = useThemeTokens();
  const bg = {
    neutral: theme.colors.actionSecondary,
    primary: theme.colors.actionPrimarySubtle,
    success: theme.colors.successSubtle,
    warning: theme.colors.warningSubtle,
    error: theme.colors.errorSubtle,
    info: theme.colors.infoSubtle,
  }[tone];
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: theme.radii.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
      }}>
      {icon}
    </View>
  );
}
