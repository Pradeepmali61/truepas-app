import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, ListChecks, ScanFace, Sun, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader, Section } from '@/components/composite';
import { CoreButton, NeuBox, Typography } from '@/components/ui';
import { CameraUnavailable, loadLivenessCamera } from '@/features/liveness/cameraModule';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Add family — step 3: liveness + face enrollment for ages 5+.
 *  Shows the FamilyEnrollScreen checklist card first (UI-design-repo), then
 *  mounts LivenessCamera with personId for family member face enrollment.
 *  The addFamilyMember call should have been made on the document step,
 *  and the personId should be passed from there.
 *  Members under 10 get the front/back camera toggle (a parent holds the
 *  phone while the child faces the rear camera); 10+ stays front-only. */
const LivenessCamera = loadLivenessCamera();

const CHECKLIST: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ListChecks, title: 'Follow the prompts', body: 'A few quick movements on camera.' },
  { icon: Sun, title: 'Good light', body: 'Hold still facing the camera.' },
  { icon: CircleCheck, title: 'Automatic enrollment', body: 'The face enrolls as soon as liveness passes.' },
];

export default function FamilyFaceCaptureScreen() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { personId, name, age } = useLocalSearchParams<{ personId?: string; name?: string; age?: string }>();
  const ageNum = age != null ? Number(age) : NaN;
  const allowBackCamera = Number.isFinite(ageNum) && ageNum < 10;
  const [started, setStarted] = useState(false);

  const goToMemberDetail = () => {
    if (personId) {
      router.replace({ pathname: '/family/[id]', params: { id: personId } });
    } else {
      router.dismissTo('/(tabs)');
    }
  };

  if (!started) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScreenHeader
          title={name ?? 'Face enrollment'}
          subtitle={Number.isFinite(ageNum) ? `Age ${ageNum} · liveness` : 'Liveness check'}
          onBack={() => router.back()}
        />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <NeuBox variant="raised" depth={6} color={theme.colors.surface} style={styles.card}>
            <View style={styles.cardHead}>
              <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />
              <Typography variant="h4">Liveness check</Typography>
            </View>
            <Section>
              {CHECKLIST.map(({ icon: RowIcon, title, body }) => (
                <View key={title} style={styles.checkRow}>
                  <View style={styles.checkIcon}>
                    <RowIcon size={iconSize.sm} color={theme.colors.actionPrimary} />
                  </View>
                  <View style={styles.checkText}>
                    <Typography variant="body-sm">{title}</Typography>
                    <Typography variant="caption" color="muted">
                      {body}
                    </Typography>
                  </View>
                </View>
              ))}
            </Section>
            <Typography variant="caption" color="muted">
              {allowBackCamera ? 'Front camera · Back camera' : 'Front camera'}
            </Typography>
          </NeuBox>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: theme.spacing[4] + insets.bottom }]}>
          <CoreButton
            fullWidth
            size="lg"
            accessibilityLabel="Start face verification"
            onPress={() => setStarted(true)}>
            Start face verification
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }

  if (!LivenessCamera) return <CameraUnavailable />;

  return (
    <LivenessCamera
      mode="enroll"
      personId={personId}
      allowBackCamera={allowBackCamera}
      onSuccess={goToMemberDetail}
    />
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: t.spacing[4], gap: t.spacing[6] },
  card: { padding: t.spacing[4], gap: t.spacing[3] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { flex: 1, gap: t.spacing[0.5] },
  footer: {
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[4],
    gap: t.spacing[2],
  },
}));
