import { useRouter } from 'expo-router';

import { LivenessCamera } from '@/features/liveness/LivenessCamera';

/** Update face — liveness challenge + face update via BFF.
 *  PIN was already verified on the previous screen. */
export default function FaceUpdateCameraScreen() {
  const router = useRouter();

  return (
    <LivenessCamera
      mode="update"
      onSuccess={() => router.replace('/face-update/success')}
      onError={(msg) => {
        router.push({ pathname: '/face-update/error', params: { message: msg } });
      }}
    />
  );
}
