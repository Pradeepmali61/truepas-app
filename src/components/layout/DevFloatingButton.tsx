import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

/**
 * Dev-only floating button — jumps to the /dev screen browser from anywhere.
 * Rendered only when __DEV__ (development builds / Metro); the in-component
 * check plus the gate in _layout keeps it out of preview/production bundles.
 */
export function DevFloatingButton() {
  if (!__DEV__) {
    return null;
  }
  return <DevFloatingButtonInner />;
}

function DevFloatingButtonInner() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open dev screen browser"
      onPress={() => router.push('/dev' as never)}
      style={styles.button}>
      <Text allowFontScaling={false} style={styles.label}>
        DEV
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
