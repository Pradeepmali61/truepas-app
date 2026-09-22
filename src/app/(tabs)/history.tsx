/** @jsxImportSource react */
/**
 * Check-ins tab — bookings split into Upcoming / Past sections, each
 * rendered with the kit BookingCard and drilling into booking detail.
 * Ported 1:1 from UI-design-repo src/app/screens/main/ActivityScreen.tsx.
 */
import { useRouter } from 'expo-router';
import { CalendarClock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncBlock, EmptyState, ScreenHeader, Section, SkeletonRows } from '@/components/composite';
import { BookingCard } from '@/components/truepas';
import { FadeUp, NeuSegmented } from '@/components/ui';
import { useBookings } from '@/features/history/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { Booking } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

/** History tab — GET /cb/bookings. The check-in event producer isn't connected
 *  yet so an empty list is a valid production state, not an error. */
export default function HistoryScreen() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bookingsQuery = useBookings();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  const renderCard = (b: Booking, i: number) => (
    <FadeUp key={b.id} delay={Math.min(i, 8) * 60}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${b.venue}, ${b.location}`}
        onPress={() => router.push(`/booking/${b.id}` as never)}
        style={({ pressed }) => pressed && styles.pressed}>
        <BookingCard booking={{ ...b, checkedInMembers: b.checkedInMembers ?? [] }} />
      </Pressable>
    </FadeUp>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Check-ins" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={bookingsQuery.isRefetching}
            onRefresh={bookingsQuery.refetch}
            tintColor={theme.colors.actionPrimary}
            colors={[theme.colors.actionPrimary]}
          />
        }
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[6],
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + theme.spacing[4],
          flexGrow: 1,
        }}>
        <AsyncBlock state={bookingsQuery} skeleton={<SkeletonRows />}>
          {(list) => {
            if (list.length === 0) {
              return (
                <EmptyState
                  title="No bookings yet"
                  description="History appears here after your first check-in."
                  icon={<CalendarClock size={iconSize.lg} color={theme.colors.textMuted} />}
                />
              );
            }
            const upcomingList = list.filter((b) => b.status === 'upcoming');
            const past = list.filter((b) => b.status !== 'upcoming');
            /* Land on Past when there's nothing upcoming. */
            const effective = view === 'upcoming' && upcomingList.length === 0 ? 'past' : view;
            const shown = effective === 'upcoming' ? upcomingList : past;
            return (
              <Section>
                <NeuSegmented
                  label="Check-ins"
                  options={[
                    { value: 'upcoming', label: `Upcoming (${upcomingList.length})` },
                    { value: 'past', label: `Past (${past.length})` },
                  ]}
                  value={effective}
                  onChange={setView}
                />
                {shown.length === 0 ? (
                  <EmptyState
                    compact
                    title={effective === 'upcoming' ? 'No upcoming check-ins' : 'No past check-ins'}
                    description={
                      effective === 'upcoming'
                        ? 'Booked venues will show up here before your visit.'
                        : 'History appears here after your first check-in.'
                    }
                    icon={<CalendarClock size={iconSize.lg} color={theme.colors.textMuted} />}
                  />
                ) : (
                  shown.map(renderCard)
                )}
              </Section>
            );
          }}
        </AsyncBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  pressed: { opacity: t.opacity.pressed },
}));
