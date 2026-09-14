import { useThemeTokens } from "@/theme";
import { getIcon, type IconName } from "./icons";

export type { IconName } from "./icons";

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Backward-compatible icon component — accepts a `name` string from the
 * legacy vocabulary and renders the matching lucide-react-native icon.
 * Use the ui-native `<Icon><X /></Icon>` for new code.
 */
export function AppIcon({ name, size, color, accessibilityLabel }: AppIconProps) {
  const theme = useThemeTokens();
  const LucideComp = getIcon(name);
  return (
    <LucideComp
      size={size ?? theme.iconSize.md}
      color={color ?? theme.colors.textSecondary}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
    />
  );
}
