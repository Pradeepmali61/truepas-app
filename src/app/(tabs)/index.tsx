import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Skeleton } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useAppSelector } from '@/store';
import type { IdentityDocument } from '@/types/domain';

const DOC_CARD_STYLES: Record<
  IdentityDocument['type'],
  { colors: [string, string]; name: string; meta: string }
> = {
  passport: { colors: ['#2c2c2c', '#000000'], name: '#ffffff', meta: '#b0b0b0' },
  drivingLicense: { colors: ['#f7c04a', '#e0a63c'], name: '#000000', meta: '#5a4a2a' },
  idCard: { colors: ['#ffffff', '#f5f5f5'], name: '#000000', meta: '#666666' },
};

function DocCard({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const palette = DOC_CARD_STYLES[doc.type];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${doc.label}, ${doc.number}`}
      onPress={onPress}
      className="mx-5 my-2 overflow-hidden rounded-card active:opacity-90"
      style={{ elevation: 3 }}>
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}>
        <View className="h-11 w-11 items-center justify-center rounded-btn">
          <Icon name={doc.type === 'passport' ? 'passport' : doc.type === 'drivingLicense' ? 'drivingLicense' : 'idCard'} size={24} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold" style={{ color: palette.name }}>
            {doc.label}
          </Text>
          <Text className="mt-[2px] text-[11px]" style={{ color: palette.meta }}>
            {doc.number} · Expires {doc.expiresAt ?? '—'}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/** Identity tab — document list (mockup: "Identity Tab — Document List"). */
export default function IdentityScreen() {
  const router = useRouter();
  const { data: documents, isPending } = useDocuments();
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

  const isEmpty = !isPending && (documents?.length ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-[13px] font-medium text-muted">{greeting}</Text>
        <Text accessibilityRole="header" className="mt-1 text-[24px] font-extrabold text-ink">
          {user?.fullName?.split(' ')[0] ?? 'there'}
        </Text>
        <Text className="mt-1 text-[13px] text-muted">Manage your verified documents</Text>
      </View>

      <View className="mx-5 mb-4 flex-row items-center rounded-card border border-line bg-white px-3 py-2">
        <Icon name="search" size={18} color="#999999" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor="#999999"
          className="ml-2 flex-1 text-[14px] text-ink"
        />
      </View>

      <View className="flex-row items-center justify-between px-5 pb-3">
        <Text className="text-[16px] font-bold text-ink">Documents</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Verify new document"
          onPress={() => router.push('/document/select-type' as never)}
          className="flex-row items-center gap-[6px] rounded-3xl bg-surface px-[14px] py-2 active:opacity-80">
          <Icon name="plus" size={18} color="#2727d6" />
          <Text className="text-[13px] font-semibold text-primary">Verify new document</Text>
        </Pressable>
      </View>

      {isPending ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton height={64} radius={16} />
          <Skeleton height={64} radius={16} />
        </View>
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-[13px] text-muted">No results found</Text>
          }
          renderItem={({ item }) => (
            <DocCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListFooterComponent={
            <>
              <AddFamilyCard onPress={() => router.push('/family/add' as never)} />
              <Text className="px-[30px] pt-[14px] text-center text-[12px] text-faint">
                Add more issued documents by tapping on +
              </Text>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

function AddFamilyCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add family member"
      onPress={onPress}
      className="mx-5 my-2 items-center rounded-card bg-surface p-5 active:opacity-90">
      <View className="flex-row items-center gap-2">
        <Icon name="plus" size={20} color="#000000" />
        <Text className="text-[15px] font-bold text-ink">Add family member</Text>
      </View>
      <Text className="mt-[2px] text-[11px] text-primary">Tap to invite</Text>
      <View className="mt-2">
        <Image
          source={require('../../../assets/images/family.png')}
          style={{ width: 112, height: 112 }}
          contentFit="contain"
          transition={120}
        />
      </View>
    </Pressable>
  );
}
