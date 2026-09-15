import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { memo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import {
    Avatar,
    Badge,
    CoreButton,
    FadeUp,
    Skeleton,
    Typography,
    type BadgeVariant,
} from '@/components/ui';
import { useFamily } from '@/features/family/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { FamilyMember } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 64;

const VERIFICATION: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending_document: { variant: 'warning', label: 'Needs document' },
  pending_face: { variant: 'warning', label: 'Needs face' },
  failed: { variant: 'error', label: 'Failed' },
};

function verificationBadge(verification: string) {
  const meta = VERIFICATION[verification] ?? { variant: 'neutral' as const, label: verification };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/** 'photo' under 5, 'liveness' 5+ — falls back to ageBand when the field is absent. */
function captureModeLabel(m: FamilyMember): string {
  const mode = m.faceCaptureMode ?? (m.ageBand === '0-4' ? 'photo' : 'liveness');
  return mode === 'photo' ? 'photo capture' : 'liveness';
}

const MemberCard = memo(function MemberCard({ member, onPress }: { member: FamilyMember; onPress: () => void }) {
  const theme = useThemeTokens();
  return (
    <Card onPress={onPress} style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <Avatar name={member.name} size="lg" />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Typography variant="body" numberOfLines={1}>{member.name}</Typography>
          <Typography variant="body-sm" color="muted" numberOfLines={1}>
            {member.relationship} · age {member.age} · {captureModeLabel(member)}
          </Typography>
        </View>
        {verificationBadge(member.verification)}
      </View>
    </Card>
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
