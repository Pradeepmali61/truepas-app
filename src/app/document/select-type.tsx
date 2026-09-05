import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Icon } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import type { DocumentType } from '@/types/domain';

type DocOption = { id: DocumentType; label: string; icon: keyof typeof DOC_ACCENT };

const DOC_ACCENT: Record<DocumentType, { bg: string; icon: string }> = {
  passport:         { bg: '#EEF2FF', icon: '#4F46E5' },
  drivingLicense:   { bg: '#EFF6FF', icon: '#2563EB' },
  greenCard:        { bg: '#ECFDF5', icon: '#059669' },
  birthCertificate: { bg: '#FFF7ED', icon: '#EA580C' },
  usVisa:           { bg: '#F5F3FF', icon: '#7C3AED' },
  idCard:           { bg: '#EEF2FF', icon: '#7C3AED' },
};

const OPTIONS: DocOption[] = [
  { id: 'passport', label: 'Passport', icon: 'passport' },
  { id: 'drivingLicense', label: "Driver's License", icon: 'drivingLicense' },
  { id: 'greenCard', label: 'US Green Card', icon: 'greenCard' },
  { id: 'birthCertificate', label: 'Birth Certificate', icon: 'birthCertificate' },
  { id: 'usVisa', label: 'U.S. Visa', icon: 'usVisa' },
];

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
  const [selected, setSelected] = useState<DocOption['id']>('passport');

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
    <ScreenContainer scroll={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Header */}
      <ScreenHeader title={isFamilyMode ? `${memberName ?? 'Member'}'s Documents` : 'Verify Document'} />

      <View className="flex-1 px-6">
        <Text
          accessibilityRole="header"
          className="mb-3 mt-2 text-[22px] font-bold text-ink">
          Select document type
        </Text>
        <View className="gap-3">
          {OPTIONS.map((option) => {
            const active = option.id === selected;
            const accent = DOC_ACCENT[option.id];
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                onPress={() => setSelected(option.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  borderRadius: 20,
                  backgroundColor: active ? '#F5F3FF' : '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? Colors.primary : '#F1F5F9',
                  ...(active ? Elevation.small : Elevation.none),
                }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: accent.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name={option.icon} size={24} color={accent.icon} />
                </View>
                <Text
                  allowFontScaling={false}
                  className="flex-1 text-[16px] font-semibold text-ink">
                  {option.label}
                </Text>
                {active && (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: Colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Continue to Scan" onPress={continueToScan} />
        </View>
      </View>
    </ScreenContainer>
  );
}
