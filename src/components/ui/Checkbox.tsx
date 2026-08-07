import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';

interface CheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

/** Consent checkbox row matching `.checkbox-row` / `.checkbox-box` (22px, radius 6). */
export function CheckboxRow({ checked, onToggle, label }: CheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      className="mx-6 mb-4 flex-row items-start gap-[10px]">
      <View
        className={`mt-[1px] h-[22px] w-[22px] items-center justify-center rounded-[6px] border-[1.5px] ${
          checked ? 'border-primary bg-primary' : 'border-line bg-white'
        }`}>
        {checked ? (
          <Icon name="check" size={14} color="#ffffff" />
        ) : null}
      </View>
      <Text className="flex-1 text-left text-[13px] leading-[19.5px] text-muted">{label}</Text>
    </Pressable>
  );
}
