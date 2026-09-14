import type { ReactNode } from "react";
import { Pressable, Text, type StyleProp, type TextStyle } from "react-native";
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

export function Link({ children, onPress, variant = "default", disabled, style, accessibilityLabel }: LinkProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Text
        style={[
          styles.link,
          variant === "default" && styles.underline,
          disabled && styles.disabled,
          style,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  link: { color: t.colors.textLink, fontSize: t.fontSize.base },
  underline: { textDecorationLine: "underline" as const },
  pressed: { opacity: 0.7 },
  disabled: { color: t.colors.textDisabled, textDecorationLine: "none" as const },
}));
