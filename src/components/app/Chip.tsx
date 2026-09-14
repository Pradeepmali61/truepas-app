import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "@/theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Relationship chip — themed version of the legacy `.chip`. */
export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? theme.colors.actionPrimary : theme.colors.border },
        selected && { backgroundColor: theme.colors.actionPrimary },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? theme.colors.onActionPrimary : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  return <View style={styles.row}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  chip: {
    borderRadius: t.radii.md,
    borderWidth: 1.5,
    paddingHorizontal: t.spacing[4],
    paddingVertical: t.spacing[2],
    backgroundColor: t.colors.surface,
  },
  label: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: t.spacing[2],
    paddingHorizontal: t.spacing[6],
    paddingBottom: t.spacing[4],
  },
}));
