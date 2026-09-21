/**
 * NeuSegmented — soft-UI segmented control: sunken track with a raised thumb
 * that slides (spring) to the selected option. The kit-style toggle used
 * across the app.
 *
 * Ported 1:1 from UI-design-repo `src/app/ui/neu.tsx` (NeuSegmented).
 */
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { NeuBox, NeuWell } from "./NeuBox";

export interface NeuSegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export function NeuSegmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: NeuSegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  const t = useThemeTokens();
  const styles = useSegStyles();
  const [trackW, setTrackW] = useState(0);
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [anim] = useState(() => new Animated.Value(idx));
  useEffect(() => {
    Animated.spring(anim, { toValue: idx, friction: 8, tension: 140, useNativeDriver: true }).start();
  }, [anim, idx]);

  const pad = 4;
  const thumbW = trackW > 0 ? (trackW - pad * 2) / options.length : 0;

  return (
    <View onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
      <NeuWell radius={t.radii.full} style={styles.segTrack}>
        {thumbW > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.segThumbWrap,
              { width: thumbW, transform: [{ translateX: Animated.multiply(anim, thumbW) }] },
            ]}
          >
            <NeuBox variant="raised" radius={t.radii.full} depth={3} color={t.colors.surface} style={styles.segThumb} />
          </Animated.View>
        )}
        {options.map((o) => {
          const active = o.value === value;
          const IconCmp = o.icon;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label ? `${label}: ${o.label}` : o.label}
              onPress={() => onChange(o.value)}
              style={styles.segOption}
            >
              {IconCmp && (
                <IconCmp size={t.iconSize.sm} color={active ? t.colors.actionPrimary : t.colors.textMuted} />
              )}
              <Text style={[styles.segLabel, active && styles.segLabelActive]} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </NeuWell>
    </View>
  );
}

const useSegStyles = makeStyles((t) => ({
  segTrack: { flexDirection: "row", padding: t.spacing[1] },
  segThumbWrap: { position: "absolute", top: 4, left: 4, bottom: 4 },
  segThumb: { flex: 1 },
  segOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[2],
    minHeight: t.sizes.touchTarget,
  },
  segLabel: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textMuted },
  segLabelActive: { fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
}));
