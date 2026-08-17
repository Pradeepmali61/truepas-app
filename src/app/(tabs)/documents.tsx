import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useIssuedDocuments } from '@/features/documents/hooks';
import type { IssuedDoc } from '@/types/domain';

const DOC_ACCENT: Record<string, { bg: string; icon: string }> = {
  passport:         { bg: '#F5F7FF', icon: '#4F46E5' },
  drivingLicense:   { bg: '#F5F9FF', icon: '#2563EB' },
  greenCard:        { bg: '#F5FBF7', icon: '#059669' },
  birthCertificate: { bg: '#FFFAF5', icon: '#EA580C' },
  usVisa:           { bg: '#FAF9FF', icon: '#7C3AED' },
};

const DocCard = memo(function DocCard({ doc, onPress }: { doc: IssuedDoc; onPress: () => void }) {
  const accent = DOC_ACCENT[doc.icon] ?? { bg: '#EEF2FF', icon: '#4F46E5' };
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
        paddingVertical: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Elevation.none,
      }}>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: accent.bg,
      }}>
        <Icon name={doc.icon} size={24} color={accent.icon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>{doc.name}</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
          {doc.issuer}
        </Text>
      </View>
      <Icon name="chevron" size={18} color={Colors.textFaint} />
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
    <SafeAreaView className="flex-1" edges={['top']} style={Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any) : undefined}>
      {Platform.OS !== 'web' && (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 24 }}>
        <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700', color: Colors.ink }}>
          Documents
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>
          Your important documents
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
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.ink }}>My Documents</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Verify new document"
          onPress={() => router.push('/document/select-type' as never)}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3535D8' }}>
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
