import { Text, View } from 'react-native';

import { Icon, IconName } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

/** Empty state — icon in a soft theme-tinted circle (matches app design). */
export function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-[30px]">
      <View
        className="mb-4 items-center justify-center rounded-full"
        style={{ width: 72, height: 72, backgroundColor: Colors.surface }}>
        <Icon name={icon} size={32} color={Colors.primary} />
      </View>
      <Text accessibilityRole="header" className="mb-[6px] text-[16px] font-bold text-ink">
        {title}
      </Text>
      <Text className="mb-5 text-center text-[13px] text-muted">{desc}</Text>
      {action}
    </View>
  );
}
