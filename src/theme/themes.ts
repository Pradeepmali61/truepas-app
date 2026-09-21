import {
    BRAND_PRESETS,
    COMBO_PRESETS,
    palette,
    type BrandPreset,
    type BrandRamp,
    type ColorRatio,
    type ComboPreset,
    type ComboPresetName,
    type FeedbackOverrides,
    type NeutralTints,
    type PaletteChoice
} from "./palette";
import {
    darkShadows,
    duration,
    fontSize,
    fontWeight,
    iconSize,
    letterSpacing,
    lineHeight,
    opacity,
    radii,
    roundedRadii,
    shadows,
    sizes,
    softDarkShadows,
    softShadows,
    spacing,
    TYPE_PRESETS,
    zIndex,
    type TypePairing,
    type TypePreset
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
  /** Structural surface — app header, nav drawer (the 20% in the ratio rule) */
  chrome: string;
  onChrome: string;
  /** Translucent surface for floating overlays — subtle glass effect */
  glass: string;
  glassBorder: string;
  // secondary (brand) layer — the "30"/"20" in the ratio rule
  brandSubtle: string;
  onBrandSubtle: string;
  accentSubtle: string;
  onAccentSubtle: string;
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

/** Optional extras layered on a brand ramp — combo palettes use all three. */
export interface ColorOptions {
  /** Second hue — drives CTAs or highlights depending on `cta`. Defaults to brand. */
  accent?: BrandRamp;
  /** Tinted neutrals for surfaces — replaces the flat gray defaults. */
  neutral?: NeutralTints;
  /** Color distribution. Default "60-30-10" (full brand layer). */
  ratio?: ColorRatio;
  /** Which hue owns primary actions: "accent" (default) or "brand". */
  cta?: "brand" | "accent";
  /** Reserved hues for verification results (success/error/etc). */
  feedback?: FeedbackOverrides;
}

export function lightColors(brand: BrandRamp, opts: ColorOptions = {}): SemanticColors {
  const { neutral, ratio = "60-30-10" } = opts;
  const accent = opts.accent ?? brand;
  const cta = opts.cta === "brand" ? brand : accent;
  const fb = opts.feedback;
  const sec = ratio === "60-30-10" ? 0.9 : 0.45;
  const secBase = neutral?.sunken ?? palette.gray100;
  const surfBase = neutral?.surface ?? palette.white;
  return {
    actionPrimary: cta.b600,
    actionPrimaryPressed: cta.b700,
    actionPrimarySubtle: cta.b50,
    actionPrimarySubtlePressed: cta.b100,
    // Tinted rather than gray — disabled/brand-light states sit on the same
    // hue family as the palette instead of dropping to neutral gray.
    actionPrimaryDisabled: neutral ? mix(brand.b200, surfBase, 0.5) : palette.gray300,
    onActionPrimary: palette.white,
    actionSecondary: mix(secBase, brand.b100, sec),
    actionSecondaryPressed: mix(secBase, brand.b200, sec),
    actionSecondaryActive: mix(secBase, brand.b200, sec * 1.4),
    onActionSecondary: sec >= 0.6 ? brand.b700 : palette.gray900,
    actionDanger: palette.red600,
    actionDangerPressed: palette.red700,
    actionDangerSubtle: palette.red50,
    onActionDanger: palette.white,
    accent: accent.b500,

    background: neutral?.bg ?? palette.gray50,
    surface: neutral?.surface ?? palette.white,
    surfaceRaised: neutral?.surface ?? palette.white,
    surfaceSunken: neutral?.sunken ?? palette.gray100,
    overlay: alpha(palette.gray950, 0.5),
    scrim: alpha(palette.gray950, 0.4),
    chrome: neutral?.chrome ?? neutral?.surface ?? palette.white,
    onChrome: neutral?.onChrome ?? neutral?.textPrimary ?? palette.gray900,
    glass: alpha(neutral?.surface ?? palette.white, 0.72),
    glassBorder: alpha(neutral?.shadow ?? palette.gray400, 0.25),

    brandSubtle: mix(surfBase, brand.b100, sec),
    onBrandSubtle: brand.b700,
    accentSubtle: mix(surfBase, accent.b100, 0.75),
    onAccentSubtle: accent.b700,

    textPrimary: neutral?.textPrimary ?? palette.gray900,
    textSecondary: neutral?.textSecondary ?? (neutral ? mix(brand.b700, palette.gray600, 0.3) : palette.gray600),
    textMuted: neutral?.textMuted ?? (neutral ? mix(brand.b700, palette.gray500, 0.22) : palette.gray500),
    textDisabled: neutral ? mix(brand.b200, surfBase, 0.45) : palette.gray400,
    textInverse: palette.white,
    textLink: brand.b600,
    textLinkPressed: brand.b700,

    border: neutral?.border ?? (neutral ? mix(neutral.sunken, palette.gray500, 0.68) : palette.gray300),
    borderSubtle: neutral?.borderSubtle ?? (neutral ? mix(neutral.sunken, palette.white, 0.55) : palette.gray200),
    borderStrong: neutral?.borderStrong ?? (neutral ? mix(neutral.sunken, palette.gray500, 0.42) : palette.gray400),
    borderFocus: cta.b600,

    success: fb?.success?.b600 ?? palette.green600,
    successSubtle: fb?.success?.b50 ?? palette.green50,
    onSuccessSubtle: fb?.success?.b700 ?? palette.green700,
    warning: fb?.warning?.b600 ?? palette.amber600,
    warningSubtle: fb?.warning?.b50 ?? palette.amber50,
    onWarningSubtle: fb?.warning?.b700 ?? palette.amber700,
    error: fb?.error?.b600 ?? palette.red600,
    errorSubtle: fb?.error?.b50 ?? palette.red50,
    onErrorSubtle: fb?.error?.b700 ?? palette.red700,
    info: fb?.info?.b600 ?? palette.sky600,
    infoSubtle: fb?.info?.b50 ?? palette.sky50,
    onInfoSubtle: fb?.info?.b700 ?? palette.sky700,
  };
}

export function darkColors(brand: BrandRamp, opts: ColorOptions = {}): SemanticColors {
  const { neutral, ratio = "60-30-10" } = opts;
  const accent = opts.accent ?? brand;
  const cta = opts.cta === "brand" ? brand : accent;
  const fb = opts.feedback;
  const sec = ratio === "60-30-10" ? 0.9 : 0.45;
  const darkSurf = neutral?.darkSurface ?? palette.gray900;
  return {
    actionPrimary: cta.b600,
    actionPrimaryPressed: cta.b700,
    actionPrimarySubtle: alpha(cta.b600, 0.22),
    actionPrimarySubtlePressed: alpha(cta.b600, 0.32),
    actionPrimaryDisabled: neutral ? mix(brand.b700, palette.gray700, 0.35) : palette.gray700,
    onActionPrimary: palette.white,
    actionSecondary: mix(darkSurf, brand.b700, sec * 0.5),
    actionSecondaryPressed: mix(darkSurf, brand.b700, sec * 0.75),
    actionSecondaryActive: mix(darkSurf, brand.b700, sec),
    onActionSecondary: sec >= 0.6 ? brand.b200 : palette.gray100,
    actionDanger: palette.red600,
    actionDangerPressed: palette.red700,
    actionDangerSubtle: alpha(palette.red600, 0.2),
    onActionDanger: palette.white,
    accent: accent.b500,

    background: neutral?.darkBg ?? palette.gray950,
    surface: neutral?.darkSurface ?? palette.gray900,
    surfaceRaised: neutral ? mix(neutral.darkSurface, palette.white, 0.94) : palette.gray800,
    surfaceSunken: neutral?.darkSunken ?? palette.gray950,
    overlay: alpha(palette.black, 0.65),
    scrim: alpha(palette.black, 0.55),
    chrome: neutral?.darkSunken ?? palette.gray950,
    onChrome: palette.gray50,
    glass: alpha(neutral?.darkSurface ?? palette.gray900, 0.7),
    glassBorder: alpha(palette.white, 0.12),

    brandSubtle: mix(darkSurf, brand.b700, sec * 0.55),
    onBrandSubtle: brand.b200,
    accentSubtle: alpha(accent.b600, 0.22),
    onAccentSubtle: accent.b200,

    textPrimary: palette.gray50,
    textSecondary: palette.gray300,
    textMuted: neutral ? mix(brand.b200, palette.gray400, 0.25) : palette.gray400,
    textDisabled: neutral ? mix(brand.b700, palette.gray600, 0.3) : palette.gray600,
    textInverse: palette.gray900,
    textLink: brand.b500,
    textLinkPressed: brand.b200,

    border: neutral ? mix(neutral.darkSurface, palette.white, 0.84) : palette.gray700,
    borderSubtle: neutral ? mix(neutral.darkSurface, palette.white, 0.91) : palette.gray800,
    borderStrong: neutral ? mix(neutral.darkSurface, palette.white, 0.68) : palette.gray500,
    borderFocus: cta.b500,

    success: fb?.success?.b600 ?? palette.green600,
    successSubtle: alpha(fb?.success?.b600 ?? palette.green600, 0.18),
    onSuccessSubtle: fb?.success?.b200 ?? palette.green300,
    warning: fb?.warning?.b600 ?? palette.amber600,
    warningSubtle: alpha(fb?.warning?.b600 ?? palette.amber600, 0.18),
    onWarningSubtle: fb?.warning?.b200 ?? palette.amber300,
    error: fb?.error?.b600 ?? palette.red600,
    errorSubtle: alpha(fb?.error?.b600 ?? palette.red600, 0.18),
    onErrorSubtle: fb?.error?.b200 ?? palette.red300,
    info: fb?.info?.b600 ?? palette.sky600,
    infoSubtle: alpha(fb?.info?.b600 ?? palette.sky600, 0.18),
    onInfoSubtle: fb?.info?.b200 ?? palette.sky300,
  };
}

/** The object every component consumes via useTheme(). */
export interface Theme {
  scheme: "light" | "dark";
  brand: BrandRamp;
  /** The resolved combo when `palette` is a ComboPresetName, else null. */
  combo: ComboPreset | null;
  ratio: ColorRatio;
  typeface: TypePreset;
  colors: SemanticColors;
  spacing: typeof spacing;
  radii: typeof radii;
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
  fontWeight: typeof fontWeight;
  letterSpacing: typeof letterSpacing;
  fontFamily: TypePairing;
  sizes: typeof sizes;
  iconSize: typeof iconSize;
  shadows: typeof shadows;
  duration: typeof duration;
  zIndex: typeof zIndex;
  opacity: typeof opacity;
}

export interface BuildThemeOptions {
  ratio?: ColorRatio;
  typeface?: TypePreset;
}

/**
 * `palette` accepts a BrandRamp (raw), a BrandPreset ("blue"), or a
 * ComboPresetName ("violetLedger" | "trustBlue" | "violetCyan" …). Combos add
 * tinted neutrals, soft shadows and rounder radii; `ratio` controls how
 * strongly the secondary (brand) layer shows — "60-30-10" full, "70-20-10"
 * restrained. The accent always owns CTAs.
 */
export function buildTheme(
  scheme: "light" | "dark",
  paletteChoice: BrandRamp | PaletteChoice = "blue",
  opts: BuildThemeOptions = {},
): Theme {
  const typeface = opts.typeface ?? "inter";

  let brand: BrandRamp;
  let combo: ComboPreset | null = null;
  if (typeof paletteChoice === "string" && paletteChoice in COMBO_PRESETS) {
    combo = COMBO_PRESETS[paletteChoice as ComboPresetName];
    brand = combo.brand;
  } else if (typeof paletteChoice === "string") {
    brand = BRAND_PRESETS[paletteChoice as BrandPreset];
  } else {
    brand = paletteChoice;
  }

  const ratio = opts.ratio ?? combo?.defaultRatio ?? "60-30-10";
  const colorOpts: ColorOptions | undefined = combo
    ? { accent: combo.accent, neutral: combo.neutral, ratio, cta: combo.cta, feedback: combo.feedback }
    : { ratio };

  return {
    scheme,
    brand,
    combo,
    ratio,
    typeface,
    colors: scheme === "dark" ? darkColors(brand, colorOpts) : lightColors(brand, colorOpts),
    spacing,
    radii: combo ? roundedRadii : radii,
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
    fontFamily: TYPE_PRESETS[typeface],
    sizes,
    iconSize,
    shadows: combo
      ? scheme === "dark"
        ? softDarkShadows
        : softShadows(combo.neutral.shadow)
      : scheme === "dark"
        ? darkShadows
        : shadows,
    duration,
    zIndex,
    opacity,
  };
}
