/** @jsxImportSource react */
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import { CalendarCheck, FileText, House } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKitStyles } from '@/components/truepas';
import { NeuBox } from '@/components/ui';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

function TabItem({ isFocused, options, label, onPress }: { isFocused: boolean; options: any; label: string; onPress: () => void }) {
  const theme = useThemeTokens();
  const kit = useKitStyles();
  const styles = useStyles();
  const [scale] = useState(() => new Animated.Value(1));

  const rest = isFocused ? 1.1 : 1;
  useEffect(() => {
    Animated.spring(scale, { toValue: rest, friction: 6, tension: 120, useNativeDriver: true }).start();
  }, [rest, scale]);

  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, friction: 7, tension: 140, useNativeDriver: true }).start();

  const icon = options.tabBarIcon
    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? theme.colors.onActionPrimary : theme.colors.actionPrimary, size: iconSize.md })
    : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(0.9)}
      onPressOut={() => to(rest)}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={styles.tabItem}>
      <Animated.View style={[kit.circle, isFocused && kit.navIconActive, { transform: [{ scale }] }]}>
        {icon}
      </Animated.View>
      <Text style={[kit.navLabel, isFocused && kit.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

/** Floating NeuBox pill tab bar — design-repo `BottomNav` (ui/chrome.tsx). */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  return (
    <View style={[styles.navWrap, { paddingBottom: insets.bottom + theme.spacing[2] }]}>
      <NeuBox variant="raised" radius={theme.radii.xl} depth={8} style={styles.navBar}>
        {state.routes.map((route: typeof state.routes[number], index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = (options.tabBarLabel as string) ?? (options.title as string) ?? route.name;
          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused) {
              navigation.navigate(route.name as never);
            }
          };
          return <TabItem key={route.key} isFocused={isFocused} options={options} label={label} onPress={onPress} />;
        })}
      </NeuBox>
    </View>
  );
}

/** Bottom tabs matching the design-repo V2 Dashboard mockup. */
export default function TabsLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }

  const tabIcon = (IconCmp: typeof House) => {
    function TabIcon({ color, size }: { color: ColorValue; size: number }) {
      return <IconCmp size={size} color={color as string} />;
    }
    return TabIcon;
  };

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon(House),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: tabIcon(FileText),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Check-ins',
          tabBarIcon: tabIcon(CalendarCheck),
        }}
      />
    </Tabs>
  );
}

const useStyles = makeStyles((t) => ({
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: t.spacing[4],
    paddingBottom: t.spacing[3],
  },
  navBar: {
    flexDirection: 'row',
    paddingVertical: t.spacing[2],
    paddingHorizontal: t.spacing[2],
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
}));
