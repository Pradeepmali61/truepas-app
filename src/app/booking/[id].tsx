import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Icon, Skeleton } from '@/components/ui';
import { Gradients } from '@/constants/theme';
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
      <TopBar title="Check-in Details" />
      {isPending ? (
        <View className="gap-4 px-5">
          <Skeleton height={160} radius={16} />
          <Skeleton height={100} radius={16} />
        </View>
      ) : !booking ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Booking not found.</Text>
        </View>
      ) : (
        <>
          {booking.image && BOOKING_IMAGES[booking.image] ? (
            <View
              style={{
                height: 160,
                marginHorizontal: 20,
                borderRadius: 16,
                overflow: 'hidden',
              }}>
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
                marginHorizontal: 20,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="hotel" size={48} />
            </LinearGradient>
          )}
          <View className="p-5">
            <View className="mb-3 self-start rounded-[6px] bg-surface-alt px-2 py-[3px]">
              <Text className="text-[11px] font-semibold text-primary">
                {booking.status === 'completed' ? 'Completed' : 'Failed'}
              </Text>
            </View>
            <Text accessibilityRole="header" className="mb-1 text-[18px] font-bold text-primary">
              {booking.venue} — Front Desk
            </Text>
            <View className="mb-1 flex-row items-center gap-1">
              <Icon name="location" size={14} color="#999" />
              <Text className="text-[14px] text-muted">{booking.location}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="calendar" size={14} color="#999" />
              <Text className="text-[14px] text-muted">
                {booking.checkIn} → {booking.checkOut}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1">
              <Icon name="documents" size={14} color="#999" />
              <Text className="text-[14px] text-muted">
                Documents used: Driving License, Passport
              </Text>
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
