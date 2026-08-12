import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { Button, Card, Icon, IconName } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { sessionEnded } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

const VERIFIED_SYSTEMS: { icon: IconName; label: string }[] = [
  { icon: 'document', label: 'PostgreSQL' },
  { icon: 'documents', label: 'S3 Images' },
  { icon: 'face', label: 'ROC Gallery' },
];

/** Delete account — success with all-3-systems verification (PRD). */
export default function DeleteSuccessScreen() {
  const dispatch = useAppDispatch();

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        <View className="h-[90px] w-[90px] items-center justify-center rounded-full bg-[#ecfdf5]">
          <Icon name="checkCircle" size={40} />
        </View>
        <Text accessibilityRole="header" className="mb-2 mt-5 text-[20px] font-bold text-primary">
          Account Deleted
        </Text>
        <Text className="mb-4 text-[14px] text-muted">
          All your data has been permanently removed
        </Text>
        <View className="w-full max-w-[280px]">
          <Card className="mx-0 my-0">
            <Text className="mb-2 text-[12px] text-muted">Deletion Verified</Text>
            {VERIFIED_SYSTEMS.map((system) => (
              <View key={system.label} className="mb-[6px] flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name={system.icon} size={16} />
                  <Text className="text-[12px] text-ink">
                    {system.label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Icon name="check" size={12} color={Colors.primary} />
                  <Text className="text-[12px] font-bold text-primary">Deleted</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Close App" onPress={() => dispatch(sessionEnded())} />
      </View>
    </ScreenContainer>
  );
}
