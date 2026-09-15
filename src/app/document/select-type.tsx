import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DatePicker, FormField, ScreenHeader } from '@/components/composite';
import { CoreButton, Input, Select } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import type { DocumentType } from '@/types/domain';

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivingLicense', label: "Driver's License" },
  { value: 'idCard', label: 'Identity Card' },
  { value: 'greenCard', label: 'US Green Card' },
  { value: 'birthCertificate', label: 'Birth Certificate' },
  { value: 'usVisa', label: 'U.S. Visa' },
];

const LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
  idCard: 'Identity Card',
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Add document — step 1 of 2: metadata (POST /cb/documents contract).
 *  "Continue to upload" forwards { type, label, number, expiresAt } to the
 *  capture screen; the document is POSTed by the processing screen after
 *  capture so no orphan pending doc is left if the user abandons the scan.
 *  Supports family mode: when `family` param is set, the scan flow is scoped
 *  to a family member (personId). */
export default function AddDocumentScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family, personId, memberName, band } = useLocalSearchParams<{
    family?: string;
    personId?: string;
    memberName?: string;
    band?: string;
  }>();
  const isFamilyMode = family === '1';

  const [type, setType] = useState<DocumentType>('passport');
  const [label, setLabel] = useState(LABELS.passport);
  const [number, setNumber] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const onTypeChange = (v: string) => {
    const next = v as DocumentType;
    // Keep the label in sync while it is untouched/auto-filled.
    setLabel((prev) => (prev.trim() === '' || prev === LABELS[type] ? LABELS[next] : prev));
    setType(next);
  };

  const errors = submitted
    ? {
        label: label.trim() ? undefined : 'Enter a label',
        number: number.trim().length >= 2 ? undefined : 'Enter the document number',
        expiresAt: expiresAt ? undefined : 'Pick the expiry date',
      }
    : {};

  const continueToUpload = () => {
    setSubmitted(true);
    if (!label.trim() || number.trim().length < 2 || !expiresAt) return;
    const params: Record<string, string> = {
      type,
      label: label.trim(),
      number: number.trim(),
      expiresAt,
    };
    if (isFamilyMode) {
      params.family = '1';
      params.personId = personId ?? '';
      params.name = memberName ?? '';
      params.band = band ?? '';
    }
    router.push({ pathname: '/document/scan', params });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Add document" subtitle="Step 1 of 2 — details" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <FormField label="Document type" required>
            <Select
              options={DOC_TYPES}
              value={type}
              onValueChange={onTypeChange}
              placeholder="Choose a type"
              title="Document type"
              accessibilityLabel="Document type"
            />
          </FormField>
          <FormField label="Label" required error={errors.label}>
            <Input
              value={label}
              onChangeText={setLabel}
              placeholder="US Passport"
              accessibilityLabel="Label"
            />
          </FormField>
          <FormField label="Document number" required error={errors.number}>
            <Input
              value={number}
              onChangeText={setNumber}
              placeholder="e.g. 123456789"
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Document number"
            />
          </FormField>
          <FormField label="Expiry date" required error={errors.expiresAt}>
            <DatePicker
              value={expiresAt}
              onValueChange={setExpiresAt}
              placeholder="YYYY-MM-DD"
              minDate={todayISO()}
              accessibilityLabel="Expiry date"
            />
          </FormField>
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
          gap: theme.spacing[2],
        }}>
        <CoreButton fullWidth size="lg" accessibilityLabel="Continue to upload" onPress={continueToUpload}>
          Continue to upload
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
