import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { AppIcon, type IconName } from "./AppIcon";

interface ListItemProps {
  icon?: IconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** List row — themed version of the legacy `.list-item`. */
export function ListItem({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  rightSlot,
  showChevron = false,
  style,
}: ListItemProps) {
  const styles = useStyles();
  const theme = useThemeTokens();

  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBg ?? theme.colors.actionPrimarySubtle }]}>
          <AppIcon name={icon} size={18} color={theme.colors.actionPrimary} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot}
      {showChevron ? <ChevronRight size={18} color={theme.colors.textMuted} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed, style]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{content}</View>;
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[5],
    paddingVertical: t.spacing[3],
    minHeight: 56,
  },
  rowPressed: { backgroundColor: t.colors.surfaceSunken },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.md,
    width: 40,
    height: 40,
  },
  text: { flex: 1 },
  title: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  subtitle: { fontSize: t.fontSize.xs, color: t.colors.textSecondary, marginTop: 2 },
}));
