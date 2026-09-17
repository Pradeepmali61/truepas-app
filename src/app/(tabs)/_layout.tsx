/** @jsxImportSource react */
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import { FileText, Home, Ticket, Users } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKitStyles } from '@/components/truepas';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

function TabItem({ isFocused, options, label, onPress }: { isFocused: boolean; options: any; label: string; onPress: () => void }) {
  const theme = useThemeTokens();
  const kit = useKitStyles();
  const styles = useStyles();
  const scale = useRef(new Animated.Value(1)).current;

  const rest = isFocused ? 1.1 : 1;
  useEffect(() => {
    Animated.spring(scale, { toValue: rest, friction: 6, tension: 120, useNativeDriver: true }).start();
  }, [rest, scale]);

  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, friction: 7, tension: 140, useNativeDriver: true }).start();

  const icon = options.tabBarIcon
    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? theme.colors.onActionPrimary : theme.colors.actionPrimary, size: iconSize.lg })
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

/** Circle-button tab bar matching the design-repo `HomeNav` mockup. */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom + theme.spacing[2],
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        },
      ]}>
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

  const tabIcon = (IconCmp: typeof Home) => {
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
          tabBarIcon: tabIcon(Home),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Docs',
          tabBarIcon: tabIcon(FileText),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: tabIcon(Users),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Check-ins',
          tabBarIcon: tabIcon(Ticket),
        }}
      />
    </Tabs>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: t.spacing[3],
    paddingHorizontal: t.spacing[3],
    borderTopWidth: t.sizes.fieldBorderWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
}));
