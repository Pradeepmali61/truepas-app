import { Redirect, useRouter } from 'expo-router';
import { ListChecks, ScanFace, Sun, Timer, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, ScreenHeader } from '@/components/composite';
import { CoreButton, NeuBox, NeuWell, Progress, Pulse, RowIcon, Typography } from '@/components/ui';
import { CameraUnavailable, loadLivenessCamera } from '@/features/liveness/cameraModule';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const POINTS: { icon: LucideIcon; title: string }[] = [
  { icon: ListChecks, title: 'Follow the on-screen prompts' },
  { icon: Sun, title: 'Hold still in good light' },
  { icon: Timer, title: 'The session expires after a few minutes' },
];

/** Face scan — mandatory liveness + face enrollment gate (no skip, PRD v2.0).
 *  Shows the "Prove it's really you" prep screen first (mirrors the
 *  UI-design-repo FaceVerification intro); "Start verification" opens the
 *  LivenessCamera, lazy-required so builds without NitroModules show a
 *  fallback. */
const LivenessCamera = loadLivenessCamera();

export default function FaceScanScreen() {
  const theme = useThemeTokens();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [started, setStarted] = useState(false);
  // Liveness only runs after explicit biometric consent — a deep link to this
  // screen must go through the consent step first.
  const biometricConsent = useAppSelector((state) => state.auth.biometricConsent);

  if (!biometricConsent) return <Redirect href="/(onboarding)/consent" />;

  if (!started) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScreenHeader title="Face verification" onBack={() => router.back()} />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.introStage}>
            <NeuBox variant="raised" depth={6} style={styles.hero}>
              <Pulse to={1.05} ms={1400}>
                <NeuWell radius={theme.radii.full} style={styles.heroTarget}>
                  <ScanFace size={theme.iconSize.xl} color={theme.colors.actionPrimary} />
                </NeuWell>
              </Pulse>
              <Typography variant="h3" center>
                Prove it&apos;s really you
              </Typography>
              <Typography variant="body-sm" color="secondary" center>
                We&apos;ll guide you through a few quick movements on camera.
              </Typography>
            </NeuBox>

            <NeuBox variant="raised" depth={4} color={theme.colors.surface} style={styles.bulletCard}>
              <View style={styles.bullets}>
                {POINTS.map(({ icon: BulletIcon, title }) => (
                  <View key={title} style={styles.bulletRow}>
                    <View style={styles.bulletIcon}>
                      <BulletIcon size={theme.iconSize.sm} color={theme.colors.actionPrimary} />
                    </View>
                    <Typography variant="body-sm" color="secondary" style={styles.bulletText}>
                      {title}
                    </Typography>
                  </View>
                ))}
              </View>
            </NeuBox>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: theme.spacing[4] + insets.bottom }]}>
          <CoreButton
            fullWidth
            size="lg"
            accessibilityLabel="Start verification"
            onPress={() => setStarted(true)}>
            Start
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }

  // Only checked after "Start verification" — without the native camera
  // module (Expo Go) the intro must still render.
  if (!LivenessCamera) return <CameraUnavailable />;

  return (
    <LivenessCamera
      mode="enroll"
      onSuccess={() => router.replace('/(onboarding)/face-enrolled')}
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

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: t.spacing[6] },
  // Design: the two cards sit vertically centered in the free space.
  introStage: {
    flex: 1,
    justifyContent: 'center',
    gap: t.spacing[6],
    paddingHorizontal: t.spacing[4],
  },
  hero: { alignItems: 'center', gap: t.spacing[3], padding: t.spacing[6] },
  heroTarget: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletCard: { padding: t.spacing[4] },
  bullets: { gap: t.spacing[4] },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: { flex: 1 },
  footer: {
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[4],
    borderTopWidth: t.sizes.fieldBorderWidth,
    borderTopColor: t.colors.borderSubtle,
    backgroundColor: t.colors.surface,
  },
}));
