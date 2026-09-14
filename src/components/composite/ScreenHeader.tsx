import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { IconButton } from "../ui/IconButton";

export interface ScreenHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Shows a back chevron — wire to your navigator */
  onBack?: () => void;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Top bar for a pushed screen — the mobile analog of breadcrumbs. */
export function ScreenHeader({ title, subtitle, onBack, actions, style }: ScreenHeaderProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={[styles.header, style]}>
      {onBack && (
        <IconButton
          accessibilityLabel="Back"
          icon={<ChevronLeft size={iconSize.md} color={theme.colors.textPrimary} />}
          onPress={onBack}
        />
      )}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle != null && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {actions != null && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    minHeight: t.sizes.headerHeight,
    paddingHorizontal: t.spacing[2],
    borderBottomWidth: t.sizes.fieldBorderWidth,
    borderBottomColor: t.colors.borderSubtle,
    backgroundColor: t.colors.surface,
  },
  titles: { flex: 1 },
  title: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  subtitle: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  actions: { flexDirection: "row", alignItems: "center", gap: t.spacing[1] },
}));
