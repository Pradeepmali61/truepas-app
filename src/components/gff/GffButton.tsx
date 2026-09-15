/** @jsxImportSource react */
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { GfColors, GfGradients, GfRadius, GfTypography } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

interface GffButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** GFF primary button — blue→indigo horizontal gradient, 56dp, radius 14.
 *  States: enabled (gradient) / disabled (flat #D1D5DB) / pressed (0.85). */
export function GffButton({ label, onPress, disabled = false, loading = false }: GffButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : { opacity: pressed ? 0.85 : 1 },
      ]}>
      {disabled ? null : (
        <LinearGradient
          colors={[...GfGradients.button]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {loading ? (
        <ActivityIndicator color={GfColors.textOnPrimary} />
      ) : (
        <Text allowFontScaling={false} style={styles.label}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: scale(56, 52),
    borderRadius: GfRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: GfColors.disabledBg,
  },
  label: {
    fontSize: fontScale(GfTypography.button.size),
    fontWeight: GfTypography.button.weight,
    color: GfColors.textOnPrimary,
  },
});
