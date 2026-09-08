/**
 * Responsive scaling utilities — ported from facepe-user-frontend
 * (src/utils/responsive.ts).
 *
 * Ensures consistent UI proportions across screen sizes (375px base design).
 *
 * Usage guidelines (same as Facepe):
 * - wp()        → container widths, card widths, overall layout
 * - scale()     → spacing, padding, margins, icon sizes, dimensions
 * - fontScale() → all text (less aggressive scaling, capped)
 * - Fixed values → only for border-radius, border-width
 * - MIN_TOUCH_TARGET → buttons, touch targets
 *
 * Adopt incrementally: use in new screens and when touching existing ones.
 * Do not big-bang refactor — Tailwind classes like `text-[14px]` can
 * migrate to fontScale gradually.
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions — design was created for iPhone 8/X (375 x 812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size categories
export const screenSize = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 350, // iPhone SE, small Androids
  isMedium: SCREEN_WIDTH >= 350 && SCREEN_WIDTH < 400, // iPhone 8, X, 11 Pro
  isLarge: SCREEN_WIDTH >= 400 && SCREEN_WIDTH < 450, // iPhone Plus, Max, Pro Max
  isXLarge: SCREEN_WIDTH >= 450, // Large Androids, tablets
  isTablet: SCREEN_WIDTH >= 768, // Tablets
};

/**
 * Width Percentage — returns a percentage of screen width.
 * Use for: container widths, card widths, overall layout.
 */
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * Height Percentage — returns a percentage of screen height.
 * Use sparingly! Height varies greatly between devices and orientations.
 */
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

/**
 * Scale — scales a value proportionally to screen width.
 * Use for: spacing, padding, margins, icon sizes, dimensions.
 *
 * @example
 * padding: scale(16)          // scales 16px proportionally
 * height: scale(56, 48)       // min 48px for touch target
 * iconSize: scale(24, 20, 32) // between 20-32px
 */
export const scale = (size: number, minSize?: number, maxSize?: number): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  let scaled = PixelRatio.roundToNearestPixel(size * scaleFactor);

  if (minSize !== undefined && scaled < minSize) scaled = minSize;
  if (maxSize !== undefined && scaled > maxSize) scaled = maxSize;

  return scaled;
};

/**
 * Vertical Scale — scales based on screen height.
 * Use sparingly! Only for elements that should scale with height.
 */
export const verticalScale = (size: number): number => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  return PixelRatio.roundToNearestPixel(size * scaleFactor);
};

/**
 * Moderate Scale — scales less aggressively (good for mixed content).
 *
 * @param factor How much to scale (0 = no scale, 1 = full scale)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (size * (scaleFactor - 1) * factor);
  return PixelRatio.roundToNearestPixel(newSize);
};

/**
 * Font Scale — specifically for text (less aggressive scaling).
 * Prevents fonts from becoming too large on tablets or too small on small phones.
 *
 * Uses moderate scaling (50% factor) with conservative caps:
 * tablets 1.3x max, phones 1.25x max, floored at 0.85x.
 *
 * @example
 * fontSize: fontScale(16)          // scales moderately
 * fontSize: fontScale(24, 20, 28)  // title with constraints
 */
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

/**
 * Get a responsive value based on screen size category.
 *
 * @example
 * fontSize: responsiveValue({ small: 14, medium: 16, default: 16 })
 */
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

/**
 * Minimum touch target size (Apple HIG recommends 44pt).
 */
export const MIN_TOUCH_TARGET = 44;

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
