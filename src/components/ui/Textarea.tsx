import { useState } from "react";
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";

export interface TextareaProps extends TextInputProps {
  state?: "default" | "error" | "success";
  containerStyle?: StyleProp<ViewStyle>;
  rows?: number;
}

export function Textarea({
  state = "default",
  containerStyle,
  editable = true,
  rows = 3,
  style,
  ...rest
}: TextareaProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;

  return (
    <View
      style={[
        styles.field,
        focused && styles.focused,
        state === "error" && styles.error,
        state === "success" && styles.success,
        disabled && styles.disabled,
        containerStyle,
      ]}
    >
      <TextInput
        multiline
        editable={editable}
        numberOfLines={rows}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.control, style]}
        textAlignVertical="top"
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
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
  },
  focused: { borderColor: t.colors.borderFocus },
  error: { borderColor: t.colors.error },
  success: { borderColor: t.colors.success },
  disabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  control: {
    flex: 1,
    minHeight: t.sizes.heightLg,
    color: t.colors.textPrimary,
    fontSize: t.fontSize.base,
    paddingHorizontal: t.sizes.controlPaddingXMd,
    paddingVertical: t.spacing[2],
    lineHeight: t.fontSize.base * t.lineHeight.normal,
  },
}));
