import { useState, type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  iconLeft,
  iconRight,
  fullWidth,
  style,
  children,
  ...rest
}: ButtonProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === "primary" || variant === "destructive" ? theme.colors.onActionPrimary : theme.colors.actionPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" color={spinnerColor} />
      ) : (
        iconLeft && <View style={styles.icon}>{iconLeft}</View>
      )}
      {children != null && (
        <Text style={[styles.label, styles[`${variant}Label`], styles[`${size}Label`]]} numberOfLines={1}>
          {children}
        </Text>
      )}
      {!loading && iconRight && <View style={styles.icon}>{iconRight}</View>}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[2],
    borderRadius: t.radii.md,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: "transparent",
  },
  sm: { height: t.sizes.heightSm, paddingHorizontal: t.sizes.controlPaddingXSm },
  md: { height: t.sizes.heightMd, paddingHorizontal: t.sizes.controlPaddingXMd },
  lg: { height: t.sizes.heightLg, paddingHorizontal: t.sizes.controlPaddingXLg },
  fullWidth: { alignSelf: "stretch" },

  label: { fontWeight: t.fontWeight.medium },
  smLabel: { fontSize: t.fontSize.sm },
  mdLabel: { fontSize: t.fontSize.base },
  lgLabel: { fontSize: t.fontSize.md },

  primary: { backgroundColor: t.colors.actionPrimary },
  primaryPressed: { backgroundColor: t.colors.actionPrimaryPressed },
  primaryLabel: { color: t.colors.onActionPrimary },

  secondary: { backgroundColor: t.colors.actionSecondary },
  secondaryPressed: { backgroundColor: t.colors.actionSecondaryPressed },
  secondaryLabel: { color: t.colors.onActionSecondary },

  outline: { backgroundColor: "transparent", borderColor: t.colors.border },
  outlinePressed: { backgroundColor: t.colors.actionSecondary },
  outlineLabel: { color: t.colors.textPrimary },

  ghost: { backgroundColor: "transparent" },
  ghostPressed: { backgroundColor: t.colors.actionSecondary },
  ghostLabel: { color: t.colors.textPrimary },

  destructive: { backgroundColor: t.colors.actionDanger },
  destructivePressed: { backgroundColor: t.colors.actionDangerPressed },
  destructiveLabel: { color: t.colors.onActionDanger },

  link: { backgroundColor: "transparent", height: undefined, paddingHorizontal: 0 },
  linkPressed: { opacity: 0.7 },
  linkLabel: { color: t.colors.textLink, textDecorationLine: "underline" as const },

  disabled: { opacity: t.opacity.disabled },
  icon: {},
}));
