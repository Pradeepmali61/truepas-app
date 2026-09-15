import { useRouter } from 'expo-router';
import { ScanFace } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, ScreenHeader } from '@/components/composite';
import { CoreButton, Progress, RowIcon, Typography } from '@/components/ui';
import { LivenessCamera } from '@/features/liveness/LivenessCamera';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Face scan — mandatory liveness + face enrollment gate (no skip, PRD v2.0).
 *  Uses server-provided challenge sequence via the LivenessCamera component. */
export default function FaceScanScreen() {
  const router = useRouter();

  return (
    <LivenessCamera
      mode="enroll"
      onSuccess={() => router.replace('/(onboarding)/face-enrolled')}
      onError={(msg) => {
        // `retry` sends the error screen's Retry button back to THIS flow —
        // without it the shared error screen routed registration retries into
        // the face-update (mode="update") flow.
        router.push({ pathname: '/face-update/error', params: { message: msg, retry: '/(onboarding)/face-scan' } });
      }}
    />
  );
}

/** Static intro screen (kept for reference — the live camera replaces it). */
export function FaceScanIntro() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Sign Up" />
      <View style={{ paddingHorizontal: theme.spacing[4] }}>
        <Progress value={75} accessibilityLabel="Onboarding progress" />
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[5],
          gap: theme.spacing[4],
        }}>
        <RowIcon
          tone="primary"
          icon={<ScanFace size={iconSize.xl} color={theme.colors.actionPrimary} />}
        />
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography variant="h3" center>
            Let&apos;s scan your face
          </Typography>
          <Typography variant="body-sm" color="secondary" center style={{ maxWidth: 280 }}>
            Good lighting · No glasses/mask · Eye-level camera
          </Typography>
        </View>
        <Alert variant="warning" style={{ alignSelf: 'stretch' }}>
          This step is mandatory and cannot be skipped
        </Alert>
      </View>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel="Start face scan"
          onPress={() => router.push('/(onboarding)/face-scan')}>
          Start Face Scan
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
