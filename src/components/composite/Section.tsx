/**
 * Section / SectionTitle — one logical group inside a screen (a set of form
 * fields, a list of tiles, a card stack). Screen bodies already space
 * sections apart, so Section only supplies the gap between the group's own
 * children.
 *
 * Ported 1:1 from UI-design-repo `src/app/ui/chrome.tsx`
 * (sizes.fieldGap → spacing[4]).
 */
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";
import { Typography } from "../ui/Typography";

export function Section({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const styles = useStyles();
  return <View style={[styles.section, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionRow}>
      <Typography variant="label" color="secondary">
        {children}
      </Typography>
      {action}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: { gap: t.spacing[4] },
}));
