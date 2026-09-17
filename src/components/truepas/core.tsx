import { useThemeTokens } from "@/theme";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useStyles } from "./styles";

/* Soft-UI primitives — the base card + icon buttons every screen composes. */

/** Raised soft card — the base surface for every TruePas widget. */
export function SoftCard({ children, style }: { children: ReactNode; style?: object }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Circular icon button with soft elevation (the icon cluster rows). */
export function CircleButton({
  icon,
  tone = "plain",
  onPress,
  label,
}: {
  icon: ReactNode;
  tone?: "plain" | "solid";
  onPress?: () => void;
  label?: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circle,
        tone === "solid" && styles.circleSolid,
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

/** Square icon button (arrow steppers, price badges). */
export function SquareButton({ icon, tone = "plain" }: { icon: ReactNode; tone?: "plain" | "solid" }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.square,
        tone === "solid" && styles.squareSolid,
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function PillButton({ label, icon, tone = "plain" }: { label: string; icon?: ReactNode; tone?: "plain" | "solid" }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        tone === "solid" && styles.pillSolid,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pillLabel, tone === "solid" && styles.pillLabelSolid]}>{label}</Text>
      {icon}
    </Pressable>
  );
}

/** Small caption tag — labels a variant so the team can reference it. */
export function VariantTag({ children }: { children: string }) {
  const styles = useStyles();
  return <Text style={styles.variantTag}>{children}</Text>;
}

/** Step-progress dots — active dot stretches; used by LivenessStepsCard. */
export function StepDots({ total, current }: { total: number; current: number }) {
  const theme = useThemeTokens();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: theme.spacing[1],
        justifyContent: "center",
        paddingVertical: theme.spacing[2],
      }}
      accessibilityLabel={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: theme.radii.full,
            backgroundColor: i <= current ? theme.colors.actionPrimary : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}
