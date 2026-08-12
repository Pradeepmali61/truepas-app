import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCard, BottomSheet, EmptyState, ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation, Gradients } from '@/constants/theme';
import { useBookings } from '@/features/history/hooks';
import type { Booking } from '@/types/domain';

type BookingTab = 'upcoming' | 'past';
type SortOption = 'recent' | 'oldest';

const BOOKING_IMAGES: Record<string, ReturnType<typeof require>> = {
  'hayat hotel': require('../../../assets/images/hayat hotel.png'),
  'theme park': require('../../../assets/images/theme park.png'),
};

const BookingCard = memo(function BookingCard({ item, onPress }: { item: Booking; onPress: () => void }) {
  const imageSource = BOOKING_IMAGES[item.image];
  return (
    <AnimatedCard
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.venue}, ${item.location}, ${item.type}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
        ...Elevation.small,
      }}>
      {imageSource ? (
        <View style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden' }}>
          <Image source={imageSource} style={{ width: 72, height: 72 }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        </View>
      ) : (
        <LinearGradient
          colors={Gradients.historyThumb}
          style={{ width: 72, height: 72, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="hotel" size={28} color="#ffffff" />
        </LinearGradient>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2 }}>{item.type}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.ink, lineHeight: 18 }} numberOfLines={1}>
          {item.venue}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Icon name="location" size={12} color={Colors.textFaint} />
          <Text style={{ fontSize: 11, color: Colors.textMuted }} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="calendar" size={12} color={Colors.textFaint} />
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>{item.checkIn}–{item.checkOut}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={{ backgroundColor: item.status === 'completed' ? Colors.successBg : Colors.errorBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: item.status === 'completed' ? Colors.successDark : Colors.error }}>
            {item.status === 'completed' ? 'Completed' : 'Failed'}
          </Text>
        </View>
        <Icon name="chevron" size={20} color={Colors.divider} />
      </View>
    </AnimatedCard>
  );
});

function BookingSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 }}>
      <Skeleton width={72} height={72} radius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={60} height={11} radius={4} />
        <Skeleton width={140} height={15} radius={4} />
        <Skeleton width={100} height={11} radius={4} />
      </View>
      <Skeleton width={70} height={20} radius={6} />
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { data: bookings, isPending, isError, isRefetching, refetch } = useBookings();
  const [tab, setTab] = useState<BookingTab>('past');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');

  const visible = useMemo(() => {
    let list = bookings ?? [];
    if (tab === 'past') {
      list = list.filter((b) => b.status === 'completed' || b.status === 'failed');
    } else {
      list = [];
    }
    if (filterStatus !== 'all') {
      list = list.filter((b) => b.status === filterStatus);
    }
    if (sortOption === 'oldest') {
      list = [...list].reverse();
    }
    return list;
  }, [bookings, tab, sortOption, filterStatus]);

  const isEmpty = !isPending && !isError && (bookings?.length ?? 0) === 0;

  const handleTabChange = (t: BookingTab) => {
    if (t !== tab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTab(t);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-[14px]">
        <Text accessibilityRole="header" className="text-[20px] font-bold text-ink">
          My bookings
        </Text>
        <View className="h-9 w-9 items-center justify-center rounded-btn bg-surface">
          <Icon name="search" size={20} color={Colors.primary} />
        </View>
      </View>

      {isEmpty ? (
        <EmptyState
          icon="clock"
          title="No check-ins yet"
          desc="Once a venue or partner verifies your identity, your check-in & check-out history will show up here."
        />
      ) : (
        <>
          <View className="flex-row gap-1 px-5 pb-3">
            {(['upcoming', 'past'] as const).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                onPress={() => handleTabChange(t)}
                className={`flex-1 items-center border-b-2 py-[10px] ${
                  tab === t ? 'border-primary' : 'border-canvas'
                }`}>
                <Text className={`text-[13px] font-semibold ${tab === t ? 'text-primary' : 'text-muted'}`}>
                  {t === 'upcoming' ? 'Upcoming' : 'Past'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between px-5 py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sort options"
              onPress={() => setShowSortSheet(true)}
              className="flex-row items-center gap-2">
              <Text className="text-[13px] text-muted">Sort by</Text>
              <Text className="text-[13px] font-bold text-primary">
                {sortOption === 'recent' ? 'Recent' : 'Oldest'} ▾
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter options"
              onPress={() => setShowFilterSheet(true)}
              className="flex-row items-center gap-2">
              <Text className="text-[13px] font-semibold text-primary">Filter</Text>
            </Pressable>
          </View>

          {isPending ? (
            <View className="px-5 pt-2">
              {[1, 2].map((i) => <BookingSkeleton key={i} />)}
            </View>
          ) : isError ? (
            <ErrorState
              title="Couldn't load bookings"
              message="Please check your connection and try again."
              onRetry={refetch}
            />
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text className="pt-10 text-center text-[13px] text-muted">
                  No {tab} bookings.
                </Text>
              }
              renderItem={({ item }) => (
                <BookingCard item={item} onPress={() => router.push(`/booking/${item.id}`)} />
              )}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
              }
            />
          )}
        </>
      )}

      <BottomSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} title="Sort by">
        {(['recent', 'oldest'] as const).map((opt) => (
          <Pressable
            key={opt}
            accessibilityRole="radio"
            accessibilityState={{ selected: sortOption === opt }}
            onPress={() => {
              setSortOption(opt);
              setShowSortSheet(false);
            }}
            className="flex-row items-center justify-between px-5 py-4">
            <Text className={`text-[15px] ${sortOption === opt ? 'font-bold text-primary' : 'text-ink'}`}>
              {opt === 'recent' ? 'Newest first' : 'Oldest first'}
            </Text>
            {sortOption === opt ? <Icon name="check" size={20} color={Colors.primary} /> : null}
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)} title="Filter">
        {(['all', 'completed', 'failed'] as const).map((opt) => (
          <Pressable
            key={opt}
            accessibilityRole="radio"
            accessibilityState={{ selected: filterStatus === opt }}
            onPress={() => {
              setFilterStatus(opt);
              setShowFilterSheet(false);
            }}
            className="flex-row items-center justify-between px-5 py-4">
            <Text className={`text-[15px] ${filterStatus === opt ? 'font-bold text-primary' : 'text-ink'}`}>
              {opt === 'all' ? 'All bookings' : opt === 'completed' ? 'Completed' : 'Failed'}
            </Text>
            {filterStatus === opt ? <Icon name="check" size={20} color={Colors.primary} /> : null}
          </Pressable>
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}
