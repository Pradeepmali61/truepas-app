import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { BrandMark } from '@/components/app';
import { FormField } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input, Link, Typography } from '@/components/ui';
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
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setLoginError('');
    try {
      let identifier = values.identifier.trim();
      if (!identifier.includes('@')) {
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
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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
            label="Sign in"
            size="lg"
            loading={submitting}
            onPress={onSubmit}
          />

          <Typography variant="body-sm" color="muted" center>
            New to Truepas?{' '}
            <Link
              onPress={() => router.push('/(auth)/register')}
              accessibilityLabel="Create account"
              style={{ fontSize: theme.fontSize.sm }}>
              Create account
            </Link>
          </Typography>
        </View>
      </View>
    </ScreenContainer>
  );
}
