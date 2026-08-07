import { Pressable, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/ui/Icon';

interface ListItemProps {
  icon?: IconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
  showChevron?: boolean;
}

/** List row matching `.list-item` (56px min height, 40px icon wrap). */
export function ListItem({
  icon,
  iconBg = '#e8f0fe',
  title,
  subtitle,
  onPress,
  rightSlot,
  showChevron = false,
}: ListItemProps) {
  const content = (
    <>
      {icon ? (
        <View
          className="h-10 w-10 items-center justify-center rounded-btn"
          style={{ backgroundColor: iconBg }}>
          <Icon name={icon} size={18} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-[14px] font-medium text-ink">{title}</Text>
        {subtitle ? <Text className="text-[12px] text-muted">{subtitle}</Text> : null}
      </View>
      {rightSlot}
      {showChevron ? <Icon name="chevron" size={18} color="#e5e5ea" /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        className="min-h-[56px] flex-row items-center gap-3 px-5 py-3 active:bg-canvas">
        {content}
      </Pressable>
    );
  }
  return (
    <View className="min-h-[56px] flex-row items-center gap-3 px-5 py-3">{content}</View>
  );
}
