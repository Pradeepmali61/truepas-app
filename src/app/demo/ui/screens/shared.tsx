import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ScanFace } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";

/** Standard padded content column inside a ScreenFrame. */
export function ScreenBody({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.body, style]}>{children}</View>;
}

/** Safe-area bottom bar for the primary CTA on form screens. */
export function StickyFooter({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.footer}>{children}</View>;
}

/** Brand lockup used at the top of auth screens. */
export function BrandMark({ compact }: { compact?: boolean }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.brand}>
      <View style={styles.brandIcon}>
        <ScanFace size={compact ? iconSize.md : iconSize.lg} color={theme.colors.onActionPrimary} />
      </View>
      <Typography variant={compact ? "h4" : "h3"}>Truepas</Typography>
    </View>
  );
}

/** Contract field row â€” label over mono value (numbers/IDs use JetBrains Mono). */
export function KV({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, mono && styles.mono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/** Simple pressable list row for reference screens. */
export function Row({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole={onPress ? "button" : "text"}>
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle != null && (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { flex: 1, padding: t.spacing[4], gap: t.spacing[4] },
  footer: {
    padding: t.spacing[4],
    paddingTop: t.spacing[3],
    borderTopWidth: t.sizes.fieldBorderWidth,
    borderTopColor: t.colors.borderSubtle,
    backgroundColor: t.colors.surface,
    gap: t.spacing[2],
  },
  brand: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  kv: { gap: 2 },
  kvLabel: { fontSize: t.fontSize.xs, color: t.colors.textMuted, textTransform: "uppercase", letterSpacing: t.letterSpacing.caps },
  kvValue: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  mono: { fontFamily: t.fontFamily.mono.medium },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[3], paddingVertical: t.spacing[2] },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  rowSubtitle: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
}));

