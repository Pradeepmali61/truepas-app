/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { ChevronRight, KeyRound, Lock, ScanFace } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardContent, Modal, ScreenHeader } from '@/components/composite';
import { Badge, CoreButton, Divider, Link, RowIcon, Switch, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Security settings — login/access, biometric toggles, consent management (PRD). */
export default function SecurityScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [faceIdLogin, setFaceIdLogin] = useState(true);
  const [smsVerification, setSmsVerification] = useState(false);
  const [consentGranted, setConsentGranted] = useState(true);
  const [consentAction, setConsentAction] = useState<'withdraw' | 'give' | null>(null);

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
          <Card>
            <CardContent style={{ gap: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body-sm" color="secondary">
                  Consent Status
                </Typography>
                <Badge variant={consentGranted ? 'success' : 'neutral'}>
                  {consentGranted ? 'Granted' : 'Withdrawn'}
                </Badge>
              </View>
              <Typography variant="body-sm" color="secondary">
                {consentGranted
                  ? 'You consented to biometric enrollment on Jul 29, 2026 at 9:10 AM'
                  : 'Biometric consent withdrawn. Face verification is disabled until you re-consent.'}
              </Typography>
              <Link
                onPress={() => setConsentAction(consentGranted ? 'withdraw' : 'give')}
                accessibilityLabel={consentGranted ? 'Withdraw consent' : 'Give consent'}>
                {consentGranted ? 'Withdraw Consent' : 'Give Consent'}
              </Link>
            </CardContent>
          </Card>
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
    </SafeAreaView>
  );
}
