import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, ScreenHeader } from '@/components/composite';
import { Badge, CoreButton, Progress, Select, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import type { DocumentType, FamilyAgeBand } from '@/types/domain';

type DocOption = { id: DocumentType; label: string };

const OPTIONS_5_17: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'birthCertificate', label: 'Birth Certificate' },
  { id: 'usVisa', label: 'US Visa' },
];

const OPTIONS_0_4: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'birthCertificate', label: 'Birth Certificate' },
  { id: 'usVisa', label: 'US Visa' },
];

// Adults can hold any document type, including driving license.
const OPTIONS_18_PLUS: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'drivingLicense', label: "Driver's License" },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'usVisa', label: 'US Visa' },
];

/** Add family — step 2: document. 5-17 → doc + selfie + face; 0-4 → doc only (PRD). */
export default function FamilyDocumentScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, band, dob, relationship } = useLocalSearchParams<{
    name?: string;
    band?: FamilyAgeBand;
    dob?: string;
    relationship?: string;
  }>();
  const isMinorWithFace = band !== '0-4';
  const firstName = (name ?? 'Member').split(' ')[0];

  const docOptions = band === '18+' ? OPTIONS_18_PLUS : isMinorWithFace ? OPTIONS_5_17 : OPTIONS_0_4;
  const [selectedDocType, setSelectedDocType] = useState<DocOption>(docOptions[0]);
  const stepDone = isMinorWithFace ? 2 : 3;

  const handleComplete = () => {
    if (!name || !dob || !relationship) {
      router.dismissTo('/(tabs)/family');
      return;
    }
    router.push({
      pathname: '/document/scan',
      params: {
        type: selectedDocType.id,
        family: '1',
        name: name,
        dob: dob,
        relationship: relationship,
        band: band ?? '',
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Add Family Member" />
      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          gap: theme.spacing[2],
          paddingBottom: theme.spacing[3],
        }}>
        <Progress value={(stepDone / 4) * 100} accessibilityLabel="Add family member progress" />
        <Typography variant="caption" color="muted">
          Step {stepDone} of 4 · Document
        </Typography>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          {isMinorWithFace ? (
            <Badge variant="primary">Age 5-17 · Doc + Selfie + Face Required</Badge>
          ) : (
            <Badge variant="neutral">Age 0-4 · Document Only</Badge>
          )}
        </View>
        {!isMinorWithFace ? (
          <Alert variant="info">
            Children under 5 only need a document uploaded — no face scan required.
          </Alert>
        ) : null}
        <Select
          options={docOptions.map((o) => ({ value: o.id, label: o.label }))}
          value={selectedDocType.id}
          onValueChange={(v) => setSelectedDocType(docOptions.find((o) => o.id === v) ?? docOptions[0])}
          title="Document type"
          accessibilityLabel="Select document type"
          size="lg"
        />
        <View style={{ alignItems: 'center', gap: theme.spacing[2], paddingVertical: theme.spacing[4] }}>
          <Typography variant="h4">
            {isMinorWithFace
              ? `Scan ${firstName}'s ${selectedDocType.label}`
              : `Upload ${selectedDocType.label}`}
          </Typography>
          <Typography variant="body-sm" color="secondary" center>
            Make sure all corners are visible and text is readable.
          </Typography>
        </View>
      </ScrollView>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel={isMinorWithFace ? 'Scan document' : 'Upload document'}
          onPress={handleComplete}>
          {isMinorWithFace ? 'Scan Document' : 'Upload Document'}
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
