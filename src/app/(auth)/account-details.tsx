import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, useRouter } from 'expo-router';
import { Calendar, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRegistrationToken } from '@/api/client';
import { Alert, BottomSheet, FormField, ScreenHeader } from '@/components/composite';
import { CoreButton, Input, Progress, Typography } from '@/components/ui';
import { useCompleteAccountDetails } from '@/features/auth/mutations';
import { AccountDetailsForm, accountDetailsSchema } from '@/features/auth/schemas';
import { accountDetailsStore } from '@/services/accountDetailsStore';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Register — account details + PIN + email + password (contract v1.1.0).
 *  After submission, navigates to verify-email (NOT sessionStarted). */
export default function AccountDetailsScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const completeAccount = useCompleteAccountDetails();
  // This step submits with the in-memory registration token issued by phone
  // OTP verification — a deep link without it can only dead-end, so bounce
  // back to register.
  const [hasRegistrationToken] = useState(() => getRegistrationToken() !== null);

  const { control, handleSubmit, setValue } = useForm<AccountDetailsForm>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: { fullName: '', dateOfBirth: '', pin: '', email: '', password: '', confirmPassword: '' },
  });

  const formatDate = (month: number, day: number, year: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${mm}/${dd}/${year}`;
  };

  const confirmDate = () => {
    setValue('dateOfBirth', formatDate(selectedMonth, selectedDay, selectedYear), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setShowDatePicker(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    console.log('[AccountDetails] Submitting:', { fullName: values.fullName, email: values.email, dateOfBirth: values.dateOfBirth });
    // Stash for the verify-email "Resend code" button — the email OTP is
    // (re)sent by re-submitting this payload (no dedicated resend endpoint).
    accountDetailsStore.stash(values);
    try {
      const response = await completeAccount.mutateAsync({
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        pin: values.pin,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      console.log('[AccountDetails] Response:', JSON.stringify(response));
      // Keep the registration token in memory — verify-email needs it for the
      // OTP call AND for resending the email. It is cleared after email
      // verification succeeds (see verify-email onVerified).
      // Pass email to verify-email screen for the OTP request
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: values.email },
      });
    } catch (err: any) {
      console.error('[AccountDetails] Error:', {
        message: err?.message,
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
      });
      setSubmitError(err?.message ?? 'Could not save details. Please try again.');
    }
  });

  if (!hasRegistrationToken) return <Redirect href="/(auth)/register" />;

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const pickerColumn = (items: { label: string; selected: boolean; onPress: () => void }[]) => (
    <View
      style={{
        flex: 1,
        borderWidth: theme.sizes.fieldBorderWidth,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        height: 200,
        overflow: 'hidden',
      }}>
      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityState={{ selected: item.selected }}
            onPress={item.onPress}
            style={{
              paddingVertical: theme.spacing[2],
              alignItems: 'center',
              backgroundColor: item.selected ? theme.colors.actionPrimarySubtle : 'transparent',
            }}>
            <Typography
              variant="body"
              style={{
                fontWeight: item.selected ? theme.fontWeight.semibold : theme.fontWeight.regular,
                color: item.selected ? theme.colors.actionPrimary : theme.colors.textPrimary,
              }}>
              {item.label}
            </Typography>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader title="Sign Up" />
        <View style={{ paddingHorizontal: theme.spacing[4] }}>
          <Progress value={45} accessibilityLabel="Registration progress" />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Typography variant="h3" center>
            Your details
          </Typography>

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value }, fieldState }) => (
              <FormField label="Full Name" error={fieldState.error?.message}>
                <Input
                  placeholder="Jane Doe"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  state={fieldState.error ? 'error' : 'default'}
                  iconLeft={<User size={iconSize.sm} color={theme.colors.textMuted} />}
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { value }, fieldState }) => (
              <FormField label="Date of Birth" error={fieldState.error?.message}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select date of birth"
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    height: theme.sizes.heightMd,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    borderRadius: theme.radii.md,
                    borderWidth: theme.sizes.fieldBorderWidth,
                    borderColor: fieldState.error ? theme.colors.error : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: theme.sizes.controlPaddingXMd,
                  }}>
                  <Typography
                    variant="body"
                    style={{
                      flex: 1,
                      color: value ? theme.colors.textPrimary : theme.colors.textMuted,
                    }}>
                    {value || 'MM/DD/YYYY'}
                  </Typography>
                  <Calendar size={iconSize.sm} color={theme.colors.textMuted} />
                </Pressable>
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState }) => (
              <FormField label="Email" error={fieldState.error?.message}>
                <Input
                  placeholder="jane.doe@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  state={fieldState.error ? 'error' : 'default'}
                  iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />}
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="pin"
            render={({ field: { onChange, value }, fieldState }) => (
              <FormField label="Set 4-digit PIN" error={fieldState.error?.message}>
                <Input
                  placeholder="• • • •"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={value}
                  onChangeText={onChange}
                  state={fieldState.error ? 'error' : 'default'}
                  iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState }) => (
              <FormField label="Password" error={fieldState.error?.message}>
                <Input
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  state={fieldState.error ? 'error' : 'default'}
                  iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
                  iconRight={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}>
                      {showPassword ? (
                        <EyeOff size={iconSize.sm} color={theme.colors.textMuted} />
                      ) : (
                        <Eye size={iconSize.sm} color={theme.colors.textMuted} />
                      )}
                    </Pressable>
                  }
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value }, fieldState }) => (
              <FormField label="Confirm Password" error={fieldState.error?.message}>
                <Input
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  state={fieldState.error ? 'error' : 'default'}
                  iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
                  iconRight={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      hitSlop={8}>
                      {showConfirmPassword ? (
                        <EyeOff size={iconSize.sm} color={theme.colors.textMuted} />
                      ) : (
                        <Eye size={iconSize.sm} color={theme.colors.textMuted} />
                      )}
                    </Pressable>
                  }
                />
              </FormField>
            )}
          />
          <Alert variant="info">
            Your PIN secures your face enrollment and future updates.
          </Alert>
          {submitError ? <Alert variant="error">{submitError}</Alert> : null}
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
            loading={completeAccount.isPending}
            accessibilityLabel="Continue"
            onPress={onSubmit}>
            Continue
          </CoreButton>
        </View>
      </KeyboardAvoidingView>

      {/* Date of birth picker — wheel-style bottom sheet */}
      <BottomSheet
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        title="Select Date of Birth"
        maxHeightRatio={0.55}
        footer={
          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
            <CoreButton variant="outline" style={{ flex: 1 }} onPress={() => setShowDatePicker(false)}>
              Cancel
            </CoreButton>
            <CoreButton style={{ flex: 1 }} onPress={confirmDate}>
              Confirm
            </CoreButton>
          </View>
        }>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          {pickerColumn(
            MONTHS.map((m, i) => ({
              label: m,
              selected: selectedMonth === i,
              onPress: () => setSelectedMonth(i),
            })),
          )}
          {pickerColumn(
            days.map((d) => ({
              label: String(d),
              selected: selectedDay === d,
              onPress: () => setSelectedDay(d),
            })),
          )}
          {pickerColumn(
            years.map((y) => ({
              label: String(y),
              selected: selectedYear === y,
              onPress: () => setSelectedYear(y),
            })),
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
