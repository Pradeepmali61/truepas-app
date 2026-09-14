import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/components/ui';
import { GfColors, GfTypography } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

/** "Need Help?" pill — top-right on GFF auth screens. */
export function GffHelpButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Need help"
      onPress={onPress}
      style={styles.pill}>
      <Icon name="info" size={scale(18, 16)} color={GfColors.primary} />
      <Text allowFontScaling={false} style={styles.pillLabel}>
        Need Help?
      </Text>
    </Pressable>
  );
}

/** Screen title — 2-line centered display heading ("Sign in / to your account"). */
export function GffScreenTitle({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line) => (
        <Text key={line} allowFontScaling={false} style={styles.title}>
          {line}
        </Text>
      ))}
    </>
  );
}

/** Screen description / helper copy. */
export function GffDescription({ children, align = 'center' as const }: { children: React.ReactNode; align?: 'center' | 'left' }) {
  return <Text allowFontScaling={false} style={[styles.description, align === 'center' ? null : { textAlign: 'left' }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8, 6),
    backgroundColor: '#F2F3F7',
    borderRadius: 999,
    paddingHorizontal: scale(16),
    paddingVertical: scale(11, 9),
  },
  pillLabel: {
    fontSize: fontScale(GfTypography.help.size),
    fontWeight: GfTypography.help.weight,
    color: GfColors.textPrimary,
  },
  title: {
    fontSize: fontScale(32),
    fontWeight: '800',
    color: GfColors.textPrimary,
    textAlign: 'center',
    lineHeight: fontScale(38),
  },
  description: {
    fontSize: fontScale(GfTypography.screenSubtitle.size),
    fontWeight: GfTypography.screenSubtitle.weight,
    color: GfColors.textSecondary,
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
});
