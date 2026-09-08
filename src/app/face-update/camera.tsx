import { useLocalSearchParams, useRouter } from 'expo-router';

import { LivenessCamera } from '@/features/liveness/LivenessCamera';

/** Update face — liveness challenge + face update via BFF.
 *  PIN was already verified on the previous screen.
 *  `personId` (when present) targets a family member's face instead of the
 *  authenticated main user's. */
export default function FaceUpdateCameraScreen() {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId?: string }>();

  return (
    <LivenessCamera
      mode="update"
      personId={personId}
      onSuccess={() => router.replace('/face-update/success')}
      onError={(msg) => {
        router.push({ pathname: '/face-update/error', params: { message: msg } });
      }}
    />
  );
}
