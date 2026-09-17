/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { checkAllHealth } from '@/api/health';
import { mockUser } from '@/api/mock';
import { Card, CardContent } from '@/components/composite';
import { CoreButton, Divider, Typography } from '@/components/ui';
import { faceEnrollmentCompleted, sessionEnded, sessionStarted } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import type { HealthStatus } from '@/types/domain';

type AuthPreset = 'unauth' | 'auth-no-face' | 'auth-face';

interface ScreenEntry {
  label: string;
  route: string;
  preset: AuthPreset;
}

const GROUPS: { title: string; screens: ScreenEntry[] }[] = [
  {
    title: 'AUTH',
    screens: [
      { label: 'Welcome carousel', route: '/(auth)/welcome', preset: 'unauth' },
      { label: 'Register — create account', route: '/(auth)/register', preset: 'unauth' },
      { label: 'Verify phone (OTP)', route: '/(auth)/verify-phone', preset: 'unauth' },
      { label: 'Verify email (OTP)', route: '/(auth)/verify-email', preset: 'unauth' },
      { label: 'Account details + PIN', route: '/(auth)/account-details', preset: 'unauth' },
      { label: 'Login', route: '/(auth)/login', preset: 'unauth' },
      { label: 'Forgot — email', route: '/(auth)/forgot-password', preset: 'unauth' },
      { label: 'Forgot — reset password', route: '/(auth)/forgot-password?step=reset', preset: 'unauth' },
    ],
  },
  {
    title: 'ONBOARDING',
    screens: [
      { label: 'Biometric consent', route: '/(onboarding)/consent', preset: 'auth-no-face' },
      { label: 'Face scan intro', route: '/(onboarding)/face-scan', preset: 'auth-no-face' },
      { label: 'Face enrolled success', route: '/(onboarding)/face-enrolled', preset: 'auth-no-face' },
    ],
  },
  {
    title: 'TABS',
    screens: [
      { label: 'Identity tab', route: '/(tabs)', preset: 'auth-face' },
      { label: 'Documents tab', route: '/(tabs)/documents', preset: 'auth-face' },
      { label: 'History tab', route: '/(tabs)/history', preset: 'auth-face' },
    ],
  },
  {
    title: 'PROFILE & SETTINGS',
    screens: [
      { label: 'Profile hub', route: '/profile', preset: 'auth-face' },
      { label: 'Edit profile', route: '/profile/edit', preset: 'auth-face' },
      { label: 'Security settings', route: '/security', preset: 'auth-face' },
      { label: 'Confirm PIN gate', route: '/security/confirm-pin?next=/security', preset: 'auth-face' },
      { label: 'Change PIN', route: '/security/change-pin', preset: 'auth-face' },
      { label: 'Change password', route: '/security/change-password', preset: 'auth-face' },
    ],
  },
  {
    title: 'FACE UPDATE',
    screens: [
      { label: 'PIN verification', route: '/face-update/pin', preset: 'auth-face' },
      { label: 'Camera capture', route: '/face-update/camera', preset: 'auth-face' },
      { label: 'ROC retry error', route: '/face-update/error', preset: 'auth-face' },
      { label: 'Success', route: '/face-update/success', preset: 'auth-face' },
    ],
  },
  {
    title: 'DOCUMENT VERIFICATION',
    screens: [
      { label: 'Select document type', route: '/document/select-type', preset: 'auth-face' },
      { label: 'Document scan', route: '/document/scan', preset: 'auth-face' },
      { label: 'Processing / matching', route: '/document/processing', preset: 'auth-face' },
      { label: 'Details mismatch', route: '/document/mismatch', preset: 'auth-face' },
      { label: 'Verified success', route: '/document/verified', preset: 'auth-face' },
    ],
  },
  {
    title: 'FAMILY',
    screens: [
      { label: 'Add family — basic info', route: '/family/add', preset: 'auth-face' },
      { label: 'Add family — document (5-17)', route: '/family/add/document?name=Max+Kim&band=5-17', preset: 'auth-face' },
      { label: 'Add family — document (0-4)', route: '/family/add/document?name=Lily+Kim&band=0-4', preset: 'auth-face' },
      { label: 'Add family — face capture', route: '/family/add/face-capture?name=Max', preset: 'auth-face' },
      { label: 'Add family — photo capture (0-4)', route: '/family/add/photo-capture?name=Noah&age=3&personId=f1', preset: 'auth-face' },
      { label: '18+ rejected', route: '/family/add/rejected?name=John&age=20', preset: 'auth-face' },
      { label: 'Family member detail', route: '/family/f1', preset: 'auth-face' },
    ],
  },
  {
    title: 'BOOKING',
    screens: [
      { label: 'Booking detail', route: '/booking/b1', preset: 'auth-face' },
    ],
  },
  {
    title: 'ACCOUNT & LEGAL',
    screens: [
      { label: 'Delete account — warning', route: '/account/delete', preset: 'auth-face' },
      { label: 'Delete account — processing', route: '/account/delete/processing', preset: 'auth-face' },
      { label: 'Delete account — success', route: '/account/delete/success', preset: 'auth-face' },
      { label: 'Data & privacy', route: '/legal/data-privacy', preset: 'auth-face' },
      { label: 'Privacy policy', route: '/legal/privacy-policy', preset: 'auth-face' },
      { label: 'Terms of service', route: '/legal/terms', preset: 'auth-face' },
    ],
  },
  {
    title: 'NOTIFICATION',
    screens: [
      { label: 'Age-18 transition', route: '/notification/age-18', preset: 'auth-face' },
      { label: 'Notifications inbox', route: '/notification', preset: 'auth-face' },
    ],
  },
];

