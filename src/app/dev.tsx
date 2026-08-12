import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mockUser } from '@/api/mock';
import { faceEnrollmentCompleted, sessionEnded, sessionStarted } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

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
      { label: 'Register — phone number', route: '/(auth)/register', preset: 'unauth' },
      { label: 'Verify phone (OTP)', route: '/(auth)/verify-phone', preset: 'unauth' },
      { label: 'Verify email (OTP)', route: '/(auth)/verify-email', preset: 'unauth' },
      { label: 'Account details + PIN', route: '/(auth)/account-details', preset: 'unauth' },
      { label: 'Login', route: '/(auth)/login', preset: 'unauth' },
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
      { label: 'Family tab', route: '/(tabs)/family', preset: 'auth-face' },
      { label: 'History tab', route: '/(tabs)/history', preset: 'auth-face' },
    ],
  },
  {
    title: 'PROFILE & SETTINGS',
    screens: [
      { label: 'Profile hub', route: '/profile', preset: 'auth-face' },
      { label: 'Edit profile', route: '/profile/edit', preset: 'auth-face' },
      { label: 'Security settings', route: '/security', preset: 'auth-face' },
      { label: 'Change PIN', route: '/security/change-pin', preset: 'auth-face' },
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
      { label: 'Delete account — confirm', route: '/account/delete/confirm', preset: 'auth-face' },
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
    ],
  },
];

const PRESET_LABELS: Record<AuthPreset, string> = {
  unauth: 'Unauthenticated',
  'auth-no-face': 'Auth + No Face',
  'auth-face': 'Auth + Face Enrolled',
};

const PRESET_COLORS: Record<AuthPreset, string> = {
  unauth: '#ef4444',
  'auth-no-face': '#ff9900',
  'auth-face': '#059669',
};

export default function DevScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-primary px-5 pb-4 pt-3">
          <Text className="text-[20px] font-bold text-white">Dev Screen Browser</Text>
          <Text className="mt-1 text-[13px] text-white/70">
            Tap any screen to jump directly to it
          </Text>
        </View>

        <View className="flex-row gap-2 px-5 py-3">
          {(['unauth', 'auth-no-face', 'auth-face'] as AuthPreset[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => applyPreset(p)}
              className="flex-1 rounded-btn border-[1.5px] py-2.5 items-center"
              style={{ borderColor: PRESET_COLORS[p] }}>
              <Text className="text-[11px] font-semibold" style={{ color: PRESET_COLORS[p] }}>
                {PRESET_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        {GROUPS.map((group) => (
          <View key={group.title}>
            <Text className="mx-5 mb-1.5 mt-4 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">
              {group.title}
            </Text>
            {group.screens.map((screen) => (
              <Pressable
                key={screen.route}
                onPress={() => navigate(screen)}
                className="flex-row items-center justify-between px-5 py-3 active:bg-gray-50">
                <View className="flex-1">
                  <Text className="text-[14px] font-medium text-ink">{screen.label}</Text>
                  <Text className="mt-0.5 text-[11px] text-muted">{screen.route}</Text>
                </View>
                <View className="ml-2 rounded-[4px] px-2 py-1" style={{ backgroundColor: PRESET_COLORS[screen.preset] + '20' }}>
                  <Text className="text-[10px] font-semibold" style={{ color: PRESET_COLORS[screen.preset] }}>
                    {PRESET_LABELS[screen.preset]}
                  </Text>
                </View>
              </Pressable>
            ))}
            <View className="mx-5 mt-1 h-px bg-gray-100" />
          </View>
        ))}

        <View className="mt-6 px-5">
          <Pressable
            onPress={() => router.replace('/' as never)}
            className="rounded-btn bg-primary py-3.5 items-center">
            <Text className="text-[15px] font-bold text-white">Resume Normal Flow</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
