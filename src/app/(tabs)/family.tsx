import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { memo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import { FamilyCard } from '@/components/truepas';
import {
    CoreButton,
    FadeUp,
    Skeleton,
} from '@/components/ui';
import { useFamily } from '@/features/family/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { FamilyMember } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

const MemberCard = memo(function MemberCard({ member, onPress }: { member: FamilyMember; onPress: () => void }) {
  const theme = useThemeTokens();
  return (
    <FamilyCard
      member={{
        name: member.name,
        relationship: member.relationship,
        age: member.age,
        verification: member.verification,
        faceCaptureMode: member.faceCaptureMode ?? (member.ageBand === '0-4' ? 'photo' : 'liveness'),
      }}
      onPress={onPress}
      style={{ width: '100%', marginBottom: theme.spacing[4] }}
    />
  );
});

function MemberSkeleton() {
  const theme = useThemeTokens();
  return (
    <Card style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <Skeleton width={48} height={48} radius={theme.radii.full} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton variant="text" width={140} height={16} />
          <Skeleton variant="text" width={190} height={12} />
        </View>
        <Skeleton width={80} height={24} radius={theme.radii.full} />
      </View>
    </Card>
  );
}

/** Family tab — GET /cb/family. Members carry ageBand, faceCaptureMode
 *  ('photo' under 5, 'liveness' 5+), allowedCameras, and verification state. */
export default function FamilyScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: members, isPending, isError, isRefetching, refetch } = useFamily();

  const ctaBottom = TAB_BAR_HEIGHT + insets.bottom + theme.spacing[2];
  const count = members?.length ?? 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title="Family"
        subtitle={`${count} ${count === 1 ? 'member' : 'members'}`}
      />
      {isPending ? (
        <View style={{ padding: theme.spacing[4] }}>
          {[1, 2].map((i) => <MemberSkeleton key={i} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load family"
          description="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={members ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing[4], paddingBottom: ctaBottom + theme.sizes.heightLg + theme.spacing[4] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeUp delay={index * 110}>
              <MemberCard member={item} onPress={() => router.push(`/family/${item.id}` as never)} />
            </FadeUp>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No family members"
              description="Add family members to manage their verification."
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
          }
        />
      )}
      <View
        style={{
          position: 'absolute',
          left: theme.spacing[4],
          right: theme.spacing[4],
          bottom: ctaBottom,
        }}>
        <CoreButton
          fullWidth
          variant="outline"
          accessibilityLabel="Add family member"
          iconLeft={<UserPlus size={iconSize.sm} color={theme.colors.actionPrimary} />}
          onPress={() => router.push('/family/add' as never)}>
          Add family member
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
