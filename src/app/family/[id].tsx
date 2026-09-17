import { useLocalSearchParams, useRouter } from 'expo-router';
import { Baby, Camera, EllipsisVertical, FileText, Trash2, UserRoundPen, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, Alert, Card, CardContent, ErrorState, Modal, ScreenHeader } from '@/components/composite';
import { LivenessStepsCard } from '@/components/truepas';
import {
    Avatar,
    Badge,
    CoreButton,
    Divider,
    IconButton,
    PopIn,
    RowIcon,
    Skeleton,
    Typography,
    type BadgeVariant,
} from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useFamilyMember, useRemoveFamilyMember } from '@/features/family/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { FamilyMember } from '@/types/domain';

const DOC_STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'error', label: 'Failed' },
  missing: { variant: 'neutral', label: 'Missing' },
};

function formatDob(dob?: string): string {
  if (!dob) return '—';
  const d = new Date(dob);
  return Number.isNaN(d.getTime())
    ? dob
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useThemeTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
      <Typography variant="body-sm" color="muted">{label}</Typography>
      <Typography variant="body-sm" numberOfLines={1} style={{ flexShrink: 1, fontWeight: theme.fontWeight.bold }}>
        {value}
      </Typography>
    </View>
  );
}

/** Family member detail — GET /cb/family/{personId}. Steps card reflects the
 *  member's verification state; capture mode comes from faceCaptureMode
 *  ('photo' under 5, 'liveness' 5+) and allowedCameras (back under 10). */
