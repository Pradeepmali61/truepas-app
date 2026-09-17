import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { BrandMark } from '@/components/app';
import { FormField } from '@/components/composite';
import { SoftCard, useKitStyles } from '@/components/truepas';
import { Checkbox, Input, Link, Select, Typography } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { COUNTRIES } from '@/constants/countries';
import { LoginForm, loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const DEFAULT_COUNTRY_CODE = '+91';
type LoginMethod = 'phone' | 'email';

/** Login — email + password; "Remember me" controls whether the refresh token
 *  is persisted. */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useThemeTokens();
  const kit = useKitStyles();
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { control, handleSubmit, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const switchMethod = (next: LoginMethod) => {
    if (next === method) return;
    setMethod(next);
    setValue('identifier', '');
    setLoginError('');
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setLoginError('');
    try {
      let identifier = values.identifier.trim();
      if (method === 'phone') {
        const digits = identifier.replace(/\D/g, '');
        const cc = countryCode.slice(1);
        identifier = digits.startsWith(cc) ? `+${digits}` : `${countryCode}${digits}`;
      } else if (!identifier.includes('@')) {
        const digits = identifier.replace(/\D/g, '');
        if (digits.length === 10) {
          identifier = `${DEFAULT_COUNTRY_CODE}${digits}`;
        } else if (digits.length > 10) {
          identifier = `+${digits}`;
        }
      }

      const { user, accessToken, refreshToken } = await api.login({
        identifier,
        password: values.password,
      });

      if (!accessToken || !refreshToken) {
        setLoginError('Login incomplete — tokens missing. Please finish registration or contact support.');
        setSubmitting(false);
        return;
      }

      if (!remember) {
        await secureStorage.clearRefreshToken();
      }
      dispatch(sessionStarted({ user, accessToken, refreshToken: remember ? refreshToken : undefined }));
    } catch (error) {
      setLoginError(toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing[5] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SoftCard style={[kit.loginCard, { width: '100%', gap: theme.spacing[6], padding: theme.spacing[6] }]}>
          <View style={kit.loginHead}>
            <BrandMark />
            <Typography variant="h1">Welcome back</Typography>
          </View>

          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: 'row',
              backgroundColor: theme.colors.surfaceSunken,
              borderRadius: theme.radii.lg,
              padding: theme.spacing[1.5],
            }}>
            {(['phone', 'email'] as const).map((m) => {
              const active = method === m;
              return (
                <Pressable
                  key={m}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Sign in with ${m}`}
                  onPress={() => switchMethod(m)}
                  style={{
                    flex: 1,
                    height: theme.sizes.touchTarget,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: theme.radii.md,
                    backgroundColor: active ? theme.colors.actionPrimary : 'transparent',
                  }}>
                  <Typography
                    variant="body-lg"
                    color={active ? 'inverse' : 'secondary'}
                    style={{ fontWeight: active ? theme.fontWeight.semibold : theme.fontWeight.medium }}>
                    {m === 'phone' ? 'Phone' : 'Email'}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: theme.spacing[5] }}>
            {method === 'phone' ? (
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField label="Mobile number" error={fieldState.error?.message}>
                    <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                      <Select
                        size="lg"
                        title="Country code"
                        accessibilityLabel="Country code"
                        style={{ width: 124 }}
                        value={countryCode}
                        onValueChange={setCountryCode}
                        options={COUNTRIES.map((c) => ({
                          value: c.code,
                          label: `${c.flag} ${c.name} (${c.code})`,
                          fieldLabel: `${c.flag} ${c.code}`,
                        }))}
                      />
                      <Input
                        size="lg"
                        containerStyle={{ flex: 1 }}
                        value={value}
                        onChangeText={onChange}
                        placeholder="98765 43210"
                        keyboardType="phone-pad"
                        autoCorrect={false}
                        iconLeft={<Phone size={iconSize.lg} color={theme.colors.actionPrimary} />}
                      />
                    </View>
                  </FormField>
                )}
              />
            ) : (
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, value }, fieldState }) => (
                  <FormField label="Email" error={fieldState.error?.message}>
                    <Input
                      size="lg"
                      value={value}
                      onChangeText={onChange}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      iconLeft={<Mail size={iconSize.lg} color={theme.colors.actionPrimary} />}
                    />
                  </FormField>
                )}
              />
            )}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value }, fieldState }) => (
                <FormField label="Password" error={fieldState.error?.message}>
                  <Input
                    size="lg"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    iconLeft={<Lock size={iconSize.lg} color={theme.colors.actionPrimary} />}
                    iconRight={
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        onPress={() => setShowPassword((s) => !s)}
                        hitSlop={8}>
                        {showPassword ? (
                          <EyeOff size={iconSize.lg} color={theme.colors.actionPrimary} />
                        ) : (
                          <Eye size={iconSize.lg} color={theme.colors.actionPrimary} />
                        )}
                      </Pressable>
                    }
                  />
                </FormField>
              )}
            />
          </View>

          <View style={kit.rowBetween}>
            <Checkbox
              checked={remember}
              onCheckedChange={setRemember}
              label={<Typography variant="body-lg">Remember me</Typography>}
            />
            <Link
              variant="quiet"
              onPress={() => router.push('/(auth)/forgot-password' as never)}
              accessibilityLabel="Forgot password"
              style={{ fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium, flexShrink: 0 }}>
              Forgot password?
            </Link>
          </View>

          {loginError ? (
            <Typography color="error" center>
              {loginError}
            </Typography>
          ) : null}

          <Button fullWidth size="lg" loading={submitting} onPress={onSubmit}>
            Sign in
          </Button>

          <Typography variant="body" color="muted" center>
            New to TruePas?{' '}
            <Link
              variant="quiet"
              onPress={() => router.push('/(auth)/register')}
              accessibilityLabel="Create account"
              style={{ fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium }}>
              Create an account
            </Link>
          </Typography>
        </SoftCard>
      </ScrollView>
    </SafeAreaView>
  );
}
