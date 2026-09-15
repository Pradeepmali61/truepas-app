/** @jsxImportSource react */
import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon, IconName } from '@/components/ui';
import { GfColors, GfElevation, GfLayout, GfRadius, GfSpacing, GfTypography } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

interface GffMenuCardProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
}

/** White rounded menu row â€” indigo outline icon + semibold label. */
export function GffMenuCard({ icon, label, onPress }: GffMenuCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <Icon name={icon} size={scale(24, 22)} color={GfColors.primary} />
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Bold section header ("Discover GFF 2026"). */
export function GffSectionHeader({ title }: { title: string }) {
  return (
    <Text allowFontScaling={false} style={styles.section}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GfSpacing.iconTextGap,
    backgroundColor: GfColors.card,
    borderRadius: GfRadius.card,
    height: scale(GfLayout.menuCardHeight, 58),
    paddingHorizontal: scale(20),
    marginBottom: GfSpacing.cardGap,
    ...GfElevation.card,
  },
  label: {
    fontSize: fontScale(GfTypography.menuItem.size),
    fontWeight: GfTypography.menuItem.weight,
    color: GfColors.textPrimary,
  },
  section: {
    fontSize: fontScale(GfTypography.sectionHeader.size),
    fontWeight: GfTypography.sectionHeader.weight,
    color: GfColors.textPrimary,
    marginBottom: scale(16),
  },
});



