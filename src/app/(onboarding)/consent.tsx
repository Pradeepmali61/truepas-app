import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, CheckboxRow, Icon, ListItem, ProgressTrack } from '@/components/ui';
import { biometricConsentGiven } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

/** Biometric consent — explicit consent before face capture (PRD requirement). */
export default function ConsentScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [checked, setChecked] = useState(false);

  const agree = () => {
    dispatch(biometricConsentGiven());
    router.push('/(onboarding)/face-scan');
  };

  const decline = () => {
    Alert.alert(
      'Face enrollment required',
      'Face enrollment is required to use Truepas. You cannot continue without providing biometric consent.'
    );
  };

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Biometric Consent" />
      <ProgressTrack percent={55} />
      <View className="items-center px-6 pb-2 pt-4">
        <Icon name="shield" size={44} />
        <Text accessibilityRole="header" className="mb-[6px] mt-3 text-[18px] font-bold text-primary">
          We need your consent
        </Text>
      </View>
      <Text className="px-6 text-center text-[13px] leading-[21px] text-muted">
        Truepas will capture and store an encrypted facial template to verify your identity. This
        biometric data is:
      </Text>
      <View className="px-6 py-3">
        <ListItem icon="lock" iconBg="transparent" title="Encrypted and stored securely (ROC)" />
        <ListItem icon="cross" iconBg="transparent" title="Never shared with third parties" />
        <ListItem icon="trash" iconBg="transparent" title="Deleted permanently on account deletion" />
      </View>
      <View className="mt-2">
        <CheckboxRow
          checked={checked}
          onToggle={() => setChecked((v) => !v)}
          label="I consent to the enrollment and processing of my biometric (facial) data for identity verification purposes."
        />
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Agree & Continue" onPress={agree} disabled={!checked} />
        <View className="mt-[14px]">
          <Button
            label="Decline (Face enrollment is required to use Truepas)"
            variant="link"
            onPress={decline}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
