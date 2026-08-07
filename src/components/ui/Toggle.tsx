import { Pressable, View } from 'react-native';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
}

/** Toggle switch matching `.toggle` (44×26, knob 20). */
export function Toggle({ on, onToggle, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={accessibilityLabel}
      onPress={onToggle}
      className={`h-[26px] w-[44px] rounded-full ${on ? 'bg-primary' : 'bg-line'}`}>
      <View
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow"
        style={{ left: on ? 21 : 3, elevation: 2 }}
      />
    </Pressable>
  );
}
