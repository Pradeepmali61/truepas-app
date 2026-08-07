import { Pressable, Text, View } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Relationship chip matching `.chip` (radius 8, border 1.5). */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`rounded-[8px] border-[1.5px] px-4 py-2 ${
        selected ? 'border-primary bg-primary' : 'border-line bg-white'
      }`}>
      <Text
        allowFontScaling={false}
        className={`text-[14px] font-medium ${selected ? 'text-white' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap justify-center gap-2 px-6 pb-4">{children}</View>;
}
