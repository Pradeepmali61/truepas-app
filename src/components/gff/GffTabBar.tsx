import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/ui';
import { GfColors, GfLayout, GfTypography } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

export interface GffTab {
  id: string;
  label: string;
  icon: IconName;
}

interface GffTabBarProps {
  tabs: GffTab[];
  activeId: string;
  onChange: (id: string) => void;
}

/** Bottom tab bar â€” white bar, 5 items; active item indigo, inactive gray. */
export function GffTabBar({ tabs, activeId, onChange }: GffTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.id}
            onPress={() => onChange(tab.id)}
            style={styles.item}>
            <Icon name={tab.icon} size={scale(24, 22)} color={active ? GfColors.tabActive : GfColors.tabInactive} />
            <Text
              allowFontScaling={false}
              style={[styles.label, { color: active ? GfColors.tabActive : GfColors.tabInactive }]}>
              {tab.id}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: scale(GfLayout.tabBarHeight, 60),
    borderTopWidth: 1,
    borderTopColor: '#EEF0F4',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: fontScale(GfTypography.tabLabel.size),
    fontWeight: GfTypography.tabLabel.weight,
  },
});

