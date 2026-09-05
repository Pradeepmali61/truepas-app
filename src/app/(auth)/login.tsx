import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput as RNTextInput, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, FloatingInput, Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { LoginForm, loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';

const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
];

/** Login (returning user) — now with visible country code selector. */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setLoginError('');
    try {
      // Normalize identifier:
      // - 10 digits => prepend selected country code (default +1)
      // - already has + or @ (email) => use as-is
      let identifier = values.identifier.trim();
      if (/^\d{10}$/.test(identifier)) {
        identifier = `${selectedCountry.code}${identifier}`;
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

        <View className="mb-6">
          {/* Identifier with country code — same layout as register screen */}
          <View className="mb-4" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Pressable onPress={() => setPickerOpen(true)} style={{ width: 90 }}>
              <Text className="mb-1.5 text-[12px]" style={{ color: Colors.textFaint, fontWeight: '500' }}>Code</Text>
              <View
                className="h-[56px] flex-row items-center rounded-[12px] border bg-white px-3"
                style={{ borderColor: Colors.borderInput }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.ink }} numberOfLines={1}>
                  {selectedCountry.flag} {selectedCountry.code}
                </Text>
                <Text style={{ fontSize: 14, color: Colors.textMuted, marginLeft: 'auto' }}>▾</Text>
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, value }, fieldState }) => (
                  <>
                    <Text className="mb-1.5 text-[12px]" style={{ color: Colors.textFaint, fontWeight: '500' }}>
                      E-mail/Mobile Number
                    </Text>
                    <View
                      className="h-[56px] flex-row items-center rounded-[12px] border bg-white px-4"
                      style={{ borderColor: fieldState.error ? Colors.warning : Colors.borderInput }}>
                      <RNTextInput
                        placeholderTextColor={Colors.textFaint}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        value={value}
                        onChangeText={onChange}
                        style={{ flex: 1, fontSize: 16, fontWeight: '500', color: Colors.ink }}
                      />
                    </View>
                    {fieldState.error ? (
                      <Text className="mt-1 text-[11px]" style={{ color: Colors.warning }}>{fieldState.error.message}</Text>
                    ) : null}
                  </>
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                noMargin
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
          <View className="-mt-2 items-end">
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot password" onPress={() => router.push('/(auth)/forgot-password' as never)}>
              <Text className="text-[14px] font-medium text-primary underline">Forgot password?</Text>
            </Pressable>
          </View>
          {loginError ? (
            <Text className="mt-3 text-center text-[13px]" style={{ color: '#EF4444' }}>
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

      {/* Country picker modal */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setPickerOpen(false)} />
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.ink, textAlign: 'center', marginBottom: 12 }}>
            Select Country
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {COUNTRIES.map((country) => (
              <Pressable
                key={country.code}
                onPress={() => {
                  setSelectedCountry(country);
                  setPickerOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  backgroundColor: selectedCountry.code === country.code ? '#F0FAFF' : 'transparent',
                }}>
                <Text style={{ fontSize: 24 }}>{country.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink }}>{country.name}</Text>
                  <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>{country.code}</Text>
                </View>
                {selectedCountry.code === country.code ? (
                  <Text style={{ fontSize: 18, color: Colors.primary }}>✓</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
