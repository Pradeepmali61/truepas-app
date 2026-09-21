/**
 * Welcome — brand hero + the two entry points (register / login).
 * Concentric soft-UI badge with a breathing pulse, staggered entrances.
 * No back button: this is the root of the signed-out stack.
 * Ported 1:1 from UI-design-repo src/app/screens/auth/WelcomeScreen.tsx.
 */
import { useRouter } from 'expo-router';
import { IdCard, ScanFace, ShieldCheck, Users, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoreButton, FadeUp, Link, NeuBox, NeuWell, PopIn, Pulse, ScanFrame, ScanLine, Typography } from '@/components/ui';
import { alpha, makeStyles, useThemeTokens } from '@/theme';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ScanFace, title: 'Face check-in', body: 'A glance is all it takes to get in.' },
  { icon: Users, title: 'Family profiles', body: 'Add your kids and manage entry together.' },
  { icon: IdCard, title: 'Verified documents', body: 'Your IDs, checked once and ready anywhere.' },
];

export default function WelcomeScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: t.spacing[4],
          paddingTop: t.spacing[4],
          gap: t.spacing[6],
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ScanFrame padding={12} style={styles.heroFrame}>
            <PopIn ms={420}>
              <NeuWell radius={t.radii.full} style={styles.halo}>
                <Pulse to={1.05} ms={1400}>
                  <NeuBox variant="raised" radius={t.radii.full} depth={8} style={styles.ring}>
                    <View style={styles.disc}>
                      <ScanLine color={alpha(t.colors.onActionPrimary, 0.8)} />
                      <ScanFace size={t.iconSize.lg} color={t.colors.onActionPrimary} />
                    </View>
                  </NeuBox>
                </Pulse>
              </NeuWell>
            </PopIn>
          </ScanFrame>
          <FadeUp delay={140}>
            <Typography variant="display" center>
              Truepas
            </Typography>
          </FadeUp>
          <FadeUp delay={220}>
            <Typography variant="body-lg" color="secondary" center>
              Your face is your ticket — contactless check-in for you and your family.
            </Typography>
          </FadeUp>
        </View>

        <FadeUp delay={330}>
          <NeuBox variant="raised" style={styles.featureCard}>
            {FEATURES.map((f, i) => (
              <View key={f.title} style={[styles.featureRow, i > 0 && styles.featureDivider]}>
                <View style={styles.featureIcon}>
                  <f.icon size={t.iconSize.md} color={t.colors.actionPrimary} />
                </View>
                <View style={styles.featureText}>
                  <Typography variant="body" style={styles.featureTitle}>
                    {f.title}
                  </Typography>
                  <Typography variant="body-sm" color="muted">
                    {f.body}
                  </Typography>
                </View>
              </View>
            ))}
          </NeuBox>
        </FadeUp>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: t.spacing[4],
          paddingTop: t.spacing[4],
          paddingBottom: t.spacing[4] + insets.bottom,
          gap: t.spacing[2],
        }}>
        <CoreButton
          fullWidth
          size="lg"
          iconLeft={<ShieldCheck size={t.iconSize.md} color={t.colors.onActionPrimary} />}
          onPress={() => router.push('/(auth)/register')}>
          Create account
        </CoreButton>
        <Typography variant="body-sm" color="muted" center>
          Already have an account? <Link onPress={() => router.push('/(auth)/login')}>Sign in</Link>
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  hero: {
    alignItems: 'center',
    gap: t.spacing[3],
    paddingTop: t.spacing[8],
    paddingBottom: t.spacing[4],
  },
  heroFrame: { marginBottom: t.spacing[3] },
  halo: {
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    width: 68,
    height: 68,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...t.shadows.lg,
  },
  featureCard: { padding: t.spacing[2], marginTop: t.spacing[4] },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing[3],
    padding: t.spacing[3],
  },
  featureDivider: {
    borderTopWidth: t.sizes.fieldBorderWidth,
    borderTopColor: t.colors.borderSubtle,
  },
  featureIcon: {
    width: t.sizes.touchTarget,
    height: t.sizes.touchTarget,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: t.spacing[0.5] },
  featureTitle: { fontWeight: t.fontWeight.semibold },
}));
