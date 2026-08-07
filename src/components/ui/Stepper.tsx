import { View } from 'react-native';

interface StepperProps {
  total: number;
  done: number;
}

/** Segmented progress stepper matching `.stepper` (4px segments, radius 99). */
export function Stepper({ total, done }: StepperProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      className="flex-row gap-[6px] px-6 pb-4">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${i < done ? 'bg-primary' : 'bg-canvas'}`}
        />
      ))}
    </View>
  );
}
