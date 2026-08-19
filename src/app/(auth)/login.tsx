import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
      <LinearGradient
        colors={['#ffffff', '#93c5fd']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-6">
        <View className="mb-10 mt-[52px] items-center">
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 20,
            elevation: 2,
          }}>
            <Image
              source={require('../../../assets/images/truepas-logo.png')}
              style={{ width: 46, height: 46 }}
              contentFit="contain"
              transition={120}
            />
          </View>
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
