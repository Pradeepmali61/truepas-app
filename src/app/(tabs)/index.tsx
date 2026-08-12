import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCard, Icon, ErrorState as ReusableErrorState, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useDocuments } from '@/features/documents/hooks';
import { useAppSelector } from '@/store';
import type { IdentityDocument, VerificationStatus } from '@/types/domain';

const DOC_CARD_STYLES: Record<
  IdentityDocument['type'],
  { colors: [string, string]; icon: string; iconBg: string; name: string; meta: string }
> = {
  passport: { colors: ['#2c2c2c', '#000000'], icon: '#ffffff', iconBg: 'rgba(255,255,255,0.12)', name: '#ffffff', meta: '#b0b0b0' },
  drivingLicense: { colors: ['#f7c04a', '#e0a63c'], icon: '#000000', iconBg: 'rgba(0,0,0,0.08)', name: '#000000', meta: '#5a4a2a' },
  idCard: { colors: ['#ffffff', '#f5f5f5'], icon: '#000000', iconBg: 'rgba(0,0,0,0.06)', name: '#000000', meta: '#666666' },
  greenCard: { colors: ['#1a4d2e', '#14502a'], icon: '#ffffff', iconBg: 'rgba(255,255,255,0.12)', name: '#ffffff', meta: '#b0d0b0' },
};

const STATUS_STYLES: Record<
  VerificationStatus,
  { bg: string; dot: string; label: string; text: string }
> = {
  verified: { bg: '#ecfdf5', dot: '#059669', label: 'Verified', text: '#065f46' },
  pending: { bg: '#fff9e6', dot: '#ff9900', label: 'Pending', text: '#b45309' },
  missing: { bg: '#f5f5f5', dot: '#999999', label: 'Missing', text: '#666666' },
  failed: { bg: '#fef2f2', dot: '#ef4444', label: 'Failed', text: '#dc2626' },
};

function DocCard({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const scale = useSharedValue(1);
  const palette = DOC_CARD_STYLES[doc.type];
  const status = STATUS_STYLES[doc.status];
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 25 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${doc.label}, ${doc.number}`}
      className="mx-5 my-2">
      <Animated.View
        style={[
          {
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          },
          animatedStyle,
        ]}>
        <LinearGradient
          colors={palette.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: palette.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon
              name={doc.type}
              size={24}
              color={palette.icon}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text className="text-[15px] font-bold" style={{ color: palette.name }}>
              {doc.label}
            </Text>
            <Text className="mt-[2px] text-[11px]" style={{ color: palette.meta }}>
              {doc.number} · Expires {doc.expiresAt ?? '—'}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: status.bg,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 20,
              marginLeft: 8,
            }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.dot, marginRight: 5 }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: status.text }}>{status.label}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

/** Identity tab — document list (mockup: "Identity Tab — Document List"). */
export default function IdentityScreen() {
  const router = useRouter();
  const { data: documents, isPending, isRefetching, isError, refetch } = useDocuments();
  const user = useAppSelector((state) => state.auth.user);
  const [query, setQuery] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const filtered = useMemo(() => {
    const list = documents ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((doc) => doc.label.toLowerCase().includes(q) || doc.number.toLowerCase().includes(q));
  }, [documents, query]);

  const isEmpty = !isPending && !isError && (documents?.length ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-[13px] font-medium text-muted">{greeting}</Text>
        <Text accessibilityRole="header" className="mt-1 text-[24px] font-extrabold text-ink">
          {user?.fullName?.split(' ')[0] ?? 'there'}
        </Text>
        <Text className="mt-1 text-[13px] text-muted">Manage your verified documents</Text>
      </View>

      <View className="mx-5 mb-4 flex-row items-center rounded-card border border-divider bg-white px-3 py-2">
        <Icon name="search" size={18} color={Colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor={Colors.textFaint}
          className="ml-2 flex-1 text-[14px] text-ink"
        />
      </View>

      <View className="flex-row items-center justify-between px-5 pb-3">
        <Text className="text-[16px] font-bold text-ink">Documents</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Verify new document"
          onPress={() => router.push('/document/select-type' as never)}
          className="flex-row items-center gap-[6px] rounded-3xl bg-surface px-[14px] py-2 active:opacity-80">
          <Icon name="plus" size={18} color={Colors.primary} />
          <Text className="text-[13px] font-semibold text-primary">Verify new document</Text>
        </Pressable>
      </View>

      {isPending ? (
        <View className="gap-3 px-5 pt-2">
          {[1, 2, 3].map((i) => (
            <DocCardSkeleton key={i} />
          ))}
        </View>
      ) : isError ? (
        <ReusableErrorState
          title="Could not load documents"
          message="Something went wrong while fetching your documents. Please try again."
          onRetry={refetch}
        />
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-surface">
            <Icon name="documents" size={52} />
          </View>
          <Text accessibilityRole="header" className="mb-2 text-[20px] font-bold text-primary">
            No documents yet
          </Text>
          <Text className="mb-6 text-center text-[14px] leading-[21px] text-muted">
            Add your first document to start verifying your identity.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verify new document"
            onPress={() => router.push('/document/select-type' as never)}
            className="mb-5 w-full flex-row items-center justify-center gap-2 rounded-btn bg-primary p-[14px] active:opacity-80">
            <Icon name="plus" size={18} color="#ffffff" />
            <Text className="text-[16px] font-bold text-white">Verify new document</Text>
          </Pressable>
          <AddFamilyCard onPress={() => router.push('/family/add' as never)} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-[13px] text-muted">No results found</Text>
          }
          renderItem={({ item }) => (
            <DocCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListFooterComponent={
            <>
              <AddFamilyCard onPress={() => router.push('/family/add' as never)} />
              <Text className="px-[30px] pt-[14px] text-center text-[12px] text-faint">
                Add more issued documents by tapping on +
              </Text>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

function AddFamilyCard({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedCard
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add family member"
      style={{
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        padding: 20,
        alignItems: 'center',
        ...Elevation.small,
      }}>
      <View className="flex-row items-center gap-2">
        <Icon name="plus" size={20} color={Colors.ink} />
        <Text className="text-[15px] font-bold text-ink">Add family member</Text>
      </View>
      <Text className="mt-[2px] text-[11px] text-primary">Tap to invite</Text>
      <View className="mt-2">
        <Image
          source={require('../../../assets/images/family.png')}
          style={{ width: 112, height: 112 }}
          contentFit="contain"
          transition={120}
        />
      </View>
    </AnimatedCard>
  );
}

function DocCardSkeleton() {
  return (
    <View className="mx-5 my-2 flex-row items-center rounded-card bg-surface p-3">
      <Skeleton width={44} height={44} radius={22} />
      <View className="ml-3 flex-1" style={{ gap: 6 }}>
        <Skeleton width={120} height={14} radius={6} />
        <Skeleton width={180} height={10} radius={4} />
      </View>
      <Skeleton width={70} height={20} radius={10} />
    </View>
  );
}
