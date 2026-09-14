import type { ReactNode } from "react";
import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";
import { makeStyles } from "../../theme";

export type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body-lg"
  | "body"
  | "body-sm"
  | "caption"
  | "label";

const ROLES: Partial<Record<TextVariant, "header">> = {
  display: "header",
  h1: "header",
  h2: "header",
  h3: "header",
  h4: "header",
};

export interface TypographyProps extends TextProps {
  variant?: TextVariant;
  color?: "primary" | "secondary" | "muted" | "disabled" | "inverse" | "error" | "success";
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}

export function Typography({
  variant = "body",
  color = "primary",
  center,
  style,
  children,
  ...rest
}: TypographyProps) {
  const styles = useStyles();
  return (
    <Text
      accessibilityRole={ROLES[variant]}
      style={[
        styles.base,
        styles[variant],
        styles[`color-${color}`],
        center && styles.center,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const useStyles = makeStyles((t) => ({
  base: { color: t.colors.textPrimary },
  center: { textAlign: "center" as const },

  display: { fontSize: t.fontSize["4xl"], fontWeight: t.fontWeight.bold, lineHeight: t.fontSize["4xl"] * t.lineHeight.tight, letterSpacing: t.letterSpacing.tight },
  h1: { fontSize: t.fontSize["3xl"], fontWeight: t.fontWeight.bold, lineHeight: t.fontSize["3xl"] * t.lineHeight.tight, letterSpacing: t.letterSpacing.tight },
  h2: { fontSize: t.fontSize["2xl"], fontWeight: t.fontWeight.semibold, lineHeight: t.fontSize["2xl"] * t.lineHeight.tight },
  h3: { fontSize: t.fontSize.xl, fontWeight: t.fontWeight.semibold, lineHeight: t.fontSize.xl * t.lineHeight.snug },
  h4: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.semibold, lineHeight: t.fontSize.lg * t.lineHeight.snug },
  "body-lg": { fontSize: t.fontSize.md, lineHeight: t.fontSize.md * t.lineHeight.normal },
  body: { fontSize: t.fontSize.base, lineHeight: t.fontSize.base * t.lineHeight.normal },
  "body-sm": { fontSize: t.fontSize.sm, lineHeight: t.fontSize.sm * t.lineHeight.normal },
  caption: { fontSize: t.fontSize.xs, lineHeight: t.fontSize.xs * t.lineHeight.normal },
  label: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    letterSpacing: t.letterSpacing.caps,
    textTransform: "uppercase" as const,
  },

  "color-primary": { color: t.colors.textPrimary },
  "color-secondary": { color: t.colors.textSecondary },
  "color-muted": { color: t.colors.textMuted },
  "color-disabled": { color: t.colors.textDisabled },
  "color-inverse": { color: t.colors.textInverse },
  "color-error": { color: t.colors.error },
  "color-success": { color: t.colors.success },
}));
