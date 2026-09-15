import { useRouter } from 'expo-router';
import { CalendarDays, Hotel, Ticket } from 'lucide-react-native';
import { memo } from 'react';
import { FlatList, RefreshControl, Alert as RNAlert, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import {
    Badge,
    CoreButton,
    FadeUp,
    RowIcon,
    Skeleton,
    Typography,
    type BadgeVariant,
} from '@/components/ui';
import { useBookings } from '@/features/history/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { Booking } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 64;

const STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  upcoming: { variant: 'info', label: 'Upcoming' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
  failed: { variant: 'error', label: 'Failed' },
};

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
}

const BookingCard = memo(function BookingCard({ item, onPress }: { item: Booking; onPress: () => void }) {
  const theme = useThemeTokens();
  const status = STATUS[item.status] ?? { variant: 'neutral' as const, label: item.status };
  const isHotel = item.type === 'hotel';
  return (
    <Card onPress={onPress} style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <RowIcon
          tone={isHotel ? 'primary' : 'info'}
          icon={
            isHotel ? (
              <Hotel size={iconSize.md} color={theme.colors.actionPrimary} />
            ) : (
              <Ticket size={iconSize.md} color={theme.colors.onInfoSubtle} />
            )
          }
        />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Typography variant="body" numberOfLines={1}>{item.venue}</Typography>
          <Typography variant="body-sm" color="muted" numberOfLines={1}>
            {item.location} · {formatDate(item.checkIn)} → {formatDate(item.checkOut)}
          </Typography>
        </View>
        <View style={{ alignItems: 'flex-end', gap: theme.spacing[1] }}>
          <Badge variant={status.variant}>{status.label}</Badge>
          <Typography variant="body-sm" style={{ fontFamily: theme.fontFamily.mono.semibold }}>
            ${item.amount.toFixed(2)}
          </Typography>
        </View>
      </View>
    </Card>
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
        <FlatList
          data={bookings ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: theme.spacing[4],
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + theme.spacing[4],
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeUp delay={index * 110}>
              <BookingCard item={item} onPress={() => router.push(`/booking/${item.id}` as never)} />
            </FadeUp>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No bookings yet"
              description="When you check in at a venue with Truepas, it shows up here."
              icon={<CalendarDays size={iconSize.lg} color={theme.colors.textMuted} />}
              action={
                <CoreButton
                  variant="outline"
                  size="sm"
                  accessibilityLabel="How check-in works"
                  onPress={() =>
                    RNAlert.alert(
                      'How check-in works',
                      'At a participating venue, open Truepas and glance at the kiosk — your enrolled face proves your identity, no documents needed.',
                    )
                  }>
                  How check-in works
                </CoreButton>
              }
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
          }
        />
      )}
    </SafeAreaView>
  );
}
