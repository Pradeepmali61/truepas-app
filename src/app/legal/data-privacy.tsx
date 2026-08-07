import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Card, ListItem, Pill, SectionTitle } from '@/components/ui';

const RETENTION = [
  { label: 'Account data', policy: 'Retained while account is active' },
  { label: 'Document images', policy: 'Stored in S3, deleted with account' },
  { label: 'Face template', policy: 'ROC gallery, deleted with account' },
];

/** Data & privacy — retention info, deletion rights, consent management (PRD). */
export default function DataPrivacyScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <TopBar title="Data & Privacy" />

      <SectionTitle>Your Data</SectionTitle>
      <ListItem
        icon="document"
        title="Download My Data"
        subtitle="Export all your data as ZIP"
        showChevron
      />
      <ListItem
        icon="trash"
        title="Delete Account"
        subtitle="Permanently remove all data"
        showChevron
        onPress={() => router.push('/account/delete')}
      />

      <SectionTitle>Biometric Data</SectionTitle>
      <Card>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[13px] text-muted">Face Template</Text>
          <Pill label="Enrolled" />
        </View>
        <Text className="text-[12px] leading-[18px] text-muted">
          Your encrypted face template is stored in ROC (Rank One Computing) gallery. It will be
          deleted permanently when you delete your account.
        </Text>
      </Card>

      <SectionTitle>Retention Policy</SectionTitle>
      <Card>
        {RETENTION.map((item, index) => (
          <View
            key={item.label}
            className={`py-[6px] ${index < RETENTION.length - 1 ? 'border-b-[0.5px] border-canvas' : ''}`}>
            <Text className="text-[12px] text-muted">{item.label}</Text>
            <Text className="text-[13px] font-medium text-ink">{item.policy}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>Consent</SectionTitle>
      <ListItem
        icon="shield"
        title="Biometric Consent"
        subtitle="Granted · Jul 29, 2026"
        showChevron
        onPress={() => router.push('/security')}
      />
    </ScreenContainer>
  );
}
