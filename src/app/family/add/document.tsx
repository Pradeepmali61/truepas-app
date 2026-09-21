import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, ScreenHeader } from '@/components/composite';
import { Badge, CoreButton, Progress, Select, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import type { DocumentType, FamilyAgeBand } from '@/types/domain';

type DocOption = { id: DocumentType; label: string };

// Minors can't hold a driving license.
const OPTIONS_MINOR: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'idCard', label: 'ID Card' },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'birthCertificate', label: 'Birth Certificate' },
  { id: 'usVisa', label: 'US Visa' },
];

// 10+ covers adults too — they can hold any document type, including driving license.
const OPTIONS_10_PLUS: DocOption[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'drivingLicense', label: "Driver's License" },
  { id: 'idCard', label: 'ID Card' },
  { id: 'greenCard', label: 'US Green Card' },
  { id: 'usVisa', label: 'US Visa' },
];

/** Add family — step 2: document. 5-9/10+ → doc + liveness; 0-4 → doc + photo. */
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
  const needsFace = band !== '0-4';
  const firstName = (name ?? 'Member').split(' ')[0];

  const docOptions = band === '10+' ? OPTIONS_10_PLUS : OPTIONS_MINOR;
  const [selectedDocType, setSelectedDocType] = useState<DocOption>(docOptions[0]);
  // Flow: basics (1) → document (2) → capture (3) — three steps for every band.
  const stepDone = 2;
  const stepTotal = 3;

  const handleComplete = () => {
    if (!name || !dob || !relationship) {
      router.dismissTo('/(tabs)');
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
        <Progress value={(stepDone / stepTotal) * 100} accessibilityLabel="Add family member progress" />
        <Typography variant="caption" color="muted">
          Step {stepDone} of {stepTotal} · Document
        </Typography>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          {band === '0-4' ? (
            <Badge variant="neutral">Age 0-4 · Document + Photo</Badge>
          ) : band === '5-9' ? (
            <Badge variant="primary">Age 5-9 · Doc + Liveness · any camera</Badge>
          ) : (
            <Badge variant="primary">Age 10+ · Doc + Liveness · front camera</Badge>
          )}
        </View>
        {!needsFace ? (
          <Alert variant="info">
            Children under 5 need a document and one photo — no liveness scan required.
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
            {needsFace
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
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[2],
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel={needsFace ? 'Scan document' : 'Upload document'}
          onPress={handleComplete}>
          {needsFace ? 'Scan Document' : 'Upload Document'}
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
