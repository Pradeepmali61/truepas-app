import { Text, View } from "react-native";
import { makeStyles, useTheme, useThemeTokens } from "@/theme";
import { Typography } from "@/components/ui/Typography";
import { Divider } from "@/components/ui/Divider";
import { ShowcasePage, Section } from "../demos";

const SEMANTIC = [
  "actionPrimary", "actionSecondary", "actionDanger", "accent",
  "background", "surface", "surfaceRaised", "surfaceSunken",
  "textPrimary", "textSecondary", "textMuted",
  "border", "borderFocus",
  "success", "warning", "error", "info",
] as const;

export function FoundationsSection() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const { scheme } = useTheme();

  return (
    <ShowcasePage>
      <Section title="Semantic colors">
        <Text style={styles.hint}>scheme: {scheme} â€” these resolve per-theme</Text>
        <View style={styles.swatches}>
          {SEMANTIC.map((key) => (
            <View key={key} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: theme.colors[key] }]} />
              <Text style={styles.swatchLabel} numberOfLines={1}>{key}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Brand ramp">
        <View style={styles.swatches}>
          {(["b50", "b100", "b200", "b500", "b600", "b700"] as const).map((k) => (
            <View key={k} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: theme.brand[k] }]} />
              <Text style={styles.swatchLabel}>{k}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography scale">
        {(["display", "h1", "h2", "h3", "h4", "body-lg", "body", "body-sm", "caption", "label"] as const).map((v) => (
          <View key={v} style={styles.typeRow}>
            <Typography variant="caption" color="muted" style={styles.typeName}>{v}</Typography>
            <Typography variant={v}>The quick brown fox</Typography>
          </View>
        ))}
      </Section>

      <Section title="Spacing">
        {([1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const).map((k) => (
          <View key={k} style={styles.spaceRow}>
            <Text style={styles.spaceLabel}>space-{k}</Text>
            <View style={[styles.spaceBar, { width: theme.spacing[k] * 4 }]} />
            <Text style={styles.spacePx}>{theme.spacing[k]}px</Text>
          </View>
        ))}
      </Section>

      <Section title="Radius">
        <View style={styles.radiusRow}>
          {(["sm", "md", "lg", "xl", "2xl", "full"] as const).map((r) => (
            <View key={r} style={styles.radiusItem}>
              <View style={[styles.radiusBox, { borderRadius: theme.radii[r] }]} />
              <Text style={styles.swatchLabel}>{r}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Shadows">
        <View style={styles.shadowRow}>
          {(["sm", "md", "lg", "xl"] as const).map((s) => (
            <View key={s} style={styles.shadowItem}>
              <View style={[styles.shadowBox, theme.shadows[s]]} />
              <Text style={styles.swatchLabel}>{s}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Dividers">
        <Divider />
        <Text style={styles.hint}>horizontal (above) Â· vertical (below)</Text>
        <View style={styles.verticalDemo}>
          <Typography variant="body-sm">Left</Typography>
          <Divider orientation="vertical" />
          <Typography variant="body-sm">Right</Typography>
        </View>
      </Section>
    </ShowcasePage>
  );
}

const useStyles = makeStyles((t) => ({
  hint: { fontSize: t.fontSize.sm, color: t.colors.textMuted },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[3] },
  swatchItem: { width: 72, gap: t.spacing[1], alignItems: "center" },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: t.radii.md,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
  },
  swatchLabel: { fontSize: 10, color: t.colors.textMuted, textAlign: "center" },
  typeRow: { gap: t.spacing[1], paddingVertical: t.spacing[1], borderBottomWidth: 1, borderBottomColor: t.colors.borderSubtle },
  typeName: {},
  spaceRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  spaceLabel: { width: 64, fontSize: t.fontSize.xs, color: t.colors.textMuted, fontVariant: ["tabular-nums"] },
  spaceBar: { height: 12, backgroundColor: t.colors.actionPrimarySubtle, borderRadius: 2 },
  spacePx: { fontSize: t.fontSize.xs, color: t.colors.textMuted },
  radiusRow: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[4] },
  radiusItem: { alignItems: "center", gap: t.spacing[1] },
  radiusBox: {
    width: 56,
    height: 40,
    borderWidth: 2,
    borderColor: t.colors.actionPrimary,
    backgroundColor: t.colors.actionPrimarySubtle,
  },
  shadowRow: { flexDirection: "row", gap: t.spacing[4] },
  shadowItem: { alignItems: "center", gap: t.spacing[1] },
  shadowBox: { width: 56, height: 56, borderRadius: t.radii.lg, backgroundColor: t.colors.surface },
  verticalDemo: { flexDirection: "row", gap: t.spacing[3], height: 24, alignItems: "center" },
}));

