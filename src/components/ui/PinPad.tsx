import { Pressable, Text, View } from 'react-native';

interface PinDotsProps {
  length: number;
  filled: number;
}

/** PIN dots matching `.pin-dots` / `.pin-dot` (16px circles). */
export function PinDots({ length, filled }: PinDotsProps) {
  return (
    <View
      accessibilityLabel={`${filled} of ${length} digits entered`}
      accessibilityLiveRegion="polite"
      className="my-4 flex-row justify-center gap-4">
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          className={`h-4 w-4 rounded-full ${i < filled ? 'bg-primary' : 'bg-[#e0e0e0]'}`}
        />
      ))}
    </View>
  );
}

interface PinPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

/** Numeric PIN pad matching `.pin-pad` (3-col grid, 56px cells). */
export function PinPad({ onDigit, onBackspace }: PinPadProps) {
  return (
    <View className="flex-row flex-wrap px-10 pb-[30px]">
      {KEYS.map((key, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={key === '⌫' ? 'Delete digit' : key || undefined}
          disabled={key === ''}
          onPress={() => (key === '⌫' ? onBackspace() : onDigit(key))}
          className="h-[56px] w-1/3 items-center justify-center active:opacity-60">
          <Text allowFontScaling={false} className="text-[24px] font-semibold text-ink">
            {key}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
