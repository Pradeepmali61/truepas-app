import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, Icon, Skeleton } from '@/components/ui';
import { Elevation } from '@/constants/theme';
import { useFamily } from '@/features/family/hooks';
import type { FamilyMember } from '@/types/domain';

const AVATAR_GRADIENTS: { bg: [string, string]; text: string }[] = [
  { bg: ['#e6f8ff', '#cef0fe'], text: '#034965' },
  { bg: ['#F0FDF4', '#BBF7D0'], text: '#065F46' },
  { bg: ['#FFF7ED', '#FED7AA'], text: '#9A3412' },
  { bg: ['#FDF2F8', '#FBCFE8'], text: '#9D174D' },
  { bg: ['#EFF6FF', '#BFDBFE'], text: '#1E3A8A' },
  { bg: ['#FAF5FF', '#DDD6FE'], text: '#5B21B6' },
];

function getAvatarStyle(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

const RELATIONSHIP_ICON: Record<string, string> = {
  Son: '👦',
  Daughter: '👧',
  Spouse: '💑',
  Sibling: '👥',
};

function getVerificationLabel(member: FamilyMember): { label: string; bg: string; color: string; dot: string } {
  if (member.turning18Soon) return { label: 'Turning 18', bg: '#FFFBEB', color: '#D97706', dot: '#D97706' };
  if (!member.faceEnrolled) return { label: 'Incomplete', bg: '#FEF3C7', color: '#B45309', dot: '#B45309' };
  return { label: 'Verified', bg: '#ECFDF5', color: '#059669', dot: '#059669' };
}

const MemberCard = memo(function MemberCard({ member, onPress, isLast }: { member: FamilyMember; onPress: () => void; isLast: boolean }) {
  const initials = member.name.split(' ').map((p) => p[0]).join('');
  const avatar = getAvatarStyle(member.name);
  const verification = getVerificationLabel(member);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.relationship}, age ${member.age}, ${verification.label}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: isLast ? 0 : 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Elevation.small,
        opacity: pressed ? 0.92 : 1,
      })}>
      {member.name === 'Max Kim' ? (
        <Image source={require('@/assets/images/boy-3d.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
      ) : member.name === 'Lily Kim' ? (
        <Image source={require('@/assets/images/girl-3d.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
      ) : (
        <LinearGradient
          colors={avatar.bg}
          style={{ alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: avatar.text }}>
            {initials}
          </Text>
        </LinearGradient>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
          {member.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}>
            {member.relationship} · Age {member.age}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: verification.bg,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: verification.dot }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: verification.color }}>{verification.label}</Text>
        </View>
        <Icon name="chevron" size={16} color="#94A3B8" />
      </View>
    </Pressable>
  );
});

function MemberSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', ...Elevation.small }}>
      <Skeleton width={56} height={56} radius={18} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width={130} height={16} radius={6} />
        <Skeleton width={80} height={12} radius={4} />
      </View>
      <Skeleton width={60} height={22} radius={10} />
    </View>
  );
}

function SummaryCard({ members, onPress }: { members: FamilyMember[]; onPress: () => void }) {
  const verified = members.filter((m) => m.faceEnrolled && !m.turning18Soon).length;
  const incomplete = members.length - verified;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${members.length} family members, ${verified} verified`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Elevation.small,
        opacity: pressed ? 0.92 : 1,
      })}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#08B6FC' }}>{members.length}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Members</Text>
      </View>
      <View style={{ width: 1, backgroundColor: '#F1F5F9' }} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#059669' }}>{verified}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Verified</Text>
      </View>
      <View style={{ width: 1, backgroundColor: '#F1F5F9' }} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: incomplete > 0 ? '#B45309' : '#94A3B8' }}>{incomplete}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending</Text>
      </View>
    </Pressable>
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
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Image source={require('../../../assets/images/background2.png')} style={{ width: '100%', height: '100%', opacity: 0.12 }} resizeMode="cover" />
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}>
        <LinearGradient
          colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
          style={{ flex: 1 }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 }}>
          <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', color: '#0F172A' }}>
            Family
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#64748B', marginTop: 2 }}>
            Manage identity verification for your dependents
          </Text>
        </View>

        {isPending ? (
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9', ...Elevation.small }}>
              <Skeleton width={80} height={40} radius={8} />
              <Skeleton width={80} height={40} radius={8} />
              <Skeleton width={80} height={40} radius={8} />
            </View>
            {[1, 2].map((i) => <MemberSkeleton key={i} />)}
          </View>
        ) : isError ? (
          <ErrorState
            title="Couldn't load family"
            message="Please check your connection and try again."
            onRetry={refetch}
          />
        ) : isEmpty ? (
          <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#e6f8ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...Elevation.small }}>
                <Icon name="family" size={48} color="#08B6FC" />
              </View>
              <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>
                No family members yet
              </Text>
              <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 260 }}>
                Add your dependents to manage their identity verification and check-in access.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add family member"
                onPress={handleAddPress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#08B6FC',
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 28,
                  opacity: pressed ? 0.88 : 1,
                  ...Elevation.small,
                })}>
                <Icon name="plus" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Add Family Member</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#08B6FC" />
            }>
            {/* Summary stats card */}
            <View style={{ marginTop: 4 }}>
              <SummaryCard members={members!} onPress={() => {}} />
            </View>

            {/* Turning 18 notification */}
            {turning18 && !notificationDismissed ? (
              <View
                style={{
                  marginBottom: 20,
                  borderRadius: 18,
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#FEF3C7',
                  ...Elevation.medium,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7' }}>
                    <Icon name="cake" size={22} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                      Eligible for independent account
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, lineHeight: 17, color: '#64748B' }}>
                      {turning18.name} has turned 18 and can now create their own Truepas account.
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss notification"
                    onPress={() => setNotificationDismissed(true)}
                    style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="cross" size={16} color="#94A3B8" />
                  </Pressable>
                </View>

                <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remind me later"
                    onPress={() => setNotificationDismissed(true)}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: '#E0E7FF',
                      paddingVertical: 11,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <Icon name="clock" size={14} color="#08B6FC" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#08B6FC' }}>
                      Remind later
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Create their account"
                    onPress={() => setNotificationDismissed(true)}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      borderRadius: 12,
                      backgroundColor: '#08B6FC',
                      paddingVertical: 11,
                      opacity: pressed ? 0.85 : 1,
                      ...Elevation.small,
                    })}>
                    <Icon name="plus" size={16} color="#FFFFFF" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                      Create account
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Section header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Members
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }}>
                {members?.length} {members?.length === 1 ? 'person' : 'people'}
              </Text>
            </View>

            {/* Member cards */}
            <View>
              {members.map((item, index) => (
                <MemberCard
                  key={item.id}
                  member={item}
                  onPress={() => router.push(`/family/${item.id}`)}
                  isLast={index === members.length - 1}
                />
              ))}
            </View>

            {/* Add member button — gradient with dashed-style outline feel */}
            <View style={{ marginTop: 20 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add family member"
                onPress={handleAddPress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingVertical: 16,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: '#08B6FC',
                  borderStyle: 'dashed',
                  backgroundColor: '#FFFFFF',
                  opacity: pressed ? 0.88 : 1,
                  ...Elevation.small,
                })}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#08B6FC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="plus" size={18} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#08B6FC' }}>Add Family Member</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
