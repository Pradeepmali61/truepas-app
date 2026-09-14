import { useState } from "react";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { ScanFace } from "lucide-react-native";
import { makeStyles, useTheme, useThemeTokens, type DeepPartial, type Theme } from "@/theme";
import { Typography } from "@/components/ui/Typography";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { iconSize } from "@/theme/tokens";
import { BRAND_PRESETS, type BrandPreset } from "@/theme/palette";

import { FoundationsSection } from "./sections/FoundationsSection";
import { ControlsSection } from "./sections/ControlsSection";
import { FieldsSection } from "./sections/FieldsSection";
import { FeedbackSection } from "./sections/FeedbackSection";
import { OverlaysSection } from "./sections/OverlaysSection";
import { DataSection } from "./sections/DataSection";
import { ChromeSection } from "./sections/ChromeSection";
import { ScreensSection } from "./sections/ScreensSection";

const SECTIONS = [
  { key: "foundations", label: "Foundations", desc: "Colors, type, spacing, radius, shadows", C: FoundationsSection },
  { key: "controls", label: "Buttons & indicators", desc: "Button, IconButton, Link, Badge, Avatar…", C: ControlsSection },
  { key: "fields", label: "Form fields", desc: "Input, Select, Checkbox, OtpInput, DatePicker…", C: FieldsSection },
  { key: "feedback", label: "Feedback & states", desc: "Alert, Toast, Empty/Error/Loading", C: FeedbackSection },
  { key: "overlays", label: "Overlays", desc: "Modal, BottomSheet, ActionSheet", C: OverlaysSection },
  { key: "data", label: "Data display", desc: "Card, Tabs, Accordion, DataList, filters…", C: DataSection },
  { key: "chrome", label: "App chrome & complex", desc: "Header, Drawer, DashboardCard, MultiStepForm…", C: ChromeSection },
  { key: "screens", label: "App screens (API reference)", desc: "Static mockups for every customer BFF endpoint", C: ScreensSection },
] as const;

const RADIUS_OPTIONS = [
  { value: "default", label: "Default radius" },
  { value: "sharp", label: "Sharp (0)" },
  { value: "rounded", label: "Rounded" },
];

const RADIUS_TOKENS: Record<string, DeepPartial<Theme>> = {
  default: {},
  sharp: { radii: { sm: 0, md: 0, lg: 0, xl: 0, "2xl": 0 } },
  rounded: { radii: { sm: 6, md: 8, lg: 12, xl: 16, "2xl": 20 } },
};

function ThemeStudio({ radius, onRadius }: { radius: string; onRadius: (v: string) => void }) {
  const styles = useStyles();
  const { scheme, setScheme, brand, setBrand } = useTheme();
  return (
    <View style={styles.studio}>
      <Typography variant="label" color="muted">Live theme</Typography>
      <View style={styles.brandRow}>
        {(Object.keys(BRAND_PRESETS) as BrandPreset[]).map((b) => (
          <Pressable
            key={b}
            accessibilityLabel={`Brand color ${b}`}
            onPress={() => setBrand(b)}
            style={[styles.swatch, { backgroundColor: BRAND_PRESETS[b].b600 }, b === brand && styles.swatchActive]}
          />
        ))}
      </View>
      <View style={styles.studioRow}>
        <View style={styles.grow}>
          <Select
            options={RADIUS_OPTIONS}
            value={radius}
            onValueChange={onRadius}
            size="sm"
            accessibilityLabel="Radius preset"
          />
        </View>
        <Switch
          value={scheme === "dark"}
          onValueChange={(v) => setScheme(v ? "dark" : "light")}
          label={scheme === "dark" ? "Dark" : "Light"}
        />
      </View>
    </View>
  );
}

function Menu({ onOpen, radius, onRadius }: { onOpen: (k: string) => void; radius: string; onRadius: (v: string) => void }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.hero}>
        <ScanFace size={iconSize.xl} color={theme.colors.actionPrimary} />
        <Typography variant="h1">Truepas UI</Typography>
        <Typography variant="body-lg" color="secondary">
          Native component system — tokens → theme → primitives → composites →
          complex. Change the theme controls; every component updates.
        </Typography>
      </View>
      <ThemeStudio radius={radius} onRadius={onRadius} />
      {SECTIONS.map((s) => (
        <Pressable
          key={s.key}
          accessibilityRole="button"
          onPress={() => onOpen(s.key)}
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
        >
          <View style={styles.menuText}>
            <Typography variant="h4">{s.label}</Typography>
            <Typography variant="body-sm" color="muted">{s.desc}</Typography>
          </View>
          <Typography variant="h3" color="muted">›</Typography>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Shell({ radius, onRadius }: { radius: string; onRadius: (v: string) => void }) {
  const styles = useStyles();
  const { resolvedScheme } = useTheme();
  const [route, setRoute] = useState<string | null>(null);
  const active = SECTIONS.find((s) => s.key === route);

  return (
    <View style={styles.safe}>
      <StatusBar barStyle={resolvedScheme === "dark" ? "light-content" : "dark-content"} />
      {active ? (
        <>
          <ScreenHeader title={active.label} subtitle="Component showcase" onBack={() => setRoute(null)} />
          <active.C />
        </>
      ) : (
        <Menu onOpen={setRoute} radius={radius} onRadius={onRadius} />
      )}
    </View>
  );
}

export default function DemoUIIndex() {
  const [radius, setRadius] = useState("default");
  return <Shell radius={radius} onRadius={setRadius} />;
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  page: { flex: 1 },
  pageContent: { padding: t.spacing[4], paddingBottom: t.spacing[20], gap: t.spacing[5] },
  hero: { gap: t.spacing[2], paddingVertical: t.spacing[4] },
  studio: {
    gap: t.spacing[3],
    padding: t.spacing[4],
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.surface,
  },
  brandRow: { flexDirection: "row", gap: t.spacing[2], flexWrap: "wrap" },
  swatch: { width: 32, height: 32, borderRadius: t.radii.full },
  swatchActive: { borderWidth: 3, borderColor: t.colors.borderFocus },
  studioRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[4] },
  grow: { flex: 1 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    padding: t.spacing[4],
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.surface,
  },
  menuItemPressed: { backgroundColor: t.colors.actionSecondary },
  menuText: { flex: 1, gap: 2 },
}));
