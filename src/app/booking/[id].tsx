import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation, Gradients } from '@/constants/theme';
import { useBooking } from '@/features/history/hooks';

const BOOKING_IMAGES = {
  'hayat hotel': require('../../../assets/images/hayat hotel.png'),
  'theme park': require('../../../assets/images/theme park.png'),
};

/** Check-in detail — completed booking summary. */
export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isPending } = useBooking(id);

  return (
    <ScreenContainer>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScreenHeader title="Check-in details" />

      {isPending ? (
        <View className="gap-4 px-6 pt-4">
          <Skeleton height={180} radius={20} />
          <Skeleton height={120} radius={20} />
        </View>
      ) : !booking ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Booking not found.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {/* Check-in summary card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            marginTop: 16,
            ...Elevation.small,
          }}>
            {/* Hotel image */}
            {booking.image && BOOKING_IMAGES[booking.image] ? (
              <View style={{ height: 160, width: '100%' }}>
                <Image
                  source={BOOKING_IMAGES[booking.image]}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <LinearGradient
                colors={Gradients.historyThumb}
                style={{
                  height: 160,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="hotel" size={48} color={Colors.primary} />
              </LinearGradient>
            )}

            {/* Summary content */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              {/* Status + venue */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: booking.status === 'completed' ? '#ECFDF5' : '#FEF2F2',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                  <Icon name="check" size={12} color={booking.status === 'completed' ? '#059669' : '#EF4444'} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: booking.status === 'completed' ? '#059669' : '#EF4444',
                  }}>
                    {booking.status === 'completed' ? 'Completed' : 'Failed'}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.ink, marginBottom: 8 }}>
                {booking.venue} — Front Desk
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon name="location" size={14} color="#9CA3AF" />
                <Text style={{ fontSize: 14, color: '#6B7280' }}>{booking.location}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar" size={14} color="#9CA3AF" />
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  {booking.checkIn} → {booking.checkOut}
                </Text>
              </View>
            </View>
          </View>

          {/* Verification details card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 4,
            marginTop: 16,
            ...Elevation.small,
          }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingVertical: 14,
            }}>
              Verification details
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '400', color: '#9CA3AF' }}>Documents verified</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink }}>
                Driving License, Passport
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
            }}>
              <Text style={{ fontSize: 15, fontWeight: '400', color: '#9CA3AF' }}>Check-in completed</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink }}>
                {booking.checkIn}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
