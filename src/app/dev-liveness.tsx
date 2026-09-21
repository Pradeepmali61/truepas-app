/**
 * Dev-only liveness stage preview — renders the LivenessStages components
 * with mock data so the challenge/finishing/result UIs can be inspected on
 * web or Expo Go (no native camera). The framed square shows the design's
 * NeuWell face target instead of a live camera feed.
 *
 *   /dev-liveness?stage=challenge | finishing | passed | failed
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScanFace } from 'lucide-react-native';
import { useState } from 'react';
import { Animated, View } from 'react-native';

import { NeuWell, Pulse } from '@/components/ui';
import { ChallengeStage, FinishingStage, LivenessResultStage } from '@/features/liveness/LivenessStages';
import { useThemeTokens } from '@/theme';
import type { LivenessChallenge } from '@/types/domain';

const STEPS: LivenessChallenge[] = ['blink', 'turn_left', 'turn_right'];
const LABELS: Record<string, string> = {
  blink: 'Blink slowly',
  turn_left: 'Turn your head left',
  turn_right: 'Turn your head right',
};

export default function DevLivenessPreview() {
  const { stage = 'challenge' } = useLocalSearchParams<{ stage?: string }>();
  const router = useRouter();
  const theme = useThemeTokens();
  // Mid-step so the progress track shows a partial fill.
  const [stepProgress] = useState(() => new Animated.Value(0.5));

  // Stands in for the live camera inside the ScanFrame square — the design's
  // original pulsing NeuWell face target.
  const cameraPlaceholder = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pulse to={1.04} ms={950}>
        <NeuWell
          radius={theme.radii.full}
          style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
          <ScanFace size={56} color={theme.colors.actionPrimary} />
        </NeuWell>
      </Pulse>
    </View>
  );

  if (stage === 'finishing') {
    return <FinishingStage />;
  }
  if (stage === 'passed') {
    return (
      <LivenessResultStage
        outcome="passed"
        score={0.92}
        primaryLabel="Continue"
        onPrimary={() => router.back()}
        onBack={() => router.back()}
      />
    );
  }
  if (stage === 'failed') {
    return (
      <LivenessResultStage
        outcome="failed"
        error="Liveness step rejected"
        primaryLabel="Try again"
        onPrimary={() => router.back()}
        onBack={() => router.back()}
      />
    );
  }
  return (
    <ChallengeStage
      instruction="Turn your head left"
      steps={STEPS}
      stepIndex={1}
      labels={LABELS}
      stepProgress={stepProgress}
      expiresIn={172}
      camera={cameraPlaceholder}
      onRestart={() => {}}
    />
  );
}
