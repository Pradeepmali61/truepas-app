import { ActivityIndicator, View } from "react-native";
import { useThemeTokens } from "../../theme";

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  /** Accessibility announcement */
  label?: string;
}

const SIZES = { xs: 12, sm: 16, md: 20, lg: 28, xl: 36 } as const;

export function Spinner({ size = "md", color, label = "Loading" }: SpinnerProps) {
  const theme = useThemeTokens();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessible>
      <ActivityIndicator size="small" color={color ?? theme.colors.actionPrimary} style={{ width: SIZES[size], height: SIZES[size] }} />
    </View>
  );
}
