import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField, ScreenHeader } from '@/components/composite';
import { CoreButton, Select, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import type { DocumentType } from '@/types/domain';

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivingLicense', label: "Driver's License" },
  { value: 'greenCard', label: 'US Green Card' },
  { value: 'birthCertificate', label: 'Birth Certificate' },
  { value: 'usVisa', label: 'U.S. Visa' },
];

/** Add document — step 1 of 2: pick the type, then scan.
 *  Number/label/expiry are NOT collected — server-side Regula OCR extracts
 *  them during /verify (processing screen sends 'PENDING' placeholders).
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

  const continueToUpload = () => {
    const params: Record<string, string> = { type };
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
      <ScreenHeader title="Add document" subtitle="Step 1 of 2 — choose type" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <FormField label="Document type" required>
          <Select
            options={DOC_TYPES}
            value={type}
            onValueChange={(v) => setType(v as DocumentType)}
            placeholder="Choose a type"
            title="Document type"
            accessibilityLabel="Document type"
          />
        </FormField>
        <Typography variant="body-sm" color="secondary">
          The document number and expiry are read from the scan automatically.
        </Typography>
      </ScrollView>
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
