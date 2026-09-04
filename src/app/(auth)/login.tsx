import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, FloatingInput, Icon } from '@/components/ui';
import { LoginForm, loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';

/** Login (returning user) — pixel-match of `auth/login.tsx` mockup. */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setLoginError('');
    try {
      // Normalize phone identifier: if user entered a 10-digit US number without
      // a country code, prepend the default +1. Leave emails untouched.
      let identifier = values.identifier.trim();
      if (/^\d{10}$/.test(identifier)) {
        identifier = `+1${identifier}`;
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
    <ScreenContainer scroll={false}>
      <LinearGradient
        colors={['#ffffff', '#84dbfe']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-6">
        <View className="mb-10 mt-[52px] items-center">
          <Image
            source={require('../../../assets/images/truepas-logo2.png')}
            style={{ width: 80, height: 80, marginBottom: 24 }}
            contentFit="contain"
            transition={120}
          />
          <Text accessibilityRole="header" className="mb-3 text-[23px] font-semibold text-ink">
            Login to <Text className="text-primary">Truepas</Text>
          </Text>
        </View>

        <View className="-mx-6 mb-6">
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="E-mail/Mobile Number"
                placeholder="Tap to Enter"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                error={fieldState.error?.message}
                gradient
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={fieldState.error?.message}
                gradient
                rightSlot={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((v) => !v)}
                    className="h-9 w-9 items-center justify-center">
                    <Icon name={showPassword ? 'eyeClosed' : 'eye'} size={20} color="#999" />
                  </Pressable>
                }
              />
            )}
          />
          <View className="-mt-2 items-end px-6">
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot password" onPress={() => router.push('/(auth)/forgot-password' as never)}>
              <Text className="text-[14px] font-medium text-primary underline">Forgot password?</Text>
            </Pressable>
          </View>
          {loginError ? (
            <Text className="mt-3 px-6 text-center text-[13px]" style={{ color: '#EF4444' }}>
              {loginError}
            </Text>
          ) : null}
        </View>

        <Spacer />

        <View className="mt-5">
          <View className="mb-6 flex-row items-center justify-center">
            <Text className="text-[14px] text-muted">Don&apos;t have an account? </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              onPress={() => router.push('/(auth)/register')}>
              <Text className="text-[14px] font-medium text-primary underline">Sign Up</Text>
            </Pressable>
          </View>
          <Button label="Next" onPress={onSubmit} loading={submitting} />
        </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
