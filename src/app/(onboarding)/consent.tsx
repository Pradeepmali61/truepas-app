import { useRouter } from 'expo-router';
import { EyeOff, Lock, Shield, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardContent, ScreenHeader } from '@/components/composite';
import { Checkbox, CoreButton, Divider, FadeUp, PopIn, Progress, RowIcon, Typography } from '@/components/ui';
import { useBiometricConsent } from '@/features/auth/mutations';
import { biometricConsentGiven } from '@/features/auth/slice';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Biometric consent — explicit consent before face capture (PRD requirement).
 *  Calls POST /user/me/biometric-consent with { accepted: true }. */
export default function ConsentScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [checked, setChecked] = useState(false);
  const biometricConsent = useBiometricConsent();
  const toast = useToast();

  const agree = async () => {
    try {
      await biometricConsent.mutateAsync({ accepted: true });
      dispatch(biometricConsentGiven());
      router.push('/(onboarding)/face-scan');
    } catch (err: any) {
      toast.show('error', err?.message ?? 'Could not record consent. Please try again.');
    }
  };

  const assurances = [
    {
      icon: <Lock size={iconSize.md} color={theme.colors.actionPrimary} />,
      text: 'Encrypted and stored securely (ROC)',
    },
    {
      icon: <EyeOff size={iconSize.md} color={theme.colors.actionPrimary} />,
      text: 'Never shared with third parties',
    },
    {
      icon: <Trash2 size={iconSize.md} color={theme.colors.actionPrimary} />,
      text: 'Deleted permanently on account deletion',
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Biometric Consent" />
      <View style={{ paddingHorizontal: theme.spacing[4] }}>
        <Progress value={55} accessibilityLabel="Onboarding progress" />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: theme.spacing[2], marginTop: theme.spacing[4] }}>
          <PopIn>
            <RowIcon tone="primary" icon={<Shield size={iconSize.xl} color={theme.colors.actionPrimary} />} />
          </PopIn>
          <Typography variant="h3" center>
            We need your consent
          </Typography>
          <Typography variant="body-sm" color="secondary" center>
            Truepas will capture and store an encrypted facial template to verify your identity. This
            biometric data is:
          </Typography>
        </View>
        <FadeUp delay={140}>
          <Card>
            <CardContent>
              {assurances.map((item, i) => (
                <View key={item.text}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                    }}>
                    {item.icon}
                    <Typography variant="body" style={{ flex: 1 }}>
                      {item.text}
                    </Typography>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        </FadeUp>
        <FadeUp delay={240}>
          <Checkbox
            checked={checked}
            onCheckedChange={setChecked}
            label="I consent to the enrollment and processing of my biometric (facial) data for identity verification purposes."
          />
        </FadeUp>
      </ScrollView>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton
          fullWidth
          size="lg"
          disabled={!checked}
          loading={biometricConsent.isPending}
          accessibilityLabel="Agree and continue"
          onPress={agree}>
          Agree & Continue
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
