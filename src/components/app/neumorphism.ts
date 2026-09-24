import { useThemeTokens } from "@/theme";
import { Platform } from "react-native";

/** Neumorphism color helpers — derived from the active theme's surface. */

function hexToRgb(hex: string) {
  const n = hex.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)] as const;
}

function toHex(n: number) {
  return n.toString(16).padStart(2, "0");
}

export function adjust(hex: string, percent: number) {
  const [r, g, b] = hexToRgb(hex);
  // Round before toHex — fractional channels produce "ea.0f5c…" strings,
  // which native color parsers reject (LinearGradient crashes with NPE).
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `#${toHex(clamp(r + (r * percent) / 100))}${toHex(clamp(g + (g * percent) / 100))}${toHex(clamp(b + (b * percent) / 100))}`;
}

function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface NeuColors {
  base: string;
  light: string;
  dark: string;
  fillStart: string;
  fillEnd: string;
  pressedStart: string;
  pressedEnd: string;
}

export function getNeuColors(base: string): NeuColors {
  return {
    base,
    light: "#ffffff",
    dark: adjust(base, -22),
    fillStart: adjust(base, 4),
    fillEnd: adjust(base, -6),
    pressedStart: adjust(base, -4),
    pressedEnd: adjust(base, -14),
  };
}

export function getNeuBoxShadow(base: string, inset = false, distance = 6, blur = 12): string {
  const c = getNeuColors(base);
  const prefix = inset ? "inset " : "";
  return `${prefix}${distance}px ${distance}px ${blur}px ${rgba(c.dark, 0.35)}, ${prefix}-${distance}px -${distance}px ${blur}px ${rgba(c.light, 0.85)}`;
}

/** Hook that returns the neumorphism base color from the theme surface. */
export function useNeuBase(): string {
  const theme = useThemeTokens();
  return theme.colors.surface;
}

export const NEU_RADIUS = 16;

export { Platform };
