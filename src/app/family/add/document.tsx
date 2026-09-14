import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppBackground } from '@/components/layout/AppBackground';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Icon, InfoBanner, Pill, Stepper } from '@/components/ui';
import { Colors } from '@/constants/theme';
import type { DocumentType, FamilyAgeBand } from '@/types/domain';

type DocOption = { id: DocumentType; label: string; icon: keyof typeof DOC_ACCENT };

const DOC_ACCENT: Record<DocumentType, { bg: string; icon: string }> = {
  passport:         { bg: '#EEF2FF', icon: '#4F46E5' },
  drivingLicense:   { bg: '#EFF6FF', icon: '#2563EB' },
  greenCard:        { bg: '#ECFDF5', icon: '#059669' },
  birthCertificate: { bg: '#FFF7ED', icon: '#EA580C' },
  usVisa:           { bg: '#F5F3FF', icon: '#7C3AED' },
  idCard:           { bg: '#EEF2FF', icon: '#7C3AED' },
};

const OPTIONS_5_17: DocOption[] = [
  { id: 'passport', label: 'Passport', icon: 'passport' },
  { id: 'greenCard', label: 'US Green Card', icon: 'greenCard' },
  { id: 'birthCertificate', label: 'Birth Certificate', icon: 'birthCertificate' },
  { id: 'usVisa', label: 'US Visa', icon: 'usVisa' },
];

const OPTIONS_0_4: DocOption[] = [
  { id: 'passport', label: 'Passport', icon: 'passport' },
  { id: 'greenCard', label: 'US Green Card', icon: 'greenCard' },
  { id: 'birthCertificate', label: 'Birth Certificate', icon: 'birthCertificate' },
  { id: 'usVisa', label: 'US Visa', icon: 'usVisa' },
];

// Adults can hold any document type, including driving license and ID card.
const OPTIONS_18_PLUS: DocOption[] = [
  { id: 'passport', label: 'Passport', icon: 'passport' },
  { id: 'drivingLicense', label: "Driver's License", icon: 'drivingLicense' },
  { id: 'greenCard', label: 'US Green Card', icon: 'greenCard' },
  { id: 'usVisa', label: 'US Visa', icon: 'usVisa' },
  { id: 'idCard', label: 'Identity Card', icon: 'idCard' },
];

/** Add family — step 2: document. 5-17 → doc + selfie + face; 0-4 → doc only (PRD). */
export default function FamilyDocumentScreen() {
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
  const [pickerOpen, setPickerOpen] = useState(false);

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
    <ScreenContainer scroll={false} background={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #39c5fd, #9ce2fe, #f5fcff)' } as any]} />
      ) : (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}>
          <LinearGradient
            colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <AppBackground />
      <ScreenHeader title="Add Family Member" />
      <Stepper total={4} done={isMinorWithFace ? 2 : 3} />
      <View className="flex-1 px-6">
        <View className="items-center pb-2 pt-4">
          {isMinorWithFace ? (
            <Pill label="Age 5-17 · Doc + Selfie + Face Required" variant="active" />
          ) : (
            <Pill label="Age 0-4 · Document Only" variant="gray" />
          )}
        </View>
        {!isMinorWithFace ? (
          <View className="-mx-6">
            <InfoBanner leading="info">
              Children under 5 only need a document uploaded — no face scan required.
            </InfoBanner>
          </View>
        ) : null}
        <View className="-mx-6 mt-3 px-6">
          <Pressable
            onPress={() => setPickerOpen(!pickerOpen)}
            accessibilityRole="button"
            accessibilityLabel="Select document type"
            accessibilityState={{ expanded: pickerOpen }}
            style={styles.dropdownButton}>
            <Text style={styles.dropdownButtonText}>{selectedDocType.label}</Text>
            <View style={{ transform: [{ rotate: pickerOpen ? '180deg' : '0deg' }] }}>
              <Icon name="chevronDown" size={20} color={Colors.textFaint} />
            </View>
          </Pressable>

          {pickerOpen && (
            <View style={styles.dropdownOptionsContainer}>
              {docOptions.map((option, index) => {
                const active = option.id === selectedDocType.id;
                const accent = DOC_ACCENT[option.id];
                return (
                  <View key={option.id}>
                    {index > 0 && <View style={styles.dropdownDivider} />}
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={option.label}
                      onPress={() => {
                        setSelectedDocType(option);
                        setPickerOpen(false);
                      }}
                      style={styles.dropdownOption}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: accent.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Icon name={option.icon} size={20} color={accent.icon} />
                        </View>
                        <Text style={styles.dropdownOptionText}>{option.label}</Text>
                      </View>
                      {active && <Icon name="check" size={18} color={Colors.primary} />}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="items-center py-8">
          {isMinorWithFace ? (
            <Text className="text-[15px] font-bold text-ink">
              Scan {firstName}&apos;s {selectedDocType.label}
            </Text>
          ) : (
            <Text className="text-[15px] font-bold text-ink">Upload {selectedDocType.label}</Text>
          )}
          <Text className="mt-2 text-center text-[13px] text-muted">
            Make sure all corners are visible and text is readable.
          </Text>
        </View>

        <Spacer />
        <View className="pb-6 pt-4">
          <Button
            label={isMinorWithFace ? 'Scan Document' : 'Upload Document'}
            onPress={handleComplete}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.bgWhite,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownOptionsContainer: {
    marginTop: 8,
    backgroundColor: Colors.bgWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
