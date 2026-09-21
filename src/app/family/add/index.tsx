import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, DatePicker, FormField, ScreenHeader } from '@/components/composite';
import { CoreButton, Input, Select, type SelectOption } from '@/components/ui';
import { ageBandFromAge, ageFromDob } from '@/features/family/hooks';
import { useThemeTokens } from '@/theme';

const RELATIONSHIPS: SelectOption[] = [
  { value: 'Child', label: 'Child' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Add family — step 1: member basics (POST /cb/family). Any age is accepted;
 *  the flow branches on computed age: 0-4 photo, 5-9 liveness (any camera),
 *  10+ front-camera liveness. */
export default function AddFamilyScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [relationship, setRelationship] = useState('Child');
  const [errors, setErrors] = useState<{ name?: string; dob?: string; relationship?: string }>({});

  const submit = () => {
    const trimmed = fullName.trim();
    const next: typeof errors = {};
    if (trimmed.length < 2) next.name = 'Name is required';
    else if (trimmed.length > 100) next.name = 'Name is too long';
    if (!dob) next.dob = 'Pick a date of birth';
    else {
      const age = ageFromDob(dob);
      if (!Number.isFinite(age)) next.dob = 'Enter a valid date';
      else if (age < 0) next.dob = 'Date of birth must be in the past';
    }
    if (!relationship) next.relationship = 'Choose a relationship';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const age = ageFromDob(dob);
    const band = ageBandFromAge(age);
    router.push({
      pathname: '/family/add/document',
      params: { name: trimmed, band, dob, relationship },
    } as never);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Add member" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <FormField label="Full name" required helperText="As on their document." error={errors.name}>
            <Input
              placeholder="Maya Example"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              maxLength={100}
              accessibilityLabel="Full name"
              iconLeft={<User size={theme.iconSize.md} color={theme.colors.actionPrimary} />}
            />
          </FormField>
          <FormField label="Date of birth" required error={errors.dob}>
            <DatePicker
              value={dob || undefined}
              onValueChange={setDob}
              placeholder="YYYY-MM-DD"
              maxDate={todayIso()}
              accessibilityLabel="Date of birth"
            />
          </FormField>
          <FormField label="Relationship" required error={errors.relationship}>
            <Select
              options={RELATIONSHIPS}
              value={relationship}
              onValueChange={setRelationship}
              placeholder="Choose…"
              title="Relationship"
            />
          </FormField>
          <Alert variant="info" title="Verification depends on age">
            Under 5: document + photo. Ages 5–9: document + liveness (any camera). 10+: document + front-camera liveness.
          </Alert>
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[2],
        }}>
        <CoreButton fullWidth size="lg" accessibilityLabel="Add member" onPress={submit}>
          Add member
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
