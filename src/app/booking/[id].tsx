import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, Hotel, MapPin, Ticket } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CardContent, CardHeader, CardTitle, ErrorState, ScreenHeader } from '@/components/composite';
import {
    Badge,
    Divider,
    RowIcon,
    Skeleton,
    Typography,
    type BadgeVariant,
} from '@/components/ui';
import { useFamily } from '@/features/family/hooks';
import { useBooking } from '@/features/history/hooks';
import { useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  upcoming: { variant: 'info', label: 'Upcoming' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
  failed: { variant: 'error', label: 'Failed' },
};

function KV({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
      <Typography variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="body"
        numberOfLines={1}
        style={mono ? { fontFamily: theme.fontFamily.mono.semibold } : undefined}>
        {value}
      </Typography>
    </View>
  );
}

function Row({ leading, title, subtitle, trailing }: { leading: ReactNode; title: string; subtitle?: string; trailing?: ReactNode }) {
  const theme = useThemeTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
      {leading}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Typography variant="body" numberOfLines={1}>{title}</Typography>
        {subtitle ? (
          <Typography variant="body-sm" color="muted" numberOfLines={1}>{subtitle}</Typography>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Booking detail — GET /cb/bookings/{bookingId}. checkedInMembers are person
 *  IDs; names resolve via family/user data. */
export default function BookingDetailScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isPending, isError, refetch } = useBooking(id);
  const { data: family } = useFamily();
  const user = useAppSelector((s) => s.auth.user);

  if (isPending) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Check-in" onBack={() => router.back()} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <Skeleton height={72} radius={theme.radii.xl} />
          <Skeleton height={140} radius={theme.radii.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Check-in" onBack={() => router.back()} />
        <ErrorState
          title="Couldn't load booking"
          description="This booking may have been removed, or your connection dropped."
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const status = STATUS[booking.status] ?? { variant: 'neutral' as const, label: booking.status };
  const isHotel = booking.type === 'hotel';
  const memberIds = booking.checkedInMembers ?? [];

  const resolveName = (personId: string): string => {
    if (user && personId === user.id) return user.fullName;
    return family?.find((m) => m.id === personId)?.name ?? 'Family member';
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={booking.venue} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4], paddingBottom: theme.spacing[8] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
          <RowIcon
            tone={isHotel ? 'primary' : 'info'}
            icon={
              isHotel ? (
                <Hotel size={iconSize.lg} color={theme.colors.actionPrimary} />
              ) : (
                <Ticket size={iconSize.lg} color={theme.colors.onInfoSubtle} />
              )
            }
          />
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Typography variant="h4" numberOfLines={1}>{booking.venue}</Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
              <MapPin size={iconSize.xs} color={theme.colors.textMuted} />
              <Typography variant="body-sm" color="secondary" numberOfLines={1}>
                {booking.location}
              </Typography>
            </View>
          </View>
          <Badge variant={status.variant}>{status.label}</Badge>
        </View>

        <Card>
          <CardContent style={{ gap: theme.spacing[3] }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
              <KV label="Check-in" value={formatDate(booking.checkIn)} />
              <KV label="Check-out" value={formatDate(booking.checkOut)} />
            </View>
            <Divider />
            <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
              <KV label="Guests" value={String(booking.guests)} />
              <KV label="Total" value={`$${booking.amount.toFixed(2)}`} />
            </View>
          </CardContent>
        </Card>

        {memberIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Checked-in members</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing[3] }}>
              {memberIds.map((personId, i) => (
                <View key={personId}>
                  {i > 0 && <Divider style={{ marginBottom: theme.spacing[3] }} />}
                  <Row
                    leading={
                      <RowIcon
                        tone="success"
                        icon={<CircleCheck size={iconSize.md} color={theme.colors.onSuccessSubtle} />}
                      />
                    }
                    title={resolveName(personId)}
                    subtitle={`Face check-in · ${formatDateTime(booking.checkIn)}`}
                    trailing={<Badge variant="success">Checked in</Badge>}
                  />
                </View>
              ))}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
