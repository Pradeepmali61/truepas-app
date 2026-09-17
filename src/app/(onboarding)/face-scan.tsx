import { useRouter } from 'expo-router';
import { Eye, Fingerprint, Lock, ScanFace } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, Card, CardContent, ScreenHeader } from '@/components/composite';
import { CoreButton, Progress, Pulse, RowIcon, Typography } from '@/components/ui';
import { CameraUnavailable, loadLivenessCamera } from '@/features/liveness/cameraModule';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Face scan — mandatory liveness + face enrollment gate (no skip, PRD v2.0).
 *  Shows the "Identity verification" intro (step preview + consent note) first;
 *  "Start verification" opens the LivenessCamera, lazy-required so builds
 *  without NitroModules show a fallback. */
const LivenessCamera = loadLivenessCamera();

export default function FaceScanScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [started, setStarted] = useState(false);

  if (!LivenessCamera) return <CameraUnavailable />;

  if (!started) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Identity verification" onBack={() => router.back()} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
          showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2], paddingVertical: theme.spacing[4] }}>
            <Pulse to={1.06} ms={1400}>
              <RowIcon
                tone="primary"
                icon={<Fingerprint size={iconSize.xl} color={theme.colors.actionPrimary} />}
              />
            </Pulse>
            <Typography variant="h3">One quick check</Typography>
            <Typography color="secondary" center>
              We&apos;ll verify your face against your document. Takes about 10 seconds.
            </Typography>
          </View>
          <Card>
            <CardContent style={{ gap: theme.spacing[3] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                <RowIcon icon={<ScanFace size={iconSize.md} color={theme.colors.textSecondary} />} />
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Typography variant="body">Show your face</Typography>
                  <Typography variant="body-sm" color="muted">Step 1 · camera opens</Typography>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                <RowIcon icon={<Eye size={iconSize.md} color={theme.colors.textSecondary} />} />
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Typography variant="body">Blink + turn left</Typography>
                  <Typography variant="body-sm" color="muted">Step 2 · liveness check</Typography>
                </View>
              </View>
            </CardContent>
          </Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <Lock size={iconSize.xs} color={theme.colors.textMuted} />
            <Typography variant="caption" color="muted" style={{ flex: 1 }}>
              Biometric data is processed on-device and discarded after verification.
            </Typography>
          </View>
        </ScrollView>
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
            accessibilityLabel="Start verification"
            onPress={() => setStarted(true)}>
            Start verification
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LivenessCamera
      mode="enroll"
      onSuccess={() => router.replace('/(onboarding)/face-enrolled')}
      onError={(msg: string) => {
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
