/**
 * Truepas design tokens — extracted 1:1 from the pixel-perfect mockups
 * (Truepas-figma/styles.css, FacePe design system / NewDesignSystem.ts).
 */

import { Platform } from 'react-native';

export const Colors = {
  primary: '#08B6FC',
  primaryPressed: '#0692ca',
  primaryDark: '#034965',
  primaryLight: '#84dbfe',
  surface: '#e6f8ff',
  surfaceAlt: '#cef0fe',
  surfaceElevated: '#ffffff',
  bgWhite: '#ffffff',
  bgYellow: '#fff9e6',
  bgGray: '#f5f5f5',
  bgDanger: '#fef2f2',
  bgSuccess: '#ecfdf5',
  text: '#000000',
  ink: '#000000',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textMuted: '#666666',
  textDisabled: '#b0b0b0',
  textFaint: '#8a8a8a',
  border: '#cccccc',
  borderLight: '#f5f5f5',
  borderInput: '#e0e0e0',
  divider: '#f0f0f0',
  pending: '#ff9900',
  warning: '#b45309',
  warnText: '#b45309',
  error: '#dc2626',
  errorBg: '#fef2f2',
  success: '#059669',
  successBg: '#ecfdf5',
  successDark: '#065f46',
  successMid: '#059669',
  info: '#3b82f6',
  infoBg: '#eff6ff',
  warningBg: '#fff9e6',
  avatarBg: '#999999',
} as const;

export const Gradients = {
  brand: ['#08B6FC', '#84dbfe'] as const,
  welcome: ['#84dbfe', '#08B6FC', '#0692ca'] as const,
  identityCard: ['#0692ca', '#0692ca'] as const,
  historyThumb: ['#84dbfe', '#0692ca'] as const,
};

export const Radius = {
  card: 16,
  btn: 12,
  input: 8,
  chip: 8,
  pill: 4,
  sheet: 20,
  welcome: 32,
} as const;

export const Typography = {
  caption: { size: 12, weight: '400' as const },
  bodySmall: { size: 14, weight: '400' as const },
  body: { size: 16, weight: '400' as const },
  bodyLarge: { size: 18, weight: '600' as const },
  headingSmall: { size: 20, weight: '700' as const },
  heading: { size: 24, weight: '700' as const },
  headingLarge: { size: 32, weight: '700' as const },
  display: { size: 40, weight: '700' as const },
} as const;

export const Elevation = {
  none: { elevation: 0, shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  small: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  medium: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  large: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  floating: { elevation: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function adjustBrightness(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const R = clamp(r + (r * percent) / 100);
  const G = clamp(g + (g * percent) / 100);
  const B = clamp(b + (b * percent) / 100);
  return '#' + componentToHex(R) + componentToHex(G) + componentToHex(B);
}

export const Neumorphism = {
  base: Colors.surface,
  light: '#ffffff',
  radius: Radius.card,
  getColors: (base: string = Colors.surface) => ({
    base,
    light: '#ffffff',
    dark: adjustBrightness(base, -22),
    fillStart: adjustBrightness(base, 4),
    fillEnd: adjustBrightness(base, -6),
    pressedStart: adjustBrightness(base, -4),
    pressedEnd: adjustBrightness(base, -14),
  }),
} as const;

export const FontFamily = Platform.select({
  ios: { regular: 'Satoshi', fallback: 'System' },
  default: { regular: 'Satoshi', fallback: 'sans-serif' },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getNeuBoxShadow(base: string = Colors.surface, inset = false, distance = 6, blur = 12) {
  const colors = Neumorphism.getColors(base);
  const prefix = inset ? 'inset ' : '';
  return `${prefix}${distance}px ${distance}px ${blur}px ${hexToRgba(colors.dark, 0.35)}, ${prefix}${-distance}px ${-distance}px ${blur}px ${hexToRgba(colors.light, 0.85)}`;
}
