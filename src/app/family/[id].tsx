import { useLocalSearchParams, useRouter } from 'expo-router';
import { Baby, Camera, CircleCheck, EllipsisVertical, FileText, ScanFace, Trash2, UserRoundPen, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, Alert, Card, CardContent, ErrorState, Modal, ScreenHeader } from '@/components/composite';
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
    type RowIconTone,
} from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useFamilyMember, useRemoveFamilyMember } from '@/features/family/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { FamilyMember } from '@/types/domain';

const VERIFICATION: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending_document: { variant: 'warning', label: 'Needs document' },
  pending_face: { variant: 'warning', label: 'Needs face' },
  failed: { variant: 'error', label: 'Failed' },
};

const DOC_STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'error', label: 'Failed' },
  missing: { variant: 'neutral', label: 'Missing' },
};

function verificationBadge(verification: string) {
  const meta = VERIFICATION[verification] ?? { variant: 'neutral' as const, label: verification };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function StepRow({
  icon,
  tone = 'neutral',
  title,
  subtitle,
  trailing,
}: {
  icon: ReactNode;
  tone?: RowIconTone;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}) {
  const theme = useThemeTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
      <RowIcon tone={tone} icon={icon} />
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Typography variant="body">{title}</Typography>
        <Typography variant="body-sm" color="muted">{subtitle}</Typography>
      </View>
      {trailing}
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
        <ScreenHeader title="Family member" onBack={() => router.back()} />
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
        <ScreenHeader title="Family member" onBack={() => router.back()} />
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

  const docRow = (
    <StepRow
      tone={docDone ? 'success' : 'warning'}
      icon={<FileText size={iconSize.md} color={docDone ? theme.colors.onSuccessSubtle : theme.colors.onWarningSubtle} />}
      title={isPhoto ? 'Document' : '1 · Verify a document'}
      subtitle={docDone ? `${doneDoc?.label ?? 'Document'} added.` : 'Birth certificate or passport.'}
      trailing={docDone ? <Badge variant="success">Done</Badge> : <Badge variant="warning">Next</Badge>}
    />
  );

  const faceRow = isPhoto ? (
    <StepRow
      tone={faceDone ? 'success' : faceNext ? 'warning' : 'neutral'}
      icon={
        <Camera
          size={iconSize.md}
          color={faceDone ? theme.colors.onSuccessSubtle : faceNext ? theme.colors.onWarningSubtle : theme.colors.textSecondary}
        />
      }
      title="Photo captured"
      subtitle="No liveness needed under 5 — one clear photo enrolls the face."
      trailing={
        faceDone ? <Badge variant="success">Done</Badge> : faceNext ? <Badge variant="warning">Next</Badge> : undefined
      }
    />
  ) : (
    <>
      <StepRow
        tone={faceDone ? 'success' : faceNext ? 'warning' : 'neutral'}
        icon={
          <ScanFace
            size={iconSize.md}
            color={faceDone ? theme.colors.onSuccessSubtle : faceNext ? theme.colors.onWarningSubtle : theme.colors.textSecondary}
          />
        }
        title="2 · Liveness check"
        subtitle={anyCamera ? 'Front or back camera, challenge prompts.' : 'Front camera, challenge prompts.'}
        trailing={
          faceDone ? <Badge variant="success">Done</Badge> : faceNext ? <Badge variant="warning">Next</Badge> : undefined
        }
      />
      <Divider />
      <StepRow
        icon={<CircleCheck size={iconSize.md} color={faceDone ? theme.colors.onSuccessSubtle : theme.colors.textSecondary} />}
        tone={faceDone ? 'success' : 'neutral'}
        title="3 · Face enrollment"
        subtitle="Automatic after liveness passes."
        trailing={faceDone ? <Badge variant="success">Done</Badge> : undefined}
      />
    </>
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
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title={m.name}
        subtitle={`${m.relationship} · age ${m.age}`}
        onBack={() => router.back()}
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
            {verificationBadge(m.verification)}
            {cameraBadge}
          </View>
        </View>
        <Card>
          <CardContent style={{ gap: theme.spacing[3] }}>
            {docRow}
            <Divider />
            {faceRow}
          </CardContent>
        </Card>

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
        {m.verification === 'verified' && (
          <Alert variant="success" title="Ready for check-in">
            {first} can be added to venue check-ins with you.
          </Alert>
        )}
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
