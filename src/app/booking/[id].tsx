/**
 * BookingDetailScreen — a single booking. Hero with venue + location,
 * then a details grid (dates, guests, amount, status, checked-in count).
 *
 * Ported 1:1 from UI-design-repo src/app/screens/main/BookingDetailScreen.tsx.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Hotel, MapPin, Plane, Ticket, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsyncBlock, ScreenHeader, Section, SectionTitle } from '@/components/composite';
import { Divider, NeuBox, StatusChip, Typography } from '@/components/ui';
import { useBooking } from '@/features/history/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import type { Booking } from '@/types/domain';

function formatDate(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function bookingIcon(type: Booking['type']): LucideIcon {
  switch (type) {
    case 'hotel':
      return Hotel;
    case 'event':
      return Ticket;
    case 'flight':
      return Plane;
    default:
      return CalendarDays;
  }
}

/** Booking detail — GET /cb/bookings/{bookingId}. */
export default function BookingDetailScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const booking = useBooking(id ?? '');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScreenHeader title="Booking" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: t.spacing[4], gap: t.spacing[6], paddingBottom: t.spacing[8] }}
        showsVerticalScrollIndicator={false}>
        <AsyncBlock state={booking}>
          {(b) => {
            const Icon = bookingIcon(b.type);
            return (
              <>
                {/* ---------- hero ---------- */}
                <NeuBox variant="raised" style={styles.hero}>
                  <View style={styles.heroRow}>
                    <View style={styles.heroIcon}>
                      <Icon size={t.iconSize.lg} color={t.colors.actionPrimary} />
                    </View>
                    <View style={styles.flex}>
                      <Typography variant="h4" numberOfLines={1}>
                        {b.venue}
                      </Typography>
                      <View style={styles.locRow}>
                        <MapPin size={t.iconSize.xs} color={t.colors.textMuted} />
                        <Typography variant="body-sm" color="secondary" numberOfLines={1}>
                          {b.location}
                        </Typography>
                      </View>
                    </View>
                    <StatusChip status={b.status} />
                  </View>
                </NeuBox>

                {/* ---------- details ---------- */}
                <Section>
                  <SectionTitle>Details</SectionTitle>
                  <NeuBox variant="raised" style={styles.card}>
                    <View style={styles.row2}>
                      <KV label="Check-in" value={formatDate(b.checkIn)} mono />
                      <KV label="Check-out" value={formatDate(b.checkOut)} mono />
                    </View>
                    <Divider />
                    <View style={styles.row2}>
                      <KV label="Guests" value={String(b.guests)} mono />
                      <KV label="Amount" value={`$${b.amount.toFixed(2)}`} mono />
                    </View>
                    <Divider />
                    <View style={styles.row2}>
                      <KV label="Status">
                        <StatusChip status={b.status} />
                      </KV>
                      <KV
                        label="Checked-in members"
                        value={String((b.checkedInMembers ?? []).length)}
                        mono
                      />
                    </View>
                  </NeuBox>
                </Section>
              </>
            );
          }}
        </AsyncBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

function KV({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.kvCell}>
      <Text style={styles.kvLabel}>{label}</Text>
      {children ?? (
        <Text style={[styles.kvValue, mono && styles.mono]} numberOfLines={2}>
          {value}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  hero: { padding: t.spacing[4] },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: t.radii.xl,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[1] },
  card: { padding: t.spacing[4], gap: t.spacing[3] },
  row2: { flexDirection: 'row', gap: t.spacing[4] },
  kvCell: { flex: 1, gap: t.spacing[1] },
  kvLabel: {
    fontSize: t.fontSize.xs,
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: t.letterSpacing.caps,
  },
  kvValue: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  mono: { fontFamily: t.fontFamily.mono.semibold },
}));
