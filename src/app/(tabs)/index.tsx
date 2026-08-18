import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Dimensions, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, ErrorState as ReusableErrorState, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useDocuments } from '@/features/documents/hooks';
import { useAppSelector } from '@/store';
import type { IdentityDocument } from '@/types/domain';

const SCREEN_WIDTH = Dimensions.get('window').width;
const cardWidth = Math.round(SCREEN_WIDTH * 0.44);

const DOC_ACCENT: Record<IdentityDocument['type'], { bg: string; icon: string; label: string; cardTint: string }> = {
  passport:          { bg: '#EEF2FF', icon: '#4F46E5', label: 'PASSPORT',          cardTint: '#FAFAFF' },
  drivingLicense:    { bg: '#EFF6FF', icon: '#2563EB', label: "DRIVER'S LICENSE",  cardTint: '#FAFCFF' },
  greenCard:         { bg: '#ECFDF5', icon: '#059669', label: 'GREEN CARD',        cardTint: '#FAFFFB' },
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

  const expiryShort = doc.expiresAt
    ? new Date(doc.expiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

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

          {/* Document-specific illustration */}
          <View style={{
            backgroundColor: accent.bg,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 8,
            minHeight: 130,
          }}>
            {doc.type === 'passport' || doc.type === 'birthCertificate' || doc.type === 'usVisa' ? (
              /* Book-style: dark cover, emblem, data fields, MRZ */
              <View style={{ flex: 1 }}>
                <View style={{
                  backgroundColor: accent.icon,
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1.5 }}>
                    {accent.label}
                  </Text>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={doc.type} size={10} color="#FFFFFF" />
                  </View>
                </View>
                <View style={{ paddingVertical: 12, paddingHorizontal: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={doc.type} size={18} color={accent.icon} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 6, fontWeight: '600', color: accent.icon, opacity: 0.5 }}>NAME</Text>
                        <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: accent.icon, opacity: 0.2 }} />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 6, fontWeight: '600', color: accent.icon, opacity: 0.5 }}>NO.</Text>
                        <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: accent.icon, opacity: 0.2 }} />
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{
                  backgroundColor: accent.icon, opacity: 0.08,
                  paddingVertical: 5, paddingHorizontal: 12,
                  flexDirection: 'row', gap: 3, justifyContent: 'center',
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <View key={i} style={{ width: 5, height: 3, borderRadius: 1, backgroundColor: accent.icon }} />
                  ))}
                </View>
              </View>
            ) : (
              /* Card-style: photo box, field lines, accent bar */
              <View style={{ flex: 1 }}>
                <View style={{
                  backgroundColor: accent.icon,
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 7, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1.2 }}>
                    {accent.label}
                  </Text>
                </View>
                <View style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{
                    width: 36, height: 44, borderRadius: 4,
                    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: accent.icon, opacity: 0.9,
                  }}>
                    <Icon name="face" size={18} color={accent.icon} />
                  </View>
                  <View style={{ flex: 1, gap: 5, paddingTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 6, fontWeight: '600', color: accent.icon, opacity: 0.5 }}>NAME</Text>
                      <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: accent.icon, opacity: 0.2 }} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 6, fontWeight: '600', color: accent.icon, opacity: 0.5 }}>DOB</Text>
                      <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: accent.icon, opacity: 0.2 }} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 6, fontWeight: '600', color: accent.icon, opacity: 0.5 }}>ID</Text>
                      <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: accent.icon, opacity: 0.2 }} />
                    </View>
                  </View>
                </View>
                <View style={{
                  height: 4,
                  backgroundColor: accent.icon,
                  opacity: 0.15,
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                }} />
              </View>
            )}
          </View>

          {/* Line 1: Label + status pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', textAlign: 'center' }}>
              {doc.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: statusBg, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Icon name="check" size={10} color={statusColor} />
              <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor }}>{statusLabel}</Text>
            </View>
          </View>
          {/* Line 2: Expiry */}
          {expiryShort && (
            <Text style={{ fontSize: 12, fontWeight: '400', color: '#9CA3AF', textAlign: 'center', marginTop: 2 }}>
              Expires {expiryShort}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Identity tab — document list (mockup: "Identity Tab — Document List"). */
export default function IdentityScreen() {
  const router = useRouter();
  const { data: documents, isPending, isRefetching, isError, refetch } = useDocuments();
  const user = useAppSelector((state) => state.auth.user);
  const [query, setQuery] = useState('');

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

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any) : undefined}>
      {Platform.OS !== 'web' && (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ flex: 1 }}>
      <View className="px-5 pb-3 pt-2">
        <View className="mb-4 flex-row items-start justify-between">
          <View>
            <Text className="text-[16px] font-medium text-muted">{greeting}</Text>
            <Text accessibilityRole="header" className="mt-1 text-[28px] font-semibold text-ink">
              {user?.fullName?.split(' ')[0] ?? 'there'}
            </Text>
          </View>
          <View className="items-center justify-center rounded-full bg-white p-2.5" style={{ ...Elevation.small }}>
            <Icon name="settings" size={20} color={Colors.ink} />
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={Colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor={Colors.textFaint}
          style={{ marginLeft: 12, flex: 1, fontSize: 15, color: Colors.ink }}
        />
      </View>

      <View className="flex-row items-center justify-between px-5 pb-3">
        <Text className="text-[16px] font-bold text-ink">Scanned documents</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Verify new document"
          onPress={() => router.push('/document/select-type' as never)}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: '#3535D8' }}>
          <Icon name="plus" size={16} color={Colors.bgWhite} />
        </Pressable>
      </View>

      {isPending ? (
        <View className="gap-3 px-5 pt-2 flex-row">
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: cardWidth, marginHorizontal: 6 }}>
              <DocCardSkeleton />
            </View>
          ))}
        </View>
      ) : isError ? (
        <ReusableErrorState
          title="Could not load documents"
          message="Something went wrong while fetching your documents. Please try again."
          onRetry={refetch}
        />
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-surface">
            <Icon name="documents" size={52} />
          </View>
          <Text accessibilityRole="header" className="mb-2 text-[20px] font-bold text-primary">
            No documents yet
          </Text>
          <Text className="mb-6 text-center text-[14px] leading-[21px] text-muted">
            Add your first document to start verifying your identity.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verify new document"
            onPress={() => router.push('/document/select-type' as never)}
            className="mb-5 w-full flex-row items-center justify-center gap-2 rounded-btn bg-primary p-[14px] active:opacity-80">
            <Icon name="plus" size={18} color="#ffffff" />
            <Text className="text-[16px] font-bold text-white">Verify new document</Text>
          </Pressable>
          <AddFamilyCard onPress={() => router.push('/family/add' as never)} />
        </View>
      ) : (
        <View>
        <View style={{ height: 250 }}>
        <FlatList
          horizontal
          data={filtered}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-[13px] text-muted">No results found</Text>
          }
          renderItem={({ item }) => (
            <DocCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} width={cardWidth} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 16 }}
          snapToInterval={cardWidth + 12}
          decelerationRate="fast"
          snapToAlignment="start"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
        />
        {/* Right edge fade */}
        <LinearGradient
          colors={['transparent', '#EAF4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, pointerEvents: 'none' }}
        />
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 14 }}>
          <AddFamilyCard onPress={() => router.push('/family/add' as never)} />
          <RecentActivity documents={documents ?? []} />
        </View>
        </View>
      )}</View>
    </SafeAreaView>
  );
}

function AddFamilyCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add family member"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        ...Elevation.small,
      }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface }}>
        <Icon name="plus" size={20} color={Colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink }}>Add a family member</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Share documents securely</Text>
      </View>
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
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: DOC_ACCENT[doc.type].bg,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={doc.type} size={14} color={DOC_ACCENT[doc.type].icon} />
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
