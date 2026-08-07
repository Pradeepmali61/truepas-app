import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Skeleton } from '@/components/ui';
import { ISSUED_DOCS } from '@/constants/documents';


/** Documents tab — DigiLocker-style issued documents list. */
export default function DocumentsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const isPending = false;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ISSUED_DOCS;
    return ISSUED_DOCS.filter(
      (doc) => doc.name.toLowerCase().includes(q) || doc.issuer.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center px-5 pb-1 pt-3">
        <View className="w-9" />
        <Text accessibilityRole="header" className="flex-1 text-center text-[18px] font-bold text-primary">
          Issued Documents
        </Text>
        <View className="w-9" />
      </View>

      <View
        className="mx-5 my-[10px] flex-row items-center rounded-[14px] bg-white px-[14px] py-2 shadow-sm"
        style={{ elevation: 2 }}>
        <View className="mr-[10px]">
          <Icon name="search" size={18} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search here.."
          placeholderTextColor="#999999"
          accessibilityLabel="Search issued documents"
          className="flex-1 text-[14px] text-ink"
        />
      </View>

      {isPending ? (
        <View className="gap-2 px-5">
          <Skeleton height={72} radius={14} />
          <Skeleton height={72} radius={14} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className="pt-10 text-center text-[13px] text-muted">
              No documents match your search.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/document/${item.id}` as never)}
              className="mb-[6px] flex-row items-start gap-3 rounded-[14px] bg-white px-[14px] py-[10px] shadow-sm active:bg-canvas"
              style={{ elevation: 2 }}>
              <View className="h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white">
                <Icon name={item.icon} size={28} />
              </View>
              <View className="flex-1 items-center">
                <Text className="w-full text-center text-[14px] font-bold text-ink">{item.name}</Text>
                <Text className="mt-[2px] w-full text-center text-[11px] leading-[14px] text-muted">{item.issuer}</Text>
                <Text className="mt-[3px] w-full text-center text-[10px] text-faint">{item.issuedAt}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
