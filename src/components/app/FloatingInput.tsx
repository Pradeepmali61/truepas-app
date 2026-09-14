import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useState } from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { makeStyles, useThemeTokens } from "@/theme";

interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
  gradient?: boolean;
  noMargin?: boolean;
}

/** Floating-label input — themed version of the legacy `.floating-input`. */
export const FloatingInput = forwardRef<TextInput, FloatingInputProps>(
  ({ label, error, rightSlot, gradient, noMargin, onFocus, onBlur, value, ...inputProps }, ref) => {
    const [focused, setFocused] = useState(false);
    const styles = useStyles();
    const theme = useThemeTokens();

    const borderColor = error
      ? theme.colors.error
      : focused
        ? theme.colors.actionPrimary
        : theme.colors.border;
    const labelColor = error
      ? theme.colors.error
      : focused
        ? theme.colors.actionPrimary
        : theme.colors.textMuted;

    const inputBody = (
      <>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          value={value}
          {...inputProps}
        />
        {rightSlot}
      </>
    );

    return (
      <View style={noMargin ? styles.noMargin : styles.margin}>
        {gradient ? (
          <>
            <View style={styles.labelWrap}>
              <Text style={[styles.labelSmall, { color: labelColor }]}>{label}</Text>
            </View>
            <View style={[styles.inputWrap, { borderColor, height: 56 }]}>
              <LinearGradient
                colors={[theme.colors.surface, theme.colors.actionPrimarySubtle]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {inputBody}
            </View>
          </>
        ) : (
          <View>
            <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
            <View style={[styles.inputWrap, { borderColor, height: 56 }]}>
              {inputBody}
            </View>
          </View>
        )}
        {error ? (
          <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

FloatingInput.displayName = "FloatingInput";

const useStyles = makeStyles((t) => ({
  margin: { marginHorizontal: t.spacing[6], marginBottom: t.spacing[6] },
  noMargin: { marginBottom: t.spacing[6] },
  labelWrap: { marginBottom: t.spacing[1] },
  label: {
    fontSize: t.fontSize.xs,
    marginBottom: t.spacing[1],
    fontWeight: t.fontWeight.medium,
  },
  labelSmall: { fontSize: 11 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: t.radii.lg,
    borderWidth: t.sizes.fieldBorderWidth,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing[4],
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.medium,
    color: t.colors.textPrimary,
  },
  error: { marginTop: t.spacing[1], paddingHorizontal: t.spacing[1], fontSize: 11 },
}));
