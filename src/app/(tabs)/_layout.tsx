import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';
import { useAppSelector } from '@/store';

const INDICATOR_WIDTH = 24;
const INDICATOR_HEIGHT = 4;

function TabItem({ isFocused, options, label, onPress }: { isFocused: boolean; options: any; label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const color = useSharedValue(Colors.textSecondary);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { stiffness: 260, damping: 20 });
    color.value = isFocused ? Colors.primary : Colors.textSecondary;
  }, [isFocused, scale, color]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: color.value,
  }));

  const icon = options.tabBarIcon
    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? Colors.primary : Colors.textSecondary, size: 24 })
    : null;

  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center" style={{ paddingTop: 8, paddingBottom: 2 }}>
      <Animated.View style={iconStyle}>{icon}</Animated.View>
      <Animated.Text style={[{ fontSize: 10, marginTop: 4, fontWeight: isFocused ? '600' : '500' }, labelStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabWidth = useSharedValue(0);
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = state.index;
  }, [state.index, activeIndex]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    tabWidth.value = width / state.routes.length;
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    left: (tabWidth.value - INDICATOR_WIDTH) / 2,
    transform: [{ translateX: withSpring(activeIndex.value * tabWidth.value, { stiffness: 260, damping: 24 }) }],
  }));

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
      <Animated.View
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
          title: 'Identity',
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
