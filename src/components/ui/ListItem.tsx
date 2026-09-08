import { Pressable, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/ui/Icon';
import { fontScale, scale } from '@/utils/responsive';

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
          className="items-center justify-center rounded-btn"
          style={{ width: scale(40, 36), height: scale(40, 36), backgroundColor: iconBg }}>
          <Icon name={icon} size={scale(18, 16)} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text allowFontScaling={false} style={{ fontSize: fontScale(14), fontWeight: '500', color: '#000000' }}>{title}</Text>
        {subtitle ? (
          <Text allowFontScaling={false} style={{ fontSize: fontScale(12), color: '#666666' }}>{subtitle}</Text>
        ) : null}
      </View>
      {rightSlot}
      {showChevron ? <Icon name="chevron" size={scale(18, 16)} color="#e5e5ea" /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        className="flex-row items-center gap-3 px-5 py-3 active:bg-canvas"
        style={{ minHeight: scale(56, 48) }}>
        {content}
      </Pressable>
    );
  }
  return (
    <View className="flex-row items-center gap-3 px-5 py-3" style={{ minHeight: scale(56, 48) }}>{content}</View>
  );
}
