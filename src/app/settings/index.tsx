/**
 * Appearance — the user-facing theme controls. Mode, palette, color ratio,
 * corner radius and field-label style write to the app's root theme
 * (useTheme setters + useFieldLabelStyle), so every choice applies instantly.
 *
 * Ported 1:1 from UI-design-repo src/app/screens/settings/AppearanceScreen.tsx.
 * Our RadiusPreset set is smaller (sharp/default/round) — three tiles instead
 * of the design's five; everything else is identical.
 */
import { useRouter } from 'expo-router';
import { Check, Moon, Smartphone, Sun, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader, Section, SectionTitle } from '@/components/composite';
import { useFieldLabelStyle, type FieldLabelStyle } from '@/components/composite/FieldLabelStyle';
import { NeuBox, NeuSegmented, NeuWell, Typography } from '@/components/ui';
import {
    BRAND_PRESETS,
    COMBO_PRESETS,
    makeStyles,
    tokens,
    useTheme,
    type BrandPreset,
    type ColorRatio,
    type ColorScheme,
    type ComboPresetName,
    type PaletteChoice,
    type RadiusPreset,
} from '@/theme';

const COMBO_LABELS: Record<ComboPresetName, string> = {
  trustBlue: 'Trust Blue',
  violetCyan: 'Violet Cyan',
  navyEmerald: 'Navy Emerald',
  trustSecurity: 'Trust & Security',
  premiumAI: 'Premium AI',
  violetLedger: 'Violet Ledger',
};

const PALETTES: { value: PaletteChoice; label: string; dots: string[] }[] = [
  ...(Object.keys(COMBO_PRESETS) as ComboPresetName[]).map((c) => ({
    value: c as PaletteChoice,
    label: COMBO_LABELS[c] ?? c,
    dots: [COMBO_PRESETS[c].brand.b600, COMBO_PRESETS[c].accent.b500, COMBO_PRESETS[c].neutral.bg],
  })),
  ...(Object.keys(BRAND_PRESETS) as BrandPreset[]).map((b) => ({
    value: b as PaletteChoice,
    label: `Truepas ${b[0].toUpperCase()}${b.slice(1)}`,
    dots: [BRAND_PRESETS[b].b600, BRAND_PRESETS[b].b500, BRAND_PRESETS[b].b200],
  })),
];

const MODES: { value: ColorScheme; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Smartphone },
];

const RATIOS: { value: ColorRatio; label: string }[] = [
  { value: '60-30-10', label: '6:3:1' },
  { value: '70-20-10', label: '7:2:1' },
];

const RADII: { value: RadiusPreset; label: string }[] = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'default', label: 'Soft' },
  { value: 'round', label: 'Rounded' },
];

const LABEL_STYLES: { value: FieldLabelStyle; label: string }[] = [
  { value: 'stacked', label: 'Stacked' },
  { value: 'overlap', label: 'Overlap' },
];

/** Mirrors ThemeProvider's RADIUS_TOKENS overrides for the tile previews. */
const RADIUS_SHAPES: Record<RadiusPreset, { box?: number; bar?: number }> = {
  sharp: { box: 4, bar: 2 },
  default: {},
  round: { box: 14, bar: 6 },
};

