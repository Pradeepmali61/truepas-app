import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';
import { useAppSelector } from '@/store';

const INDICATOR_WIDTH = 32;
const INDICATOR_HEIGHT = 4;

function TabItem({ isFocused, options, label, onPress }: { isFocused: boolean; options: any; label: string; onPress: () => void }) {
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
    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? Colors.primary : Colors.textSecondary, size: 24 })
    : null;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: isFocused ? 1.15 : 1, useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} className="flex-1 items-center justify-center" style={{ paddingTop: 8, paddingBottom: 2 }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }}>
        {icon}
      </Animated.View>
      <Text style={{ fontSize: 10, marginTop: 4, fontWeight: isFocused ? '600' : '500', color: isFocused ? Colors.primary : Colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
      className="flex-row items-end bg-white"
      style={{
        paddingBottom: insets.bottom,
        height: 64 + insets.bottom,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
      }}>
      <View
        style={[
          {
            position: 'absolute',
            top: 8,
            width: INDICATOR_WIDTH,
            height: INDICATOR_HEIGHT,
            borderRadius: INDICATOR_HEIGHT / 2,
            backgroundColor: Colors.primary,
          },
          indicatorStyle,
        ]}
      />
      {state.routes.map((route, index) => {
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
  const insets = useSafeAreaInsets();

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="identity" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => <Icon name="documents" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, size }) => <Icon name="family" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Icon name="history" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
