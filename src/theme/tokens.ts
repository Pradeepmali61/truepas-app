import type { TextStyle, ViewStyle } from "react-native";

/**
 * TRUEPAS UI NATIVE — DESIGN TOKENS (layer 2: non-color scales)
 * Same scales as the web system (truepas-ui). Values are numbers —
 * React Native consumes dp, not CSS lengths. Value types are widened
 * (number/weight union) so ThemeProvider `tokens` overrides accept any value.
 */

export const spacing: Record<
  "0" | "0.5" | "1" | "1.5" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16" | "20",
  number
> = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

export const radii: Record<"none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full", number> = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  full: 9999,
};

/** Softer scale used by combo palettes (soft-UI — cards land in 16–24px). */
export const roundedRadii: typeof radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  "2xl": 28,
  full: 9999,
};

export const fontSize: Record<
  "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
  number
> = {
  xs: 13,
  sm: 14,
  base: 16,
  md: 17,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

export const lineHeight: Record<"tight" | "snug" | "normal" | "relaxed", number> = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
};

export const fontWeight: Record<
  "regular" | "medium" | "semibold" | "bold",
  NonNullable<TextStyle["fontWeight"]>
> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export const letterSpacing: Record<"tight" | "normal" | "wide" | "caps", number> = {
  tight: -0.16,
  normal: 0,
  wide: 0.3,
  caps: 0.9,
};

type FontWeights = Record<"regular" | "medium" | "semibold" | "bold", string>;

/**
 * A typography pairing — sans (UI body), display (headings), mono (codes,
 * amounts, IDs). One family per weight so iOS/Android resolve the exact
 * face. Families must be registered at runtime — see useTruepasFonts().
 */
export interface TypePairing {
  sans: FontWeights;
  display: FontWeights;
  mono: FontWeights;
}

const INTER: FontWeights = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

const JAKARTA: FontWeights = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

const SPACE_GROTESK: FontWeights = {
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  semibold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
};

const JETBRAINS_MONO: FontWeights = {
  regular: "JetBrainsMono_400Regular",
  medium: "JetBrainsMono_500Medium",
  semibold: "JetBrainsMono_600SemiBold",
  bold: "JetBrainsMono_700Bold",
};

/**
 * Typeface presets — switch the whole app's voice in one token.
 *  inter:   Inter everywhere — neutral, utilitarian (default).
 *  jakarta: Plus Jakarta Sans everywhere — geometric, modern fintech.
 *  grotesk: Space Grotesk headings + Inter body — editorial contrast.
 */
export const TYPE_PRESETS: Record<"inter" | "jakarta" | "grotesk", TypePairing> = {
  inter: { sans: INTER, display: INTER, mono: JETBRAINS_MONO },
  jakarta: { sans: JAKARTA, display: JAKARTA, mono: JETBRAINS_MONO },
  grotesk: { sans: INTER, display: SPACE_GROTESK, mono: JETBRAINS_MONO },
};

export type TypePreset = keyof typeof TYPE_PRESETS;

export const fontFamily: TypePairing = TYPE_PRESETS.inter;

/** Component metrics — heights in dp */
export const sizes: Record<
  | "heightXs"
  | "heightSm"
  | "heightMd"
  | "heightLg"
  | "touchTarget"
  | "controlPaddingXSm"
  | "controlPaddingXMd"
  | "controlPaddingXLg"
  | "cardPadding"
  | "sidebarWidth"
  | "headerHeight"
  | "fieldBorderWidth"
  | "labelGap"
  | "screenGutter"
  | "sectionGap"
  | "fieldGap",
  number
> = {
  heightXs: 30,
  heightSm: 42,
  heightMd: 54,
  heightLg: 58,
  touchTarget: 48,
  controlPaddingXSm: 12,
  controlPaddingXMd: 16,
  controlPaddingXLg: 20,
  cardPadding: 24,
  sidebarWidth: 256,
  headerHeight: 56,
  fieldBorderWidth: 1,
  labelGap: 8,
  /**
   * Layout rhythm — the only three spacing values a screen may use:
   * one horizontal gutter, 24 between logical sections, 16 inside a section
   * (between fields/tiles), 8 between a label and its control.
   */
  screenGutter: 16,
  sectionGap: 24,
  fieldGap: 16,
};

export const iconSize: Record<"xs" | "sm" | "md" | "lg" | "xl", number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

type ShadowKey = "none" | "sm" | "md" | "lg" | "xl";

/** Elevation presets — iOS shadows + Android elevation in one object */
export const shadows: Record<ShadowKey, ViewStyle> = {
  none: {},
  sm: {
    shadowColor: "#030712",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: "#030712",
    shadowOpacity: 0.09,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  lg: {
    shadowColor: "#030712",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  xl: {
    shadowColor: "#030712",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
};

/** Dark variants (applied via theme.shadows — see themes.ts) */
export const darkShadows: Record<ShadowKey, ViewStyle> = {
  none: {},
  sm: { shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  md: { shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  lg: { shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  xl: { shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
};

/**
 * Soft-UI shadows — long, diffuse, tinted with the palette's neutral shadow
 * hue (the neumorphic look from the design references). `tint` should be a
 * deep desaturated relative of the brand hue, e.g. NeutralTints.shadow.
 */
export function softShadows(tint: string): Record<ShadowKey, ViewStyle> {
  return {
    none: {},
    sm: { shadowColor: tint, shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    md: { shadowColor: tint, shadowOpacity: 0.11, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
    lg: { shadowColor: tint, shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 7 },
    xl: { shadowColor: tint, shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  };
}

export const softDarkShadows: Record<ShadowKey, ViewStyle> = {
  none: {},
  sm: { shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  md: { shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  lg: { shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 26, shadowOffset: { width: 0, height: 13 }, elevation: 9 },
  xl: { shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 20 }, elevation: 16 },
};

export const duration: Record<"instant" | "fast" | "normal" | "slow", number> = {
  instant: 75,
  fast: 120,
  normal: 200,
  slow: 320,
};

export const zIndex: Record<
  "base" | "sticky" | "header" | "drawer" | "modal" | "popover" | "toast",
  number
> = {
  base: 0,
  sticky: 100,
  header: 200,
  drawer: 400,
  modal: 500,
  popover: 600,
  toast: 800,
};

export const opacity: Record<"disabled" | "muted" | "overlay" | "pressed", number> = {
  disabled: 0.5,
  muted: 0.7,
  overlay: 0.5,
  pressed: 0.85,
};
