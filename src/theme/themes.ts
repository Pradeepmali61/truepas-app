import { palette, type BrandRamp, BRAND_PRESETS } from "./palette";
import {
  darkShadows,
  duration,
  fontFamily,
  fontSize,
  fontWeight,
  iconSize,
  letterSpacing,
  lineHeight,
  opacity,
  radii,
  shadows,
  sizes,
  spacing,
  zIndex,
} from "./tokens";

/** Simple color mix (srgb) — the RN equivalent of CSS color-mix(). */
export function mix(hex: string, other: string, weight = 0.5): string {
  const parse = (h: string) => {
    const n = h.replace("#", "");
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(other);
  const f = (a: number, b: number) => Math.round(a * weight + b * (1 - weight));
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(f(r1, r2))}${to(f(g1, g2))}${to(f(b1, b2))}`;
}

/** hex + alpha → rgba() string */
export function alpha(hex: string, a: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface SemanticColors {
  // action
  actionPrimary: string;
  actionPrimaryPressed: string;
  actionPrimarySubtle: string;
  actionPrimarySubtlePressed: string;
  actionPrimaryDisabled: string;
  onActionPrimary: string;
  actionSecondary: string;
  actionSecondaryPressed: string;
  actionSecondaryActive: string;
  onActionSecondary: string;
  actionDanger: string;
  actionDangerPressed: string;
  actionDangerSubtle: string;
  onActionDanger: string;
  accent: string;
  // surfaces
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  overlay: string;
  scrim: string;
  // text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;
  textLink: string;
  textLinkPressed: string;
  // border
  border: string;
  borderSubtle: string;
  borderStrong: string;
  borderFocus: string;
  // feedback
  success: string;
  successSubtle: string;
  onSuccessSubtle: string;
  warning: string;
  warningSubtle: string;
  onWarningSubtle: string;
  error: string;
  errorSubtle: string;
  onErrorSubtle: string;
  info: string;
  infoSubtle: string;
  onInfoSubtle: string;
}

export function lightColors(brand: BrandRamp): SemanticColors {
  return {
    actionPrimary: brand.b600,
    actionPrimaryPressed: brand.b700,
    actionPrimarySubtle: brand.b50,
    actionPrimarySubtlePressed: brand.b100,
    actionPrimaryDisabled: palette.gray300,
    onActionPrimary: palette.white,
    actionSecondary: palette.gray100,
    actionSecondaryPressed: palette.gray200,
    actionSecondaryActive: palette.gray300,
    onActionSecondary: palette.gray900,
    actionDanger: palette.red600,
    actionDangerPressed: palette.red700,
    actionDangerSubtle: palette.red50,
    onActionDanger: palette.white,
    accent: brand.b500,

    background: palette.gray50,
    surface: palette.white,
    surfaceRaised: palette.white,
    surfaceSunken: palette.gray100,
    overlay: alpha(palette.gray950, 0.5),
    scrim: alpha(palette.gray950, 0.4),

    textPrimary: palette.gray900,
    textSecondary: palette.gray600,
    textMuted: palette.gray500,
    textDisabled: palette.gray400,
    textInverse: palette.white,
    textLink: brand.b600,
    textLinkPressed: brand.b700,

    border: palette.gray300,
    borderSubtle: palette.gray200,
    borderStrong: palette.gray400,
    borderFocus: brand.b600,

    success: palette.green600,
    successSubtle: palette.green50,
    onSuccessSubtle: palette.green700,
    warning: palette.amber600,
    warningSubtle: palette.amber50,
    onWarningSubtle: palette.amber700,
    error: palette.red600,
    errorSubtle: palette.red50,
    onErrorSubtle: palette.red700,
    info: palette.sky600,
    infoSubtle: palette.sky50,
    onInfoSubtle: palette.sky700,
  };
}

export function darkColors(brand: BrandRamp): SemanticColors {
  return {
    actionPrimary: brand.b600,
    actionPrimaryPressed: brand.b700,
    actionPrimarySubtle: alpha(brand.b600, 0.22),
    actionPrimarySubtlePressed: alpha(brand.b600, 0.32),
    actionPrimaryDisabled: palette.gray700,
    onActionPrimary: palette.white,
    actionSecondary: palette.gray800,
    actionSecondaryPressed: palette.gray700,
    actionSecondaryActive: palette.gray600,
    onActionSecondary: palette.gray100,
    actionDanger: palette.red600,
    actionDangerPressed: palette.red700,
    actionDangerSubtle: alpha(palette.red600, 0.2),
    onActionDanger: palette.white,
    accent: brand.b500,

    background: palette.gray950,
    surface: palette.gray900,
    surfaceRaised: palette.gray800,
    surfaceSunken: palette.gray950,
    overlay: alpha(palette.black, 0.65),
    scrim: alpha(palette.black, 0.55),

    textPrimary: palette.gray50,
    textSecondary: palette.gray300,
    textMuted: palette.gray400,
    textDisabled: palette.gray600,
    textInverse: palette.gray900,
    textLink: brand.b500,
    textLinkPressed: brand.b200,

    border: palette.gray700,
    borderSubtle: palette.gray800,
    borderStrong: palette.gray500,
    borderFocus: brand.b500,

    success: palette.green600,
    successSubtle: alpha(palette.green600, 0.18),
    onSuccessSubtle: palette.green300,
    warning: palette.amber600,
    warningSubtle: alpha(palette.amber600, 0.18),
    onWarningSubtle: palette.amber300,
    error: palette.red600,
    errorSubtle: alpha(palette.red600, 0.18),
    onErrorSubtle: palette.red300,
    info: palette.sky600,
    infoSubtle: alpha(palette.sky600, 0.18),
    onInfoSubtle: palette.sky300,
  };
}

/** The object every component consumes via useTheme(). */
export interface Theme {
  scheme: "light" | "dark";
  brand: BrandRamp;
  colors: SemanticColors;
  spacing: typeof spacing;
  radii: typeof radii;
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
  fontWeight: typeof fontWeight;
  letterSpacing: typeof letterSpacing;
  fontFamily: typeof fontFamily;
  sizes: typeof sizes;
  iconSize: typeof iconSize;
  shadows: typeof shadows;
  duration: typeof duration;
  zIndex: typeof zIndex;
  opacity: typeof opacity;
}

export function buildTheme(scheme: "light" | "dark", brand: BrandRamp = BRAND_PRESETS.blue): Theme {
  return {
    scheme,
    brand,
    colors: scheme === "dark" ? darkColors(brand) : lightColors(brand),
    spacing,
    radii,
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
    fontFamily,
    sizes,
    iconSize,
    shadows: scheme === "dark" ? darkShadows : shadows,
    duration,
    zIndex,
    opacity,
  };
}
