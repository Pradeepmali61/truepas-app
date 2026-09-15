import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Modal } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CoreButton, ListItem, Pill, SectionTitle, Toggle, Typography } from '@/components/ui';

/** Security settings — login/access, biometric toggles, consent management (PRD). */
export default function SecurityScreen() {
  const router = useRouter();
  const [faceIdLogin, setFaceIdLogin] = useState(true);
  const [smsVerification, setSmsVerification] = useState(false);
  const [consentGranted, setConsentGranted] = useState(true);
  const [consentAction, setConsentAction] = useState<'withdraw' | 'give' | null>(null);

  return (
    <ScreenContainer>
      <TopBar title="Security" />

      <SectionTitle>Login &amp; Access</SectionTitle>
      <ListItem title="Change Password" showChevron onPress={() => router.push({ pathname: '/security/confirm-pin', params: { next: '/security/change-password' } } as never)} />
      <ListItem title="Change PIN" showChevron onPress={() => router.push({ pathname: '/security/confirm-pin', params: { next: '/security/change-pin' } } as never)} />
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
          <Pill label={consentGranted ? 'Granted' : 'Withdrawn'} />
        </View>
        <Text className="mt-2 text-[12px] text-muted">
          {consentGranted
            ? 'You consented to biometric enrollment on Jul 29, 2026 at 9:10 AM'
            : 'Biometric consent withdrawn. Face verification is disabled until you re-consent.'}
        </Text>
        {consentGranted ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Withdraw consent"
            className="mt-2"
            onPress={() => setConsentAction('withdraw')}>
            <Text className="text-[14px] font-medium text-primary underline">Withdraw Consent</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Give consent"
            className="mt-2"
            onPress={() => setConsentAction('give')}>
            <Text className="text-[14px] font-medium text-primary underline">Give Consent</Text>
          </Pressable>
        )}
      </Card>

      <Modal
        visible={consentAction !== null}
        onClose={() => setConsentAction(null)}
        title={consentAction === 'withdraw' ? 'Withdraw Consent?' : 'Give Consent?'}
        footer={
          <>
            <CoreButton variant="ghost" onPress={() => setConsentAction(null)}>
              Cancel
            </CoreButton>
            <CoreButton
              variant={consentAction === 'withdraw' ? 'destructive' : 'primary'}
              onPress={() => {
                setConsentGranted(consentAction !== 'withdraw');
                setConsentAction(null);
              }}>
              {consentAction === 'withdraw' ? 'Withdraw' : 'Give Consent'}
            </CoreButton>
          </>
        }>
        <Typography variant="body" color="secondary">
          {consentAction === 'withdraw'
            ? 'Withdrawing biometric consent will disable face verification. You will need to re-enroll to use face-based features.'
            : 'Giving biometric consent will enable face verification. You can withdraw at any time.'}
        </Typography>
      </Modal>
    </ScreenContainer>
  );
}
