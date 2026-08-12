import { useRouter } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCard, ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useIssuedDocuments } from '@/features/documents/hooks';
import type { IssuedDoc } from '@/types/domain';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Active: { bg: Colors.successBg, text: Colors.successDark, label: 'Active' },
  Expired: { bg: Colors.errorBg, text: Colors.error, label: 'Expired' },
};

const DocCard = memo(function DocCard({ doc, onPress }: { doc: IssuedDoc; onPress: () => void }) {
  const badge = STATUS_BADGE[doc.status] ?? STATUS_BADGE.Active;
  return (
    <AnimatedCard
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${doc.name}, ${doc.issuer}, ${doc.status}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 8,
        ...Elevation.small,
      }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={doc.icon} size={26} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.ink }}>{doc.name}</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }} numberOfLines={1}>
          {doc.issuer}
        </Text>
        <Text style={{ fontSize: 11, color: Colors.textFaint, marginTop: 3 }}>{doc.issuedAt}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: badge.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: badge.text }}>{badge.label}</Text>
        </View>
        <Icon name="chevron" size={18} color={Colors.divider} />
      </View>
    </AnimatedCard>
  );
});

function DocSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 }}>
      <Skeleton width={48} height={48} radius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={140} height={14} radius={6} />
        <Skeleton width={200} height={10} radius={4} />
        <Skeleton width={100} height={10} radius={4} />
      </View>
      <Skeleton width={60} height={20} radius={10} />
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-5 pb-1 pt-3">
        <Text accessibilityRole="header" className="text-[20px] font-bold text-ink">
          Issued Documents
        </Text>
      </View>

      <View
        className="mx-5 my-[10px] flex-row items-center rounded-[14px] border border-divider bg-white px-[14px] py-2">
        <View className="mr-[10px]">
          <Icon name="search" size={18} color={Colors.textFaint} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor={Colors.textFaint}
          accessibilityLabel="Search issued documents"
          className="flex-1 text-[14px] text-ink"
        />
      </View>

      {isPending ? (
        <View className="px-5 pt-2">
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
    </SafeAreaView>
  );
}
