/** @jsxImportSource react */
import { Check, ChevronDown } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  state?: "default" | "error" | "success";
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Sheet header text */
  title?: string;
  leftIcon?: ReactNode;
}

/**
 * Mobile-native select: tap → bottom sheet with options.
 * No native module needed.
 */
export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  size = "md",
  state = "default",
  disabled,
  accessibilityLabel,
  style,
  title,
  leftIcon,
}: SelectProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const selected = options.find((o) => o.value === value);

  const pick = (v: string) => {
    onValueChange?.(v);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.field,
          styles[size],
          focused && styles.focused,
          state === "error" && styles.error,
          disabled && styles.disabled,
          style,
        ]}
      >
        {leftIcon && <View style={styles.leadIcon}>{leftIcon}</View>}
        <Text
          style={[styles.valueText, styles[`${size}Text`], !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={iconSize.sm} color={theme.colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {title && <Text style={styles.sheetTitle}>{title}</Text>}
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item.value === value, disabled: item.disabled }}
                disabled={item.disabled}
                onPress={() => pick(item.value)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                  item.disabled && styles.optionDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    item.value === value && styles.optionTextActive,
                    item.disabled && styles.optionTextDisabled,
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === value && (
                  <Check size={iconSize.sm} color={theme.colors.actionPrimary} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
    paddingHorizontal: t.sizes.controlPaddingXMd,
  },
  sm: { height: t.sizes.heightSm },
  md: { height: t.sizes.heightMd },
  lg: { height: t.sizes.heightLg },
  focused: { borderColor: t.colors.borderFocus },
  error: { borderColor: t.colors.error },
  disabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  leadIcon: {},
  valueText: { flex: 1, color: t.colors.textPrimary },
  smText: { fontSize: t.fontSize.sm },
  mdText: { fontSize: t.fontSize.base },
  lgText: { fontSize: t.fontSize.md },
  placeholder: { color: t.colors.textMuted },

  scrim: { flex: 1, backgroundColor: t.colors.scrim },
  sheet: {
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: t.radii["2xl"],
    borderTopRightRadius: t.radii["2xl"],
    maxHeight: "70%",
    paddingBottom: t.spacing[8],
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.borderStrong,
    marginVertical: t.spacing[2],
  },
  sheetTitle: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textPrimary,
    paddingHorizontal: t.spacing[4],
    paddingBottom: t.spacing[2],
  },
  list: { flexGrow: 0 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.spacing[4],
    minHeight: t.sizes.touchTarget,
    paddingVertical: t.spacing[3],
  },
  optionPressed: { backgroundColor: t.colors.actionSecondary },
  optionDisabled: { opacity: t.opacity.disabled },
  optionText: { fontSize: t.fontSize.md, color: t.colors.textPrimary },
  optionTextActive: { color: t.colors.actionPrimary, fontWeight: t.fontWeight.semibold },
  optionTextDisabled: { color: t.colors.textDisabled },
}));
