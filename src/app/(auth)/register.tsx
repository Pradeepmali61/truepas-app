import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Phone, ScanFace } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, FormField } from '@/components/composite';
import { CoreButton, Input, Link, Select, Typography } from '@/components/ui';
import { useRegister } from '@/features/auth/mutations';
import { PhoneForm, phoneSchema } from '@/features/auth/schemas';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
];

function BrandMark() {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.brand}>
      <View style={styles.brandIcon}>
        <ScanFace size={iconSize.md} color={theme.colors.onActionPrimary} />
      </View>
      <Typography variant="h4">Truepas</Typography>
    </View>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  const styles = useStyles();
  return (
    <View style={styles.dots} accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i < current && styles.dotDone, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

/** Register — POST /cb/auth/register { phone, countryCode } → 202 →
 *  registrationId + nextStep: verifyPhone. */
export default function RegisterScreen() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+1');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const register = useRegister();
  const { control, handleSubmit, formState } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const cleanPhone = values.phone.replace(/\D/g, '');
    try {
      const response = await register.mutateAsync({ phone: cleanPhone, countryCode });
      if (!response?.registrationId) {
        setSubmitError('Registration failed: server did not return a registration ID. Please try again.');
        return;
      }
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { phone: cleanPhone, countryCode, registrationId: response.registrationId },
      });
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Could not send code. Please try again.');
    }
  });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandMark />
          <StepDots total={6} current={0} />

          <View style={styles.heading}>
            <Typography variant="h2">Create your account</Typography>
            <Typography color="secondary">We&apos;ll text a verification code to your phone.</Typography>
          </View>

          <FormField
            label="Mobile number"
            required
            error={formState.errors.phone?.message}>
            <View style={styles.phoneRow}>
              <Select
                size="md"
                title="Country code"
                accessibilityLabel="Country code"
                style={styles.ccSelect}
                value={countryCode}
                onValueChange={setCountryCode}
                options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.code}` }))}
              />
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    placeholder="(555) 555-0123"
                    keyboardType="phone-pad"
                    containerStyle={styles.flex}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    state={fieldState.error ? 'error' : 'default'}
                    iconLeft={<Phone size={iconSize.sm} color={theme.colors.textMuted} />}
                    accessibilityLabel="Mobile number"
                  />
                )}
              />
            </View>
          </FormField>

          {submitError ? (
            <Alert variant="error" title="Couldn't send code">
              {submitError}
            </Alert>
          ) : null}

        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing[3] }]}>
          <Typography variant="caption" color="muted" style={styles.legal}>
            By continuing you agree to the{' '}
            <Link
              onPress={() => router.push('/legal/terms' as never)}
              style={{ fontSize: theme.fontSize.xs }}>
              Terms of Service
            </Link>
            {' '}and acknowledge the{' '}
            <Link
              onPress={() => router.push('/legal/privacy-policy' as never)}
              style={{ fontSize: theme.fontSize.xs }}>
              Privacy Policy
            </Link>
            .
          </Typography>
          <CoreButton
            variant="primary"
            size="lg"
            fullWidth
            loading={register.isPending}
            accessibilityLabel="Send code"
            onPress={onSubmit}>
            Send code
          </CoreButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  body: { flexGrow: 1, padding: t.spacing[4], gap: t.spacing[4] },
  heading: { gap: t.spacing[1] },
  brand: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.actionPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: t.spacing[1], justifyContent: 'center', paddingVertical: t.spacing[2] },
  dot: { width: 6, height: 6, borderRadius: t.radii.full, backgroundColor: t.colors.border },
  dotDone: { backgroundColor: t.colors.actionPrimary },
  dotActive: { width: 18, backgroundColor: t.colors.actionPrimary },
  phoneRow: { flexDirection: 'row', gap: t.spacing[2], alignItems: 'stretch' },
  ccSelect: { width: 112 },
  legal: { textAlign: 'center' },
  footer: {
    padding: t.spacing[4],
    paddingTop: t.spacing[3],
    gap: t.spacing[3],
    borderTopWidth: t.sizes.fieldBorderWidth,
    borderTopColor: t.colors.borderSubtle,
    backgroundColor: t.colors.surface,
  },
}));
