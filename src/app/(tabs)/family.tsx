import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, EmptyState, Icon, Pill, Skeleton } from '@/components/ui';
import { useFamily } from '@/features/family/hooks';

/** Family tab — list with age-18 notification, or empty state. */
export default function FamilyScreen() {
  const router = useRouter();
  const { data: members, isPending } = useFamily();
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  const turning18 = members?.find((m) => m.turning18Soon);
  const isEmpty = !isPending && (members?.length ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text accessibilityRole="header" className="text-[20px] font-bold text-ink">
          Family
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add family member"
          onPress={() => router.push('/family/add')}
          className="h-9 w-9 items-center justify-center rounded-btn bg-surface active:opacity-80">
          <Icon name="plus" size={20} color="#2727d6" />
        </Pressable>
      </View>

      {isPending ? (
        <View className="gap-3 px-5">
          <Skeleton height={72} radius={16} />
          <Skeleton height={72} radius={16} />
        </View>
      ) : isEmpty ? (
        <EmptyState
          icon="family"
          title="No family members yet"
          desc="Add your dependents to manage their identity verification too."
          action={
            <View className="w-[220px]">
              <Button label="Add Family Member" onPress={() => router.push('/family/add')} />
            </View>
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {turning18 && !notificationDismissed ? (
            <View className="mx-5 my-3 flex-row items-start gap-3 rounded-card border border-[#fde68a] bg-[#fff9e6] px-[18px] py-4">
              <Icon name="cake" size={24} />
              <View className="flex-1 items-center">
                <Text className="w-full text-center text-[14px] font-bold text-ink">
                  {turning18.name} is turning 18 soon
                </Text>
                <Text
                  className="mt-1 w-full text-center text-[12px] leading-[18px] text-muted"
                  numberOfLines={2}>
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
          ) : null}

          {members?.map((member) => (
            <Pressable
              key={member.id}
              accessibilityRole="button"
              accessibilityLabel={`${member.name}, ${member.relationship}, age ${member.age}`}
              onPress={() => router.push(`/family/${member.id}`)}
              className="mx-5 my-2 flex-row items-center gap-3 rounded-card border-[0.5px] border-canvas bg-white px-4 py-[14px] shadow-sm active:opacity-90"
              style={{ elevation: 2 }}>
              <Avatar
                initials={member.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
                size={44}
              />
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-ink">{member.name}</Text>
                <Text className="mt-[2px] text-[12px] text-muted">
                  {member.relationship} · Age {member.age} · {member.verification}
                </Text>
              </View>
              {member.turning18Soon ? (
                <Pill label="Turning 18" variant="warn" />
              ) : (
                <Pill label="Active" />
              )}
            </Pressable>
          ))}

          <View className="px-5 py-4">
            <Button
              label="Add Family Member"
              variant="secondary"
              icon="plus"
              onPress={() => router.push('/family/add')}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
