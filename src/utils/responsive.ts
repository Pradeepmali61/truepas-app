/**
 * Responsive Utility for Truepas App (ref: Facepe src/utils/responsive.ts)
 * Ensures consistent UI across all screen sizes.
 *
 * Usage Guidelines:
 * - wp() → Container widths, card widths, overall layout
 * - scale() → Spacing, padding, margins, dimensions
 * - fontScale() → All text (less aggressive scaling)
 * - Aspect ratios → Cards, images, maintaining proportions
 * - Fixed values → Only for border-radius, border-width
 * - Min/Max constraints → Buttons, touch targets, fonts
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions - design was created for iPhone 8/X (375 x 812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size categories
export const screenSize = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 350,      // iPhone SE, small Androids
  isMedium: SCREEN_WIDTH >= 350 && SCREEN_WIDTH < 400,  // iPhone 8, X, 11 Pro
  isLarge: SCREEN_WIDTH >= 400 && SCREEN_WIDTH < 450,   // iPhone Plus, Max, Pro Max
  isXLarge: SCREEN_WIDTH >= 450,    // Large Androids, tablets
  isTablet: SCREEN_WIDTH >= 768,    // Tablets
};

/** Width Percentage — % of screen width (containers, cards, layout). */
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/** Height Percentage — use sparingly (height varies across devices). */
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

/** Scale — proportional to screen width (spacing, padding, icons, dimensions). */
export const scale = (size: number, minSize?: number, maxSize?: number): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  let scaled = PixelRatio.roundToNearestPixel(size * scaleFactor);
  if (minSize !== undefined && scaled < minSize) scaled = minSize;
  if (maxSize !== undefined && scaled > maxSize) scaled = maxSize;
  return scaled;
};

/** Vertical Scale — based on screen height (use sparingly). */
export const verticalScale = (size: number): number => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  return PixelRatio.roundToNearestPixel(size * scaleFactor);
};

/** Moderate Scale — less aggressive scaling (mixed content). */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (size * (scaleFactor - 1) * factor);
  return PixelRatio.roundToNearestPixel(newSize);
};

/** Font Scale — moderate scaling for text with conservative caps. */
export const fontScale = (size: number, minSize?: number, maxSize?: number): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  let scaled = size + (size * (scaleFactor - 1) * 0.5);
  scaled = PixelRatio.roundToNearestPixel(scaled);
  const defaultMax = screenSize.isTablet ? size * 1.3 : size * 1.25;
  const min = minSize ?? Math.round(size * 0.85);
  const max = maxSize ?? Math.round(defaultMax);
  if (scaled < min) scaled = min;
  if (scaled > max) scaled = max;
  return scaled;
};

/** Responsive value per screen-size category. */
export const responsiveValue = <T>(options: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
  default: T;
}): T => {
  if (screenSize.isSmall && options.small !== undefined) return options.small;
  if (screenSize.isMedium && options.medium !== undefined) return options.medium;
  if (screenSize.isLarge && options.large !== undefined) return options.large;
  if (screenSize.isXLarge && options.xlarge !== undefined) return options.xlarge;
  return options.default;
};

/** Common responsive spacing values. */
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
  huge: scale(40),
  massive: scale(48),
};

/** Common responsive font sizes. */
export const fontSize = {
  xs: fontScale(12),
  sm: fontScale(14),
  md: fontScale(16),
  lg: fontScale(18),
  xl: fontScale(20),
  xxl: fontScale(24),
  xxxl: fontScale(28),
  huge: fontScale(32),
  massive: fontScale(36),
};

/** Minimum touch target size (Apple HIG recommends 44pt). */
export const MIN_TOUCH_TARGET = 44;

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export default {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  responsiveValue,
  screenSize,
  spacing,
  fontSize,
  MIN_TOUCH_TARGET,
  isIOS,
  isAndroid,
};
