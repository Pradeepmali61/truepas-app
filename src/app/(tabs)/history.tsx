import { useRouter } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { memo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchAndFilterBar } from '@/components/complex/SearchAndFilterBar';
import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import { BookingCard } from '@/components/truepas';
import {
    CoreButton,
    FadeUp,
    Skeleton
} from '@/components/ui';
import { useBookings } from '@/features/history/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { Booking } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
}

const BookingCardItem = memo(function BookingCardItem({ item, onPress }: { item: Booking; onPress: () => void }) {
  const theme = useThemeTokens();
  return (
    <BookingCard
      booking={{
        venue: item.venue,
        location: item.location,
        status: item.status,
        checkIn: formatDate(item.checkIn),
        guests: item.guests,
        amount: item.amount,
        checkedInMembers: item.checkedInMembers ?? [],
      }}
      onPress={onPress}
      style={{ width: '100%', marginBottom: theme.spacing[4] }}
    />
  );
});

function BookingSkeleton() {
  const theme = useThemeTokens();
  return (
    <Card style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <Skeleton width={40} height={40} radius={theme.radii.md} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton variant="text" width={140} height={16} />
          <Skeleton variant="text" width={200} height={12} />
        </View>
        <Skeleton width={70} height={24} radius={theme.radii.full} />
      </View>
    </Card>
  );
}

/** History tab — GET /cb/bookings. The check-in event producer isn't connected
 *  yet so an empty list is a valid production state, not an error. */
export default function HistoryScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bookings, isPending, isError, isRefetching, refetch } = useBookings();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const hasBookings = (bookings?.length ?? 0) > 0;
  const typeOptions = [...new Set((bookings ?? []).map((b) => b.type))].map((v) => ({
    value: v,
    label: v.charAt(0).toUpperCase() + v.slice(1),
  }));
  const filterDefs = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ...(typeOptions.length > 1 ? [{ key: 'type', label: 'Type', options: typeOptions }] : []),
  ];

  const filtered = (bookings ?? []).filter((b) => {
    if (filters.status && b.status !== filters.status) return false;
    if (filters.type && b.type !== filters.type) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${b.venue} ${b.location} ${b.id}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const isFiltering = search.trim().length > 0 || Object.values(filters).some(Boolean);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="History" subtitle="Your check-ins" />
      {isPending ? (
        <View style={{ padding: theme.spacing[4] }}>
          {[1, 2].map((i) => <BookingSkeleton key={i} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load bookings"
          description="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <>
          {hasBookings ? (
            <SearchAndFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search venue, location or ID…"
              filters={filterDefs}
              values={filters}
              onFilterChange={(k, v) => setFilters((s) => ({ ...s, [k]: v }))}
              onClearAll={() => {
                setFilters({});
                setSearch('');
              }}
              style={{
                paddingHorizontal: theme.spacing[4],
                marginTop: theme.spacing[2],
              }}
            />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: theme.spacing[4],
              paddingTop: hasBookings ? theme.spacing[2] : theme.spacing[4],
              paddingBottom: TAB_BAR_HEIGHT + insets.bottom + theme.spacing[4],
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <FadeUp delay={index * 110}>
                <BookingCardItem item={item} onPress={() => router.push(`/booking/${item.id}` as never)} />
              </FadeUp>
            )}
            ListEmptyComponent={
              isFiltering ? (
                <EmptyState
                  title="No matches"
                  description="Try a different search or clear the filters."
                />
              ) : (
                <EmptyState
                  title="No bookings yet"
                  description="When you check in at a venue with Truepas, it shows up here."
                  icon={<Ticket size={iconSize.xl} color={theme.colors.actionPrimary} />}
                  action={
                    <CoreButton
                      variant="outline"
                      size="sm"
                      accessibilityLabel="How check-in works"
                      onPress={() => router.push('/help' as never)}>
                      How check-in works
                    </CoreButton>
                  }
                />
              )
            }
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
