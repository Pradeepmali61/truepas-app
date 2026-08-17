import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useFamily } from '@/features/family/hooks';
import type { FamilyMember } from '@/types/domain';

const AVATAR_GRADIENTS = [
  ['#EEF2FF', '#C7D2FE'],
  ['#F0FDF4', '#BBF7D0'],
  ['#FFF7ED', '#FED7AA'],
  ['#FDF2F8', '#FBCFE8'],
  ['#EFF6FF', '#BFDBFE'],
  ['#FAF5FF', '#DDD6FE'],
];

function getAvatarGradient(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

const MemberCard = memo(function MemberCard({ member, onPress, isLast }: { member: FamilyMember; onPress: () => void; isLast: boolean }) {
  const initials = member.name.split(' ').map((p) => p[0]).join('');
  const [gradStart, gradEnd] = getAvatarGradient(member.name);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.relationship}, age ${member.age}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#F1F5F9',
      }}>
      <LinearGradient
        colors={[gradStart, gradEnd]}
        style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 26 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#3730A3' }}>
          {initials}
        </Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{member.name}</Text>
        <Text style={{ fontSize: 14, fontWeight: '400', color: '#6B7280', marginTop: 2 }}>
          {member.relationship} · {member.age}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="check" size={12} color={'#059669'} />
            <Text style={{ fontSize: 13, fontWeight: '400', color: '#6B7280' }}>
              Verified
            </Text>
          </View>
          {member.turning18Soon ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="cake" size={12} color={'#92400E'} />
              <Text style={{ fontSize: 13, fontWeight: '400', color: '#92400E' }}>
                Turning 18
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 13, fontWeight: '400', color: '#6B7280' }}>
                Active
              </Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron" size={20} color={Colors.textFaint} />
    </Pressable>
  );
});

function MemberSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <Skeleton width={52} height={52} radius={26} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={120} height={18} radius={6} />
        <Skeleton width={180} height={14} radius={4} />
      </View>
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

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any) : undefined}>
      {Platform.OS !== 'web' && (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 32, paddingTop: 12, paddingBottom: 32 }}>
        <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700', color: Colors.ink }}>
          Family
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>
          Manage your dependents
        </Text>
      </View>

      {isPending ? (
        <View style={{ paddingHorizontal: 20 }}>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add family member"
              onPress={handleAddPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingVertical: 16,
                paddingHorizontal: 24,
              }}>
              <Icon name="plus" size={18} color={Colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primary }}>Add Family Member</Text>
            </Pressable>
          }
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }>
          {turning18 && !notificationDismissed ? (
            <View
              style={{
                marginBottom: 28,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                borderRadius: 16,
                backgroundColor: '#FEFCE8',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}>
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 18, backgroundColor: '#FDE68A' }}>
                <Icon name="cake" size={18} color={'#92400E'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.ink }}>
                  {turning18.name} is turning 18 soon
                </Text>
                <Text style={{ marginTop: 2, fontSize: 13, lineHeight: 19, color: Colors.textMuted }}>
                  They&apos;ll need their own Truepas account when they turn 18.
                </Text>
                <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remind later"
                    onPress={() => setNotificationDismissed(true)}
                    style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
                      Remind Later
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove from family"
                    onPress={() => setNotificationDismissed(true)}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.error }}>
                      Remove from Family
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.ink, marginBottom: 12 }}>Your Family</Text>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
            {members.map((item, index) => (
              <MemberCard
                key={item.id}
                member={item}
                onPress={() => router.push(`/family/${item.id}`)}
                isLast={index === members.length - 1}
              />
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add family member"
              onPress={handleAddPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingVertical: 16,
              }}>
              <Icon name="plus" size={18} color={Colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primary }}>Add Family Member</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}
