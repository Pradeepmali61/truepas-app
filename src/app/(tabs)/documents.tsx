import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useDocuments } from '@/features/documents/hooks';
import type { DocumentType, IdentityDocument } from '@/types/domain';
import { fontScale, scale } from '@/utils/responsive';

const DOC_ACCENT: Record<DocumentType, { bg: string; icon: string }> = {
  passport:         { bg: '#F5F7FF', icon: '#4F46E5' },
  drivingLicense:   { bg: '#F5F9FF', icon: '#2563EB' },
  idCard:           { bg: '#F5F7FF', icon: '#4F46E5' },
  greenCard:        { bg: '#F5FBF7', icon: '#059669' },
  birthCertificate: { bg: '#F0FAFF', icon: '#08B6FC' },
  usVisa:           { bg: '#FAF9FF', icon: '#7C3AED' },
};

const DocCard = memo(function DocCard({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const accent = DOC_ACCENT[doc.type] ?? { bg: '#EEF2FF', icon: '#4F46E5' };
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
        width: scale(64, 56, 72),
        height: scale(64, 56, 72),
        borderRadius: scale(18, 16, 20),
        backgroundColor: accent.bg,
        borderWidth: 1,
        borderColor: accent.icon + '20',
      }}>
        {doc.type === 'drivingLicense' ? (
          <Image source={require('../../../assets/images/car-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.type === 'passport' ? (
          <Image source={require('../../../assets/images/passport-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.type === 'greenCard' ? (
          <Image source={require('../../../assets/images/liberty-simple.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.type === 'usVisa' ? (
          <Image source={require('../../../assets/images/visa-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : doc.type === 'birthCertificate' ? (
          <Image source={require('../../../assets/images/birth-simple4.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : (
          <Icon name={doc.type} size={34} color={accent.icon} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={{ fontSize: fontScale(16), fontWeight: '700', color: '#111827' }}>{doc.label}</Text>
        <Text allowFontScaling={false} style={{ fontSize: fontScale(12), color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
          {doc.number}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
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
          <Text allowFontScaling={false} style={{ fontSize: fontScale(10), fontWeight: '700', color: isVerified ? '#059669' : '#EF4444' }}>{isVerified ? 'Verified' : 'Failed'}</Text>
        </View>
        <Icon name="chevron" size={scale(16, 14)} color={Colors.textFaint} />
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
  const { data: documents, isPending, isError, isRefetching, refetch } = useDocuments();

  // NOTE: no client-side personId filtering here. The BFF already scopes the
  // self `GET /documents` call to the account owner, and document.personId is
  // an identity-proofing person id — a DIFFERENT namespace from auth.user.id,
  // so comparing them would wrongly filter out every document.

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents ?? [];
    return (documents ?? []).filter(
      (doc) => doc.label.toLowerCase().includes(q) || doc.number.toLowerCase().includes(q)
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
