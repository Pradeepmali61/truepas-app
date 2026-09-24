import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, useRouter } from 'expo-router';
import { ArrowLeft, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRegistrationToken } from '@/api/client';
import { toApiError } from '@/api/errors';
import { DatePicker, FormField } from '@/components/composite';
import { OtpInput } from '@/components/composite/OtpInput';
import { useToast } from '@/components/composite/Toast';
import { Progress, Typography } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { useCompleteAccountDetails } from '@/features/auth/mutations';
import { AccountDetailsForm, accountDetailsSchema } from '@/features/auth/schemas';
import { useKeyboardScrollPad } from '@/hooks/useKeyboardScrollPad';
import { accountDetailsStore } from '@/services/accountDetailsStore';
import { makeStyles, useThemeTokens } from '@/theme';
import type { AccountDetailsRequest } from '@/types/domain';

/** DatePicker speaks ISO ("YYYY-MM-DD"); the backend contract takes "MM/DD/YYYY". */
const isoToApiDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};
const apiDateToIso = (v: string) => {
  const [m, d, y] = v.split('/');
  return m && d && y ? `${y}-${m}-${d}` : undefined;
};

const samePayload = (a: AccountDetailsRequest, b: AccountDetailsRequest) =>
  (Object.keys(a) as (keyof AccountDetailsRequest)[]).every((k) => a[k] === b[k]);

/** Register — account details + PIN + email + password (contract v1.1.0).
 *  Layout mirrors UI-design-repo AccountDetailsScreen 1:1.
 *  After submission, navigates to verify-email (NOT sessionStarted). */
