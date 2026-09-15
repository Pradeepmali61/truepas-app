import { useRouter } from 'expo-router';
import { FileText, ScanFace, ShieldCheck, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    Badge,
    CoreButton,
    CoreCard,
    CoreIcon,
    Divider,
    EmptyState,
    ErrorState,
    LoadingState,
    Typography,
    type BadgeVariant,
} from '@/components/ui';
import { useIdentitySummary } from '@/features/identity/hooks';
import { makeStyles, useThemeTokens, type Theme } from '@/theme';
import type { ActivityItem, VerificationStatus } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 64;

const STEP_STATUS: Record<VerificationStatus, { label: string; variant: BadgeVariant }> = {
    verified: { label: 'Verified', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    missing: { label: 'Missing', variant: 'neutral' },
    failed: { label: 'Failed', variant: 'error' },
};

const STEPS: { key: 'face' | 'document' | 'selfieMatch'; label: string; icon: ReactNode }[] = [
    { key: 'face', label: 'Face enrollment', icon: <ScanFace /> },
    { key: 'document', label: 'Identity document', icon: <FileText /> },
    { key: 'selfieMatch', label: 'Selfie match', icon: <User /> },
];

function stepColors(t: Theme, status: VerificationStatus): { bg: string; fg: string } {
    switch (status) {
        case 'verified':
            return { bg: t.colors.successSubtle, fg: t.colors.onSuccessSubtle };
        case 'pending':
            return { bg: t.colors.warningSubtle, fg: t.colors.onWarningSubtle };
        case 'failed':
            return { bg: t.colors.errorSubtle, fg: t.colors.onErrorSubtle };
        default:
            return { bg: t.colors.actionSecondary, fg: t.colors.textMuted };
    }
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const t = useThemeTokens();
    const styles = useStyles();
    const dot =
        item.tone === 'success' ? t.colors.success : item.tone === 'warning' ? t.colors.warning : t.colors.error;
    return (
        <View style={styles.activityRow}>
            <View style={[styles.activityDot, { backgroundColor: dot }]} />
            <View style={styles.activityText}>
                <Typography variant="body-sm">{item.title}</Typography>
                <Typography variant="caption" color="muted">
                    {item.timestamp}
                </Typography>
            </View>
        </View>
    );
}

/** Home tab — identity dashboard (GET /cb/identity/summary). */
export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useThemeTokens();
    const styles = useStyles();
    const { data: summary, isPending, isError, isRefetching, refetch } = useIdentitySummary();

    const isVerified = summary?.status === 'verified';
    const showCta = !!summary && !isVerified;
    const ctaBottom = TAB_BAR_HEIGHT + insets.bottom + t.spacing[2];

    const headline = isVerified ? "You're verified" : 'Almost there';
    const subheadline = isVerified
        ? 'Your identity is fully verified.'
        : summary?.document === 'missing'
          ? 'Add a document to finish verification.'
          : 'Complete the remaining steps to finish verification.';
    const headerTone = stepColors(t, isVerified ? 'verified' : 'pending');

    return (
        <SafeAreaView edges={['top']} style={styles.screen}>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingBottom: ctaBottom + (showCta ? t.sizes.heightLg : 0) + t.spacing[4] },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.actionPrimary} />
                }>
                <View style={styles.header}>
                    <Typography variant="h3">Your identity</Typography>
                    <Typography variant="body-sm" color="secondary">
                        Verification status
                    </Typography>
                </View>

                {isPending ? (
                    <LoadingState fullPage label="Loading identity…" />
                ) : isError || !summary ? (
                    <ErrorState
                        title="Couldn't load identity status"
                        message="Please check your connection and try again."
                        onRetry={refetch}
                    />
                ) : (
                    <>
                        <CoreCard style={[styles.cardPad, styles.card]}>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusIconWrap, { backgroundColor: headerTone.bg }]}>
                                    <CoreIcon size="lg" color={headerTone.fg}>
                                        <ShieldCheck />
                                    </CoreIcon>
                                </View>
                                <View style={styles.statusText}>
                                    <Typography variant="h4">{headline}</Typography>
                                    <Typography variant="body-sm" color="secondary">
                                        {subheadline}
                                    </Typography>
                                </View>
                                <Badge variant={isVerified ? 'success' : 'warning'} size="sm">
                                    {isVerified ? 'Verified' : 'Incomplete'}
                                </Badge>
                            </View>
                        </CoreCard>

                        <CoreCard noPadding style={styles.card}>
                            {STEPS.map((step, index) => {
                                const status = summary[step.key];
                                const meta = STEP_STATUS[status];
                                const tone = stepColors(t, status);
                                return (
                                    <View key={step.key}>
                                        {index > 0 ? <Divider /> : null}
                                        <View style={styles.stepRow}>
                                            <View style={[styles.stepIconWrap, { backgroundColor: tone.bg }]}>
                                                <CoreIcon size="md" color={tone.fg}>
                                                    {step.icon}
                                                </CoreIcon>
                                            </View>
                                            <Typography variant="body" style={styles.stepLabel}>
                                                {step.label}
                                            </Typography>
                                            <Badge variant={meta.variant} size="sm">
                                                {meta.label}
                                            </Badge>
                                        </View>
                                    </View>
                                );
                            })}
                        </CoreCard>

                        <CoreCard style={[styles.cardPad, styles.card]}>
                            <Typography variant="h4">Recent activity</Typography>
                            {summary.activity.length === 0 ? (
                                <EmptyState
                                    compact
                                    title="No activity yet"
                                    description="Verification events will appear here."
                                />
                            ) : (
                                <View style={styles.activityList}>
                                    {summary.activity.map((item) => (
                                        <ActivityRow key={item.id} item={item} />
                                    ))}
                                </View>
                            )}
                        </CoreCard>
                    </>
                )}
            </ScrollView>

            {showCta ? (
                <View style={[styles.cta, { bottom: ctaBottom }]}>
                    <CoreButton
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={() => router.push('/document/select-type' as never)}>
                        Add a document
                    </CoreButton>
                </View>
            ) : null}
        </SafeAreaView>
    );
}

const useStyles = makeStyles((t) => ({
    screen: { flex: 1, backgroundColor: t.colors.background },
    flex: { flex: 1 },
    scroll: { paddingHorizontal: t.spacing[5], paddingTop: t.spacing[2] },
    header: { marginTop: t.spacing[2], marginBottom: t.spacing[4], gap: t.spacing[0.5] },
    card: { marginBottom: t.spacing[4] },
    cardPad: { padding: t.spacing[4] },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
    statusIconWrap: {
        width: 44,
        height: 44,
        borderRadius: t.radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: { flex: 1, minWidth: 0, gap: 2 },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[3],
        paddingHorizontal: t.spacing[4],
        paddingVertical: 14,
    },
    stepIconWrap: {
        width: 36,
        height: 36,
        borderRadius: t.radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLabel: { flex: 1, minWidth: 0 },
    activityList: { marginTop: t.spacing[3], gap: t.spacing[2] },
    activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing[3] },
    activityDot: { width: 8, height: 8, borderRadius: t.radii.full, marginTop: 6 },
    activityText: { flex: 1, minWidth: 0, gap: 2 },
    cta: { position: 'absolute', left: t.spacing[5], right: t.spacing[5] },
}));

