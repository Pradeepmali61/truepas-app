/**
 * Security hub — sign-in credentials, biometric consent, danger zone.
 * Sensitive flows (password/PIN change, face update) route through the
 * confirm-pin gate first. Biometric withdrawal deletes face templates
 * server-side and sets faceEnrolled=false, forcing re-enrollment.
 *
 * Ported 1:1 from UI-design-repo src/app/screens/settings/SecurityScreen.tsx —
 * navigation targets map to our real confirm-pin/face-update routes.
 */
import { useRouter } from 'expo-router';
import { Fingerprint, KeyRound, Lock, ScanFace, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { isMockApi } from '@/api';
import { toApiError } from '@/api/errors';
import { MOCK_PIN } from '@/api/mock';
import { ListTile, Modal, ScreenHeader, Section, SectionTitle } from '@/components/composite';
import { CoreButton, Switch, Typography } from '@/components/ui';
import { useBiometricConsent } from '@/features/auth/mutations';
import { biometricConsentGiven, biometricConsentRevoked } from '@/features/auth/slice';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';

export default function SecurityScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const toast = useToast();
  const consent = useBiometricConsent();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Server truth — reflects the stored user record, not local optimism.
  const consentOn = !!user?.biometricConsentAt;

  const applyConsent = async (accepted: boolean) => {
    if (consent.isPending) return;
    try {
      await consent.mutateAsync({ accepted });
      dispatch(accepted ? biometricConsentGiven() : biometricConsentRevoked());
      // Withdrawing drops faceEnrolled locally too — the tabs layout routes
      // the user back through consent + re-enrollment on next entry.
      toast.show(
        'success',
        accepted ? 'Biometric consent on' : 'Biometric consent off — your enrolled face was removed.',
      );
    } catch (err) {
      toast.show('error', toApiError(err).message || 'Could not update consent. Please try again.');
    }
  };

  const onConsentToggle = (next: boolean) => {
    if (next) void applyConsent(true);
    else setConfirmRevoke(true);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Security" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom,
          gap: theme.spacing[6],
        }}
        showsVerticalScrollIndicator={false}>
        <Section>
          <SectionTitle>Sign-in</SectionTitle>
          <ListTile
            icon={KeyRound}
            tone="brand"
            title="Change password"
            subtitle="Update your account password"
            onPress={() =>
              router.push({
                pathname: '/security/confirm-pin',
                params: { next: '/security/change-password' },
              } as never)
            }
          />
          <ListTile
            icon={Lock}
            tone="brand"
            title="Change PIN"
            subtitle="4-digit code for sensitive actions"
            onPress={() =>
              router.push({
                pathname: '/security/confirm-pin',
                params: { next: '/security/change-pin' },
              } as never)
            }
          />
          <ListTile
            icon={ScanFace}
            tone="brand"
            title="Update face"
            subtitle="Re-enroll your face template"
            onPress={() => router.push('/face-update/pin')}
          />
        </Section>

        <Section>
          <SectionTitle>Face & consent</SectionTitle>
          <ListTile
            icon={Fingerprint}
            tone="brand"
            title="Biometric consent"
            subtitle={
              consentOn ? 'On — your face template is stored' : 'Off — no face template stored'
            }
            trailing={
              <Switch
                value={consentOn}
                onValueChange={onConsentToggle}
                disabled={consent.isPending}
              />
            }
          />
        </Section>

        <Section>
          <SectionTitle>Danger zone</SectionTitle>
          <ListTile
            icon={Trash2}
            tone="error"
            title="Delete account"
            subtitle="Erase your data permanently"
            onPress={() => router.push('/account/delete')}
          />
        </Section>

        {__DEV__ && isMockApi() && (
          <Typography variant="caption" color="muted" center>
            Demo PIN: {MOCK_PIN}
          </Typography>
        )}
      </ScrollView>

      <Modal
        visible={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        title="Turn off biometric consent?"
        footer={
          <>
            <CoreButton variant="ghost" onPress={() => setConfirmRevoke(false)}>
              Cancel
            </CoreButton>
            <CoreButton
              variant="destructive"
              loading={consent.isPending}
              onPress={() => {
                setConfirmRevoke(false);
                void applyConsent(false);
              }}>
              Turn off
            </CoreButton>
          </>
        }>
        <Typography variant="body" color="secondary">
          Turning this off removes your enrolled face. You&apos;ll need to re-enroll before using
          face check-in again.
        </Typography>
      </Modal>
    </SafeAreaView>
  );
}