export default function AppearanceScreen() {
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, setScheme, palette, setPalette, ratio, setRatio, radius, setRadius } = useTheme();
  const { labelStyle, setLabelStyle } = useFieldLabelStyle();
  const t = useTheme().theme;
  // Preview shapes mirror the real token merge: palette base radii + the
  // per-preset override, so they never drift from the theme.
  const baseRadii = t.combo ? tokens.roundedRadii : tokens.radii;
  const radiusShape = (key: RadiusPreset) => {
    const over = RADIUS_SHAPES[key];
    return { box: over.box ?? baseRadii.lg, bar: over.bar ?? baseRadii.sm };
  };
  const preview = t.combo
    ? [t.brand.b600, t.combo.accent.b500, t.colors.success, t.colors.error, t.colors.surfaceSunken]
    : [t.brand.b700, t.brand.b600, t.brand.b500, t.brand.b200, t.brand.b100];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScreenHeader title="Appearance" subtitle="Look & feel" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: t.spacing[4],
          paddingTop: t.spacing[4],
          gap: t.spacing[6],
          paddingBottom: t.spacing[8] + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}>
        <NeuBox variant="raised" depth={5} color={t.colors.surface} style={styles.preview}>
          <View style={styles.previewDots}>
            {preview.map((c, i) => (
              <View key={i} style={[styles.previewDot, { backgroundColor: c }]} />
            ))}
          </View>
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>Primary</Text>
          </View>
        </NeuBox>

        <Section>
          <SectionTitle>Mode</SectionTitle>
          <NeuSegmented options={MODES} value={scheme} onChange={setScheme} label="Theme mode" />
        </Section>

        <Section>
          <SectionTitle>Palette</SectionTitle>
          <NeuWell radius={t.radii.xl} style={styles.paletteTrack}>
            {PALETTES.map((p) => {
              const active = p.value === palette;
              return (
                <Pressable
                  key={p.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Palette ${p.label}`}
                  onPress={() => setPalette(p.value)}>
                  {active ? (
                    <NeuBox
                      variant="raised"
                      radius={t.radii.lg}
                      depth={3}
                      color={t.colors.surface}
                      style={styles.paletteRow}>
                      <PaletteRowDots dots={p.dots} />
                      <Text style={styles.paletteLabelActive}>{p.label}</Text>
                      <Check size={t.iconSize.sm} color={t.colors.actionPrimary} />
                    </NeuBox>
                  ) : (
                    <View style={styles.paletteRow}>
                      <PaletteRowDots dots={p.dots} />
                      <Text style={styles.paletteLabel}>{p.label}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </NeuWell>
        </Section>

        <Section>
          <SectionTitle>Color ratio</SectionTitle>
          <NeuSegmented options={RATIOS} value={ratio} onChange={setRatio} label="Color ratio" />
          <Typography variant="caption" color="muted">
            Brand-to-accent distribution. Applies to combo palettes.
          </Typography>
        </Section>

        <Section>
          <SectionTitle>Corner radius</SectionTitle>
          <NeuWell radius={t.radii.xl} style={styles.paletteTrack}>
            <View style={styles.radiusRow}>
              {RADII.map((r) => {
                const active = r.value === radius;
                const shape = radiusShape(r.value);
                const previewTile = (
                  <>
                    <View style={styles.radiusShapes}>
                      <View style={[styles.radiusBox, { borderRadius: shape.box }]} />
                      <View style={[styles.radiusBar, { borderRadius: shape.bar }]} />
                    </View>
                    <Text
                      style={active ? styles.radiusLabelActive : styles.radiusLabel}
                      numberOfLines={1}>
                      {r.label}
                    </Text>
                  </>
                );
                return (
                  <Pressable
                    key={r.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Corner radius ${r.label}`}
                    onPress={() => setRadius(r.value)}
                    style={styles.radiusCell}>
                    {active ? (
                      <NeuBox
                        variant="raised"
                        radius={t.radii.lg}
                        depth={3}
                        color={t.colors.surface}
                        style={styles.radiusTile}>
                        {previewTile}
                        <Check size={t.iconSize.xs} color={t.colors.actionPrimary} />
                      </NeuBox>
                    ) : (
                      <View style={styles.radiusTile}>{previewTile}</View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </NeuWell>
        </Section>

        <Section>
          <SectionTitle>Field labels</SectionTitle>
          <NeuSegmented
            options={LABEL_STYLES}
            value={labelStyle}
            onChange={setLabelStyle}
            label="Field label style"
          />
          <Typography variant="caption" color="muted">
            Stacked places labels above inputs; Overlap rests them on the input&apos;s top edge.
          </Typography>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function PaletteRowDots({ dots }: { dots: string[] }) {
  const styles = useStyles();
  return (
    <View style={styles.paletteDots}>
      {dots.map((c, i) => (
        <View key={i} style={[styles.paletteDot, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: t.spacing[4],
  },
  previewDots: { flexDirection: 'row', gap: t.spacing[2] },
  previewDot: {
    width: 22,
    height: 22,
    borderRadius: t.radii.full,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
  },
  previewPill: {
    paddingHorizontal: t.spacing[4],
    paddingVertical: t.spacing[2],
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
    ...t.shadows.sm,
  },
  previewPillText: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.onActionPrimary,
  },
  paletteTrack: { padding: t.spacing[1], gap: t.spacing[0.5] },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[2],
    borderRadius: t.radii.lg,
    minHeight: 44,
  },
  paletteDots: { flexDirection: 'row' },
  paletteDot: {
    width: 18,
    height: 18,
    borderRadius: t.radii.full,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    marginLeft: -5,
  },
  paletteLabel: {
    flex: 1,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.medium,
    color: t.colors.textMuted,
  },
  paletteLabelActive: {
    flex: 1,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textPrimary,
  },
  radiusRow: { flexDirection: 'row' },
  radiusCell: { flex: 1 },
  radiusTile: {
    alignItems: 'center',
    gap: t.spacing[1.5],
    paddingVertical: t.spacing[3],
    paddingHorizontal: t.spacing[1],
    borderRadius: t.radii.lg,
  },
  radiusShapes: { alignItems: 'center', gap: t.spacing[2] },
  radiusBox: {
    width: 26,
    height: 26,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderStrong,
    backgroundColor: t.colors.surface,
  },
  radiusBar: { width: 32, height: 10, backgroundColor: t.colors.actionPrimary },
  radiusLabel: { fontSize: t.fontSize.xs, fontWeight: t.fontWeight.medium, color: t.colors.textMuted },
  radiusLabelActive: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textPrimary,
  },
}));
