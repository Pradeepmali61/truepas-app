import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { memo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCard, Avatar, Button, EmptyState, ErrorState, Icon, Pill, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useFamily } from '@/features/family/hooks';
import type { FamilyMember } from '@/types/domain';

const MemberCard = memo(function MemberCard({ member, onPress }: { member: FamilyMember; onPress: () => void }) {
  const initials = member.name.split(' ').map((p) => p[0]).join('');
  return (
    <AnimatedCard
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.relationship}, age ${member.age}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        ...Elevation.small,
      }}>
      <Avatar initials={initials} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.ink }}>{member.name}</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
          {member.relationship} · Age {member.age} · {member.verification}
        </Text>
      </View>
      {member.turning18Soon ? <Pill label="Turning 18" variant="warn" /> : <Pill label="Active" />}
    </AnimatedCard>
  );
});

function MemberSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 }}>
      <Skeleton width={44} height={44} radius={22} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={120} height={14} radius={6} />
        <Skeleton width={180} height={10} radius={4} />
      </View>
      <Skeleton width={60} height={20} radius={10} />
    </View>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  const { data: members, isPending, isError, isRefetching, refetch } = useFamily();
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  const turning18 = members?.find((m) => m.turning18Soon);
  const isEmpty = !isPending && !isError && (members?.length ?? 0) === 0;

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/family/add');
  };

  const renderItem = ({ item }: { item: FamilyMember }) => (
    <MemberCard member={item} onPress={() => router.push(`/family/${item.id}`)} />
  );

  const ListHeader = () => {
    if (turning18 && !notificationDismissed) {
      return (
        <View
          className="mx-5 my-3 flex-row items-start gap-3 rounded-card border border-[#fde68a] bg-[#fff9e6] px-[18px] py-4">
          <Icon name="cake" size={24} />
          <View className="flex-1 items-center">
            <Text className="w-full text-center text-[14px] font-bold text-ink">
              {turning18.name} is turning 18 soon
            </Text>
            <Text className="mt-1 w-full text-center text-[12px] leading-[18px] text-muted" numberOfLines={2}>
              They&apos;ll need their own Truepas account.{'\n'}Remove them from family or remind later.
            </Text>
            <View className="mt-[10px] flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove from family"
                onPress={() => setNotificationDismissed(true)}
                className="w-36 items-center justify-center rounded-[12px] bg-primary py-2 active:opacity-80">
                <Text className="text-center text-[12px] font-semibold text-white" numberOfLines={2}>
                  Remove from{'\n'}Family
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remind later"
                onPress={() => setNotificationDismissed(true)}
                className="w-36 items-center justify-center rounded-[12px] border border-line bg-white py-2 active:opacity-80">
                <Text className="text-center text-[12px] font-semibold text-muted" numberOfLines={2}>
                  Remind{'\n'}Later
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text accessibilityRole="header" className="text-[20px] font-bold text-ink">
          Family
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add family member"
          onPress={handleAddPress}
          className="h-9 w-9 items-center justify-center rounded-btn bg-surface active:opacity-80">
          <Icon name="plus" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {isPending ? (
        <View className="px-5 pt-2">
          {[1, 2].map((i) => <MemberSkeleton key={i} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load family"
          message="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : isEmpty ? (
        <EmptyState
          icon="family"
          title="No family members yet"
          desc="Add your dependents to manage their identity verification too."
          action={
            <View className="w-[220px]">
              <Button label="Add Family Member" onPress={handleAddPress} />
            </View>
          }
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListFooterComponent={
            <View className="px-0 py-4">
              <Button label="Add Family Member" variant="secondary" icon="plus" onPress={handleAddPress} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
