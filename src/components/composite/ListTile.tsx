/**
 * ListTile — the standard raised row (icon tile + title/subtitle + chevron).
 *
 * Ported 1:1 from UI-design-repo `src/app/ui/chrome.tsx` (ListTile).
 */
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { NeuBox } from "../ui/NeuBox";

type TileTone = "neutral" | "brand" | "success" | "warning" | "error";

export function ListTile({
  icon: IconCmp,
  title,
  subtitle,
  trailing,
  onPress,
  tone = "neutral",
  disabled,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  tone?: TileTone;
  disabled?: boolean;
}) {
  const styles = useStyles();
  const t = useThemeTokens();
  const toneColor: Record<TileTone, string> = {
    neutral: t.colors.surfaceSunken,
    brand: t.colors.actionPrimarySubtle,
    success: t.colors.successSubtle,
    warning: t.colors.warningSubtle,
    error: t.colors.errorSubtle,
  };
  const iconColor: Record<TileTone, string> = {
    neutral: t.colors.textSecondary,
    brand: t.colors.actionPrimary,
    success: t.colors.onSuccessSubtle,
    warning: t.colors.onWarningSubtle,
    error: t.colors.onErrorSubtle,
  };
  const content = (
    <NeuBox variant="raised" depth={3} color={t.colors.surface} style={styles.tile}>
      {IconCmp && (
        <View style={[styles.tileIcon, { backgroundColor: toneColor[tone] }]}>
          <IconCmp size={t.iconSize.md} color={iconColor[tone]} />
        </View>
      )}
      <View style={styles.tileText}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle != null && (
          <Text style={styles.tileSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={t.iconSize.sm} color={t.colors.textMuted} /> : null)}
    </NeuBox>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof title === "string" ? title : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.tilePressed}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    padding: t.spacing[3],
    paddingRight: t.spacing[4],
    minHeight: t.sizes.touchTarget,
  },
  tilePressed: { opacity: t.opacity.pressed },
  tileIcon: {
    width: t.sizes.touchTarget,
    height: t.sizes.touchTarget,
    borderRadius: t.radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: { flex: 1, gap: t.spacing[0.5] },
  tileTitle: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  tileSubtitle: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
}));
