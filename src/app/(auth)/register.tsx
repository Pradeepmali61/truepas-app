import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { RegisterCard } from '@/components/truepas';
import { DEFAULT_COUNTRY_CODE } from '@/constants/countries';
import { useRegister } from '@/features/auth/mutations';
import { PhoneForm, phoneSchema } from '@/features/auth/schemas';
import { makeStyles } from '@/theme';

/** Register — step 1 (contract v1.1.0): POST /cb/auth/register { phone, countryCode }
 *  → registrationId → verify-phone with params. */
export default function RegisterScreen() {
  const styles = useStyles();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const register = useRegister();
  const { control, handleSubmit } = useForm<PhoneForm>({
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
      setSubmitError(toApiError(err).message || 'Could not send code. Please try again.');
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
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <RegisterCard
                style={styles.card}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                phone={value}
                onPhoneChange={onChange}
                onPhoneBlur={onBlur}
                phoneError={fieldState.error?.message}
                error={submitError}
                loading={register.isPending}
                onCreateAccount={onSubmit}
                onSignIn={() => router.push('/(auth)/login')}
                onTerms={() => router.push('/legal/terms' as never)}
                onPrivacy={() => router.push('/legal/privacy-policy' as never)}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing[4] },
  card: { width: '100%', maxWidth: 380 },
}));
