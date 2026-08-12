import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, Card, Icon, Pill, SectionTitle, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useFamilyActivity, useFamilyMember } from '@/features/family/hooks';

/** Family member detail — verification summary, documents, activity log. */
export default function FamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, isPending } = useFamilyMember(id);
  const { data: activity } = useFamilyActivity(id ?? '');

  if (isPending) {
    return (
      <ScreenContainer scroll={false}>
        <TopBar title="Family Member" />
        <View className="gap-3 px-5 pt-5">
          <Skeleton height={72} radius={16} />
          <Skeleton height={120} radius={16} />
        </View>
      </ScreenContainer>
    );
  }

  if (!member) {
    return (
      <ScreenContainer scroll={false}>
        <TopBar title="Family Member" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Family member not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('');
  const faceEnrolled = member.ageBand !== '0-4';

  return (
    <ScreenContainer>
      <TopBar title={member.name} />
      <View className="items-center py-5">
        <Avatar initials={initials} size={72} />
        <Text className="mt-[10px] text-[16px] font-bold text-primary">{member.name}</Text>
        <Text className="text-[13px] text-muted">
          {member.relationship} · Age {member.age}
        </Text>
        <View className="mt-2">
          <Pill label={faceEnrolled ? 'Fully Verified' : 'Document Only'} />
        </View>
      </View>

      <Card>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[13px] text-muted">Face Enrolled</Text>
          <View className="flex-row items-center gap-1">
            {faceEnrolled ? <Icon name="check" size={14} color={Colors.primary} /> : null}
            <Text className="text-[13px] font-bold text-primary">
              {faceEnrolled ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] text-muted">Documents Verified</Text>
          <Text className="text-[13px] font-bold text-primary">1</Text>
        </View>
      </Card>

      <SectionTitle centered>Documents</SectionTitle>
      <View
        className="mx-5 my-2 flex-row items-center gap-3 rounded-card bg-white px-[14px] py-[10px] shadow-sm"
        style={{ elevation: 2 }}>
        <View className="h-11 w-11 items-center justify-center rounded-btn">
          <Icon name="idCard" size={28} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink">Identity Card</Text>
          <Text className="mt-[2px] text-[11px] text-muted">Verified · 04/2027</Text>
        </View>
        <Pill label="Verified" />
      </View>

      <SectionTitle centered>Recent Activity</SectionTitle>
      {(activity ?? []).map((item) => (
        <View key={item.id} className="flex-row items-start gap-3 px-5 py-[10px]">
          <View className="mt-[5px] h-[10px] w-[10px] rounded-full bg-primary" />
          <View>
            <Text className="text-[13px] font-medium text-ink">{item.title}</Text>
            <Text className="mt-[2px] text-[11px] text-muted">{item.date}</Text>
          </View>
        </View>
      ))}

      <Spacer />
      <View className="px-5 pb-6 pt-4">
        <Button
          label="Add Another Document"
          variant="secondary"
          icon="plus"
          onPress={() => router.push('/document/select-type')}
        />
        <View className="mt-[10px]">
          <Button label="Remove Family Member" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    </ScreenContainer>
  );
}
