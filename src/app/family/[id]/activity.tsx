import { useLocalSearchParams, useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CardContent, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import { Skeleton, Typography } from '@/components/ui';
import { useFamilyActivity, useFamilyMember } from '@/features/family/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Member activity — GET /cb/family/{personId}/activity. The projection isn't
 *  connected yet so this returns []; the empty state is the expected render,
 *  events are not fabricated. */
export default function FamilyMemberActivityScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data: member } = useFamilyMember(id);
  const { data: events, isPending, isError, isRefetching, refetch } = useFamilyActivity(id);

  const first = (name ?? member?.name ?? 'Member').split(' ')[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={`${first}'s activity`} onBack={() => router.back()} />
      {isPending ? (
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={64} radius={theme.radii.xl} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load activity"
          description="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={events ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: theme.spacing[4],
            gap: theme.spacing[3],
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card>
              <CardContent>
                <Typography variant="body">{item.title}</Typography>
                <Typography variant="body-sm" color="muted">
                  {new Date(item.date).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No activity yet"
              description={`Check-ins and verification events for ${first} will appear here once venues start reporting them.`}
              icon={<Users size={iconSize.lg} color={theme.colors.textMuted} />}
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
          }
        />
      )}
    </SafeAreaView>
  );
}
