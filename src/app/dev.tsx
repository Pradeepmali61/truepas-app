/** @jsxImportSource react */
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setDevMockApi } from '@/api';
import { setRegistrationToken } from '@/api/client';
import { checkAllHealth } from '@/api/health';
import { mockUser } from '@/api/mock';
import { Card, CardContent } from '@/components/composite';
import { CoreButton, Divider, Typography } from '@/components/ui';
import {
    biometricConsentGiven,
    faceEnrollmentCompleted,
    sessionEnded,
    sessionStarted,
} from '@/features/auth/slice';
import { accountDetailsStore } from '@/services/accountDetailsStore';
import { flowGuards } from '@/services/flowGuards';
import { setScanResult } from '@/services/scanStore';
import { useAppDispatch, type AppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import type { HealthStatus } from '@/types/domain';

type AuthPreset = 'unauth' | 'auth-no-face' | 'auth-face';

interface ScreenEntry {
  label: string;
  route: string;
  preset: AuthPreset;
  /** Runs after the auth preset and before router.push — grants the
   *  one-shot flowGuards flags / in-memory tokens the target screen's
   *  deep-link guard requires, so the entry lands on the screen itself
   *  instead of being bounced to the start of its flow. */
  prepare?: (dispatch: AppDispatch) => void;
  /** Turns the dev mock override back OFF for this entry — use for screens
   *  like Login where the dev wants the real BFF to answer (real
   *  credentials → real session), not the mock fixtures. */
  realApi?: boolean;
}

// 1×1 PNG — stands in for a captured scan so /document/processing runs
// the verification flow instead of rendering its "no image" error state.
const DEV_SCAN_IMAGE_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const GROUPS: { title: string; screens: ScreenEntry[] }[] = [
  {
    title: 'AUTH',
    screens: [
      { label: 'Welcome carousel', route: '/(auth)/welcome', preset: 'unauth' },
      { label: 'Register — create account', route: '/(auth)/register', preset: 'unauth' },
      {
        label: 'Verify phone (OTP)',
        // Screen requires phone + registrationId params — without them it
        // bounces back to register.
        route: '/(auth)/verify-phone?phone=5550102938&registrationId=dev-reg-1',
        preset: 'unauth',
      },
      {
        label: 'Verify email (OTP)',
        route: '/(auth)/verify-email?email=sarah.kim@example.com',
        preset: 'unauth',
        // Resend re-submits the stashed account-details payload with the
        // registration token — without both, Resend throws.
        prepare: () => {
          setRegistrationToken('dev-registration-token');
          accountDetailsStore.stash({
            fullName: 'Sarah Kim',
            dateOfBirth: '04/12/1990',
            pin: '1234',
            email: 'sarah.kim@example.com',
            password: 'password123',
            confirmPassword: 'password123',
          });
        },
      },
      {
        label: 'Account details + PIN',
        route: '/(auth)/account-details',
        preset: 'unauth',
        // Screen submits with the in-memory registration token issued by
        // phone OTP — without it the deep-link guard bounces to register.
        prepare: () => setRegistrationToken('dev-registration-token'),
      },
      {
        label: 'Login',
        route: '/(auth)/login',
        preset: 'unauth',
        // Real sign-in must reach the BFF — otherwise mockApi.login returns
        // the fixture user no matter which credentials are entered.
        realApi: true,
      },
      { label: 'Forgot — email', route: '/(auth)/forgot-password', preset: 'unauth' },
      { label: 'Forgot — reset password', route: '/(auth)/forgot-password?step=reset', preset: 'unauth' },
    ],
  },
  {
    title: 'ONBOARDING',
    screens: [
      { label: 'Biometric consent — "Faster check-in"', route: '/(onboarding)/consent', preset: 'auth-no-face' },
      {
        label: 'Face scan intro',
        route: '/(onboarding)/face-scan',
        preset: 'auth-no-face',
        // Requires biometric consent — the preset alone leaves it false.
        prepare: (dispatch) => dispatch(biometricConsentGiven()),
      },
      {
        label: 'Face enrolled success',
        route: '/(onboarding)/face-enrolled',
        preset: 'auth-no-face',
        prepare: () => flowGuards.grant('onboarding:face-enrolled'),
      },
      // Liveness stage UIs live inside LivenessCamera (no camera on web) —
      // these preview them with mock data + a placeholder face target.
      { label: 'Liveness — challenge (preview)', route: '/dev-liveness?stage=challenge', preset: 'auth-no-face' },
      { label: 'Liveness — verifying (preview)', route: '/dev-liveness?stage=finishing', preset: 'auth-no-face' },
      { label: 'Liveness — verified (preview)', route: '/dev-liveness?stage=passed', preset: 'auth-no-face' },
      { label: 'Liveness — failed (preview)', route: '/dev-liveness?stage=failed', preset: 'auth-no-face' },
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
      {
        label: 'Camera capture',
        route: '/face-update/camera',
        preset: 'auth-face',
        prepare: () => flowGuards.grant('face-update:camera'),
      },
      { label: 'ROC retry error', route: '/face-update/error', preset: 'auth-face' },
      {
        label: 'Success',
        route: '/face-update/success',
        preset: 'auth-face',
        prepare: () => flowGuards.grant('face-update:done'),
      },
    ],
  },
  {
    title: 'DOCUMENT VERIFICATION',
    screens: [
      { label: 'Identity dashboard', route: '/identity', preset: 'auth-face' },
      { label: 'Select document type', route: '/document/select-type', preset: 'auth-face' },
      { label: 'Document scan', route: '/document/scan', preset: 'auth-face' },
      {
        label: 'Processing / matching',
        route: '/document/processing?type=passport&label=Passport',
        preset: 'auth-face',
        // Runs the verify flow — needs a captured scan in scanStore.
        prepare: () =>
          setScanResult({ documentImageBase64: DEV_SCAN_IMAGE_B64, selfieBase64: DEV_SCAN_IMAGE_B64 }),
      },
      {
        label: 'Details mismatch',
        route: '/document/mismatch?docId=d1&profileName=Sarah+Kim&profileDob=04%2F12%2F1990&docName=Sara+Kim&docDob=04%2F21%2F1990',
        preset: 'auth-face',
        prepare: () => flowGuards.grant('document:mismatch'),
      },
      {
        label: 'Verified success',
        route: '/document/verified?docId=d1&docLabel=Passport&docType=passport&outcome=approved&matchScore=0.95&extractedName=Sarah+Kim&extractedDob=04%2F12%2F1990',
        preset: 'auth-face',
        prepare: () => flowGuards.grant('document:verified'),
      },
    ],
  },
  {
    title: 'FAMILY',
    screens: [
      { label: 'Add family — basic info', route: '/family/add', preset: 'auth-face' },
      { label: 'Add family — document (5-9)', route: '/family/add/document?name=Max+Kim&band=5-9&dob=2018-06-15&relationship=Child', preset: 'auth-face' },
      { label: 'Add family — document (0-4)', route: '/family/add/document?name=Lily+Kim&band=0-4&dob=2023-03-10&relationship=Child', preset: 'auth-face' },
      { label: 'Add family — face capture (5-9)', route: '/family/add/face-capture?name=Max&age=7&personId=f1', preset: 'auth-face' },
      { label: 'Add family — photo capture (0-4)', route: '/family/add/photo-capture?name=Noah&age=3&personId=f1', preset: 'auth-face' },
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
      {
        label: 'Delete account — processing',
        route: '/account/delete/processing',
        preset: 'auth-face',
        prepare: () => flowGuards.grant('account:deleting'),
      },
      {
        label: 'Delete account — success',
        route: '/account/delete/success',
        preset: 'auth-face',
        prepare: () => flowGuards.grant('account:deleted'),
      },
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
  // Dev-menu presets forge auth state locally — the route must not exist
  // for end users in a release build.
  if (!__DEV__) return <Redirect href="/" />;
  return <DevScreenInner />;
}

function DevScreenInner() {
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
    // The presets forge a fake session — the real BFF rejects 'dev-token'
    // (401 → session-expired → bounce to login), so browsing runs on mock.
    setDevMockApi(true);
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
    if (entry.realApi) setDevMockApi(false);
    entry.prepare?.(dispatch);
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
            onPress={() => {
              setDevMockApi(false);
              router.replace('/' as never);
            }}>
            Resume Normal Flow
          </CoreButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
