import { useRouter } from 'expo-router';
import { CalendarDays, Landmark } from 'lucide-react-native';
import { memo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import { Badge, RowIcon, Skeleton, Typography } from '@/components/ui';
import { useIssuedDocuments } from '@/features/documents/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { IssuedDoc } from '@/types/domain';

const IssuedCard = memo(function IssuedCard({ doc, onPress }: { doc: IssuedDoc; onPress: () => void }) {
  const theme = useThemeTokens();
  // Numbers arrive masked from the BFF — render verbatim, never unmask.
  return (
    <Card onPress={onPress} style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <RowIcon tone="info" icon={<Landmark size={iconSize.md} color={theme.colors.onInfoSubtle} />} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Typography variant="body" numberOfLines={1}>{doc.name}</Typography>
          <Typography variant="body-sm" color="muted" numberOfLines={1}>
            {doc.issuer} · <Typography variant="body-sm" color="muted" style={{ fontFamily: theme.fontFamily.mono.regular }}>{doc.number}</Typography>
          </Typography>
        </View>
        <Badge variant={doc.status === 'Active' ? 'success' : 'neutral'}>{doc.status}</Badge>
      </View>
    </Card>
  );
});

function IssuedSkeleton() {
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

/** Issued credentials — GET /cb/documents/issued. Venue-issued credentials
 *  with Active/Expired status; they appear after venue check-ins. */
export default function IssuedDocumentsScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const { data: docs, isPending, isError, isRefetching, refetch } = useIssuedDocuments();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Issued to you" onBack={() => router.back()} />
      {isPending ? (
        <View style={{ padding: theme.spacing[4] }}>
          {[1, 2].map((i) => <IssuedSkeleton key={i} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load credentials"
          description="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={docs ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing[4] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <IssuedCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No issued credentials"
              description="Credentials issued to you at venues will appear here."
            />
          }
          ListFooterComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[2] }}>
              <CalendarDays size={iconSize.md} color={theme.colors.textMuted} />
              <Typography variant="body-sm" color="muted" style={{ flex: 1 }}>
                Issued credentials appear after venue check-ins.
              </Typography>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
          }
        />
      )}
    </SafeAreaView>
  );
}
