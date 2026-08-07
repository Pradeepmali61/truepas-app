import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';
import { useAppSelector } from '@/store';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View className="items-center pt-1">
      {focused ? (
        <View className="absolute -top-[10px] h-[3px] w-[30px] rounded-[3px] bg-primary" />
      ) : null}
      <Icon name={name} size={22} color={focused ? Colors.primary : Colors.textSecondary} />
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, lineHeight: 14, paddingBottom: 4 },
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          backgroundColor: '#ffffff',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Identity',
          tabBarIcon: ({ focused }) => <TabIcon name="identity" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ focused }) => <TabIcon name="documents" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => <TabIcon name="family" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
