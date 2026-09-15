import { useLocalSearchParams, useRouter } from 'expo-router';

import { CameraUnavailable, loadLivenessCamera } from '@/features/liveness/cameraModule';

/** Update face — liveness challenge + face update via BFF.
 *  PIN was already verified on the previous screen.
 *  `personId` (when present) targets a family member's face instead of the
 *  authenticated main user's. */
const LivenessCamera = loadLivenessCamera();

export default function FaceUpdateCameraScreen() {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  if (!LivenessCamera) return <CameraUnavailable />;

  return (
    <LivenessCamera
      mode="update"
      personId={personId}
      onSuccess={() => router.replace('/face-update/success')}
      onError={(msg: string) => {
        router.push({ pathname: '/face-update/error', params: { message: msg } });
      }}
    />
  );
}
