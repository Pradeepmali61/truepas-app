import { Text, View } from 'react-native';

type PillVariant = 'default' | 'warn' | 'fail' | 'active' | 'gray';

const CONTAINER: Record<PillVariant, string> = {
  default: 'bg-surface',
  warn: 'bg-[#fff9e6]',
  fail: 'bg-[#fef2f2]',
  active: 'bg-primary',
  gray: 'bg-canvas',
};

const LABEL: Record<PillVariant, string> = {
  default: 'text-primary',
  warn: 'text-[#ff6600]',
  fail: 'text-primary',
  active: 'text-white',
  gray: 'text-muted',
};

/** Status pill matching `.pill` (12px, radius 4). */
export function Pill({ label, variant = 'default' }: { label: string; variant?: PillVariant }) {
  return (
    <View className={`rounded-[4px] px-2 py-1 ${CONTAINER[variant]}`}>
      <Text allowFontScaling={false} className={`text-[12px] font-medium ${LABEL[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