const PRESET_LABELS: Record<AuthPreset, string> = {
  unauth: 'Unauthenticated',
  'auth-no-face': 'Auth + No Face',
  'auth-face': 'Auth + Face Enrolled',
};

function HealthRow({ label, url, status }: { label: string; url: string; status?: HealthStatus }) {
  const theme = useThemeTokens();
  const loading = status === undefined;
  const healthy = status?.healthy === true;
  const dotColor = loading ? theme.colors.textMuted : healthy ? theme.colors.success : theme.colors.error;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
      <View style={{ width: 8, height: 8, borderRadius: theme.radii.full, backgroundColor: dotColor }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body-sm" style={{ fontWeight: theme.fontWeight.medium }}>
          {label}
        </Typography>
        <Typography variant="caption" color="muted" numberOfLines={1}>
          {url}
        </Typography>
      </View>
      <Typography variant="caption" style={{ fontWeight: theme.fontWeight.semibold, color: dotColor }}>
        {loading ? '…' : healthy ? 'Healthy' : 'Down'}
      </Typography>
    </View>
  );
}

export default function DevScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useThemeTokens();
  const [health, setHealth] = useState<{ bff: HealthStatus } | null>(null);

  const refreshHealth = useCallback(async () => {
    const result = await checkAllHealth();
    setHealth(result);
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const applyPreset = (preset: AuthPreset) => {
    if (preset === 'unauth') {
      dispatch(sessionEnded());
    } else if (preset === 'auth-no-face') {
      dispatch(
        sessionStarted({
          user: { ...mockUser, faceEnrolled: false, biometricConsentAt: null },
          accessToken: 'dev-token',
        }),
      );
    } else {
      dispatch(sessionStarted({ user: mockUser, accessToken: 'dev-token' }));
      dispatch(faceEnrollmentCompleted());
    }
  };

  const navigate = (entry: ScreenEntry) => {
    applyPreset(entry.preset);
    router.push(entry.route as never);
  };

  const presetColors: Record<AuthPreset, string> = {
    unauth: theme.colors.error,
    'auth-no-face': theme.colors.warning,
    'auth-face': theme.colors.success,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: theme.spacing[10] }}>
        <View
          style={{
            backgroundColor: theme.colors.actionPrimary,
            paddingHorizontal: theme.spacing[5],
            paddingTop: theme.spacing[3],
            paddingBottom: theme.spacing[4],
          }}>
          <Typography variant="h3" style={{ color: theme.colors.onActionPrimary }}>
            Dev Screen Browser
          </Typography>
          <Typography variant="body-sm" style={{ color: 'rgba(255,255,255,0.7)', marginTop: theme.spacing[1] }}>
            Tap any screen to jump directly to it
          </Typography>
        </View>

        {/* Backend status */}
        <Card style={{ marginHorizontal: theme.spacing[5], marginTop: theme.spacing[3] }}>
          <CardContent style={{ gap: theme.spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body-sm" style={{ fontWeight: theme.fontWeight.semibold }}>
                Backend Status
              </Typography>
              <Pressable onPress={refreshHealth} hitSlop={8} accessibilityRole="button" accessibilityLabel="Refresh health">
                <Typography variant="body-sm" style={{ color: theme.colors.actionPrimary, fontWeight: theme.fontWeight.medium }}>
                  Refresh
                </Typography>
              </Pressable>
            </View>
            <HealthRow
              label="customer-app-bff"
              url="https://api.dev.truepas.com/cb"
              status={health?.bff}
            />
          </CardContent>
        </Card>

        {/* Auth presets */}
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], paddingHorizontal: theme.spacing[5], paddingVertical: theme.spacing[3] }}>
          {(['unauth', 'auth-no-face', 'auth-face'] as AuthPreset[]).map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityLabel={`Preset ${PRESET_LABELS[p]}`}
              onPress={() => applyPreset(p)}
              style={{
                flex: 1,
                borderRadius: theme.radii.md,
                borderWidth: theme.sizes.fieldBorderWidth,
                borderColor: presetColors[p],
                paddingVertical: theme.spacing[2],
                alignItems: 'center',
              }}>
              <Typography variant="caption" style={{ fontWeight: theme.fontWeight.semibold, color: presetColors[p] }}>
                {PRESET_LABELS[p]}
              </Typography>
            </Pressable>
          ))}
        </View>

        {GROUPS.map((group) => (
          <View key={group.title}>
            <Typography
              variant="caption"
              color="muted"
              style={{
                marginHorizontal: theme.spacing[5],
                marginTop: theme.spacing[4],
                marginBottom: theme.spacing[1.5],
                letterSpacing: theme.letterSpacing.caps,
              }}>
              {group.title}
            </Typography>
            {group.screens.map((screen) => (
              <Pressable
                key={screen.route}
                accessibilityRole="button"
                accessibilityLabel={screen.label}
                onPress={() => navigate(screen)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: theme.spacing[5],
                    paddingVertical: theme.spacing[3],
                  },
                  pressed && { backgroundColor: theme.colors.background },
                ]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body-sm" style={{ fontWeight: theme.fontWeight.medium }}>
                    {screen.label}
                  </Typography>
                  <Typography variant="caption" color="muted" style={{ marginTop: theme.spacing[0.5] }}>
                    {screen.route}
                  </Typography>
                </View>
                <View
                  style={{
                    marginLeft: theme.spacing[2],
                    borderRadius: theme.radii.sm,
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: theme.spacing[1],
                    backgroundColor: presetColors[screen.preset] + '20',
                  }}>
                  <Typography variant="caption" style={{ fontWeight: theme.fontWeight.semibold, color: presetColors[screen.preset] }}>
                    {PRESET_LABELS[screen.preset]}
                  </Typography>
                </View>
              </Pressable>
            ))}
            <Divider style={{ marginHorizontal: theme.spacing[5], marginTop: theme.spacing[1] }} />
          </View>
        ))}

        <View style={{ marginTop: theme.spacing[6], paddingHorizontal: theme.spacing[5] }}>
          <CoreButton
            fullWidth
            accessibilityLabel="Resume normal flow"
            onPress={() => router.replace('/' as never)}>
            Resume Normal Flow
          </CoreButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
