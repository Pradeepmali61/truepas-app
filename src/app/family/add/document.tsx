import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, FloatingInput, Icon, InfoBanner, Pill, Stepper } from '@/components/ui';
import { useAddFamilyMember } from '@/features/family/hooks';
import type { FamilyAgeBand } from '@/types/domain';

/** Add family — step 2: document. 5-17 → doc + selfie + face; 0-4 → doc only (PRD). */
export default function FamilyDocumentScreen() {
  const router = useRouter();
  const { name, band, dob, relationship } = useLocalSearchParams<{
    name?: string;
    band?: FamilyAgeBand;
    dob?: string;
    relationship?: string;
  }>();
  const addFamilyMember = useAddFamilyMember();
  const isMinorWithFace = band !== '0-4';
  const firstName = (name ?? 'Member').split(' ')[0];

  const handleComplete = async () => {
    if (!name || !dob || !relationship) {
      router.dismissTo('/(tabs)/family');
      return;
    }
    try {
      await addFamilyMember.mutateAsync({ name, dateOfBirth: dob, relationship });
      router.dismissTo('/(tabs)/family');
    } catch (err) {
      router.dismissTo('/(tabs)/family');
    }
  };

  return (
    <ScreenContainer scroll={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScreenHeader title="Add Family Member" />
      <Stepper total={4} done={isMinorWithFace ? 2 : 3} />
      <View className="flex-1 px-6">
        <View className="items-center pb-2 pt-4">
          {isMinorWithFace ? (
            <Pill label="Age 5-17 · Doc + Selfie + Face Required" variant="active" />
          ) : (
            <Pill label="Age 0-4 · Document Only" variant="gray" />
          )}
        </View>
        {!isMinorWithFace ? (
          <View className="-mx-6">
            <InfoBanner leading="info">
              Children under 5 only need a document uploaded — no face scan required.
            </InfoBanner>
          </View>
        ) : null}
        <View className="-mx-6 mt-3">
          <FloatingInput
            label="Document Type"
            value={isMinorWithFace ? 'Identity Card' : 'Identity Card / Birth Certificate'}
            editable={false}
            gradient
          />
        </View>
        <View className="items-center">
          <View className="my-5 h-[150px] w-[240px] items-center justify-center rounded-btn border-[3px] border-dashed border-primary">
            <Icon name="idCard" size={80} />
          </View>
          {isMinorWithFace ? (
            <Text className="-mt-[10px] text-[12px] text-muted">
              Scan {firstName}&apos;s Identity Card
            </Text>
          ) : null}
        </View>
        <Spacer />
        <View className="pb-6 pt-4">
          <Button
            label={isMinorWithFace ? 'Scan Document' : 'Upload Document'}
            loading={addFamilyMember.isPending}
            onPress={() =>
              isMinorWithFace
                ? router.push({ pathname: '/family/add/face-capture', params: { name: firstName, fullName: name, dob, relationship } })
                : handleComplete()
            }
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
