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
