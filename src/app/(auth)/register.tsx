import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput as RNTextInput, ScrollView, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, ProgressTrack } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useRegister } from '@/features/auth/mutations';
import { PhoneForm, phoneSchema } from '@/features/auth/schemas';

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

/** Register — contact step. Pixel-match of `auth/register.tsx (contact)`. */
export default function RegisterScreen() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const register = useRegister();
  const { control, handleSubmit } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await register.mutateAsync({
        phone: values.phone,
        countryCode: selectedCountry.code,
      });
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { phone: values.phone, countryCode: selectedCountry.code },
      });
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Could not send code. Please try again.');
    }
  });

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <TopBar title="" />
        <ProgressTrack percent={12} />
        <View className="flex-1 px-6">
          <View className="items-center pb-[6px] pt-[14px]">
            <Text accessibilityRole="header" className="mb-1 text-center text-[20px] font-bold text-primary">
              What&apos;s your number?
            </Text>
            <Text className="text-center text-[14px] text-muted">We&apos;ll send you a verification code</Text>
          </View>
          <View className="mt-6" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Pressable onPress={() => setPickerOpen(true)} style={{ width: 90 }}>
              <Text className="text-[12px] mb-1.5" style={{ color: Colors.textFaint, fontWeight: '500' }}>Code</Text>
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
                name="phone"
                render={({ field: { onChange, value }, fieldState }) => (
                  <View>
                    <Text className="text-[12px] mb-1.5" style={{ color: Colors.textFaint, fontWeight: '500' }}>Phone Number</Text>
                    <View
                      className="h-[56px] flex-row items-center rounded-[12px] border bg-white px-4"
                      style={{ borderColor: fieldState.error ? Colors.warning : Colors.borderInput }}>
                      <RNTextInput
                        accessibilityLabel="Phone Number"
                        placeholder="(555) 123-4567"
                        placeholderTextColor={Colors.textFaint}
                        keyboardType="phone-pad"
                        value={value}
                        onChangeText={onChange}
                        style={{ flex: 1, fontSize: 16, fontWeight: '500', color: Colors.ink }}
                      />
                    </View>
                    {fieldState.error ? (
                      <Text className="mt-1 text-[11px]" style={{ color: Colors.warning }}>{fieldState.error.message}</Text>
                    ) : null}
                  </View>
                )}
              />
            </View>
          </View>
          <Spacer />
          {submitError ? (
            <Text className="mb-3 text-center text-[13px]" style={{ color: '#EF4444' }}>
              {submitError}
            </Text>
          ) : null}
          <View className="pb-6">
            <Button label="Send Code" onPress={onSubmit} loading={register.isPending} />
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
