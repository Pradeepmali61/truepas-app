import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing as REasing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Skeleton } from '@/components/ui';
import { DocIllustration } from '@/components/ui/DocIllustration';
import { Colors, Elevation } from '@/constants/theme';
import { useDocuments } from '@/features/documents/hooks';
import { useBookings } from '@/features/history/hooks';
import { useAppSelector } from '@/store';
import type { Booking, IdentityDocument } from '@/types/domain';

const SCREEN_WIDTH = Dimensions.get('window').width;
const cardWidth = Math.round(SCREEN_WIDTH * 0.44);

const DOC_ACCENT: Record<IdentityDocument['type'], { bg: string; icon: string; label: string; cardTint: string }> = {
  passport:          { bg: '#EEF2FF', icon: '#4F46E5', label: 'PASSPORT',          cardTint: '#FAFAFF' },
  drivingLicense:    { bg: '#EFF6FF', icon: '#2563EB', label: "DRIVER'S LICENSE",  cardTint: '#FAFCFF' },
  greenCard:         { bg: '#ECFDF5', icon: '#059669', label: 'US GREEN CARD',   cardTint: '#FAFFFB' },
  birthCertificate:  { bg: '#FFF7ED', icon: '#EA580C', label: 'BIRTH CERTIFICATE', cardTint: '#FFFCF8' },
  usVisa:            { bg: '#F5F3FF', icon: '#7C3AED', label: 'US VISA',          cardTint: '#FBFAFF' },
  idCard:            { bg: '#EEF2FF', icon: '#7C3AED', label: 'ID CARD',          cardTint: '#FAFAFF' },
};

const styles = StyleSheet.create({
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
});

function DocCard({ doc, onPress, width }: { doc: IdentityDocument; onPress: () => void; width?: number }) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const accent = DOC_ACCENT[doc.type];
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    elevation: pressed.value * 4 + 2,
    shadowColor: '#000',
    shadowOpacity: 0.04 + pressed.value * 0.06,
    shadowRadius: 8 + pressed.value * 8,
    shadowOffset: { width: 0, height: 2 + pressed.value * 4 },
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98, { stiffness: 400, damping: 25 });
    pressed.value = withSpring(1, { stiffness: 400, damping: 25 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
    pressed.value = withSpring(0, { stiffness: 400, damping: 25 });
  };

  const statusLabel = doc.status === 'verified' ? 'Valid' : doc.status === 'pending' ? 'Pending' : 'Failed';
  const statusColor = doc.status === 'verified' ? '#059669' : doc.status === 'pending' ? '#D97706' : '#EF4444';
  const statusBg = doc.status === 'verified' ? '#ECFDF5' : doc.status === 'pending' ? '#FFFBEB' : '#FEF2F2';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={doc.label}
      style={{ width, marginHorizontal: 6, marginVertical: 8 }}>
      <Animated.View style={[{ width: '100%' }, animatedStyle]}>
        <Animated.View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            flexDirection: 'column',
            paddingHorizontal: 14,
            paddingVertical: 10,
            ...shadowStyle,
          }}>

          <DocIllustration type={doc.type} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function ProgressDot({ active, index }: { active: boolean; index: number }) {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (active) {
      fillWidth.value = 0;
      fillWidth.value = withTiming(1, { duration: 7500, easing: REasing.linear });
    } else {
      fillWidth.value = 0;
    }
  }, [active, index]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  return (
    <View style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', overflow: 'hidden' }}>
      {active && <Animated.View style={[{ height: '100%', backgroundColor: '#08B6FC' }, fillStyle]} />}
    </View>
  );
}

