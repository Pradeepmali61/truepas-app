/**
 * Compatibility shim — re-exports the new theme system's ThemeProvider
 * and a backward-compatible useTheme() that returns `{ colors, headerGradient }`
 * with the legacy color name vocabulary, derived from the new token-based theme.
 *
 * New code should import useThemeTokens / useTheme from @/theme directly.
 */
import { Gradients } from "@/constants/theme";
import { useTheme as useNewTheme, type Theme } from "@/theme";

export { ThemeProvider } from "@/theme";

/** Legacy color names mapped onto the new SemanticColors. */
interface LegacyColors {
  primary: string;
  primaryPressed: string;
  primaryDark: string;
  primaryLight: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  bgWhite: string;
  bg: string;
  bgYellow: string;
  bgGray: string;
  bgDanger: string;
  bgSuccess: string;
  text: string;
  ink: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textFaint: string;
  border: string;
  borderLight: string;
  borderInput: string;
  divider: string;
  pending: string;
  warning: string;
  warnText: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
  successDark: string;
  successMid: string;
  info: string;
  infoBg: string;
  warningBg: string;
  avatarBg: string;
}

interface CompatTheme {
  colors: LegacyColors;
  headerGradient: readonly [string, string, string];
}

function mapColors(t: Theme): LegacyColors {
  const c = t.colors;
  return {
    primary: c.actionPrimary,
    primaryPressed: c.actionPrimaryPressed,
    primaryDark: c.actionPrimaryPressed,
    primaryLight: c.accent,
    surface: c.actionPrimarySubtle,
    surfaceAlt: c.actionPrimarySubtlePressed,
    surfaceElevated: c.surfaceRaised,
    bgWhite: c.surface,
    bg: c.background,
    bgYellow: c.warningSubtle,
    bgGray: c.surfaceSunken,
    bgDanger: c.errorSubtle,
    bgSuccess: c.successSubtle,
    text: c.textPrimary,
    ink: c.textPrimary,
    textPrimary: c.textPrimary,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
    textDisabled: c.textDisabled,
    textFaint: c.textMuted,
    border: c.border,
    borderLight: c.borderSubtle,
    borderInput: c.border,
    divider: c.borderSubtle,
    pending: c.warning,
    warning: c.warning,
    warnText: c.warning,
    error: c.error,
    errorBg: c.errorSubtle,
    success: c.success,
    successBg: c.successSubtle,
    successDark: c.success,
    successMid: c.success,
    info: c.info,
    infoBg: c.infoSubtle,
    warningBg: c.warningSubtle,
    avatarBg: c.textMuted,
  };
}

export function useTheme(): CompatTheme {
  const { theme } = useNewTheme();
  return {
    colors: mapColors(theme),
    headerGradient: Gradients.welcome,
  };
}
