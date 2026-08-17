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
const cardWidth = Math.round(SCREEN_WIDTH * 0.33);

const DOC_ACCENT: Record<IdentityDocument['type'], { bg: string; icon: string }> = {
  passport:          { bg: '#EEF2FF', icon: '#4F46E5' },
  drivingLicense:    { bg: '#EFF6FF', icon: '#2563EB' },
  greenCard:         { bg: '#ECFDF5', icon: '#059669' },
  birthCertificate:  { bg: '#FFF7ED', icon: '#EA580C' },
  usVisa:            { bg: '#F5F3FF', icon: '#7C3AED' },
  idCard:            { bg: '#EEF2FF', icon: '#4F46E5' },
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
  const accent = DOC_ACCENT[doc.type];
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 25 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={doc.label}
      style={{ width, marginHorizontal: 6, marginVertical: 8 }}>
      <Animated.View style={[{ width: '100%' }, animatedStyle]}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            flexDirection: 'column',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 14,
            ...Elevation.small,
          }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: accent.bg,
              marginBottom: 8,
            }}>
            <Icon
              name={doc.type}
              size={22}
              color={accent.icon}
            />
          </View>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#111827', textAlign: 'center' }}>
            {doc.label}
          </Text>
        </View>
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingRight: cardWidth * 0.25 }}
          style={{ height: 116 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
        />
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
          <AddFamilyCard onPress={() => router.push('/family/add' as never)} />
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
    <View className="my-2 items-center rounded-card bg-surface p-3" style={{ width: '100%' }}>
      <Skeleton width={44} height={44} radius={22} />
      <Skeleton width={80} height={10} radius={4} />
    </View>
  );
}
