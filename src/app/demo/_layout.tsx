import { Stack } from 'expo-router';

/** GFF reference screens (design-system demo) — isolated from the Truepas flow. */
export default function DemoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    />
  );
}
