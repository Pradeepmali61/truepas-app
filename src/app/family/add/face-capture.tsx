import { useLocalSearchParams, useRouter } from 'expo-router';

import { CameraUnavailable, loadLivenessCamera } from '@/features/liveness/cameraModule';

/** Add family — step 3: liveness + face enrollment for ages 5+.
 *  Uses LivenessCamera with personId for family member face enrollment.
 *  The addFamilyMember call should have been made on the document step,
 *  and the personId should be passed from there.
 *  Members under 10 get the front/back camera toggle (a parent holds the
 *  phone while the child faces the rear camera); 10+ stays front-only. */
const LivenessCamera = loadLivenessCamera();

export default function FamilyFaceCaptureScreen() {
  const router = useRouter();
  const { personId, age } = useLocalSearchParams<{ personId?: string; age?: string }>();
  const ageNum = age != null ? Number(age) : NaN;
  const allowBackCamera = Number.isFinite(ageNum) && ageNum < 10;

  const goToMemberDetail = () => {
    if (personId) {
      router.replace({ pathname: '/family/[id]', params: { id: personId } });
    } else {
      router.dismissTo('/(tabs)');
    }
  };

  if (!LivenessCamera) return <CameraUnavailable />;

  return (
    <LivenessCamera
      mode="enroll"
      personId={personId}
      allowBackCamera={allowBackCamera}
      onSuccess={goToMemberDetail}
    />
  );
}
