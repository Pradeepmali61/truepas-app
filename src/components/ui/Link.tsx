import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface LinkProps {
  children: ReactNode;
  onPress?: () => void;
  href?: never; // apps wire their own navigation via onPress
  variant?: "default" | "quiet";
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/** Inline-safe link — a Text with onPress (not a Pressable), so it flows
 *  inside a Typography/Text run without breaking baseline alignment. */
export function Link({ children, onPress, variant = "default", disabled, style, accessibilityLabel }: LinkProps) {
  const styles = useStyles();
  return (
    <Text
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      suppressHighlighting
      style={[
        styles.link,
        variant === "default" && styles.underline,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const useStyles = makeStyles((t) => ({
  link: { color: t.colors.textLink, fontSize: t.fontSize.base },
  underline: { textDecorationLine: "underline" as const },
  disabled: { color: t.colors.textDisabled, textDecorationLine: "none" as const },
}));
