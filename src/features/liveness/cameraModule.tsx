import { useRouter } from 'expo-router';
import type { ComponentType } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Alert, ScreenHeader } from '@/components/composite';
import { CoreButton } from '@/components/ui';
import { useThemeTokens } from '@/theme';

/**
 * Lazy access to the vision-camera stack. react-native-vision-camera is a
 * NitroModules TurboModule — its module-level code throws when the native
 * binary doesn't contain it (stale dev build / Expo Go). Route screens must
 * NEVER statically import LivenessCamera or PhotoCapture; load them through
 * these guarded loaders and render <CameraUnavailable /> when null.
 */
type AnyComponent = ComponentType<Record<string, unknown>>;

let livenessCamera: AnyComponent | null | undefined;
let photoCapture: AnyComponent | null | undefined;

export function loadLivenessCamera(): AnyComponent | null {
  if (livenessCamera === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: throws without NitroModules
      livenessCamera = (require('./LivenessCamera') as { LivenessCamera: AnyComponent }).LivenessCamera ?? null;
    } catch {
      livenessCamera = null;
    }
  }
  return livenessCamera;
}

export function loadPhotoCapture(): AnyComponent | null {
  if (photoCapture === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: throws without NitroModules
      photoCapture = (require('./PhotoCapture') as { PhotoCapture: AnyComponent }).PhotoCapture ?? null;
    } catch {
      photoCapture = null;
    }
  }
  return photoCapture;
}

/** Shown when the camera stack can't load — the build lacks NitroModules. */
export function CameraUnavailable() {
  const theme = useThemeTokens();
  const router = useRouter();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Face verification" onBack={() => router.back()} />
      <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4], justifyContent: 'center' }}>
        <Alert variant="error" title="Camera unavailable">
          This build doesn&apos;t include the camera module. Rebuild the dev client
          (npx expo run:android or an EAS development build) and try again.
        </Alert>
        <CoreButton variant="outline" fullWidth accessibilityLabel="Go back" onPress={() => router.back()}>
          Go back
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
