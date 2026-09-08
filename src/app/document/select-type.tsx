import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppBackground } from '@/components/layout/AppBackground';
import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';
import type { DocumentType } from '@/types/domain';

const OPTIONS: DocumentType[] = [
  'passport',
  'drivingLicense',
  'greenCard',
  'birthCertificate',
  'usVisa',
];

const LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
  idCard: 'Identity Card',
};

/** Add document — select type. Supports family mode: when `family` param is
 *  set, the scan flow is scoped to a family member (personId). */
export default function SelectTypeScreen() {
  const router = useRouter();
  const { family, personId, memberName, band } = useLocalSearchParams<{
    family?: string;
    personId?: string;
    memberName?: string;
    band?: string;
  }>();
  const isFamilyMode = family === '1';
  const isDocOnly = isFamilyMode && band === '0-4';
  const [selected, setSelected] = useState<DocumentType>('passport');
  const [open, setOpen] = useState(false);

  const continueToScan = () => {
    const params: Record<string, string> = { type: selected };
    if (isFamilyMode) {
      params.family = '1';
      params.personId = personId ?? '';
      params.name = memberName ?? '';
      params.band = band ?? '';
    }
    router.push({ pathname: '/document/scan', params });
  };

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
      {/* Header */}
      <ScreenHeader title={isFamilyMode ? `${memberName ?? 'Member'}'s Documents` : 'Verify Your Identity'} />

      <View className="flex-1 px-6">
        {/* Progress bar — Document → Selfie */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <View style={styles.dotActive}>
              <View style={styles.dotActiveInner} />
            </View>
            <View style={styles.progressLine} />
            <View style={styles.dotInactive}>
              <View style={styles.dotInactiveInner} />
            </View>
          </View>
          <View style={styles.labelsRow}>
            <Text style={styles.stepLabelActive}>Document</Text>
            <Text style={styles.stepLabelInactive}>{isDocOnly ? 'Upload' : 'Selfie'}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Choose your document type and upload a clear photo.
        </Text>

        {/* Inline dropdown — button expands options below with dividers */}
        <Pressable
          onPress={() => setOpen(!open)}
          accessibilityRole="button"
          accessibilityLabel="Select document type"
          accessibilityState={{ expanded: open }}
          style={styles.dropdownButton}>
          <Text style={styles.dropdownButtonText}>{LABELS[selected]}</Text>
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <Icon name="chevronDown" size={20} color={Colors.textFaint} />
          </View>
        </Pressable>

        {open && (
          <View style={styles.dropdownOptionsContainer}>
            {OPTIONS.map((option, index) => {
              const active = option === selected;
              return (
                <View key={option}>
                  {index > 0 && <View style={styles.dropdownDivider} />}
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={LABELS[option]}
                    onPress={() => {
                      setSelected(option);
                      setOpen(false);
                    }}
                    style={styles.dropdownOption}>
                    <Text style={styles.dropdownOptionText}>{LABELS[option]}</Text>
                    {active && <Icon name="check" size={18} color={Colors.primary} />}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Scan instructions card */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Scan the Front of Your Document</Text>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumberBox}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionRowText}>
              Place your document inside the frame
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumberBox}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionRowText}>
              Ensure all corners are visible and text is fully readable
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumberBox}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionRowText}>
              No glare, blur, or shadow on the document
            </Text>
          </View>
        </View>

        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Next" onPress={continueToScan} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderInput,
  },
  dotInactive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInactiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgWhite,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabelActive: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepLabelInactive: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textFaint,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
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
  instructionsCard: {
    marginTop: 24,
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  instructionNumberBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  instructionRowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});
