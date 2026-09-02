import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, InfoBanner, ProgressTrack } from '@/components/ui';
import { LivenessCamera } from '@/features/liveness/LivenessCamera';

/** Face scan — mandatory liveness + face enrollment gate (no skip, PRD v2.0).
 *  Uses server-provided challenge sequence via the LivenessCamera component. */
export default function FaceScanScreen() {
  const router = useRouter();

  return (
    <LivenessCamera
      mode="enroll"
      onSuccess={() => router.replace('/(onboarding)/face-enrolled')}
      onError={(msg) => {
        // Navigate to error screen; the LivenessCamera itself shows retry UI
        router.push({ pathname: '/face-update/error', params: { message: msg } });
      }}
    />
  );
}

/** Static intro screen (kept for reference — the live camera replaces it). */
export function FaceScanIntro() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Sign Up" />
      <ProgressTrack percent={75} />
      <View className="flex-1 items-center justify-center p-5">
        <View className="my-6 h-[220px] w-[220px] items-center justify-center rounded-full border-4 border-primary bg-surface">
          <Icon name="face" size={54} />
        </View>
        <Text accessibilityRole="header" className="mb-1 mt-[6px] text-[18px] font-bold text-primary">
          Let&apos;s scan your face
        </Text>
        <Text className="mb-[6px] max-w-[260px] text-center text-[14px] text-muted">
          Good lighting · No glasses/mask · Eye-level camera
        </Text>
        <View className="max-w-[280px]">
          <InfoBanner variant="warn" leading="warning">
            This step is mandatory and cannot be skipped
          </InfoBanner>
        </View>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Start Face Scan" onPress={() => router.push('/(onboarding)/face-scan')} />
      </View>
    </ScreenContainer>
  );
}
