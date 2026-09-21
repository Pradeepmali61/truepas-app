import { useState, type ReactNode } from "react";
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export interface InputProps extends TextInputProps {
  size?: "sm" | "md" | "lg";
  /** Visual validation state — pair with FormField for messaging */
  state?: "default" | "error" | "success";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  size = "md",
  state = "default",
  iconLeft,
  iconRight,
  containerStyle,
  editable = true,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const disabled = editable === false;
  const showSecureToggle = !!secureTextEntry;

  return (
    <View
      style={[
        styles.field,
        styles[size],
        focused && styles.focused,
        state === "error" && styles.error,
        state === "success" && styles.success,
        disabled && styles.disabled,
        rest.readOnly && styles.readOnly,
        containerStyle,
      ]}
    >
      {iconLeft && <View style={styles.affix}>{iconLeft}</View>}
      <TextInput
        editable={editable}
        secureTextEntry={showSecureToggle ? hidden : secureTextEntry}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityState={{ disabled }}
        style={[styles.control, styles[`${size}Text`], style]}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {iconRight && <View style={styles.affix}>{iconRight}</View>}
      {showSecureToggle && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show password" : "Hide password"}
          hitSlop={14}
          onPress={() => setHidden((h) => !h)}
          style={styles.affix}
        >
          {hidden ? (
            <Eye size={iconSize.sm} color={theme.colors.textMuted} />
          ) : (
            <EyeOff size={iconSize.sm} color={theme.colors.textMuted} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
    ...t.shadows.sm,
  },
  focused: {
    borderColor: t.colors.borderFocus,
    shadowColor: t.colors.actionPrimary,
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2, // Android: shadows.sm alone doesn't raise the glow
  },
  error: { borderColor: t.colors.error },
  success: { borderColor: t.colors.success },
  disabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  readOnly: { backgroundColor: t.colors.surfaceSunken },
  sm: { height: t.sizes.heightSm },
  md: { height: t.sizes.heightMd },
  lg: { height: t.sizes.heightLg },
  control: {
    flex: 1,
    height: "100%",
    color: t.colors.textPrimary,
    paddingHorizontal: t.sizes.controlPaddingXMd,
    paddingVertical: 0,
  },
  smText: { fontSize: t.fontSize.sm },
  mdText: { fontSize: t.fontSize.base },
  lgText: { fontSize: t.fontSize.md },
  affix: { paddingHorizontal: t.spacing[2] },
}));
