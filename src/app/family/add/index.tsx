import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AppBackground } from '@/components/layout/AppBackground';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, CheckboxRow, Chip, ChipRow, FloatingInput, Icon, Stepper } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { ageBandFromAge, ageFromDob } from '@/features/family/hooks';

const RELATIONSHIPS = ['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling'] as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const basicInfoSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name').max(100, 'Too long'),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12][0-9]|3[01])\s*\/\s*(19|20)\d{2}$/, 'Use MM / DD / YYYY'),
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;

/** Add family — step 1: basic info + guardianship consent (PRD). */
export default function AddFamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [relationship, setRelationship] = useState<(typeof RELATIONSHIPS)[number]>('Son');
  const [consented, setConsented] = useState(false);
  // DOB calendar picker (same as the signup page) — family members are minors,
  // so default the year to something recent instead of signup's 2000.
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear - 5);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);

  const { control, handleSubmit, setValue } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { fullName: '', dateOfBirth: '' },
  });

  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const confirmDate = () => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    setValue('dateOfBirth', `${mm}/${dd}/${selectedYear}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setShowDatePicker(false);
  };

  const onSubmit = handleSubmit((values) => {
    const age = ageFromDob(values.dateOfBirth);
    const band = ageBandFromAge(age);
    console.log('[FamilyAdd] DOB entered:', values.dateOfBirth, '| calculated age:', age, '| band:', band);
    if (band === '18+') {
      router.push({ pathname: '/family/add/rejected', params: { name: values.fullName, age: String(age) } });
      return;
    }
    router.push({
      pathname: '/family/add/document',
      params: { name: values.fullName, band, dob: values.dateOfBirth, relationship },
    });
  });

  return (
    <ScreenContainer scroll={false} background={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <AppBackground />
      <ScreenHeader title="Add Family Member" />
      <Stepper total={4} done={1} />
      <View className="flex-1 px-6">
        <View className="items-center pb-3 pt-[6px]">
          <Text accessibilityRole="header" className="text-center text-[16px] font-bold text-ink">
            Basic information
          </Text>
        </View>
        <View className="-mx-6">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value }, fieldState }) => (
              <FloatingInput
                label="Full Name"
                placeholder="Max Kim"
                value={value}
                onChangeText={onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { value }, fieldState }) => {
              const hasValue = value !== undefined && value !== '';
              const borderColor = fieldState.error?.message
                ? Colors.warning
                : hasValue
                  ? Colors.primary
                  : Colors.borderInput;
              return (
                <View style={{ marginBottom: 6 }}>
                  <Text allowFontScaling={false} style={{ fontSize: 12, marginBottom: 6, color: fieldState.error?.message ? Colors.warning : hasValue ? Colors.primary : Colors.textFaint, fontWeight: '500' }}>
                    Date of Birth
                  </Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Select date of birth"
                    style={{
                      height: 56,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor,
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 16,
                    }}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontWeight: '500',
                        color: hasValue ? Colors.ink : Colors.textFaint,
                      }}>
                      {hasValue ? value : 'MM / DD / YYYY'}
                    </Text>
                    <Icon name="calendar" size={20} color={Colors.primary} />
                  </Pressable>
                  {fieldState.error?.message ? (
                    <Text style={{ marginTop: 4, paddingHorizontal: 4, fontSize: 11, color: Colors.warning }}>
                      {fieldState.error?.message}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        </View>
        <Text className="mb-2 w-full text-center text-[12px] font-semibold text-muted">Relationship</Text>
        <View className="-mx-6">
          <ChipRow>
            {RELATIONSHIPS.map((rel) => (
              <Chip
                key={rel}
                label={rel}
                selected={relationship === rel}
                onPress={() => setRelationship(rel)}
              />
            ))}
          </ChipRow>
        </View>
        <Spacer />
        <View className="-mx-6">
          <CheckboxRow
            checked={consented}
            onToggle={() => setConsented((v) => !v)}
            label="I confirm I am the parent/legal guardian and consent to identity verification on behalf of this minor."
          />
        </View>
        <View className="pb-6 pt-4">
          <Button label="Continue" onPress={onSubmit} disabled={!consented} />
        </View>
      </View>

      {/* Date Picker Modal — same as the signup page */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowDatePicker(false)} />
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16 }}>
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
