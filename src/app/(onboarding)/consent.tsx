import { useRouter } from 'expo-router';
import { Info, ScanFace, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/composite/Toast';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { NeuBox, NeuWell } from '@/components/ui/NeuBox';
import { Typography } from '@/components/ui/Typography';
import { useBiometricConsent } from '@/features/auth/mutations';
import { biometricConsentGiven } from '@/features/auth/slice';
import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useAppDispatch } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';

const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ScanFace,
    title: 'A quick liveness check',
    body: "A short guided scan proves it's really you — photos and masks are rejected.",
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted face template',
    body: 'Truepas stores a mathematical template — never your photo — to verify you at venues.',
  },
  {
    icon: Info,
    title: 'Required to continue',
    body: "Face check-in is how Truepas works, so this step can't be skipped. Withdraw later in Settings.",
  },
];

/** Biometric consent — POST /user/me/biometric-consent { accepted: true }.
 *  Mandatory gate before liveness enrollment: accept → face-scan or sign out.
 *  Layout mirrors UI-design-repo ConsentScreen 1:1. */
export default function ConsentScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { logout, isPending: signingOut } = useLogoutFlow();
  const biometricConsent = useBiometricConsent();
  const loading = biometricConsent.isPending || signingOut;

  const accept = async () => {
    if (loading) return;
    try {
      await biometricConsent.mutateAsync({ accepted: true });
      dispatch(biometricConsentGiven());
      router.push('/(onboarding)/face-scan');
    } catch (err: any) {
      toast({
        variant: 'error',
        title: "Couldn't save consent",
        description: err?.message ?? 'Check your connection and try again.',
      });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          <View style={styles.hero}>
            <NeuBox variant="raised" radius={t.radii.full} depth={8} style={styles.heroBadge}>
              <ScanFace size={t.iconSize.xl} color={t.colors.actionPrimary} />
            </NeuBox>
            <Typography variant="h2" center>
              Faster check-in with your face
            </Typography>
            <Typography color="secondary" center>
              Truepas verifies it&apos;s really you at venues — one glance, no phone, no wallet.
            </Typography>
          </View>

          <NeuBox variant="raised" depth={5} color={t.colors.surface} style={styles.card}>
            {POINTS.map((p, i) => (
              <View key={p.title}>
                {i > 0 && <Divider />}
                <View style={styles.pointRow}>
                  <NeuWell radius={t.radii.full} style={styles.pointIcon}>
                    <p.icon size={t.iconSize.md} color={t.colors.actionPrimary} />
                  </NeuWell>
                  <View style={styles.pointText}>
                    <Typography variant="body" style={styles.pointTitle}>
                      {p.title}
                    </Typography>
                    <Typography variant="body-sm" color="muted">
                      {p.body}
                    </Typography>
                  </View>
                </View>
              </View>
            ))}
          </NeuBox>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: t.spacing[4] + insets.bottom }]}>
        <Button
          fullWidth
          size="lg"
          loading={biometricConsent.isPending}
          disabled={loading}
          onPress={accept}
          accessibilityLabel="Accept and continue">
          Accept and continue
        </Button>
        <Button
          fullWidth
          variant="ghost"
          disabled={loading}
          onPress={logout}
          style={styles.signOut}
          accessibilityLabel="Sign out instead">
          Sign out instead
        </Button>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: t.spacing[6] },
  body: { flex: 1, gap: t.spacing[6], paddingHorizontal: t.spacing[4], paddingTop: t.spacing[4] },
  hero: {
    alignItems: 'center',
    gap: t.spacing[3],
    paddingTop: t.spacing[8],
    paddingBottom: t.spacing[2],
  },
  heroBadge: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing[2],
  },
  card: { padding: t.spacing[4], gap: t.spacing[3] },
  footer: {
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[4],
    gap: t.spacing[2],
  },
  signOut: { marginTop: t.spacing[4] },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing[3] },
  pointIcon: {
    width: t.sizes.touchTarget,
    height: t.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1, gap: t.spacing[0.5] },
  pointTitle: { fontWeight: t.fontWeight.semibold },
}));
