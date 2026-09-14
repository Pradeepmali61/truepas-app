import { useRef, type ComponentRef } from "react";
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { Search, X } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Spinner } from "../ui/Spinner";

export interface SearchBoxProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function SearchBox({
  value,
  defaultValue,
  onChange,
  onSubmit,
  placeholder = "Search…",
  disabled,
  loading,
  clearable = true,
  accessibilityLabel = "Search",
  style,
}: SearchBoxProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const inputRef = useRef<ComponentRef<typeof TextInput> | null>(null);
  const controlled = value !== undefined;

  return (
    <View style={[styles.wrap, disabled && styles.disabled, style]}>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <Search size={iconSize.sm} color={theme.colors.textMuted} />
      )}
      <TextInput
        ref={inputRef}
        accessibilityRole="search"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        editable={!disabled}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"
        value={value}
        defaultValue={defaultValue}
        onChangeText={onChange}
        onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {clearable && controlled && value.length > 0 && !disabled && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => {
            onChange?.("");
            inputRef.current?.focus();
          }}
          hitSlop={8}
        >
          <X size={iconSize.sm} color={theme.colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    height: t.sizes.heightMd,
    paddingHorizontal: t.sizes.controlPaddingXMd,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
  },
  disabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  input: {
    flex: 1,
    height: "100%",
    color: t.colors.textPrimary,
    fontSize: t.fontSize.base,
    paddingVertical: 0,
  },
}));
