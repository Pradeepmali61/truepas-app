import { Text, View } from 'react-native';

import { Icon, IconName } from '@/components/ui/Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

/** Empty state matching `.empty-state` (56px icon at 50% opacity). */
export function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-[30px]">
      <View className="mb-4 opacity-50">
        <Icon name={icon} size={56} />
      </View>
      <Text accessibilityRole="header" className="mb-[6px] text-[16px] font-bold text-ink">
        {title}
      </Text>
      <Text className="mb-5 text-center text-[13px] text-muted">{desc}</Text>
      {action}
    </View>
  );
}
