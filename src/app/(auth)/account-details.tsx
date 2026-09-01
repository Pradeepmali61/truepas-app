import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { api } from '@/api';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, FloatingInput, Icon, InfoBanner, ProgressTrack } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { AccountDetailsForm, accountDetailsSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Register — account details + PIN (PRD FR-03). Ends the auth flow; face gate follows. */
export default function AccountDetailsScreen() {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);

  const { control, handleSubmit, setValue } = useForm<AccountDetailsForm>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: { fullName: '', dateOfBirth: '', pin: '' },
  });

  const formatDate = (month: number, day: number, year: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${mm} / ${dd} / ${year}`;
  };

  const confirmDate = () => {
    setValue('dateOfBirth', formatDate(selectedMonth, selectedDay, selectedYear), { shouldValidate: true });
    setShowDatePicker(false);
  };

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

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
              <Pressable onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                  <FloatingInput
                    label="Date of Birth"
                    placeholder="MM / DD / YYYY"
                    keyboardType="numbers-and-punctuation"
                    value={value}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    rightSlot={
                      <Pressable onPress={() => setShowDatePicker(true)} hitSlop={8}>
                        <Icon name="calendar" size={20} color={Colors.primary} />
                      </Pressable>
                    }
                  />
                </View>
              </Pressable>
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

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowDatePicker(false)} />
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.ink, textAlign: 'center', marginBottom: 20 }}>
            Select Date of Birth
          </Text>

          {/* Scroll pickers */}
          <View style={{ flexDirection: 'row', height: 200, paddingHorizontal: 24, gap: 12 }}>
            {/* Month */}
            <View style={{ flex: 1.3, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => (
                  <Pressable
                    key={m}
                    onPress={() => setSelectedMonth(i)}
                    style={{
                      paddingVertical: 10,
                      alignItems: 'center',
                      backgroundColor: selectedMonth === i ? '#F0FAFF' : 'transparent',
                    }}>
                    <Text style={{ fontSize: 15, fontWeight: selectedMonth === i ? '700' : '400', color: selectedMonth === i ? Colors.primary : Colors.ink }}>
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            {/* Day */}
            <View style={{ flex: 0.7, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setSelectedDay(d)}
                    style={{
                      paddingVertical: 10,
                      alignItems: 'center',
                      backgroundColor: selectedDay === d ? '#F0FAFF' : 'transparent',
                    }}>
                    <Text style={{ fontSize: 15, fontWeight: selectedDay === d ? '700' : '400', color: selectedDay === d ? Colors.primary : Colors.ink }}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            {/* Year */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => setSelectedYear(y)}
                    style={{
                      paddingVertical: 10,
                      alignItems: 'center',
                      backgroundColor: selectedYear === y ? '#F0FAFF' : 'transparent',
                    }}>
                    <Text style={{ fontSize: 15, fontWeight: selectedYear === y ? '700' : '400', color: selectedYear === y ? Colors.primary : Colors.ink }}>
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" onPress={() => setShowDatePicker(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Confirm" onPress={confirmDate} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
