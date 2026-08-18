import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, CheckboxRow, Chip, ChipRow, FloatingInput, Stepper } from '@/components/ui';
import { ageBandFromAge, ageFromDob } from '@/features/family/hooks';

const RELATIONSHIPS = ['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling'] as const;

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
  const [relationship, setRelationship] = useState<(typeof RELATIONSHIPS)[number]>('Son');
  const [consented, setConsented] = useState(false);

  const { control, handleSubmit } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { fullName: '', dateOfBirth: '' },
  });

  const onSubmit = handleSubmit((values) => {
    const age = ageFromDob(values.dateOfBirth);
    const band = ageBandFromAge(age);
    if (band === '18+') {
      router.push({ pathname: '/family/add/rejected', params: { name: values.fullName, age: String(age) } });
      return;
    }
    router.push({ pathname: '/family/add/document', params: { name: values.fullName, band } });
  });

  return (
    <ScreenContainer scroll={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
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
                gradient
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
                gradient
              />
            )}
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
    </ScreenContainer>
  );
}
