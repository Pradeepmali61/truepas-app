import { useRouter } from 'expo-router';
import { CircleCheck, FileText, ScanFace, ShieldCheck, TriangleAlert, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppChrome } from '@/components/app/AppChrome';
import { ActivityFeed } from '@/components/complex/ActivityFeed';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/composite';
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
    type BadgeVariant
} from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useIdentitySummary } from '@/features/identity/hooks';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens, type Theme } from '@/theme';
import { iconSize } from '@/theme/tokens';
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

function activityIcon(t: Theme, tone: ActivityItem['tone']): ReactNode {
    switch (tone) {
        case 'success':
            return <CircleCheck size={iconSize.sm} color={t.colors.onSuccessSubtle} />;
        case 'warning':
            return <FileText size={iconSize.sm} color={t.colors.onWarningSubtle} />;
        default:
            return <TriangleAlert size={iconSize.sm} color={t.colors.onErrorSubtle} />;
    }
}

/** Home tab — identity dashboard (GET /cb/identity/summary). */
export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useThemeTokens();
    const styles = useStyles();
    const { data: summary, isPending, isError, isRefetching, refetch } = useIdentitySummary();
    const { data: documents } = useDocuments();
    const faceEnrolled = useAppSelector((state) => state.auth.user?.faceEnrolled);

    const isVerified = summary?.status === 'verified';
    const scrollBottom = TAB_BAR_HEIGHT + insets.bottom + t.spacing[4];

    const docCount = documents?.length ?? 0;
    const verifiedDocs = (documents ?? []).filter((d) => d.status === 'verified').map((d) => d.label);
    const walletSummary = `${docCount} document${docCount === 1 ? '' : 's'} · ${faceEnrolled ? 'face enrolled' : 'face not enrolled'}`;
    const walletDetail =
        verifiedDocs.length === 0
            ? 'No documents verified yet.'
            : `${verifiedDocs.slice(0, 2).join(' and ')}${verifiedDocs.length > 2 ? ` and ${verifiedDocs.length - 2} more` : ''} verified.`;

    const headline = isVerified ? "You're verified" : 'Almost there';
    const subheadline = isVerified
        ? 'Your identity is fully verified.'
        : summary?.document === 'missing'
          ? 'Add a document to finish verification.'
          : 'Complete the remaining steps to finish verification.';
    const headerTone = stepColors(t, isVerified ? 'verified' : 'pending');

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.chromeWrap}>
                <AppChrome />
            </SafeAreaView>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingBottom: scrollBottom },
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

                        <Card appearance="outlined" style={styles.card}>
                            <CardHeader>
                                <CardTitle>Identity wallet</CardTitle>
                                <CardDescription>{walletSummary}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Typography variant="body-sm" color="secondary">
                                    {walletDetail}
                                </Typography>
                            </CardContent>
                            <CardFooter>
                                <CoreButton size="sm" onPress={() => router.push('/documents' as never)}>
                                    Manage
                                </CoreButton>
                                <CoreButton
                                    size="sm"
                                    variant="ghost"
                                    onPress={() => router.push('/document/select-type' as never)}>
                                    Add document
                                </CoreButton>
                            </CardFooter>
                        </Card>

                        <CoreCard style={[styles.cardPad, styles.card]}>
                            <Typography variant="h4">Recent activity</Typography>
                            <ActivityFeed
                                style={styles.feed}
                                events={summary.activity.map((item) => ({
                                    key: item.id,
                                    icon: activityIcon(t, item.tone),
                                    title: item.title,
                                    timestamp: item.timestamp,
                                }))}
                                emptyState={
                                    <EmptyState
                                        compact
                                        title="No activity yet"
                                        description="Verification events will appear here."
                                    />
                                }
                            />
                        </CoreCard>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const useStyles = makeStyles((t) => ({
    screen: { flex: 1, backgroundColor: t.colors.background },
    chromeWrap: { backgroundColor: t.colors.surface },
    flex: { flex: 1 },
    scroll: { paddingHorizontal: t.spacing[5], paddingTop: t.spacing[2] },
    header: {
        marginTop: t.spacing[2],
        marginBottom: t.spacing[4],
    },
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
    feed: { marginTop: t.spacing[3] },
}));

