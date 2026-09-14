import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GfColors, GfRadius } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

export type GffAuthMethod = 'email' | 'whatsapp';

interface GffAuthSegmentProps {
  value: GffAuthMethod;
  onChange: (method: GffAuthMethod) => void;
}

const OPTIONS: { id: GffAuthMethod; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

/** Segmented Email | WhatsApp control — active segment deep indigo with
 *  white bold text on a light-gray track. */
export function GffAuthSegment({ value, onChange }: GffAuthSegmentProps) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option.label} sign in`}
            onPress={() => onChange(option.id)}
            style={styles.segmentHit}>
            <View style={[styles.segment, active && styles.segmentActive]}>
              <Text
                allowFontScaling={false}
                style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#F1F2F6',
    borderRadius: GfRadius.segment,
    padding: scale(4, 3),
  },
  segmentHit: {
    flex: 1,
  },
  segment: {
    height: scale(44, 40),
    borderRadius: GfRadius.segmentInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: GfColors.primaryDeep,
  },
  segmentLabel: {
    fontSize: fontScale(16),
    fontWeight: '500',
    color: '#374151',
  },
  segmentLabelActive: {
    color: GfColors.textOnPrimary,
    fontWeight: '700',
  },
});
