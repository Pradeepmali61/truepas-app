import { useLocalSearchParams, useRouter } from 'expo-router';

import { CameraUnavailable, loadLivenessCamera } from '@/features/liveness/cameraModule';

/** Update face — liveness challenge + face update via BFF.
 *  PIN was already verified on the previous screen.
 *  `personId` (when present) targets a family member's face instead of the
 *  authenticated main user's. */
const LivenessCamera = loadLivenessCamera();

export default function FaceUpdateCameraScreen() {
  const router = useRouter();
  const { personId, age } = useLocalSearchParams<{ personId?: string; age?: string }>();
  // Under-10 family members may use the rear camera here too.
  const ageNum = age != null ? Number(age) : NaN;
  const allowBackCamera = Number.isFinite(ageNum) && ageNum < 10;
  if (!LivenessCamera) return <CameraUnavailable />;

  return (
    <LivenessCamera
      mode="update"
      personId={personId}
      allowBackCamera={allowBackCamera}
      onSuccess={() => router.replace('/face-update/success')}
    />
  );
}
