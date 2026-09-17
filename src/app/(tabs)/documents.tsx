import { useRouter } from 'expo-router';
import { memo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import { AddDocumentButton, DocumentRow } from '@/components/truepas';
import { Skeleton } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useThemeTokens } from '@/theme';
import type { IdentityDocument } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

const DocCard = memo(function DocCard({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const theme = useThemeTokens();
  // Numbers arrive masked from the BFF — render verbatim, never unmask.
  const expiry = doc.expiresAt ? doc.expiresAt.split('T')[0] : null;
  return (
    <DocumentRow
      doc={{
        label: doc.label,
        number: doc.number,
        status: doc.status,
        expiresAt: expiry,
        matchScore: doc.matchScore,
        type: doc.type,
      }}
      onPress={onPress}
      style={{ width: '100%', marginBottom: theme.spacing[4] }}
    />
  );
});

function DocSkeleton() {
  const theme = useThemeTokens();
  return (
    <Card style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <Skeleton width={40} height={40} radius={theme.radii.lg} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton variant="text" width={140} height={16} />
          <Skeleton variant="text" width={200} height={12} />
        </View>
        <Skeleton width={64} height={24} radius={theme.radii.full} />
      </View>
    </Card>
  );
}

export default function DocumentsScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: documents, isPending, isError, isRefetching, refetch } = useDocuments();

  const isEmpty = !isPending && !isError && (documents?.length ?? 0) === 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title="Documents"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
      />
      <View style={{ flex: 1 }}>
        {isPending ? (
          <View style={{ padding: theme.spacing[4] }}>
            {[1, 2, 3].map((i) => <DocSkeleton key={i} />)}
          </View>
        ) : isError ? (
          <ErrorState
            title="Couldn't load documents"
            description="Please check your connection and try again."
            onRetry={refetch}
          />
        ) : isEmpty ? (
          <EmptyState
            title="No documents yet"
            description="Your verified documents will appear here."
          />
        ) : (
          <FlatList
            data={documents ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: theme.spacing[4] }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DocCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} />
            )}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
            }
          />
        )}
      </View>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          // Tab bar is absolute-positioned (88 + bottom inset) — lift the
          // footer above it.
          marginBottom: TAB_BAR_HEIGHT + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
          gap: theme.spacing[2],
        }}>
        <AddDocumentButton onPress={() => router.push('/document/select-type' as never)} />
      </View>
    </SafeAreaView>
  );
}
