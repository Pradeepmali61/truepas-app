import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing as REasing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useDocuments } from '@/features/documents/hooks';
import { useBookings } from '@/features/history/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { useAppSelector } from '@/store';
import type { Booking, IdentityDocument } from '@/types/domain';
import { fontScale, scale } from '@/utils/responsive';

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

function SearchResultRow({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const accent = DOC_ACCENT[doc.type];
  const isVerified = doc.status === 'verified';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${doc.label}, ${doc.number}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(14),
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: scale(16),
        paddingVertical: scale(14),
        marginBottom: scale(10),
        ...Elevation.small,
      }}>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: scale(56, 48, 64),
        height: scale(56, 48, 64),
        borderRadius: scale(16, 14, 18),
        backgroundColor: accent.bg,
        borderWidth: 1,
        borderColor: accent.icon + '20',
      }}>
        {doc.type === 'drivingLicense' ? (
          <Image source={require('@/assets/images/car-simple.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
        ) : doc.type === 'passport' ? (
          <Image source={require('@/assets/images/passport-simple.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
        ) : doc.type === 'greenCard' ? (
          <Image source={require('@/assets/images/liberty-simple.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
        ) : doc.type === 'usVisa' ? (
          <Image source={require('@/assets/images/usa-simple.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
        ) : doc.type === 'birthCertificate' ? (
          <Image source={require('@/assets/images/baby-simple.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
        ) : (
          <Icon name={doc.type} size={26} color={accent.icon} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontSize: fontScale(16), fontWeight: '700', color: '#111827' }} numberOfLines={1}>
          {doc.label}
        </Text>
        <Text allowFontScaling={false} style={{ fontSize: fontScale(12), color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
          {doc.number}
        </Text>
      </View>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: isVerified ? '#ECFDF5' : '#FEF2F2',
        borderRadius: 8,
        paddingHorizontal: scale(7, 6),
        paddingVertical: scale(3, 2),
      }}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isVerified ? '#059669' : '#EF4444' }} />
        <Text allowFontScaling={false} style={{ fontSize: fontScale(10), fontWeight: '700', color: isVerified ? '#059669' : '#EF4444' }}>
          {isVerified ? 'Verified' : 'Failed'}
        </Text>
      </View>
      <Icon name="chevron" size={scale(16, 14)} color={Colors.textFaint} />
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

/** Identity tab â€” document list (mockup: "Identity Tab â€” Document List"). */
export default function IdentityScreen() {
  const router = useRouter();
  const { data: documents, isPending, isError } = useDocuments();
  const { data: bookings } = useBookings();
  const { url: profilePictureUrl } = useProfilePicture();
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
        <Pressable onPress={() => router.push('/profile' as never)} className="items-center justify-center overflow-hidden rounded-full bg-white" style={{ width: 34, height: 34, ...Elevation.small }}>
          {profilePictureUrl ? (
            <Image source={{ uri: profilePictureUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Icon name="user" size={18} color={Colors.ink} />
          )}
        </Pressable>
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Image source={require('@/assets/images/background2.png')} style={{ width: '100%', height: '100%', opacity: 0.12 }} resizeMode="cover" />
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }} pointerEvents="none">
        <LinearGradient
          colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}>
      <View style={{ position: 'relative' }}>
        <View className="px-5 pb-3 pt-2">
          <View className="mb-4 flex-row items-center justify-start">
            <Pressable onPress={() => router.push('/profile' as never)} className="items-center justify-center overflow-hidden rounded-full bg-white" style={{ width: 40, height: 40, ...Elevation.small }}>
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Icon name="user" size={20} color={Colors.ink} />
              )}
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

      {query.trim().length > 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          {isPending ? (
            <Text style={{ paddingTop: 24, textAlign: 'center', fontSize: 13, color: Colors.textFaint }}>
              Loading documentsâ€¦
            </Text>
          ) : isError ? (
            <Text style={{ paddingTop: 24, textAlign: 'center', fontSize: 13, color: '#EF4444' }}>
              Couldn&apos;t load documents.
            </Text>
          ) : filtered.length === 0 ? (
            <Text style={{ paddingTop: 24, textAlign: 'center', fontSize: 13, color: Colors.textFaint }}>
              No documents match your search.
            </Text>
          ) : (
            filtered.map((doc) => (
              <SearchResultRow
                key={doc.id}
                doc={doc}
                onPress={() => router.push(`/document/${doc.id}` as never)}
              />
            ))
          )}
        </View>
      ) : (
      <>
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
        // Real upcoming bookings only â€” no dummy filler
        const upcoming = (bookings ?? []).filter((b) => b.status === 'upcoming');
        if (upcoming.length === 0) {
          return (
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                ...Elevation.small,
              }}>
                <Text style={{ fontSize: 13, color: Colors.textMuted }}>
                  No upcoming trips yet.
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View style={{ paddingHorizontal: 20 }}>
            {upcoming.map((booking) => (
              <TripCard
                key={booking.id}
                booking={booking}
                onPress={() => router.push(`/booking/${booking.id}` as never)}
              />
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

        {/* Recent trips â€” most recent completed trip only (hidden when none) */}
        {(() => {
          const recent = (bookings ?? [])
            .filter((b) => b.status === 'completed')
            .sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime())
            .slice(0, 1);
          if (recent.length === 0) return null;
          return (
            <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.ink, marginBottom: 12 }}>Recent Trips</Text>
              <TripCard
                booking={recent[0]}
                onPress={() => router.push(`/booking/${recent[0].id}` as never)}
              />
            </View>
          );
        })()}
      </>
      )}
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
        gap: scale(14),
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: scale(16),
        paddingVertical: scale(14),
        marginBottom: scale(10),
        ...Elevation.small,
      }}>
      {imageSource ? (
        <View style={{ width: scale(64, 56, 72), height: scale(64, 56, 72), borderRadius: scale(18, 16), overflow: 'hidden' }}>
          <Image source={imageSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      ) : (
        <View style={{ width: scale(64, 56, 72), height: scale(64, 56, 72), borderRadius: scale(18, 16), backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="hotel" size={scale(28, 24)} color={Colors.ink} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontSize: fontScale(16), fontWeight: '700', color: '#111827' }} numberOfLines={1}>
          {booking.venue}
        </Text>
        <Text allowFontScaling={false} style={{ fontSize: fontScale(12), fontWeight: '400', color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
          {booking.location} Â· {booking.checkIn}â€“{booking.checkOut}
        </Text>
      </View>
      <Icon name="chevron" size={scale(16, 14)} color={Colors.textFaint} />
    </Pressable>
  );
}

