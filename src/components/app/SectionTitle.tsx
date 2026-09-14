import { makeStyles } from "@/theme";
import { Text, type StyleProp, type TextStyle } from "react-native";

interface SectionTitleProps {
  children: string;
  centered?: boolean;
  style?: StyleProp<TextStyle>;
}

/** Uppercase section title — themed version of the legacy `.section-title`. */
export function SectionTitle({ children, centered, style }: SectionTitleProps) {
  const styles = useStyles();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.title, centered && styles.centered, style]}
    >
      {children}
    </Text>
  );
}

const useStyles = makeStyles((t) => ({
  title: {
    marginHorizontal: t.spacing[5],
    marginBottom: t.spacing[2],
    marginTop: t.spacing[4],
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: t.colors.textSecondary,
  },
  centered: { textAlign: "center" },
}));
