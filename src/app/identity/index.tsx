import { useRouter } from 'expo-router';
import { FileText, ScanFace, ShieldCheck, UserRoundCheck, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    EmptyState,
    ErrorState,
    LoadingState,
    ScreenHeader,
} from '@/components/composite';
import { CoreButton, Divider, FadeUp, NeuBox, RowIcon, StatusChip, Typography } from '@/components/ui';
import { useIdentitySummary } from '@/features/identity/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { ActivityItem } from '@/types/domain';

type RowTone = 'success' | 'warning' | 'error' | 'neutral';
const ROW_VISUAL: Record<string, { tone: RowTone; colorKey: 'onSuccessSubtle' | 'onWarningSubtle' | 'onErrorSubtle' | 'textSecondary' }> = {
    verified: { tone: 'success', colorKey: 'onSuccessSubtle' },
    pending: { tone: 'warning', colorKey: 'onWarningSubtle' },
    failed: { tone: 'error', colorKey: 'onErrorSubtle' },
};

function CheckRow({ icon: Icon, title, status }: { icon: LucideIcon; title: string; status: string }) {
    const styles = useStyles();
    const theme = useThemeTokens();
    const visual = ROW_VISUAL[status] ?? { tone: 'neutral' as const, colorKey: 'textSecondary' as const };
    return (
        <View style={styles.checkRow}>
            <RowIcon tone={visual.tone} icon={<Icon size={iconSize.md} color={theme.colors[visual.colorKey]} />} />
            <View style={styles.checkText}>
                <Typography variant="body">{title}</Typography>
            </View>
            <StatusChip status={status} />
        </View>
    );
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const styles = useStyles();
    const theme = useThemeTokens();
    const dotColor = item.tone === 'success' ? theme.colors.success
        : item.tone === 'error' ? theme.colors.error
        : theme.colors.warning;
    return (
        <View style={styles.checkRow}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <View style={styles.checkText}>
                <Typography variant="body-sm" numberOfLines={1}>{item.title}</Typography>
                <Typography variant="caption" color="muted">{item.timestamp}</Typography>
            </View>
        </View>
    );
}

/** Identity dashboard — GET /cb/identity/summary. Status is computed
 *  server-side: face + document verified → "verified", anything
 *  missing/pending/failed → "incomplete". Design: identity.tsx ScreenFrame 1. */
export default function IdentityScreen() {
    const styles = useStyles();
    const theme = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { data: summary, isPending, isError, refetch } = useIdentitySummary();

    if (isPending) {
        return (
            <SafeAreaView edges={['top']} style={styles.safe}>
                <ScreenHeader title="Your identity" subtitle="Verification status" onBack={() => router.back()} />
                <LoadingState label="Loading identity…" />
            </SafeAreaView>
        );
    }

    if (isError || !summary) {
        return (
            <SafeAreaView edges={['top']} style={styles.safe}>
                <ScreenHeader title="Your identity" subtitle="Verification status" onBack={() => router.back()} />
                <ErrorState
                    title="Couldn't load identity status"
                    description="Please check your connection and try again."
                    onRetry={refetch}
                />
            </SafeAreaView>
        );
    }

    const verified = summary.status === 'verified';

    const incompleteHint =
        summary.face !== 'verified' ? 'Complete face verification to finish.'
        : summary.document === 'missing' ? 'Add a document to finish verification.'
        : summary.document === 'pending' ? 'Your document is being reviewed.'
        : summary.document === 'failed' ? 'Document verification failed — try again.'
        : summary.selfieMatch !== 'verified' ? 'Selfie match is still pending.'
        : 'Finish verification to unlock check-ins.';

    const cta = summary.document === 'pending'
        ? { label: 'View document status', route: '/(tabs)/documents' }
        : summary.document !== 'verified'
          ? { label: 'Add a document', route: '/document/select-type' }
          : summary.face !== 'verified'
            ? { label: 'Verify your face', route: '/face-update/pin' }
            : null;

    return (
        <SafeAreaView edges={['top']} style={styles.safe}>
            <ScreenHeader
                title="Your identity"
                subtitle="Verification status"
                onBack={() => router.back()}
            />
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: cta ? theme.sizes.heightLg + theme.spacing[8] : theme.spacing[6] },
                ]}
                showsVerticalScrollIndicator={false}>
                <FadeUp>
                    <NeuBox variant="raised" depth={6} color={theme.colors.surface} style={styles.card}>
                        <View style={styles.checkRow}>
                            <RowIcon
                                tone={verified ? 'success' : 'warning'}
                                icon={
                                    <ShieldCheck
                                        size={iconSize.lg}
                                        color={verified ? theme.colors.onSuccessSubtle : theme.colors.onWarningSubtle}
                                    />
                                }
                            />
                            <View style={styles.checkText}>
                                <Typography variant="h4">{verified ? "You're verified" : 'Almost there'}</Typography>
                                <Typography variant="body-sm" color="secondary">
                                    {verified ? 'Your face and document are verified.' : incompleteHint}
                                </Typography>
                            </View>
                            <StatusChip status={summary.status} />
                        </View>
                    </NeuBox>
                </FadeUp>
                <FadeUp delay={110}>
                    <NeuBox variant="raised" depth={4} color={theme.colors.surface} style={[styles.card, styles.cardTight]}>
                        <CheckRow icon={ScanFace} title="Face enrollment" status={summary.face} />
                        <Divider style={styles.divider} />
                        <CheckRow icon={FileText} title="Identity document" status={summary.document} />
                        <Divider style={styles.divider} />
                        <CheckRow icon={UserRoundCheck} title="Selfie match" status={summary.selfieMatch} />
                    </NeuBox>
                </FadeUp>
                <FadeUp delay={200}>
                    <NeuBox variant="raised" depth={4} color={theme.colors.surface} style={styles.card}>
                        <Typography variant="h4">Recent activity</Typography>
                        {summary.activity.length > 0 ? (
                            summary.activity.map((item) => <ActivityRow key={item.id} item={item} />)
                        ) : (
                            <EmptyState
                                compact
                                title="No activity yet"
                                description="Verification events will appear here."
                            />
                        )}
                    </NeuBox>
                </FadeUp>
            </ScrollView>
            {cta && (
                <View style={[styles.footer, { paddingBottom: theme.spacing[4] + insets.bottom }]}>
                    <CoreButton
                        fullWidth
                        size="lg"
                        accessibilityLabel={cta.label}
                        onPress={() => router.push(cta.route as never)}>
                        {cta.label}
                    </CoreButton>
                </View>
            )}
        </SafeAreaView>
    );
}

const useStyles = makeStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.background },
    flex: { flex: 1 },
    scrollContent: { padding: t.spacing[4], gap: t.spacing[4] },
    card: { padding: t.spacing[4], gap: t.spacing[3] },
    cardTight: { gap: 0 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
    checkText: { flex: 1, gap: 2, minWidth: 0 },
    dot: { width: 8, height: 8, borderRadius: t.radii.full },
    divider: { marginVertical: t.spacing[3] },
    footer: {
        paddingHorizontal: t.spacing[4],
        paddingTop: t.spacing[4],
        gap: t.spacing[2],
    },
}));
