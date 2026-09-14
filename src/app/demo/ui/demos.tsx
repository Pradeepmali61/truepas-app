import type { ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { Typography } from "@/components/ui/Typography";
import { makeStyles } from "@/theme";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Typography variant="h4">{title}</Typography>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Labeled demo row/block */
export function Demo({ label, children, row, style }: { label?: string; children: ReactNode; row?: boolean; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={styles.demo}>
      {label != null && (
        <Typography variant="label" color="muted" style={styles.demoLabel}>
          {label}
        </Typography>
      )}
      <View style={[row && styles.demoRow, style]}>{children}</View>
    </View>
  );
}

export function ShowcasePage({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      {children}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  page: { flex: 1 },
  pageContent: { padding: t.spacing[4], paddingBottom: t.spacing[20], gap: t.spacing[8] },
  section: { gap: t.spacing[4] },
  sectionBody: { gap: t.spacing[5] },
  demo: { gap: t.spacing[2] },
  demoLabel: { textTransform: "uppercase" },
  demoRow: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[3], alignItems: "center" },
}));

