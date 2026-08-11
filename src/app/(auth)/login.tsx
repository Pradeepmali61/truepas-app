import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { api } from '@/api';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, FloatingInput, Icon } from '@/components/ui';
import { LoginForm, loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

/** Login (returning user) — pixel-match of `auth/login.tsx` mockup. */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async () => {
    setSubmitting(true);
    const user = await api.getUser();
    dispatch(sessionStarted({ user, accessToken: 'mock-access-token' }));
    setSubmitting(false);
  });

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-6">
        <View className="mb-10 mt-[52px] items-center">
          <View className="mb-6 h-[100px] w-[100px] items-center justify-center rounded-[24px] bg-surface overflow-hidden">
            <Image
              source={require('../../../assets/images/logo-glow.png')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
              transition={120}
            />
          </View>
          <Text accessibilityRole="header" className="mb-3 text-[24px] font-extrabold text-ink">
            Login to Truepas
          </Text>
          <Text className="text-center text-[14px] leading-5 text-muted">
            Enter your mobile number or email ID linked{'\n'}to your Truepas Account.
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
                rightSlot={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((v) => !v)}
                    className="h-9 w-9 items-center justify-center">
                    <Icon name="eye" size={20} color="#999" />
                  </Pressable>
                }
              />
            )}
          />
          <View className="-mt-2 items-end px-6">
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot password">
              <Text className="text-[14px] font-medium text-primary underline">Forgot password?</Text>
            </Pressable>
          </View>
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
