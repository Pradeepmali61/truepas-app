import { useLocalSearchParams, useRouter } from 'expo-router';

import { LivenessCamera } from '@/features/liveness/LivenessCamera';

/** Add family — step 3: liveness + face enrollment for ages 5-17 (PRD).
 *  Uses LivenessCamera with personId for family member face enrollment.
 *  The addFamilyMember call should have been made on the document step,
 *  and the personId should be passed from there. */
export default function FamilyFaceCaptureScreen() {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId?: string }>();

  const goToMemberDetail = () => {
    if (personId) {
      router.replace({ pathname: '/family/[id]', params: { id: personId } });
    } else {
      router.dismissTo('/(tabs)/family');
    }
  };

  return (
    <LivenessCamera
      mode="enroll"
      personId={personId}
      onSuccess={goToMemberDetail}
      onError={(msg) => {
        // Still navigate to member detail; the error is shown in the camera UI
        goToMemberDetail();
      }}
    />
  );
}
