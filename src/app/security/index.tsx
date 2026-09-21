/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { ChevronRight, KeyRound, Lock, ScanFace } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { Card, CardContent, Modal, ScreenHeader } from '@/components/composite';
import { ConsentCard } from '@/components/truepas';
import { CoreButton, Divider, RowIcon, Switch, Typography } from '@/components/ui';
import { useBiometricConsent } from '@/features/auth/mutations';
import { biometricConsentGiven, biometricConsentRevoked } from '@/features/auth/slice';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Security settings — login/access, biometric toggles, consent management (PRD). */
export default function SecurityScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const toast = useToast();
  const consent = useBiometricConsent();
  const [faceIdLogin, setFaceIdLogin] = useState(true);
  const [smsVerification, setSmsVerification] = useState(false);
  const [consentAction, setConsentAction] = useState<'withdraw' | 'give' | null>(null);
  // Server truth — reflects the stored user record, not local optimism.
  const consentGranted = !!user?.biometricConsentAt;

  const handleConsentConfirm = async () => {
    const grant = consentAction === 'give';
    try {
      await consent.mutateAsync({ accepted: grant });
      dispatch(grant ? biometricConsentGiven() : biometricConsentRevoked());
      setConsentAction(null);
      // Withdrawing drops faceEnrolled locally too — the tabs layout routes
      // the user back through consent + re-enrollment on next entry.
    } catch (err) {
      setConsentAction(null);
      toast.show('error', toApiError(err).message || 'Could not update consent. Please try again.');
    }
  };

  const sectionLabel = (text: string) => (
    <Typography variant="caption" color="muted" style={{ letterSpacing: theme.letterSpacing.caps }}>
      {text}
    </Typography>
  );

  const linkRow = (icon: ReactNode, title: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[3],
        },
        pressed && { opacity: 0.7 },
      ]}>
      <RowIcon tone="neutral" icon={icon} />
      <Typography variant="body" style={{ flex: 1 }}>
        {title}
      </Typography>
      <ChevronRight size={iconSize.sm} color={theme.colors.textMuted} />
    </Pressable>
  );

  const toggleRow = (icon: ReactNode, title: string, subtitle: string, value: boolean, onChange: (v: boolean) => void) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingVertical: theme.spacing[3],
      }}>
      <RowIcon tone="neutral" icon={icon} />
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing[0.5] }}>
        <Typography variant="body">{title}</Typography>
        <Typography variant="body-sm" color="secondary">
          {subtitle}
        </Typography>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Security" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom,
          gap: theme.spacing[5],
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('LOGIN & ACCESS')}
          <Card>
            <CardContent style={{ paddingVertical: theme.spacing[1] }}>
              {linkRow(
                <Lock size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Change Password',
                () => router.push({ pathname: '/security/confirm-pin', params: { next: '/security/change-password' } } as never),
              )}
              <Divider />
              {linkRow(
                <KeyRound size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Change PIN',
                () => router.push({ pathname: '/security/confirm-pin', params: { next: '/security/change-pin' } } as never),
              )}
              <Divider />
              {linkRow(
                <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Update Face',
                () => router.push('/face-update/pin'),
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('BIOMETRIC & VERIFICATION')}
          <Card>
            <CardContent style={{ paddingVertical: theme.spacing[1] }}>
              {toggleRow(
                <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Face ID Login',
                'Use face to unlock app',
                faceIdLogin,
                setFaceIdLogin,
              )}
              <Divider />
              {toggleRow(
                <KeyRound size={iconSize.md} color={theme.colors.actionPrimary} />,
                'SMS Verification for Login',
                'Extra security layer',
                smsVerification,
                setSmsVerification,
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('BIOMETRIC CONSENT')}
          {/* Design-repo ConsentCard, controlled — the toggle opens the
              confirm modal first; the value only commits on confirm. */}
          <ConsentCard
            value={consentGranted}
            onValueChange={(v) => setConsentAction(v ? 'give' : 'withdraw')}
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>

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
              loading={consent.isPending}
              onPress={handleConsentConfirm}>
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
    </SafeAreaView>
  );
}
