import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Menu } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { IconButton } from "../ui/IconButton";

export interface AppHeaderProps {
  /** Left slot — usually logo/brand or back button */
  left?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Right slot — notification bell, user menu, etc. */
  actions?: ReactNode;
  /** Opens the navigation drawer (shows hamburger) */
  onMenuPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Fixed top bar — brand/nav/actions for the home-level screens. */
export function AppHeader({ left, title, subtitle, actions, onMenuPress, style }: AppHeaderProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={[styles.header, style]} accessibilityRole="header">
      <View style={styles.left}>
        {onMenuPress && (
          <IconButton
            accessibilityLabel="Open menu"
            icon={<Menu size={iconSize.md} color={theme.colors.textPrimary} />}
            onPress={onMenuPress}
          />
        )}
        {left}
      </View>
      {(title != null || subtitle != null) && (
        <View style={styles.center}>
          {title != null && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
          {subtitle != null && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.right}>{actions}</View>
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
    backgroundColor: t.colors.surface,
    borderBottomWidth: t.sizes.fieldBorderWidth,
    borderBottomColor: t.colors.borderSubtle,
  },
  left: { flexDirection: "row", alignItems: "center", gap: t.spacing[1] },
  center: { flex: 1 },
  title: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  subtitle: { fontSize: t.fontSize.xs, color: t.colors.textMuted },
  right: { flexDirection: "row", alignItems: "center", gap: t.spacing[1] },
}));
