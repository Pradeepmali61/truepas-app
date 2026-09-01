import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useIssuedDocuments } from '@/features/documents/hooks';
import type { IssuedDoc } from '@/types/domain';

const DOC_ACCENT: Record<string, { bg: string; icon: string }> = {
  passport:         { bg: '#F5F7FF', icon: '#4F46E5' },
  drivingLicense:   { bg: '#F5F9FF', icon: '#2563EB' },
  greenCard:        { bg: '#F5FBF7', icon: '#059669' },
  birthCertificate: { bg: '#F0FAFF', icon: '#08B6FC' },
  usVisa:           { bg: '#FAF9FF', icon: '#7C3AED' },
};

const DocCard = memo(function DocCard({ doc, onPress }: { doc: IssuedDoc; onPress: () => void }) {
  const accent = DOC_ACCENT[doc.icon] ?? { bg: '#EEF2FF', icon: '#4F46E5' };
  const isActive = doc.status === 'Active';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${doc.name}, ${doc.issuer}`}
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
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: accent.bg,
        borderWidth: 1,
        borderColor: accent.icon + '20',
      }}>
        {doc.icon === 'drivingLicense' ? (
          <Image source={require('../../../assets/images/car-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.icon === 'passport' ? (
          <Image source={require('../../../assets/images/passport-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.icon === 'greenCard' ? (
          <Image source={require('../../../assets/images/liberty-simple.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.icon === 'usVisa' ? (
          <Image source={require('../../../assets/images/visa-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.icon === 'birthCertificate' ? (
          <Image source={require('../../../assets/images/birth-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : (
          <Icon name={doc.icon} size={34} color={accent.icon} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{doc.name}</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
          {doc.issuer}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2',
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 3,
        }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isActive ? '#059669' : '#EF4444' }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: isActive ? '#059669' : '#EF4444' }}>{doc.status}</Text>
        </View>
        <Icon name="chevron" size={16} color={Colors.textFaint} />
      </View>
    </Pressable>
  );
});

function DocSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 }}>
      <Skeleton width={48} height={48} radius={24} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={140} height={16} radius={6} />
        <Skeleton width={200} height={12} radius={4} />
      </View>
    </View>
  );
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: documents, isPending, isError, isRefetching, refetch } = useIssuedDocuments();

  const filtered = useMemo(() => {
    const list = documents ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (doc) => doc.name.toLowerCase().includes(q) || doc.issuer.toLowerCase().includes(q)
    );
  }, [documents, query]);

  const isEmpty = !isPending && !isError && (documents?.length ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: '#F8FBFF' }}>
      <Image source={require('../../../assets/images/background2.png')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.12 }} resizeMode="cover" pointerEvents="none" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}>
        <LinearGradient
          colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
          style={{ flex: 1 }}
        />
      </View>
      <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 16 }}>
        <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700', color: '#000000' }}>
          Documents
        </Text>
      </View>
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 28,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.divider,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 4,
          ...Elevation.small,
        }}>
        <View style={{ marginRight: 12 }}>
          <Icon name="search" size={20} color={Colors.textFaint} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor={Colors.textFaint}
          accessibilityLabel="Search issued documents"
          style={{ flex: 1, fontSize: 15, color: Colors.ink }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.ink }}>My Documents</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Verify new document"
          onPress={() => router.push('/document/select-type' as never)}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#08B6FC', ...Elevation.small }}>
          <Icon name="plus" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {isPending ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {[1, 2, 3].map((i) => <DocSkeleton key={i} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load documents"
          message="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-5 h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: Colors.surface }}>
            <Icon name="documents" size={48} color={Colors.primary} />
          </View>
          <Text accessibilityRole="header" className="mb-2 text-[20px] font-bold text-ink">
            No documents yet
          </Text>
          <Text className="text-center text-[14px] leading-[21px] text-muted">
            Your issued documents will appear here once verified.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="pt-10 text-center text-[13px] text-muted">
              No documents match your search.
            </Text>
          }
          renderItem={({ item }) => (
            <DocCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
}
