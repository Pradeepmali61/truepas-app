import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Skeleton } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import type { IdentityDocument } from '@/types/domain';

const DOC_CARD_STYLES: Record<
  IdentityDocument['type'],
  { bg: string; name: string; meta: string }
> = {
  passport: { bg: '#2c2c2c', name: '#ffffff', meta: '#b0b0b0' },
  drivingLicense: { bg: '#f7c04a', name: '#000000', meta: '#5a4a2a' },
  idCard: { bg: '#ffffff', name: '#000000', meta: '#666666' },
};

function DocCard({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const palette = DOC_CARD_STYLES[doc.type];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${doc.label}, ${doc.number}`}
      onPress={onPress}
      className="mx-5 my-2 flex-row items-center gap-3 rounded-card px-[14px] py-[10px] shadow-md active:opacity-90"
      style={{ backgroundColor: palette.bg, elevation: 3 }}>
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
    </Pressable>
  );
}

/** Identity tab — document list (mockup: "Identity Tab — Document List"). */
export default function IdentityScreen() {
  const router = useRouter();
  const { data: documents, isPending } = useDocuments();
  const isEmpty = !isPending && (documents?.length ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text accessibilityRole="header" className="text-[20px] font-bold text-ink">
          Documents
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Verify new document"
          onPress={() => router.push('/document/select-type')}
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
            onPress={() => router.push('/document/select-type')}
            className="mb-5 w-full flex-row items-center justify-center gap-2 rounded-btn bg-primary p-[14px] active:opacity-80">
            <Icon name="plus" size={18} color="#ffffff" />
            <Text className="text-[16px] font-bold text-white">Verify new document</Text>
          </Pressable>
          <AddFamilyCard onPress={() => router.push('/family/add')} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {documents?.map((doc) => (
            <DocCard key={doc.id} doc={doc} onPress={() => router.push(`/document/${doc.id}` as never)} />
          ))}
          <AddFamilyCard onPress={() => router.push('/family/add')} />
          <Text className="px-[30px] pt-[14px] text-center text-[12px] text-faint">
            Add more issued documents by tapping on +
          </Text>
        </ScrollView>
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
          style={{ width: 112, height: 112, resizeMode: 'contain' }}
        />
      </View>
    </Pressable>
  );
}
