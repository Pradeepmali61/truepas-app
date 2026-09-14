import type { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { Spinner } from "./Spinner";

export interface IconButtonProps extends Omit<PressableProps, "style" | "children"> {
  /** Required — there is no visible label */
  accessibilityLabel: string;
  icon: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  loading,
  disabled,
  style,
  accessibilityLabel,
  ...rest
}: IconButtonProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === "primary" || variant === "destructive"
      ? theme.colors.onActionPrimary
      : theme.colors.actionPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? <Spinner size="sm" color={spinnerColor} /> : icon}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.md,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: "transparent",
  },
  sm: { width: t.sizes.heightSm, height: t.sizes.heightSm },
  md: { width: t.sizes.heightMd, height: t.sizes.heightMd },
  lg: { width: t.sizes.heightLg, height: t.sizes.heightLg },

  primary: { backgroundColor: t.colors.actionPrimary },
  primaryPressed: { backgroundColor: t.colors.actionPrimaryPressed },
  secondary: { backgroundColor: t.colors.actionSecondary },
  secondaryPressed: { backgroundColor: t.colors.actionSecondaryPressed },
  outline: { borderColor: t.colors.border, backgroundColor: "transparent" },
  outlinePressed: { backgroundColor: t.colors.actionSecondary },
  ghost: { backgroundColor: "transparent" },
  ghostPressed: { backgroundColor: t.colors.actionSecondary },
  destructive: { backgroundColor: t.colors.actionDanger },
  destructivePressed: { backgroundColor: t.colors.actionDangerPressed },
  disabled: { opacity: t.opacity.disabled },
}));