/** Identity tab — document list (mockup: "Identity Tab — Document List"). */
export default function IdentityScreen() {
  const router = useRouter();
  const { data: documents, isPending, isRefetching, isError, refetch } = useDocuments();
  const { data: bookings } = useBookings();
  const user = useAppSelector((state) => state.auth.user);
  const [query, setQuery] = useState('');
  const [activeFamilyIndex, setActiveFamilyIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const familyListRef = useRef<FlatList>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const filtered = useMemo(() => {
    const list = documents ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((doc) => doc.label.toLowerCase().includes(q) || doc.number.toLowerCase().includes(q));
  }, [documents, query]);

  const isEmpty = !isPending && !isError && (documents?.length ?? 0) === 0;

  // Family image carousel data
  const familyImages = [
    { id: 'family-main-home', image: require('@/assets/images/family-main-home.png'), title: 'Airport check-in' },
    { id: 'family-themepark', image: require('@/assets/images/family-theme-park.png'), title: 'Theme park entry' },
    { id: 'family-hotel', image: require('@/assets/images/family-hotel.png'), title: 'Hotel check-in' },
    { id: 'family-tourist', image: require('@/assets/images/family-tourist.png'), title: 'Tourist places' },
    { id: 'family-cruise', image: require('@/assets/images/family-cruise.png'), title: 'Cruise check-in' },
  ];

  // Auto-scroll family carousel
  useEffect(() => {
    if (familyImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFamilyIndex((prev) => {
        const next = (prev + 1) % familyImages.length;
        familyListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 7500);
    return () => clearInterval(interval);
  }, [familyImages.length]);

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: '#F8FBFF' }}>
      {/* Sticky compact header - shows when scrolled */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: scrollY > 80 ? 'rgba(39,39,214,0.95)' : 'transparent',
        opacity: Math.min(1, Math.max(0, (scrollY - 60) / 40)),
        height: scrollY > 80 ? 50 : 0,
        overflow: 'hidden',
      }}>
        <Pressable onPress={() => router.push('/profile' as never)} className="items-center justify-center rounded-full bg-white p-2" style={{ ...Elevation.small }}>
          <Icon name="user" size={18} color={Colors.ink} />
        </Pressable>
      </View>

      <Image source={require('@/assets/images/background2.png')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.12 }} resizeMode="cover" pointerEvents="none" />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}>
        <LinearGradient
          colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}>
      <View style={{ position: 'relative' }}>
        <View className="px-5 pb-3 pt-2">
          <View className="mb-4 flex-row items-center justify-start">
            <Pressable onPress={() => router.push('/profile' as never)} className="items-center justify-center rounded-full bg-white p-2.5" style={{ ...Elevation.small }}>
              <Icon name="user" size={20} color={Colors.ink} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#1E293B" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor={Colors.textFaint}
          style={{ marginLeft: 12, flex: 1, fontSize: 15, color: Colors.ink }}
        />
      </View>

      <View className="flex-row items-center justify-between px-5 pb-3">
        <Text className="text-[16px] font-bold text-ink">Upcoming trips</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all bookings"
          onPress={() => router.push('/(tabs)/history' as never)}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: '#08B6FC' }}>
          <Icon name="chevron" size={16} color={Colors.bgWhite} />
        </Pressable>
      </View>

      {(() => {
        const upcoming = (bookings ?? []).filter((b) => b.status === 'upcoming');
        if (upcoming.length === 0) {
          return (
            <View className="flex-1 items-center justify-center px-6">
              <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-surface">
                <Icon name="hotel" size={52} />
              </View>
              <Text accessibilityRole="header" className="mb-2 text-[20px] font-bold text-primary">
                No upcoming trips
              </Text>
              <Text className="mb-6 text-center text-[14px] leading-[21px] text-muted">
                Your upcoming bookings will appear here.
              </Text>
            </View>
          );
        }
        return (
          <View style={{ paddingHorizontal: 20 }}>
            {upcoming.map((booking) => (
              <TripCard key={booking.id} booking={booking} onPress={() => router.push(`/booking/${booking.id}` as never)} />
            ))}
          </View>
        );
      })()}

        {/* Family images carousel */}
        <View style={{ marginTop: 20 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.ink }}>Explore with Family</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add family member"
              onPress={() => router.push('/family/add' as never)}
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: '#08B6FC' }}>
              <Icon name="plus" size={16} color={Colors.bgWhite} />
            </Pressable>
          </View>
          <FlatList
            ref={familyListRef}
            horizontal
            data={familyImages}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 16 }}
            snapToInterval={Dimensions.get('window').width - 32}
            decelerationRate="fast"
            snapToAlignment="start"
            onScrollToIndexFailed={({ index, averageItemLength }) => {
              familyListRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true });
            }}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / (Dimensions.get('window').width - 32));
              setActiveFamilyIndex(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => router.push('/family/add' as never)}
                style={{ width: Dimensions.get('window').width - 44, marginHorizontal: 6, borderRadius: 20, overflow: 'hidden' }}>
                <Image source={item.image} style={{ width: '100%', height: 190 }} resizeMode="cover" />
                <View style={{ position: 'absolute', bottom: 8, left: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{item.title}</Text>
                </View>
              </Pressable>
            )}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
            {familyImages.map((_, i) => (
              <ProgressDot key={i} active={i === activeFamilyIndex} index={i} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BOOKING_IMAGES: Record<string, ReturnType<typeof require>> = {
  'hayat hotel': require('@/assets/images/hotel-simple1.png'),
  'theme park': require('@/assets/images/themepark-simple1.png'),
  'disney cruise': require('@/assets/images/cruise-simple1.png'),
};

function TripCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const imageSource = BOOKING_IMAGES[booking.image];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${booking.venue}, ${booking.location}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        ...Elevation.small,
      }}>
      {imageSource ? (
        <View style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden' }}>
          <Image source={imageSource} style={{ width: 64, height: 64 }} resizeMode="cover" />
        </View>
      ) : (
        <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="hotel" size={28} color={Colors.ink} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
          {booking.venue}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '400', color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
          {booking.location} · {booking.checkIn}–{booking.checkOut}
        </Text>
      </View>
      <Icon name="chevron" size={16} color={Colors.textFaint} />
    </Pressable>
  );
}

function DocCardSkeleton() {
  return (
    <View style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
      <Skeleton width={'100%'} height={130} radius={12} />
      <Skeleton width={120} height={15} radius={4} />
      <Skeleton width={80} height={12} radius={4} />
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function RecentActivity({ documents }: { documents: IdentityDocument[] }) {
  const sorted = useMemo(() => {
    return [...documents].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, 3);
  }, [documents]);

  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const sixMonths = now + 1000 * 60 * 60 * 24 * 180;
    return documents
      .filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() <= sixMonths && new Date(d.expiresAt).getTime() > now)
      .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
  }, [documents]);

  if (sorted.length === 0 && expiringSoon.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <View style={{
          backgroundColor: '#FFFBEB',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: '#FDE68A',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="warning" size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>
              {expiringSoon.length === 1 ? `${expiringSoon[0].label} expires soon` : `${expiringSoon.length} documents expiring soon`}
            </Text>
            {expiringSoon[0].expiresAt && (
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#B45309', marginTop: 1 }}>
                Next: {new Date(expiringSoon[0].expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Recent activity feed */}
      {sorted.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 }}>
            Recent activity
          </Text>
          {sorted.map((doc) => (
            <View key={doc.id} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: '#F1F5F9',
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: DOC_ACCENT[doc.type].bg,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1,
                borderColor: DOC_ACCENT[doc.type].icon + '18',
              }}>
                {doc.type === 'drivingLicense' ? (
                  <Image source={require('../../../assets/images/car-simple.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                ) : doc.type === 'passport' ? (
                  <Image source={require('../../../assets/images/passport-simple.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                ) : doc.type === 'greenCard' ? (
                  <Image source={require('../../../assets/images/liberty-simple.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                ) : doc.type === 'usVisa' ? (
                  <Image source={require('../../../assets/images/usa-simple.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                ) : doc.type === 'birthCertificate' ? (
                  <Image source={require('../../../assets/images/baby-simple.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                ) : (
                  <Icon name={doc.type} size={20} color={DOC_ACCENT[doc.type].icon} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827' }} numberOfLines={1}>
                  {doc.label} scanned
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '400', color: '#9CA3AF' }}>
                  {timeAgo(doc.addedAt)}
                </Text>
              </View>
              <Icon name="check" size={14} color="#059669" />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
