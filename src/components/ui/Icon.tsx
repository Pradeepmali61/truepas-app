import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { SvgProps } from "react-native-svg";
import { useThemeTokens } from "../../theme";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps {
  /** A lucide-react-native element, e.g. <Search /> */
  children: ReactNode;
  size?: IconSize;
  color?: string;
  /** Set when the icon conveys meaning; decorative icons are hidden from AT */
  accessibilityLabel?: string;
}

/** Normalizes icon sizing to the token scale and applies a11y attributes. */
export function Icon({ children, size = "md", color, accessibilityLabel }: IconProps) {
  const theme = useThemeTokens();
  if (!isValidElement(children)) return null;
  const px = theme.iconSize[size];
  return cloneElement(children as ReactElement<SvgProps>, {
    width: px,
    height: px,
    size: px,
    color: color ?? theme.colors.textSecondary,
    accessibilityLabel,
    accessibilityElementsHidden: !accessibilityLabel,
    importantForAccessibility: accessibilityLabel ? "yes" : "no-hide-descendants",
  } as Partial<SvgProps>);
}
