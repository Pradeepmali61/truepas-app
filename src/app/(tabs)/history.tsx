import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet, EmptyState, ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.venue}, ${item.location}, ${item.type}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}>
      {imageSource ? (
        <View style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden' }}>
          <Image source={imageSource} style={{ width: 64, height: 64 }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        </View>
      ) : (
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="hotel" size={28} color={Colors.ink} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.primary, marginBottom: 1 }}>{item.type}</Text>
        <Text style={{ fontSize: 17, fontWeight: '600', color: Colors.ink, lineHeight: 22 }} numberOfLines={1}>
          {item.venue}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Icon name="location" size={13} color={Colors.textMuted} />
          <Text style={{ fontSize: 13, color: Colors.textMuted }} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="calendar" size={13} color={Colors.textMuted} />
          <Text style={{ fontSize: 13, color: Colors.textMuted }}>{item.checkIn}–{item.checkOut}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={{ backgroundColor: item.status === 'completed' ? '#ECFDF5' : '#FEF2F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: item.status === 'completed' ? '#059669' : Colors.error }}>
            {item.status === 'completed' ? 'Completed' : 'Failed'}
          </Text>
        </View>
        <Icon name="chevron" size={18} color={Colors.textFaint} />
      </View>
    </Pressable>
  );
});

function BookingSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
      <Skeleton width={64} height={64} radius={12} />
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
    <SafeAreaView className="flex-1" edges={['top']} style={Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any) : undefined}>
      {Platform.OS !== 'web' && (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View className="flex-1">
      <View style={{ paddingHorizontal: 32, paddingTop: 12, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700', color: Colors.ink }}>
              My Bookings
            </Text>
            <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>
              View your check-in history
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search bookings"
            className="h-9 w-9 items-center justify-center rounded-btn bg-surface">
            <Icon name="search" size={20} color={Colors.ink} />
          </Pressable>
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
          <View style={{ flexDirection: 'row', gap: 1, paddingHorizontal: 32, paddingBottom: 12 }}>
            {(['upcoming', 'past'] as const).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                onPress={() => handleTabChange(t)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: tab === t ? Colors.primary : '#E5E7EB',
                  paddingVertical: 10,
                }}>
                <Text style={{ fontSize: 14, fontWeight: tab === t ? '600' : '500', color: tab === t ? Colors.primary : Colors.textMuted }}>
                  {t === 'upcoming' ? 'Upcoming' : 'Past'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sort options"
              onPress={() => setShowSortSheet(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, color: Colors.textMuted }}>Sort by</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary }}>
                {sortOption === 'recent' ? 'Recent' : 'Oldest'} ▾
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter options"
              onPress={() => setShowFilterSheet(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary }}>Filter</Text>
            </Pressable>
          </View>

          {isPending ? (
            <View style={{ paddingHorizontal: 32, paddingTop: 8 }}>
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
              contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={{ paddingTop: 40, textAlign: 'center', fontSize: 14, color: Colors.textMuted }}>
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
      </View>
    </SafeAreaView>
  );
}
