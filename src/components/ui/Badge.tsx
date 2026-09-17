import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export type BadgeVariant = "neutral" | "primary" | "brand" | "success" | "warning" | "error" | "info";

export interface BadgeProps {
  variant?: BadgeVariant;
  appearance?: "subtle" | "outline" | "solid";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  variant = "neutral",
  appearance = "subtle",
  size = "md",
  dot,
  icon,
  children,
  style,
}: BadgeProps) {
  const styles = useStyles();
  return (
    <View
      accessibilityRole="text"
      style={[
        styles.badge,
        styles[size],
        styles[`${variant}_${appearance}`],
        style,
      ]}
    >
      {dot && <View style={[styles.dot, styles[`${variant}Dot`]]} />}
      {icon}
      <Text style={[styles.text, styles[`${size}Text`], styles[`${variant}_${appearance}Text`]]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => {
  const subtleBg = {
    neutral: t.colors.actionSecondary,
    primary: t.colors.actionPrimarySubtle,
    brand: t.colors.brandSubtle,
    success: t.colors.successSubtle,
    warning: t.colors.warningSubtle,
    error: t.colors.errorSubtle,
    info: t.colors.infoSubtle,
  } as const;
  const subtleFg = {
    neutral: t.colors.textSecondary,
    primary: t.colors.actionPrimary,
    brand: t.colors.onBrandSubtle,
    success: t.colors.onSuccessSubtle,
    warning: t.colors.onWarningSubtle,
    error: t.colors.onErrorSubtle,
    info: t.colors.onInfoSubtle,
  } as const;
  const solidBg = {
    neutral: t.colors.textSecondary,
    primary: t.colors.actionPrimary,
    brand: t.brand.b600,
    success: t.colors.success,
    warning: t.colors.warning,
    error: t.colors.error,
    info: t.colors.info,
  } as const;
  const accent = {
    neutral: t.colors.borderStrong,
    primary: t.colors.actionPrimary,
    brand: t.brand.b600,
    success: t.colors.success,
    warning: t.colors.warning,
    error: t.colors.error,
    info: t.colors.info,
  } as const;

  const s: Record<string, ViewStyle | any> = {
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing[1.5],
      borderRadius: t.radii.full,
      borderWidth: t.sizes.fieldBorderWidth,
      borderColor: "transparent",
      alignSelf: "flex-start",
      maxWidth: "100%",
    },
    sm: { height: 20, paddingHorizontal: t.spacing[2] },
    md: { height: 24, paddingHorizontal: t.spacing[3] },
    lg: { height: 28, paddingHorizontal: t.spacing[4] },
    text: { fontWeight: t.fontWeight.medium },
    smText: { fontSize: t.fontSize.xs },
    mdText: { fontSize: t.fontSize.sm },
    lgText: { fontSize: t.fontSize.base },
    dot: { width: 6, height: 6, borderRadius: t.radii.full },
  };

  for (const v of Object.keys(subtleBg) as BadgeVariant[]) {
    s[`${v}_subtle`] = { backgroundColor: subtleBg[v] };
    s[`${v}_subtleText`] = { color: subtleFg[v] };
    s[`${v}_outline`] = { backgroundColor: "transparent", borderColor: accent[v] };
    s[`${v}_outlineText`] = { color: accent[v] };
    s[`${v}_solid`] = { backgroundColor: solidBg[v] };
    s[`${v}_solidText`] = { color: t.colors.textInverse };
    s[`${v}Dot`] = { backgroundColor: accent[v] };
  }
  return s as any;
});