export default function FamilyMemberScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, isPending, isError, refetch } = useFamilyMember(id);
  const { data: memberDocs } = useDocuments(id);
  const removeMember = useRemoveFamilyMember();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (isPending) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Family member" onBack={() => router.dismissTo('/(tabs)/family')} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
            <Skeleton width={64} height={64} radius={theme.radii.full} />
            <Skeleton variant="text" width={120} height={16} />
          </View>
          <Skeleton height={180} radius={theme.radii.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !member) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Family member" onBack={() => router.dismissTo('/(tabs)/family')} />
        <ErrorState
          title="Couldn't load member"
          description="This member may have been removed, or your connection dropped."
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const m: FamilyMember = member;
  const first = m.name.split(' ')[0];
  const isPhoto = (m.faceCaptureMode ?? (m.ageBand === '0-4' ? 'photo' : 'liveness')) === 'photo';
  const anyCamera = m.allowedCameras?.includes('back') ?? false;
  const doneDoc = memberDocs?.find((d) => d.status !== 'failed' && d.status !== 'missing');
  // Member docs may stay 'pending' when backend verification isn't run for
  // them — any captured (non-failed) document completes this step.
  const docDone = doneDoc != null;
  const faceDone = m.faceEnrolled;
  const docNext = !docDone;
  const faceNext = docDone && !faceDone;

  const cameraBadge = isPhoto ? (
    <Badge variant="info" icon={<Baby size={iconSize.xs} color={theme.colors.onInfoSubtle} />}>
      Photo enrollment
    </Badge>
  ) : (
    <Badge variant="info" icon={<Camera size={iconSize.xs} color={theme.colors.onInfoSubtle} />}>
      {anyCamera ? 'Any camera' : 'Front camera'}
    </Badge>
  );

  const cta = docNext
    ? {
        label: `Add ${first}'s document`,
        onPress: () =>
          router.push({
            pathname: '/document/select-type',
            params: { family: '1', personId: id, memberName: m.name, band: m.ageBand },
          } as never),
      }
    : faceNext
      ? {
          label: isPhoto ? `Capture ${first}'s photo` : 'Start liveness check',
          onPress: () =>
            router.push({
              pathname: isPhoto ? '/family/add/photo-capture' : '/family/add/face-capture',
              params: { personId: id, name: first, age: String(m.age) },
            } as never),
        }
      : null;

  const handleRemove = () => setConfirmRemove(true);

  const confirmRemoveMember = async () => {
    try {
      await removeMember.mutateAsync(id);
    } finally {
      router.dismissTo('/(tabs)/family');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title={m.name}
        subtitle={`${m.relationship} · age ${m.age}`}
        onBack={() => router.dismissTo('/(tabs)/family')}
        actions={
          <IconButton
            accessibilityLabel="Member options"
            icon={<EllipsisVertical size={iconSize.md} color={theme.colors.textPrimary} />}
            onPress={() => setMenuOpen(true)}
          />
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4], paddingBottom: cta ? theme.sizes.heightLg + theme.spacing[8] : theme.spacing[6] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
          <PopIn>
            <Avatar name={m.name} size="xl" />
          </PopIn>
          <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap', justifyContent: 'center' }}>
            {cameraBadge}
          </View>
        </View>
        <Card>
          <CardContent style={{ gap: theme.spacing[3] }}>
            <DetailRow label="Name" value={m.name} />
            <Divider />
            <DetailRow label="Date of birth" value={formatDob(m.dateOfBirth)} />
            <Divider />
            <DetailRow label="Relationship" value={m.relationship} />
          </CardContent>
        </Card>
        <LivenessStepsCard
          title="Verification"
          total={2}
          current={docDone ? 1 : 0}
          style={{ width: '100%', elevation: 0, shadowOpacity: 0 }}
          steps={[
            { label: 'Document upload', state: docDone ? 'done' : 'active' },
            {
              label: isPhoto ? 'Photo captured' : 'Face scanned',
              state: faceDone ? 'done' : docDone ? 'active' : 'pending',
            },
          ]}
        />

        {/* Member's scanned documents — tap to open the flip-card detail */}
        {memberDocs && memberDocs.length > 0 ? (
          <View style={{ gap: theme.spacing[2] }}>
            <Typography
              variant="caption"
              color="muted"
              style={{ textTransform: 'uppercase', letterSpacing: theme.letterSpacing.caps }}>
              Documents
            </Typography>
            {memberDocs.map((d) => {
              const st = DOC_STATUS[d.status] ?? { variant: 'neutral' as const, label: d.status };
              return (
                <Card key={d.id} onPress={() => router.push(`/document/${d.id}` as never)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                    <RowIcon tone="primary" icon={<FileText size={iconSize.md} color={theme.colors.actionPrimary} />} />
                    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                      <Typography variant="body" numberOfLines={1}>
                        {d.label}
                      </Typography>
                      <Typography variant="body-sm" color="muted" numberOfLines={1}>
                        {d.number}
                      </Typography>
                    </View>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}
        {m.turning18Soon && (
          <Alert variant="info" title="Eligible for independent account">
            {first} is turning 18 soon and can create their own Truepas account.
          </Alert>
        )}
      </ScrollView>
      {cta && (
        <View
          style={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[3],
            paddingBottom: theme.spacing[4] + insets.bottom,
            borderTopWidth: theme.sizes.fieldBorderWidth,
            borderTopColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface,
          }}>
          <CoreButton fullWidth size="lg" accessibilityLabel={cta.label} onPress={cta.onPress}>
            {cta.label}
          </CoreButton>
        </View>
      )}
      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={m.name}
        items={[
          {
            key: 'activity',
            label: 'View activity',
            icon: <Users size={iconSize.sm} color={theme.colors.textPrimary} />,
            onSelect: () =>
              router.push({ pathname: '/family/[id]/activity', params: { id, name: m.name } } as never),
          },
          ...(faceDone
            ? [
                {
                  key: 'update-face',
                  label: isPhoto ? 'Retake photo' : 'Update face',
                  icon: <UserRoundPen size={iconSize.sm} color={theme.colors.textPrimary} />,
                  onSelect: () =>
                    isPhoto
                      ? router.push({
                          pathname: '/family/add/photo-capture',
                          params: { personId: id, name: first, age: String(m.age) },
                        } as never)
                      : router.push({ pathname: '/face-update/pin', params: { personId: id } } as never),
                },
              ]
            : []),
          {
            key: 'remove',
            label: 'Remove member',
            icon: <Trash2 size={iconSize.sm} color={theme.colors.error} />,
            destructive: true,
            onSelect: handleRemove,
          },
        ]}
      />
      <Modal
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove family member?"
        footer={
          <>
            <CoreButton variant="ghost" onPress={() => setConfirmRemove(false)}>
              Cancel
            </CoreButton>
            <CoreButton
              variant="destructive"
              loading={removeMember.isPending}
              onPress={() => {
                setConfirmRemove(false);
                confirmRemoveMember();
              }}>
              Remove
            </CoreButton>
          </>
        }>
        <Typography variant="body" color="secondary">
          {m.name} will no longer be available in your family. Their face and documents are deleted too.
        </Typography>
      </Modal>
    </SafeAreaView>
  );
}
