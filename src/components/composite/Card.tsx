/** @jsxImportSource react */
import type { ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface CardProps {
  appearance?: "outlined" | "elevated" | "filled";
  noPadding?: boolean;
  /** Card becomes a pressable surface */
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ appearance = "outlined", noPadding, onPress, children, style }: CardProps) {
  const styles = useStyles();
  const cardStyle = [
    styles.card,
    styles[appearance],
    !noPadding && styles.padded,
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

export function CardHeader({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.header, style]}>{children}</View>;
}
export function CardTitle({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <Text style={styles.title}>{children}</Text>;
}
export function CardDescription({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <Text style={styles.description}>{children}</Text>;
}
export function CardContent({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.content, style]}>{children}</View>;
}
export function CardFooter({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.footer, style]}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  card: { backgroundColor: t.colors.surface, borderRadius: t.radii.xl },
  outlined: { borderWidth: t.sizes.fieldBorderWidth, borderColor: t.colors.borderSubtle },
  elevated: { borderWidth: t.sizes.fieldBorderWidth, borderColor: t.colors.borderSubtle, ...t.shadows.md },
  filled: { backgroundColor: t.colors.surfaceSunken },
  padded: { padding: t.sizes.cardPadding },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  header: { gap: t.spacing[1], marginBottom: t.spacing[4] },
  title: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  description: { fontSize: t.fontSize.base, color: t.colors.textSecondary },
  content: {},
  footer: { marginTop: t.spacing[4], flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
}));
