import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, IconName } from '@/components/ui';
import type { DocumentType } from '@/types/domain';

type DocOption = { id: DocumentType; label: string; icon: IconName };

const OPTIONS: DocOption[] = [
  { id: 'passport', label: 'Passport', icon: 'passport' },
  { id: 'drivingLicense', label: "Driver's License", icon: 'drivingLicense' },
  { id: 'greenCard', label: 'USA Green Card', icon: 'greenCard' },
];

/** Add document — select type (no skip, per PRD). */
export default function SelectTypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<DocOption['id']>('passport');

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Verify Document" />
      <View className="flex-1 px-6">
        <Text
          accessibilityRole="header"
          className="mb-6 mt-9 text-center text-[22px] font-bold text-primary">
          Select Document Type
        </Text>
        <View className="gap-3">
          {OPTIONS.map((option) => {
            const active = option.id === selected;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                onPress={() => setSelected(option.id)}
                className={`flex-row items-center gap-[14px] rounded-[14px] px-5 py-[18px] ${
                  active ? 'border-2 border-primary bg-surface' : 'border-[1.5px] border-[#e0e0e0] bg-white'
                }`}>
                <Icon name={option.icon} size={28} />
                <Text
                  allowFontScaling={false}
                  className={`text-[16px] text-primary ${active ? 'font-semibold' : 'font-medium'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Continue to Scan" onPress={() => router.push('/document/scan')} />
        </View>
      </View>
    </ScreenContainer>
  );
}
