import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { api } from '@/api';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, FloatingInput, InfoBanner, ProgressTrack } from '@/components/ui';
import { AccountDetailsForm, accountDetailsSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

/** Register — account details + PIN (PRD FR-03). Ends the auth flow; face gate follows. */
export default function AccountDetailsScreen() {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<AccountDetailsForm>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: { fullName: '', dateOfBirth: '', pin: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    const user = await api.getUser();
    dispatch(
      sessionStarted({
        user: { ...user, fullName: values.fullName, faceEnrolled: false, biometricConsentAt: null },
        accessToken: 'mock-access-token',
      })
    );
    setSubmitting(false);
  });

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <TopBar title="Sign Up" />
      <ProgressTrack percent={45} />
      <View className="flex-1 px-6">
        <View className="items-center pb-1 pt-[10px]">
          <Text accessibilityRole="header" className="text-center text-[18px] font-bold text-primary">
            Your details
          </Text>
        </View>
        <View className="-mx-6 mt-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="Full Name"
                placeholder="Jane Doe"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="Date of Birth"
                placeholder="MM / DD / YYYY"
                keyboardType="numbers-and-punctuation"
                value={value}
                onChangeText={onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="pin"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="Set 4-digit PIN"
                placeholder="• • • •"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={value}
                onChangeText={onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <InfoBanner leading="info">
            Your PIN secures your face enrollment and future updates.
          </InfoBanner>
        </View>
        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Continue" onPress={onSubmit} loading={submitting} />
        </View>
      </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
