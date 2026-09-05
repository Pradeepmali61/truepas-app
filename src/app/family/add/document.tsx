import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { BottomSheet, Button, FloatingInput, Icon, InfoBanner, Pill, Stepper } from '@/components/ui';
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

// Per KYC guide §6.2:
//  - 5-17 (minor with face): idCard only
//  - 0-4 (minor no face): idCard or birthCertificate
const OPTIONS_5_17: DocOption[] = [
  { id: 'idCard', label: 'Identity Card', icon: 'idCard' },
];

const OPTIONS_0_4: DocOption[] = [
  { id: 'idCard', label: 'Identity Card', icon: 'idCard' },
  { id: 'birthCertificate', label: 'Birth Certificate', icon: 'birthCertificate' },
];

/** Add family — step 2: document. 5-17 → doc + selfie + face; 0-4 → doc only (PRD).
 *  For 5-17, the family member is created here and the personId is passed
 *  to the face-capture screen for liveness + face enrollment. */
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

  const docOptions = isMinorWithFace ? OPTIONS_5_17 : OPTIONS_0_4;
  const [selectedDocType, setSelectedDocType] = useState<DocOption>(docOptions[0]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleComplete = () => {
    if (!name || !dob || !relationship) {
      router.dismissTo('/(tabs)/family');
      return;
    }
    // Navigate to the document scan screen — the family member is created
    // AFTER the document is captured (family/add/processing).
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
        <View className="-mx-6 mt-3">
          <Pressable onPress={() => setPickerOpen(true)} accessibilityRole="button" accessibilityLabel="Select document type">
            <FloatingInput
              label="Document Type"
              value={selectedDocType.label}
              editable={false}
              gradient
              rightSlot={
                <View className="flex-row items-center pr-1">
                  <Icon name="chevron" size={20} color={Colors.textFaint} />
                </View>
              }
            />
          </Pressable>
        </View>
        <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Select Document Type">
          <View className="px-5 pb-2">
            {docOptions.map((option) => {
              const active = option.id === selectedDocType.id;
              const accent = DOC_ACCENT[option.id];
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  onPress={() => {
                    setSelectedDocType(option);
                    setPickerOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderRadius: 16,
                    backgroundColor: active ? '#F5F3FF' : '#F8FAFC',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 8,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? Colors.primary : '#E2E8F0',
                  }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: accent.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon name={option.icon} size={22} color={accent.icon} />
                  </View>
                  <Text className="flex-1 text-[15px] font-semibold text-ink">
                    {option.label}
                  </Text>
                  {active && (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: Colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </BottomSheet>
        <View className="items-center">
          <View className="my-5 h-[150px] w-[240px] items-center justify-center rounded-btn border-[3px] border-dashed border-primary">
            <Icon name="idCard" size={80} />
          </View>
          {isMinorWithFace ? (
            <Text className="-mt-[10px] text-[12px] text-muted">
              Scan {firstName}&apos;s {selectedDocType.label}
            </Text>
          ) : null}
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
