import { useRef, useState, type ComponentRef } from "react";
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface OtpInputProps {
  /** Number of cells (default 6 — matches Truepas OTP flows) */
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  state?: "default" | "error";
  disabled?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Segmented one-time-code input — renders N cells over a single hidden
 * TextInput so paste/autofill work. Used by verify-otp flows.
 */
export function OtpInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
  state = "default",
  disabled,
  autoFocus,
  accessibilityLabel = "One-time code",
  style,
}: OtpInputProps) {
  const styles = useStyles();
  const inputRef = useRef<ComponentRef<typeof TextInput> | null>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.slice(0, length).split("");

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, length);
    onChange?.(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  return (
    <Pressable
      style={[styles.wrap, style]}
      onPress={() => inputRef.current?.focus()}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
    >
      {Array.from({ length }, (_, i) => {
        const isActive = focused && digits.length === i;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              isActive && styles.cellFocused,
              state === "error" && styles.cellError,
              disabled && styles.cellDisabled,
            ]}
          >
            <Text style={[styles.digit, disabled && styles.digitDisabled]}>{digits[i] ?? ""}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        style={styles.hidden}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { flexDirection: "row", gap: t.spacing[2], justifyContent: "center" },
  cell: {
    width: t.sizes.heightLg,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
  },
  cellFocused: { borderColor: t.colors.borderFocus, borderWidth: 2 },
  cellError: { borderColor: t.colors.error },
  cellDisabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  digit: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
    fontFamily: t.fontFamily.mono.semibold,
    color: t.colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  digitDisabled: { color: t.colors.textDisabled },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
}));
