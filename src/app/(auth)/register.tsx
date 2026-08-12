import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, FloatingInput, ProgressTrack } from '@/components/ui';
import { PhoneForm, phoneSchema } from '@/features/auth/schemas';

/** Register — contact step. Pixel-match of `auth/register.tsx (contact)`. */
export default function RegisterScreen() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(() => router.push('/(auth)/verify-phone'));

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
          <View className="-mx-6 mt-6">
            <FloatingInput
              label="Country Code"
              value="🇺🇸 +1 — United States"
              editable={false}
              rightSlot={<Text className="text-muted">▾</Text>}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value }, fieldState }) => (
                <FloatingInput
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
          <Spacer />
          <View className="pb-6">
            <Button label="Send Code" onPress={onSubmit} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
