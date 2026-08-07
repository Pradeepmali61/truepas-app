/**
 * Truepas design tokens — extracted 1:1 from the pixel-perfect mockups
 * (Truepas-figma/styles.css, FacePe design system / NewDesignSystem.ts).
 */

import { Platform } from 'react-native';

export const Colors = {
  primary: '#2727d6',
  primaryDark: '#1b1b9e',
  primaryLight: '#4e9af1',
  surface: '#e8f0fe',
  surfaceAlt: '#d6e3f8',
  bgWhite: '#ffffff',
  bgYellow: '#fff9e6',
  bgGray: '#f5f5f5',
  bgDanger: '#fef2f2',
  bgSuccess: '#ecfdf5',
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  textFaint: '#b0b0b0',
  border: '#cccccc',
  borderLight: '#f5f5f5',
  borderInput: '#e0e0e0',
  pending: '#ff9900',
  warning: '#ff6600',
  warnText: '#b45309',
  successDark: '#065f46',
  successMid: '#059669',
  avatarBg: '#999999',
} as const;

export const Gradients = {
  brand: ['#2727d6', '#4e9af1'] as const,
  welcome: ['#4e9af1', '#2727d6', '#1b1b9e'] as const,
  identityCard: ['#1b1b9e', '#1b1b9e'] as const,
  historyThumb: ['#4e9af1', '#1b1b9e'] as const,
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

export const FontFamily = Platform.select({
  ios: { regular: 'Satoshi', fallback: 'System' },
  default: { regular: 'Satoshi', fallback: 'sans-serif' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
