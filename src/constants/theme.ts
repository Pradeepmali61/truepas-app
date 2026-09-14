/**
 * Compatibility shim — re-exports the legacy `Colors`, `Gradients`, `Radius`,
 * `Typography`, `Elevation`, `Spacing`, `Neumorphism`, `FontFamily`,
 * `BottomTabInset`, `getNeuBoxShadow` vocabulary, derived from the new
 * token-based theme system's default light theme.
 *
 * New code should use `useThemeTokens()` / `makeStyles()` from `@/theme`.
 */
import { buildTheme } from "@/theme";
import { BRAND_PRESETS } from "@/theme/palette";
import { Platform } from "react-native";

const THEME = buildTheme("light", BRAND_PRESETS.blue);
const C = THEME.colors;

export const Colors = {
  primary: C.actionPrimary,
  primaryPressed: C.actionPrimaryPressed,
  primaryDark: C.actionPrimaryPressed,
  primaryLight: C.accent,
  surface: C.actionPrimarySubtle,
  surfaceAlt: C.actionPrimarySubtlePressed,
  surfaceElevated: C.surfaceRaised,
  bgWhite: C.surface,
  bg: C.background,
  bgYellow: C.warningSubtle,
  bgGray: C.surfaceSunken,
  bgDanger: C.errorSubtle,
  bgSuccess: C.successSubtle,
  text: C.textPrimary,
  ink: C.textPrimary,
  textPrimary: C.textPrimary,
  textSecondary: C.textSecondary,
  textMuted: C.textMuted,
  textDisabled: C.textDisabled,
  textFaint: C.textMuted,
  border: C.border,
  borderLight: C.borderSubtle,
  borderInput: C.border,
  divider: C.borderSubtle,
  pending: C.warning,
  warning: C.warning,
  warnText: C.warning,
  error: C.error,
  errorBg: C.errorSubtle,
  success: C.success,
  successBg: C.successSubtle,
  successDark: C.success,
  successMid: C.success,
  info: C.info,
  infoBg: C.infoSubtle,
  warningBg: C.warningSubtle,
  avatarBg: C.textMuted,
} as const;

export const Gradients = {
  brand: [C.actionPrimary, C.accent] as const,
  welcome: [C.accent, C.actionPrimary, C.actionPrimaryPressed] as const,
  identityCard: [C.actionPrimaryPressed, C.actionPrimaryPressed] as const,
  historyThumb: [C.accent, C.actionPrimaryPressed] as const,
};

export const Radius = {
  card: THEME.radii["2xl"],
  btn: THEME.radii.lg,
  input: THEME.radii.md,
  chip: THEME.radii.md,
  pill: THEME.radii.sm,
  sheet: THEME.radii.xl,
  welcome: 32,
} as const;

export const Typography = {
  caption: { size: THEME.fontSize.xs, weight: "400" as const },
  bodySmall: { size: THEME.fontSize.sm, weight: "400" as const },
  body: { size: THEME.fontSize.md, weight: "400" as const },
  bodyLarge: { size: THEME.fontSize.lg, weight: "600" as const },
  headingSmall: { size: THEME.fontSize.xl, weight: "700" as const },
  heading: { size: THEME.fontSize["2xl"], weight: "700" as const },
  headingLarge: { size: THEME.fontSize["3xl"], weight: "700" as const },
  display: { size: THEME.fontSize["4xl"], weight: "700" as const },
  label: { size: THEME.fontSize.base, weight: "500" as const },
  inputError: { size: THEME.fontSize.xs, weight: "500" as const },
  link: { size: THEME.fontSize.md, weight: "600" as const },
  linkSmall: { size: THEME.fontSize.base, weight: "500" as const },
  otp: { size: THEME.fontSize["2xl"], weight: "700" as const },
  screenSubtitle: { size: THEME.fontSize.md, weight: "400" as const },
  cardSubtitle: { size: THEME.fontSize.base, weight: "400" as const },
} as const;

export const Elevation = {
  none: { elevation: 0, shadowColor: "transparent", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  small: { elevation: 1, shadowColor: "#030712", shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  medium: { elevation: 3, shadowColor: "#030712", shadowOpacity: 0.09, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  large: { elevation: 8, shadowColor: "#030712", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  floating: { elevation: 16, shadowColor: "#030712", shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
} as const;

export const Spacing = {
  xs: THEME.spacing["1"],
  sm: THEME.spacing["2"],
  md: THEME.spacing["3"],
  lg: THEME.spacing["4"],
  xl: THEME.spacing["5"],
  xxl: THEME.spacing["6"],
  xxxl: THEME.spacing["8"],
  huge: THEME.spacing["10"],
  massive: THEME.spacing["12"],
} as const;

function hexToRgb(hex: string) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function adjustBrightness(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const R = clamp(r + (r * percent) / 100);
  const G = clamp(g + (g * percent) / 100);
  const B = clamp(b + (b * percent) / 100);
  return "#" + componentToHex(R) + componentToHex(G) + componentToHex(B);
}

export const Neumorphism = {
  base: Colors.surface,
  light: "#ffffff",
  radius: Radius.card,
  getColors: (base: string = Colors.surface) => ({
    base,
    light: "#ffffff",
    dark: adjustBrightness(base, -22),
    fillStart: adjustBrightness(base, 4),
    fillEnd: adjustBrightness(base, -6),
    pressedStart: adjustBrightness(base, -4),
    pressedEnd: adjustBrightness(base, -14),
  }),
} as const;

export const FontFamily = Platform.select({
  ios: { regular: "Inter", fallback: "System" },
  default: { regular: "Inter", fallback: "sans-serif" },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getNeuBoxShadow(base: string = Colors.surface, inset = false, distance = 6, blur = 12) {
  const colors = Neumorphism.getColors(base);
  const prefix = inset ? "inset " : "";
  return `${prefix}${distance}px ${distance}px ${blur}px ${hexToRgba(colors.dark, 0.35)}, ${prefix}-${distance}px -${distance}px ${blur}px ${hexToRgba(colors.light, 0.85)}`;
}
