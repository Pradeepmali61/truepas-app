import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, IconName, InfoBanner } from '@/components/ui';

const CHECKLIST: { icon: IconName; label: string; source: string }[] = [
  { icon: 'document', label: 'Account & profile data', source: 'PostgreSQL' },
  { icon: 'documents', label: 'Document images, selfies, portraits', source: 'S3' },
  { icon: 'face', label: 'Face template & biometric data', source: 'ROC Gallery' },
  { icon: 'family', label: 'Family member records', source: 'PostgreSQL' },
];

/** Delete account — warning with PostgreSQL + S3 + ROC checklist (PRD). */
export default function DeleteAccountScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Delete Account" />
      <View className="flex-1 px-6">
        <View className="items-center py-6">
          <Icon name="warning" size={40} />
          <Text accessibilityRole="header" className="mb-[6px] mt-3 text-[18px] font-bold text-primary">
            This action is permanent
          </Text>
          <Text className="text-center text-[14px] text-muted">
            Deleting your account will remove all your data across all systems.
          </Text>
        </View>

        <View
          className="rounded-card border-[0.5px] border-canvas bg-white p-4 shadow-sm"
          style={{ elevation: 2 }}>
          <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">
            What will be deleted
          </Text>
          {CHECKLIST.map((item, index) => (
            <View
              key={item.label}
              className={`flex-row items-center gap-[10px] py-2 ${
                index < CHECKLIST.length - 1 ? 'border-b-[0.5px] border-canvas' : ''
              }`}>
              <Icon name={item.icon} size={20} />
              <Text className="flex-1 text-[13px] font-medium text-ink">{item.label}</Text>
              <Text className="text-[11px] text-muted">{item.source}</Text>
            </View>
          ))}
        </View>

        <View className="-mx-6">
          <InfoBanner variant="danger" leading="warning">
            Deletion is verified across PostgreSQL, S3, and ROC. This cannot be undone.
          </InfoBanner>
        </View>

        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Continue to Delete" variant="danger" onPress={() => router.push('/account/delete/confirm')} />
          <View className="mt-[10px]">
            <Button label="Cancel" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
