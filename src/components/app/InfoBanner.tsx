import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Info, TriangleAlert, CircleAlert } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { AppIcon, type IconName } from "./AppIcon";

export type BannerVariant = "info" | "warn" | "danger";

interface InfoBannerProps {
  children: React.ReactNode;
  variant?: BannerVariant;
  leading?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Info banner — themed version of the legacy `.info-banner`. */
export function InfoBanner({ children, variant = "info", leading, style }: InfoBannerProps) {
  const styles = useStyles();
  const theme = useThemeTokens();

  const bg = {
    info: theme.colors.actionPrimarySubtle,
    warn: theme.colors.warningSubtle,
    danger: theme.colors.errorSubtle,
  }[variant];

  const fg = {
    info: theme.colors.actionPrimary,
    warn: theme.colors.warning,
    danger: theme.colors.error,
  }[variant];

  const LeadingIcon = leading
    ? null
    : { info: Info, warn: TriangleAlert, danger: CircleAlert }[variant];

  return (
    <View style={[styles.banner, { backgroundColor: bg }, style]}>
      {leading ? (
        <AppIcon name={leading} size={16} color={fg} />
      ) : LeadingIcon ? (
        <LeadingIcon size={16} color={fg} />
      ) : null}
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: t.spacing[2],
    borderRadius: t.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: t.spacing[3],
    marginHorizontal: t.spacing[6],
    marginVertical: 10,
  },
  text: { flex: 1, fontSize: t.fontSize.xs, lineHeight: 18 },
}));
