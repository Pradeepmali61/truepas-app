/**
 * TRUEPAS UI NATIVE — PALETTE (layer 1)
 * Raw values only. Components must never import this — they consume the
 * semantic map in themes.ts via useTheme().
 */

export const palette = {
  white: "#ffffff",
  black: "#000000",

  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  gray950: "#030712",

  green50: "#f0fdf4",
  green100: "#dcfce7",
  green300: "#86efac",
  green600: "#16a34a",
  green700: "#15803d",

  amber50: "#fffbeb",
  amber100: "#fef3c7",
  amber300: "#fcd34d",
  amber600: "#d97706",
  amber700: "#b45309",

  red50: "#fef2f2",
  red100: "#fee2e2",
  red300: "#fca5a5",
  red600: "#dc2626",
  red700: "#b91c1c",

  sky50: "#f0f9ff",
  sky100: "#e0f2fe",
  sky300: "#7dd3fc",
  sky600: "#0284c7",
  sky700: "#0369a1",
} as const;

/** A 6-step brand ramp. Swap presets to rebrand the whole app. */
export interface BrandRamp {
  b50: string;
  b100: string;
  b200: string;
  b500: string;
  b600: string;
  b700: string;
}

export const BRAND_PRESETS = {
  blue: { b50: "#eff6ff", b100: "#dbeafe", b200: "#bfdbfe", b500: "#3b82f6", b600: "#2563eb", b700: "#1d4ed8" },
  violet: { b50: "#f5f3ff", b100: "#ede9fe", b200: "#ddd6fe", b500: "#8b5cf6", b600: "#7c3aed", b700: "#6d28d9" },
  emerald: { b50: "#ecfdf5", b100: "#d1fae5", b200: "#a7f3d0", b500: "#10b981", b600: "#059669", b700: "#047857" },
  orange: { b50: "#fff7ed", b100: "#ffedd5", b200: "#fed7aa", b500: "#f97316", b600: "#ea580c", b700: "#c2410c" },
  rose: { b50: "#fff1f2", b100: "#ffe4e6", b200: "#fecdd3", b500: "#f43f5e", b600: "#e11d48", b700: "#be123c" },
  slate: { b50: "#f8fafc", b100: "#f1f5f9", b200: "#e2e8f0", b500: "#64748b", b600: "#475569", b700: "#334155" },
} as const satisfies Record<string, BrandRamp>;

export type BrandPreset = keyof typeof BRAND_PRESETS;

/** Tinted neutrals — the 60% layer. Gives surfaces a hue instead of flat gray. */
export interface NeutralTints {
  bg: string;
  surface: string;
  sunken: string;
  darkBg: string;
  darkSurface: string;
  darkSunken: string;
  /** Base for soft-UI shadows — a deep, desaturated relative of the brand hue */
  shadow: string;
  /** Optional text overrides (e.g. midnight navy instead of near-black) */
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  /**
   * Optional hairline overrides — lets a palette use tinted borders instead of
   * the default neutral-gray derivation.
   */
  border?: string;
  borderSubtle?: string;
  borderStrong?: string;
  /**
   * Optional chrome surface — the structural 20%: app header, nav drawer.
   * Defaults to `surface` (light) / `darkSunken` (dark) when unset.
   */
  chrome?: string;
  onChrome?: string;
}

/**
 * Feedback-hue overrides for palettes that reserve specific hues for
 * verification results (e.g. emerald = verified only, red = failed only).
 * Each is a ramp; b600/b700 drive the semantic tokens.
 */
export interface FeedbackOverrides {
  success?: BrandRamp;
  warning?: BrandRamp;
  error?: BrandRamp;
  info?: BrandRamp;
}

/** A 2–3 hue palette: brand (structure) + accent + tinted neutrals. */
export interface ComboPreset {
  brand: BrandRamp;
  accent: BrandRamp;
  neutral: NeutralTints;
  feedback?: FeedbackOverrides;
  /**
   * Which hue owns primary actions. "accent" = pop-color CTAs (6:3:1 style);
   * "brand" = brand CTAs with accent reserved for highlights (e.g. cyan for
   * AI features only). Default "accent".
   */
  cta?: "brand" | "accent";
  /** The distribution this palette was designed for — applied on select. */
  defaultRatio?: ColorRatio;
}

