import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { BrandMark } from '@/components/app';
import { FormField } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Input, Link, Typography } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoginForm, loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const DEFAULT_COUNTRY_CODE = '+1';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useThemeTokens();
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setLoginError('');
    try {
      let identifier = values.identifier.trim();
      if (/^\d{10}$/.test(identifier)) {
        identifier = `${DEFAULT_COUNTRY_CODE}${identifier}`;
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

      await secureStorage.setRefreshToken(refreshToken);
      dispatch(sessionStarted({ user, accessToken, refreshToken }));
    } catch (error) {
      setLoginError(toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ScreenContainer scroll background={false}>
      <View style={{ padding: theme.spacing[4], paddingTop: theme.spacing[8], gap: theme.spacing[4] }}>
        <BrandMark />

        <View style={{ gap: theme.spacing[1] }}>
          <Typography variant="h2">Welcome back</Typography>
          <Typography variant="body-lg" color="secondary">
            Sign in with your email or phone.
          </Typography>
        </View>

        <View style={{ gap: theme.spacing[4] }}>
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, value }, fieldState }) => (
              <FormField label="Email or phone" error={fieldState.error?.message}>
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="ada@example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />}
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
                  value={value}
                  onChangeText={onChange}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
                />
              </FormField>
            )}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Link onPress={() => router.push('/(auth)/forgot-password' as never)} accessibilityLabel="Forgot password">
              Forgot password?
            </Link>
          </View>

          {loginError ? (
            <Typography color="error" center>
              {loginError}
            </Typography>
          ) : null}
        </View>

        <View style={{ gap: theme.spacing[3], marginTop: theme.spacing[2] }}>
          <Button
            fullWidth
            size="lg"
            loading={submitting}
            onPress={onSubmit}
            style={{ backgroundColor: theme.colors.actionPrimary, width: '100%' }}
          >
            Sign in
          </Button>

          <Typography variant="body-sm" color="muted" center>
            New to Truepas?{' '}
            <Link onPress={() => router.push('/(auth)/register')} accessibilityLabel="Create account">
              Create account
            </Link>
          </Typography>
        </View>
      </View>
    </ScreenContainer>
  );
}
