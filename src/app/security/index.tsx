import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Card, ListItem, Pill, SectionTitle, Toggle } from '@/components/ui';

/** Security settings — login/access, biometric toggles, consent management (PRD). */
export default function SecurityScreen() {
  const router = useRouter();
  const [faceIdLogin, setFaceIdLogin] = useState(true);
  const [smsVerification, setSmsVerification] = useState(false);

  return (
    <ScreenContainer>
      <TopBar title="Security" />

      <SectionTitle>Login &amp; Access</SectionTitle>
      <ListItem title="Change Password" showChevron />
      <ListItem title="Change PIN" showChevron onPress={() => router.push('/security/change-pin')} />
      <ListItem title="Update Face" showChevron onPress={() => router.push('/face-update/pin')} />

      <SectionTitle>Biometric &amp; Verification</SectionTitle>
      <ListItem
        title="Face ID Login"
        subtitle="Use face to unlock app"
        rightSlot={
          <Toggle
            on={faceIdLogin}
            onToggle={() => setFaceIdLogin((v) => !v)}
            accessibilityLabel="Face ID login"
          />
        }
      />
      <ListItem
        title="SMS Verification for Login"
        subtitle="Extra security layer"
        rightSlot={
          <Toggle
            on={smsVerification}
            onToggle={() => setSmsVerification((v) => !v)}
            accessibilityLabel="SMS verification for login"
          />
        }
      />

      <SectionTitle>Biometric Consent</SectionTitle>
      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] text-muted">Consent Status</Text>
          <Pill label="Granted" />
        </View>
        <Text className="mt-2 text-[12px] text-muted">
          You consented to biometric enrollment on Jul 29, 2026 at 9:10 AM
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Withdraw consent" className="mt-2">
          <Text className="text-[14px] font-medium text-primary underline">Withdraw Consent</Text>
        </Pressable>
      </Card>

      <SectionTitle>Danger Zone</SectionTitle>
      <ListItem title="Delete Account" showChevron onPress={() => router.push('/account/delete')} />
    </ScreenContainer>
  );
}
