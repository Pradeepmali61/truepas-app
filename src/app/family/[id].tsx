/**
 * FamilyDetailScreen — a single family member. Header card, setup
 * checklist derived from verification state, and remove flow.
 * Ported 1:1 from UI-design-repo `src/app/screens/main/FamilyDetailScreen.tsx` —
 * "Continue setup" routes to our real next step (document capture, then
 * photo/liveness capture) instead of the design's single familyEnroll route.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Camera, Circle, CircleCheck, FileText, ScanFace, Trash2, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, AsyncBlock, ScreenHeader, Section, SectionTitle, SkeletonRows } from '@/components/composite';
import { useToast } from '@/components/composite/Toast';
import { DocumentRow } from '@/components/truepas';
import { Avatar, Badge, Divider, FadeUp, NeuBox, StatusChip, Typography } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useDocuments } from '@/features/documents/hooks';
import { useFamilyMember, useRemoveFamilyMember } from '@/features/family/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { FamilyMember } from '@/types/domain';

interface Step {
    icon: LucideIcon;
    label: string;
    sub: string;
    done: boolean;
}

function stepsFor(m: FamilyMember, docDone: boolean): Step[] {
    const isPhoto = m.faceCaptureMode === 'photo';
    const faceDone = m.faceEnrolled || m.verification === 'verified';
    return [
        {
            icon: FileText,
            label: 'Document',
            sub: 'Birth certificate, passport, or ID',
            done: docDone,
        },
        {
            icon: isPhoto ? Camera : ScanFace,
            label: isPhoto ? 'Face photo' : 'Liveness check',
            sub: isPhoto
                ? 'One clear photo — no liveness under 5'
                : 'Short challenge prompts on the front camera',
            done: faceDone,
        },
        {
            icon: BadgeCheck,
            label: 'Enrolled',
            sub: 'Ready for venue check-in',
            done: m.verification === 'verified',
        },
    ];
}

export default function FamilyMemberScreen() {
    const styles = useStyles();
    const t = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { toast } = useToast();
    const { id } = useLocalSearchParams<{ id: string }>();

    const member = useFamilyMember(id);
    const memberDocs = useDocuments(id);
    const removeMember = useRemoveFamilyMember();
    const [confirmRemove, setConfirmRemove] = useState(false);

    const m = member.data;
    const first = m?.name.split(' ')[0] ?? '';
    const isPhoto = (m?.faceCaptureMode ?? (m && m.age < 5 ? 'photo' : 'liveness')) === 'photo';
    // Member docs may stay 'pending' when backend verification isn't run for
    // them — any captured (non-failed) document completes this step.
    const doneDoc = memberDocs.data?.find((d) => d.status !== 'failed' && d.status !== 'missing');
    const docDone =
        doneDoc != null || m?.verification === 'pending_liveness' || m?.verification === 'verified';

    const continueSetup = m
        ? !docDone
            ? () =>
                  router.push({
                      pathname: '/document/select-type',
                      params: { family: '1', personId: id, memberName: m.name, band: m.ageBand },
                  } as never)
            : () =>
                  router.push({
                      pathname: isPhoto ? '/family/add/photo-capture' : '/family/add/face-capture',
                      params: { personId: id, name: first, age: String(m.age) },
                  } as never)
        : undefined;

    const cameras =
        m && m.allowedCameras?.length
            ? `${m.allowedCameras.map((c) => c[0].toUpperCase() + c.slice(1)).join(' + ')} camera`
            : '';

    const doRemove = async () => {
        try {
            await removeMember.mutateAsync(id);
            toast({ variant: 'success', title: 'Member removed' });
            router.back();
        } catch (e) {
            toast({
                variant: 'error',
                title: "Couldn't remove member",
                description: e instanceof Error ? e.message : undefined,
            });
        }
    };

    return (
        <SafeAreaView edges={['top']} style={styles.screen}>
            <ScreenHeader
                title={m?.name ?? 'Member'}
                subtitle={m ? `${m.relationship} · ${m.age} yrs` : undefined}
                onBack={() => router.back()}
            />
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.body, { paddingBottom: t.spacing[8] + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={member.isRefetching || memberDocs.isRefetching}
                        onRefresh={() => {
                            void member.refetch();
                            void memberDocs.refetch();
                        }}
                        tintColor={t.colors.actionPrimary}
                    />
                }>
                <AsyncBlock
                    state={{
                        data: member.data,
                        isPending: member.isPending,
                        isError: member.isError,
                        error: member.error,
                        refetch: () => void member.refetch(),
                    }}>
                    {(memberData) => (
                        <>
                            {/* ---------- header ---------- */}
                            <NeuBox variant="raised" style={styles.header}>
                                <Avatar name={memberData.name} size="xl" tinted />
                                <Typography variant="h4" numberOfLines={1}>
                                    {memberData.name}
                                </Typography>
                                <Typography variant="body-sm" color="secondary">
                                    {memberData.relationship} · {memberData.age} yrs
                                </Typography>
                                <View style={styles.chipRow}>
                                    <StatusChip status={memberData.verification} />
                                    <Badge
                                        variant="info"
                                        icon={
                                            memberData.faceCaptureMode === 'photo' ? (
                                                <Camera size={iconSize.xs} color={t.colors.onInfoSubtle} />
                                            ) : (
                                                <ScanFace size={iconSize.xs} color={t.colors.onInfoSubtle} />
                                            )
                                        }>
                                        {memberData.faceCaptureMode === 'photo' ? 'Photo' : 'Liveness'}
                                    </Badge>
                                    {cameras ? <Badge variant="neutral">{cameras}</Badge> : null}
                                </View>
                            </NeuBox>

                            {/* ---------- setup checklist ---------- */}
                            <Section>
                                <SectionTitle>Setup checklist</SectionTitle>
                                <NeuBox variant="raised" style={styles.card}>
                                    {stepsFor(memberData, docDone).map((s, i) => (
                                        <View key={s.label}>
                                            {i > 0 && <Divider />}
                                            <View style={styles.stepRow}>
                                                {s.done ? (
                                                    <CircleCheck size={iconSize.md} color={t.colors.success} />
                                                ) : (
                                                    <Circle size={iconSize.md} color={t.colors.textMuted} />
                                                )}
                                                <View style={styles.flex}>
                                                    <Text style={styles.stepTitle}>
                                                        {i + 1} · {s.label}
                                                    </Text>
                                                    <Text style={styles.stepSub}>{s.sub}</Text>
                                                </View>
                                                {s.done && (
                                                    <Badge variant="success" size="sm">
                                                        Done
                                                    </Badge>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </NeuBox>
                            </Section>

                            {/* ---------- documents ---------- */}
                            <Section>
                                <SectionTitle>Documents</SectionTitle>
                                <AsyncBlock
                                    state={{
                                        data: memberDocs.data,
                                        isPending: memberDocs.isPending,
                                        isError: memberDocs.isError,
                                        error: memberDocs.error,
                                        refetch: () => void memberDocs.refetch(),
                                    }}
                                    empty={(docs) => docs.length === 0}
                                    emptyTitle="No documents yet"
                                    emptyBody={`Add a document to verify ${first}.`}
                                    skeleton={<SkeletonRows />}>
                                    {(docs) => (
                                        <Section>
                                            {docs.map((d, i) => (
                                                <FadeUp key={d.id} delay={Math.min(i, 8) * 60}>
                                                    <DocumentRow
                                                        doc={{
                                                            label: d.label,
                                                            number: d.number,
                                                            status: d.status,
                                                            expiresAt: d.expiresAt
                                                                ? d.expiresAt.split('T')[0]
                                                                : null,
                                                            matchScore: d.matchScore,
                                                            type: d.type,
                                                        }}
                                                        onPress={() =>
                                                            router.push(`/document/${d.id}` as never)
                                                        }
                                                    />
                                                </FadeUp>
                                            ))}
                                        </Section>
                                    )}
                                </AsyncBlock>
                            </Section>
                        </>
                    )}
                </AsyncBlock>
            </ScrollView>

            {m && (
                <View style={[styles.footer, { paddingBottom: t.spacing[4] + insets.bottom }]}>
                    {m.verification !== 'verified' && continueSetup && (
                        <Button fullWidth size="lg" onPress={continueSetup}>
                            Continue setup
                        </Button>
                    )}
                    <Button
                        fullWidth
                        variant="outline"
                        loading={removeMember.isPending}
                        onPress={() => setConfirmRemove(true)}
                        iconLeft={<Trash2 size={iconSize.sm} color={t.colors.error} />}>
                        <Text style={styles.removeLabel}>Remove member</Text>
                    </Button>
                </View>
            )}

            <ActionSheet
                visible={confirmRemove}
                onClose={() => setConfirmRemove(false)}
                title={m ? `Remove ${m.name}?` : 'Remove member?'}
                items={[
                    {
                        key: 'remove',
                        label: 'Remove member',
                        destructive: true,
                        icon: <Trash2 size={iconSize.md} color={t.colors.error} />,
                        onSelect: () => void doRemove(),
                    },
                ]}
            />
        </SafeAreaView>
    );
}

const useStyles = makeStyles((t) => ({
    screen: { flex: 1, backgroundColor: t.colors.background },
    flex: { flex: 1 },
    body: {
        paddingHorizontal: t.spacing[4],
        paddingTop: t.spacing[4],
        gap: t.spacing[6],
        flexGrow: 1,
    },
    header: { alignItems: 'center', padding: t.spacing[5], gap: t.spacing[2] },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: t.spacing[2],
    },
    card: { padding: t.spacing[4], gap: t.spacing[3] },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
    stepTitle: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
    stepSub: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
    footer: {
        paddingHorizontal: t.spacing[4],
        paddingTop: t.spacing[3],
        gap: t.spacing[2],
    },
    removeLabel: { color: t.colors.error },
}));