export default function AccountDetailsScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const insets = useSafeAreaInsets();
  const kbd = useKeyboardScrollPad();
  const router = useRouter();
  const { toast } = useToast();
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmPinError, setConfirmPinError] = useState<string | undefined>();
  const completeAccount = useCompleteAccountDetails();
  // This step submits with the in-memory registration token issued by phone
  // OTP verification — a deep link without it can only dead-end, so bounce
  // back to register.
  const [hasRegistrationToken] = useState(() => getRegistrationToken() !== null);

  const { control, handleSubmit } = useForm<AccountDetailsForm>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: { fullName: '', dateOfBirth: '', pin: '', email: '', password: '', confirmPassword: '' },
  });
  const pin = useWatch({ control, name: 'pin' });

  const onSubmit = handleSubmit(async (values) => {
    if (confirmPin !== values.pin) {
      setConfirmPinError("PINs don't match");
      return;
    }
    const payload: AccountDetailsRequest = {
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth,
      pin: values.pin,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    };
    console.log('[AccountDetails] Submitting:', { fullName: payload.fullName, email: payload.email, dateOfBirth: payload.dateOfBirth });
    // Back-nav resubmit with nothing changed: details are already saved and
    // re-POSTing only burns the email-OTP resend limit (429). Go straight to
    // verify-email instead.
    const stashed = accountDetailsStore.get();
    if (stashed && samePayload(stashed, payload)) {
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: payload.email },
      });
      return;
    }
    try {
      const response = await completeAccount.mutateAsync(payload);
      console.log('[AccountDetails] Response:', JSON.stringify(response));
      // Stash on success for the verify-email "Resend code" button — the
      // email OTP is (re)sent by re-submitting this payload (no dedicated
      // resend endpoint). Also marks this payload as already-saved for the
      // skip check above.
      accountDetailsStore.stash(payload);
      // Keep the registration token in memory — verify-email needs it for the
      // OTP call AND for resending the email. It is cleared after email
      // verification succeeds (see verify-email onVerified).
      // Pass email to verify-email screen for the OTP request
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: payload.email },
      });
    } catch (err: any) {
      const apiErr = toApiError(err);
      console.error('[AccountDetails] Error:', {
        message: apiErr.message,
        status: apiErr.status,
        traceId: apiErr.traceId,
      });
      toast({
        variant: 'error',
        title: "Couldn't save details",
        description: apiErr.message || 'Check the form and try again.',
      });
    }
  });

  if (!hasRegistrationToken) return <Redirect href="/(auth)/register" />;

  const pinMismatch = confirmPin.length === 4 && confirmPin !== pin;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <IconButton
            icon={<ArrowLeft size={t.iconSize.md} color={t.colors.actionPrimary} />}
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />
          <View style={styles.headerText}>
            <Typography variant="h4" numberOfLines={1}>
              Your details
            </Typography>
            <Typography variant="caption" color="muted" numberOfLines={1}>
              Step 3 of 6
            </Typography>
          </View>
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
            <Progress value={(3 / 6) * 100} size="sm" accessibilityLabel="Step 3 of 6" />

            <View style={styles.heading}>
              <Typography variant="h2">Almost there</Typography>
              <Typography color="secondary">
                These details secure your account and speed up venue check-in.
              </Typography>
            </View>

            <View style={styles.section}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField
                    label="Full name"
                    required
                    error={fieldState.error?.message}
                    helperText="As on your government ID.">
                    <Input
                      placeholder="Ada Example"
                      autoCapitalize="words"
                      autoComplete="name"
                      value={value}
                      onChangeText={onChange}
                      state={fieldState.error ? 'error' : 'default'}
                    />
                  </FormField>
                )}
              />

              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField label="Date of birth" required error={fieldState.error?.message}>
                    <DatePicker
                      placeholder="Date of birth"
                      maxDate={new Date().toISOString().slice(0, 10)}
                      value={apiDateToIso(value)}
                      onValueChange={(iso) => onChange(isoToApiDate(iso))}
                      state={fieldState.error ? 'error' : 'default'}
                      accessibilityLabel="Date of birth"
                    />
                  </FormField>
                )}
              />

              <Controller
                control={control}
                name="pin"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField
                    label="App PIN"
                    required
                    error={fieldState.error?.message}
                    helperText="4 digits — used for quick unlock.">
                    <OtpInput
                      length={4}
                      value={value}
                      onChange={onChange}
                      error={fieldState.error != null}
                      accessibilityLabel="App PIN"
                    />
                  </FormField>
                )}
              />

              <FormField
                label="Confirm PIN"
                required
                error={confirmPinError ?? (pinMismatch ? "PINs don't match" : undefined)}>
                <OtpInput
                  length={4}
                  value={confirmPin}
                  onChange={(v) => {
                    setConfirmPin(v);
                    setConfirmPinError(undefined);
                  }}
                  error={confirmPinError != null || pinMismatch}
                  accessibilityLabel="Confirm PIN"
                />
              </FormField>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField label="Email" required error={fieldState.error?.message}>
                    <Input
                      placeholder="ada@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      value={value}
                      onChangeText={onChange}
                      state={fieldState.error ? 'error' : 'default'}
                      iconLeft={<Mail size={t.iconSize.md} color={t.colors.actionPrimary} />}
                    />
                  </FormField>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField label="Password" required error={fieldState.error?.message}>
                    <Input
                      placeholder="Create a password"
                      secureTextEntry
                      autoComplete="new-password"
                      value={value}
                      onChangeText={onChange}
                      state={fieldState.error ? 'error' : 'default'}
                      iconLeft={<Lock size={t.iconSize.md} color={t.colors.actionPrimary} />}
                    />
                  </FormField>
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField label="Confirm password" required error={fieldState.error?.message}>
                    <Input
                      placeholder="Repeat password"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      state={fieldState.error ? 'error' : 'default'}
                      iconLeft={<Lock size={t.iconSize.md} color={t.colors.actionPrimary} />}
                    />
                  </FormField>
                )}
              />
            </View>
          </View>
        </ScrollView>

        <View {...kbd.footerProps} style={[styles.footer, { paddingBottom: t.spacing[4] + insets.bottom }]}>
          <Button
            fullWidth
            size="lg"
            loading={completeAccount.isPending}
            onPress={onSubmit}
            accessibilityLabel="Continue">
            Continue
          </Button>
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
  heading: { gap: t.spacing[1] },
  section: { gap: t.spacing[4] },
  footer: {
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[6],
    gap: t.spacing[2],
  },
}));