export const COMBO_PRESETS = {
  /** Sapphire + Amber — banking trust with warm, high-energy CTAs. */
  trustBlue: {
    brand: BRAND_PRESETS.blue,
    accent: { b50: "#fffaeb", b100: "#fef0c7", b200: "#fedf89", b500: "#f79009", b600: "#dc6803", b700: "#b54708" },
    neutral: {
      bg: "#edf1f9", surface: "#f9fbfe", sunken: "#dfe7f3",
      darkBg: "#0b1120", darkSurface: "#141c30", darkSunken: "#070b14",
      shadow: "#42547a",
      chrome: "#f9fbfe", onChrome: "#1e3a8a",
    },
  },
  /** Violet + Cyan — biometric/security tech. Violet structure, cyan CTAs. */
  violetCyan: {
    brand: { b50: "#f1efff", b100: "#e3dfff", b200: "#c9c1ff", b500: "#7c5cff", b600: "#6439f5", b700: "#5128d6" },
    accent: { b50: "#ecfeff", b100: "#cffafe", b200: "#a5f3fc", b500: "#06b6d4", b600: "#0891b2", b700: "#0e7490" },
    neutral: {
      bg: "#f0eefb", surface: "#faf9fe", sunken: "#e3dff5",
      darkBg: "#12101f", darkSurface: "#1c1930", darkSunken: "#0b0916",
      shadow: "#565180",
      chrome: "#faf9fe", onChrome: "#5128d6",
    },
  },
  /** Navy + Emerald — premium money. Deep navy structure, emerald CTAs, warm paper neutrals. */
  navyEmerald: {
    brand: { b50: "#eef4fc", b100: "#d9e6f7", b200: "#b2cdec", b500: "#33609e", b600: "#1e3a8a", b700: "#172e6e" },
    accent: BRAND_PRESETS.emerald,
    neutral: {
      bg: "#f2f0ec", surface: "#faf9f7", sunken: "#e8e4de",
      darkBg: "#15130f", darkSurface: "#211d18", darkSunken: "#0c0a08",
      shadow: "#6e6553",
      chrome: "#faf9f7", onChrome: "#172e6e",
    },
  },
  /**
   * Trust & Security — 60:20:15:3:2. Soft white base, midnight-navy text,
   * royal-blue actions; emerald/red strictly reserved for verification results.
   * Recommended default for an enterprise authentication product.
   */
  trustSecurity: {
    brand: BRAND_PRESETS.blue,
    accent: BRAND_PRESETS.blue,
    cta: "brand",
    defaultRatio: "70-20-10",
    neutral: {
      bg: "#f8fafc", surface: "#ffffff", sunken: "#e8edf5",
      darkBg: "#0b1220", darkSurface: "#131c2f", darkSunken: "#060a12",
      shadow: "#3b4d70",
      textPrimary: "#0f172a", textSecondary: "#475569",
      chrome: "#ffffff", onChrome: "#0f172a",
    },
    feedback: {
      success: { b50: "#ecfdf5", b100: "#d1fae5", b200: "#a7f3d0", b500: "#10b981", b600: "#059669", b700: "#047857" },
      error: { b50: "#fef2f2", b100: "#fee2e2", b200: "#fecaca", b500: "#ef4444", b600: "#dc2626", b700: "#b91c1c" },
    },
  },
  /**
   * Premium AI — 55:20:15:7:2:1. Pure-white base, deep-navy text, indigo
   * actions, cyan reserved for AI/technology highlights.
   */
  premiumAI: {
    brand: { b50: "#eef2ff", b100: "#e0e7ff", b200: "#c7d2fe", b500: "#6366f1", b600: "#4f46e5", b700: "#4338ca" },
    accent: { b50: "#ecfeff", b100: "#cffafe", b200: "#a5f3fc", b500: "#06b6d4", b600: "#0891b2", b700: "#0e7490" },
    cta: "brand",
    defaultRatio: "70-20-10",
    neutral: {
      bg: "#ffffff", surface: "#fbfbfd", sunken: "#e9ecf5",
      darkBg: "#0d1117", darkSurface: "#161c2a", darkSunken: "#080b10",
      shadow: "#3d4460",
      textPrimary: "#111827", textSecondary: "#4b5563",
      chrome: "#ffffff", onChrome: "#111827",
    },
    feedback: {
      success: { b50: "#ecfdf5", b100: "#d1fae5", b200: "#a7f3d0", b500: "#10b981", b600: "#059669", b700: "#047857" },
      error: { b50: "#fef2f2", b100: "#fee2e2", b200: "#fecaca", b500: "#ef4444", b600: "#dc2626", b700: "#b91c1c" },
    },
  },
  /**
   * Violet Ledger — lavender fintech dashboard. Purple owns every action,
   * selected state, link and metric; deep blue-purple replaces black text;
   * tinted hairlines replace gray borders; green/amber/red stay muted and
   * semantic only. Implements the "lavender surfaces + violet accent" spec.
   */
  violetLedger: {
    brand: { b50: "#e8e3ff", b100: "#ddd5ff", b200: "#c3b4ff", b500: "#8b6cff", b600: "#5b2ff4", b700: "#4320cf" },
    accent: { b50: "#e8e3ff", b100: "#ddd5ff", b200: "#c3b4ff", b500: "#8b6cff", b600: "#5b2ff4", b700: "#4320cf" },
    cta: "brand",
    defaultRatio: "60-30-10",
    neutral: {
      bg: "#f0f0ff", surface: "#f8f7ff", sunken: "#e8e3ff",
      darkBg: "#12102a", darkSurface: "#1b1840", darkSunken: "#0c0a1c",
      shadow: "#6b5bd6",
      textPrimary: "#182044", textSecondary: "#737993", textMuted: "#9da2b8",
      border: "#e2dcfb", borderSubtle: "#ece8fd", borderStrong: "#cfc4f8",
      chrome: "#f8f7ff", onChrome: "#182044",
    },
    feedback: {
      success: { b50: "#d9f1df", b100: "#c2e8cb", b200: "#a5dcb4", b500: "#35935c", b600: "#28754a", b700: "#1f5c3a" },
      warning: { b50: "#fff0c9", b100: "#ffe6a8", b200: "#ffd97d", b500: "#a97710", b600: "#93640b", b700: "#754e08" },
      error: { b50: "#ffe0e2", b100: "#ffc9cd", b200: "#ffaeb4", b500: "#b8484f", b600: "#a63d49", b700: "#87303a" },
    },
  },
} as const satisfies Record<string, ComboPreset>;

export type ComboPresetName = keyof typeof COMBO_PRESETS;

/** Any selectable palette: a curated combo or a single classic brand ramp. */
export type PaletteChoice = BrandPreset | ComboPresetName;

/**
 * Color distribution modes (interior-design rule applied to UI).
 *  "60-30-10": neutral base + strong brand layer + accent reserved for CTAs.
 *  "70-20-10": neutral base + restrained brand layer + accent reserved for CTAs.
 * The accent always owns primary actions; the ratio controls how much the
 * secondary (brand) layer shows in chips, tabs, secondary buttons, badges.
 */
export type ColorRatio = "60-30-10" | "70-20-10";
