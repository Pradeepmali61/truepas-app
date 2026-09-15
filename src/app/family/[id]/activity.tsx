import { useLocalSearchParams, useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityFeed } from '@/components/complex/ActivityFeed';
import { EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
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
  const { data: events, isPending, isError, refetch } = useFamilyActivity(id);

  const first = (name ?? member?.name ?? 'Member').split(' ')[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={`${first}'s activity`} onBack={() => router.back()} />
      {isError ? (
        <ErrorState
          title="Couldn't load activity"
          description="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <View style={{ flex: 1, padding: theme.spacing[4] }}>
          <ActivityFeed
            loading={isPending}
            events={(events ?? []).map((e) => ({
              key: e.id,
              icon: <Users size={iconSize.sm} color={theme.colors.actionPrimary} />,
              title: e.title,
              timestamp: new Date(e.date).toLocaleString(),
            }))}
            emptyState={
              <EmptyState
                title="No activity yet"
                description={`Check-ins and verification events for ${first} will appear here once venues start reporting them.`}
                icon={<Users size={iconSize.lg} color={theme.colors.textMuted} />}
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
