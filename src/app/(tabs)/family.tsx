import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useFamily } from '@/features/family/hooks';
import type { FamilyMember } from '@/types/domain';

const AVATAR_GRADIENTS = [
  ['#e6f8ff', '#cef0fe'],
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
  const isTurning18 = member.turning18Soon;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, age ${member.age}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: isLast ? 0 : 10,
        ...Elevation.small,
      }}>
      {member.name === 'Max Kim' ? (
        <Image source={require('@/assets/images/boy-3d.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
      ) : member.name === 'Lily Kim' ? (
        <Image source={require('@/assets/images/girl-3d.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
      ) : (
        <LinearGradient
          colors={[gradStart, gradEnd]}
          style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3730A3' }}>
            {initials}
          </Text>
        </LinearGradient>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
          {member.name} <Text style={{ fontSize: 12, fontWeight: '400', color: '#6B7280' }}>· {member.age}</Text>
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          backgroundColor: isTurning18 ? '#FFFBEB' : '#ECFDF5',
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 3,
        }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isTurning18 ? '#D97706' : '#059669' }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: isTurning18 ? '#D97706' : '#059669' }}>{isTurning18 ? 'Turning 18' : 'Verified'}</Text>
        </View>
        <Icon name="chevron" size={16} color={Colors.textFaint} />
      </View>
    </Pressable>
  );
});

function MemberSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10, ...Elevation.small }}>
      <Skeleton width={64} height={64} radius={18} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={120} height={16} radius={6} />
        <Skeleton width={60} height={12} radius={4} />
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
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: '#F8FBFF' }}>
      <Image source={require('../../../assets/images/background2.png')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.12 }} resizeMode="cover" pointerEvents="none" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}>
        <LinearGradient
          colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
          style={{ flex: 1 }}
        />
      </View>
      <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 32, paddingTop: 12, paddingBottom: 20 }}>
        <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700', color: '#000000' }}>
          Family
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
                backgroundColor: '#08B6FC',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
              }}>
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Add Family Member</Text>
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
                marginBottom: 20,
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                paddingVertical: 12,
                paddingHorizontal: 14,
                ...Elevation.medium,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 19, backgroundColor: '#e6f8ff' }}>
                  <Icon name="cake" size={20} color="#08B6FC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#059669' }}>
                    You're eligible for a new Truepas account!
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 12, lineHeight: 17, color: Colors.textMuted }}>
                    {turning18.name} has turned 18 and can now create an independent account.
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remind me later"
                  onPress={() => setNotificationDismissed(true)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, borderWidth: 1.5, borderColor: '#cef0fe', paddingVertical: 10 }}>
                  <Icon name="clock" size={14} color="#08B6FC" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#08B6FC' }}>
                    Remind later
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create their account"
                  onPress={() => setNotificationDismissed(true)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, backgroundColor: '#08B6FC', paddingVertical: 10, ...Elevation.small }}>
                  <Icon name="plus" size={16} color="#FFFFFF" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                    Create account
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 8 }}>
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
                gap: 10,
                paddingVertical: 16,
                backgroundColor: '#08B6FC',
                borderRadius: 16,
                overflow: 'hidden',
                ...Elevation.medium }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="plus" size={16} color="#08B6FC" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Add Family Member</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}
