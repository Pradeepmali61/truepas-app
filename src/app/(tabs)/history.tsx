import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Icon, Skeleton } from '@/components/ui';
import { Gradients } from '@/constants/theme';
import { useBookings } from '@/features/history/hooks';

type BookingTab = 'upcoming' | 'past';

const BOOKING_IMAGES = {
  'hayat hotel': require('../../../assets/images/hayat hotel.png'),
  'theme park': require('../../../assets/images/theme park.png'),
};

/** History tab — bookings list with Upcoming/Past tabs, or empty state. */
export default function HistoryScreen() {
  const router = useRouter();
  const { data: bookings, isPending } = useBookings();
  const [tab, setTab] = useState<BookingTab>('past');

  const visible = tab === 'past' ? bookings ?? [] : [];
  const isEmpty = !isPending && (bookings?.length ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-[14px]">
        <Text accessibilityRole="header" className="text-[18px] font-bold text-ink">
          My bookings
        </Text>
        <View className="h-9 w-9 items-center justify-center rounded-btn bg-surface">
          <Icon name="search" size={20} />
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
                onPress={() => setTab(t)}
                className={`flex-1 items-center border-b-2 py-[10px] ${
                  tab === t ? 'border-primary' : 'border-canvas'
                }`}>
                <Text
                  className={`text-[13px] font-semibold ${tab === t ? 'text-primary' : 'text-muted'}`}>
                  {t === 'upcoming' ? 'Upcoming' : 'Past'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between px-5 py-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-[13px] text-muted">Sort by</Text>
              <Text className="text-[13px] font-bold text-primary">Recent ▾</Text>
            </View>
            <Text className="text-[13px] font-semibold text-primary">Filter</Text>
          </View>

          {isPending ? (
            <View className="gap-2 px-5">
              <Skeleton height={92} radius={10} />
              <Skeleton height={92} radius={10} />
            </View>
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text className="pt-10 text-center text-[13px] text-muted">
                  No {tab} bookings.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.venue}, ${item.location}`}
                  onPress={() => router.push(`/booking/${item.id}`)}
                  className="flex-row items-center gap-[10px] border-b border-canvas px-[14px] py-[10px] active:bg-canvas">
                  {item.image && BOOKING_IMAGES[item.image] ? (
                    <View style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden' }}>
                      <Image source={BOOKING_IMAGES[item.image]} style={{ width: 72, height: 72 }} resizeMode="cover" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={Gradients.historyThumb}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Icon name="hotel" size={28} />
                    </LinearGradient>
                  )}
                  <View className="min-w-0 flex-1">
                    <Text className="mb-1 text-[11px] font-bold text-primary">{item.type}</Text>
                    <Text className="text-[15px] font-bold leading-[18px] text-ink">
                      {item.venue}
                    </Text>
                  </View>
                  <View className="items-end gap-[3px]">
                    <View className="rounded-[6px] bg-surface-alt px-2 py-[3px]">
                      <Text className="text-[11px] font-semibold text-primary">
                        {item.status === 'completed' ? 'Completed' : 'Failed'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Icon name="location" size={12} />
                      <Text className="text-[11px] text-muted">{item.location}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Icon name="calendar" size={12} />
                      <Text className="text-[11px] text-muted">
                        {item.checkIn}–{item.checkOut}
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron" size={22} color="#c7c7cc" />
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
