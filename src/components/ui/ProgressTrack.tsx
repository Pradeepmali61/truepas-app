import { View } from 'react-native';

/** Thin progress bar matching `.progress-track` / `.progress-fill` (4px, radius 99). */
export function ProgressTrack({ percent }: { percent: number }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className="mx-6 mb-[10px] h-1 overflow-hidden rounded-full bg-canvas">
      <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </View>
  );
}
