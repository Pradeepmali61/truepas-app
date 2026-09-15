/** @jsxImportSource react */
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import { FileText, History, Home, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/components/ui';
import { useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';

const INDICATOR_WIDTH = 32;
const INDICATOR_HEIGHT = 4;

function TabItem({ isFocused, options, label, onPress }: { isFocused: boolean; options: any; label: string; onPress: () => void }) {
  const theme = useThemeTokens();
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.15 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(isFocused ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.15 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(translateYAnim, {
        toValue: isFocused ? -2 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
  }, [isFocused]);

  const icon = options.tabBarIcon
    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? theme.colors.actionPrimary : theme.colors.textSecondary, size: 24 })
    : null;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: isFocused ? 1.15 : 1, useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[0.5],
      }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }}>
        {icon}
      </Animated.View>
      <Typography
        variant="caption"
        style={{
          marginTop: theme.spacing[1],
          fontWeight: isFocused ? theme.fontWeight.semibold : theme.fontWeight.medium,
          color: isFocused ? theme.colors.actionPrimary : theme.colors.textSecondary,
        }}>
        {label}
      </Typography>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = useState(0);
  const activeIndex = state.index;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setTabWidth(width / state.routes.length);
  };

  const indicatorStyle = {
    left: (tabWidth - INDICATOR_WIDTH) / 2,
    transform: [{ translateX: activeIndex * tabWidth }],
  };

  return (
    <View
      onLayout={onLayout}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingBottom: insets.bottom,
        height: 64 + insets.bottom,
        borderTopWidth: theme.sizes.fieldBorderWidth,
        borderTopColor: theme.colors.borderSubtle,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: theme.colors.surface,
      }}>
      <View
        style={[
          {
            position: 'absolute',
            top: 0,
            width: INDICATOR_WIDTH,
            height: INDICATOR_HEIGHT,
            borderRadius: INDICATOR_HEIGHT / 2,
            backgroundColor: theme.colors.actionPrimary,
          },
          indicatorStyle,
        ]}
      />
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

/** Bottom tabs matching the mockup `.bottom-nav`: Identity / Documents / Family / History. */
export default function TabsLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }

  const tabIcon = (IconCmp: typeof Home) =>
    ({ color, size }: { color: ColorValue; size: number }) => <IconCmp size={size} color={color as string} />;

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
          title: 'Documents',
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
          title: 'History',
          tabBarIcon: tabIcon(History),
        }}
      />
    </Tabs>
  );
}
