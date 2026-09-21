import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { IconButton } from "../ui/IconButton";
import { Typography } from "../ui/Typography";

export interface ScreenHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Shows a back chevron — wire to your navigator */
  onBack?: () => void;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Top bar for a pushed screen — mirrors the design-repo AppScreen header:
 *  transparent over the screen background (no strip/border), ghost back
 *  arrow in actionPrimary, centered h4 title kept balanced by equal-width
 *  side slots. */
export function ScreenHeader({ title, subtitle, onBack, actions, style }: ScreenHeaderProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <IconButton
          accessibilityLabel="Back"
          variant="ghost"
          icon={<ArrowLeft size={iconSize.md} color={theme.colors.actionPrimary} />}
          onPress={onBack}
        />
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <View style={styles.titles}>
        <Typography variant="h4" numberOfLines={1}>
          {title}
        </Typography>
        {subtitle != null && (
          <Typography variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </Typography>
        )}
      </View>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    minHeight: t.sizes.headerHeight,
    paddingHorizontal: t.spacing[4],
  },
  headerSpacer: { width: t.sizes.touchTarget },
  titles: { flex: 1, alignItems: "center", gap: 1 },
  actions: {
    minWidth: t.sizes.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: t.spacing[2],
  },
}));
