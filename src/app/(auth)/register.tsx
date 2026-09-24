import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { TruepasIcon } from '@/components/app/TruepasIcon';
import { FormField } from '@/components/composite/FormField';
import { useToast } from '@/components/composite/Toast';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { NeuBox } from '@/components/ui/NeuBox';
import { Select } from '@/components/ui/Select';
import { Typography } from '@/components/ui/Typography';
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from '@/constants/countries';
import { useRegister } from '@/features/auth/mutations';
import { PhoneForm, phoneSchema } from '@/features/auth/schemas';
import { useKeyboardScrollPad } from '@/hooks/useKeyboardScrollPad';
import { makeStyles, useThemeTokens } from '@/theme';

/** Register — step 1 (contract v1.1.0): POST /cb/auth/register { phone, countryCode }
 *  → registrationId → verify-phone with params.
 *  Layout mirrors UI-design-repo RegisterPhoneScreen 1:1. */
export default function RegisterScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const insets = useSafeAreaInsets();
  const kbd = useKeyboardScrollPad();
  const router = useRouter();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const register = useRegister();
  const { control, handleSubmit } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });
  const phone = useWatch({ control, name: 'phone' }) ?? '';

  const onSubmit = handleSubmit(async (values) => {
    if (register.isPending) return;
    const cleanPhone = values.phone.replace(/\D/g, '');
    try {
      const response = await register.mutateAsync({ phone: cleanPhone, countryCode });
      if (!response?.registrationId) {
        toast({
          variant: 'error',
          title: "Couldn't send code",
          description: 'Registration failed: server did not return a registration ID. Please try again.',
        });
        return;
      }
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { phone: cleanPhone, countryCode, registrationId: response.registrationId },
      });
    } catch (err: any) {
      toast({
        variant: 'error',
        title: "Couldn't send code",
        description: toApiError(err).message || 'Check the number and try again.',
      });
    }
  });

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <IconButton
            icon={<ArrowLeft size={t.iconSize.md} color={t.colors.actionPrimary} />}
            variant="ghost"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
            accessibilityLabel="Back"
          />
          <View style={styles.headerText} />
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          {...kbd.scrollProps}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.body}>
            <View style={styles.brand}>
              <NeuBox
                variant="raised"
                radius={t.radii.lg}
                depth={4}
                color={t.colors.actionPrimary}
                style={styles.brandIcon}>
                <TruepasIcon size={t.iconSize.sm} color={t.colors.onActionPrimary} />
              </NeuBox>
              <Typography variant="h4">Truepas</Typography>
            </View>

            <View style={styles.heading}>
              <Typography variant="h2" center>
                Create your account
              </Typography>
              <Typography color="secondary" center>
                We&apos;ll text a verification code to your phone.
              </Typography>
            </View>

            <View style={styles.section}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <FormField
                    label="Mobile number"
                    required
                    helperText="Enter your number without the country code."
                    error={fieldState.error?.message}>
                    <View style={styles.phoneRow}>
                      <Select
                        options={COUNTRIES.map((c) => ({
                          value: c.code,
                          label: `${c.flag} ${c.name} (${c.code})`,
                          fieldLabel: `${c.flag} ${c.code}`,
                        }))}
                        value={countryCode}
                        onValueChange={setCountryCode}
                        accessibilityLabel="Country code"
                        style={styles.ccSelect}
                      />
                      <Input
                        placeholder="(555) 555-0123"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        state={fieldState.error ? 'error' : 'default'}
                        containerStyle={styles.phoneInput}
                        iconLeft={<Phone size={t.iconSize.md} color={t.colors.actionPrimary} />}
                        accessibilityLabel="Mobile number"
                      />
                    </View>
                  </FormField>
                )}
              />

              <Typography variant="caption" color="muted" center>
                By continuing you agree to the Terms of Service and acknowledge the Privacy Policy.
              </Typography>
            </View>
          </View>
        </ScrollView>

        <View {...kbd.footerProps} style={[styles.footer, { paddingBottom: t.spacing[4] + insets.bottom }]}>
          <Button
            fullWidth
            size="lg"
            loading={register.isPending}
            disabled={!phone.trim()}
            onPress={onSubmit}
            accessibilityLabel="Send code">
            Send code
          </Button>
          <Typography variant="body-sm" color="muted" center>
            Already have an account? <Link onPress={() => router.push('/(auth)/login')}>Sign in</Link>
          </Typography>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: t.sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing[4],
    gap: t.spacing[2],
  },
  headerText: { flex: 1, alignItems: 'center', gap: 1 },
  headerRight: { minWidth: t.sizes.touchTarget },
  scrollContent: { flexGrow: 1, paddingBottom: t.spacing[6] },
  body: { flex: 1, gap: t.spacing[6], paddingHorizontal: t.spacing[4], paddingTop: t.spacing[4] },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing[2],
  },
  brandIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { alignItems: 'center', gap: t.spacing[1] },
  section: { gap: t.spacing[4] },
  phoneRow: { flexDirection: 'row', gap: t.spacing[2] },
  ccSelect: { width: 122 },
  phoneInput: { flex: 1 },
  footer: {
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[6],
    gap: t.spacing[2],
  },
}));
