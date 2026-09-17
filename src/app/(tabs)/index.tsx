import { useRouter } from 'expo-router';
import { Clock, FileText, ScanFace, Ticket, User, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppChrome } from '@/components/app/AppChrome';
import { useKitStyles } from '@/components/truepas';
import {
    Badge,
    CoreCard,
    CoreIcon,
    Divider,
    ErrorState,
    LoadingState,
    Progress,
    type BadgeVariant
} from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useBookings } from '@/features/history/hooks';
import { useIdentitySummary } from '@/features/identity/hooks';
import { makeStyles, useThemeTokens, type Theme } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { VerificationStatus } from '@/types/domain';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

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

/** Home tab — V2 Dashboard composition (design-repo truepas/home.tsx):
 *  greeting chrome → status panel with confidence → 2×2 quick tiles →
 *  steps checklist (while incomplete).
 *  Data: GET /cb/identity/summary + documents + family + bookings. */
export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useThemeTokens();
    const kit = useKitStyles();
    const styles = useStyles();
    const { data: summary, isPending, isError, isRefetching, refetch } = useIdentitySummary();
    const { data: documents } = useDocuments();
    const { data: members } = useFamily();
    const { data: bookings } = useBookings();

    const isVerified = summary?.status === 'verified';
    const scrollBottom = TAB_BAR_HEIGHT + insets.bottom + t.spacing[4];

    const docCount = documents?.length ?? 0;
    const memberCount = members?.length ?? 0;
    const upcomingBookings = (bookings ?? []).filter((b) => b.status === 'upcoming').length;
    const activityCount = summary?.activity.length ?? 0;

    // Confidence = best verified document match score; when nothing was scored
    // yet, fall back to the share of completed verification steps.
    const scored = (documents ?? [])
        .map((d) => d.matchScore)
        .filter((s): s is number => s != null);
    const stepsDone = STEPS.filter((s) => summary?.[s.key] === 'verified').length;
    const confidence = scored.length
        ? Math.round(Math.max(...scored) * 100)
        : Math.round((stepsDone / STEPS.length) * 100);

    const tiles = [
        {
            label: 'Documents',
            sub: `${docCount} stored`,
            Icon: FileText,
            onPress: () => router.push('/(tabs)/documents' as never),
        },
        {
            label: 'Family',
            sub: `${memberCount} member${memberCount === 1 ? '' : 's'}`,
            Icon: Users,
            onPress: () => router.push('/(tabs)/family' as never),
        },
        {
            label: 'Check-ins',
            sub: `${upcomingBookings} upcoming`,
            Icon: Ticket,
            onPress: () => router.push('/(tabs)/history' as never),
        },
        {
            label: 'History',
            sub: `${activityCount} events`,
            Icon: Clock,
            onPress: () => router.push('/(tabs)/history' as never),
        },
    ];

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']}>
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
                        {/* V2 status panel — sunken surface, confidence metric, progress */}
                        <View style={kit.homePanel}>
                            <View style={kit.rowBetween}>
                                <Text style={kit.cardTitle}>
                                    {isVerified ? 'Identity verified' : 'Finish verification'}
                                </Text>
                                <Badge variant={isVerified ? 'success' : 'warning'}>
                                    {isVerified ? 'Verified' : 'Incomplete'}
                                </Badge>
                            </View>
                            <View style={kit.rowBetween}>
                                <Text style={kit.metric}>{confidence}%</Text>
                                <Text style={kit.helper}>
                                    {scored.length ? 'match confidence' : 'steps complete'}
                                </Text>
                            </View>
                            <Progress value={confidence} variant={isVerified ? 'success' : 'primary'} />
                        </View>

                        {/* V2 quick tiles — 2×2 nav grid */}
                        <View style={styles.tileGrid}>
                            {[tiles.slice(0, 2), tiles.slice(2, 4)].map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.tileRow}>
                                    {row.map((tile) => (
                                        <Pressable
                                            key={tile.label}
                                            accessibilityRole="button"
                                            accessibilityLabel={`${tile.label}, ${tile.sub}`}
                                            onPress={tile.onPress}
                                            style={({ pressed }) => [styles.tile, pressed && kit.pressed]}>
                                            <View style={[styles.tileIcon, { backgroundColor: t.colors.brandSubtle }]}>
                                                <tile.Icon size={iconSize.md} color={t.colors.onBrandSubtle} />
                                            </View>
                                            <Text style={kit.cardTitle}>{tile.label}</Text>
                                            <Text style={kit.helper}>{tile.sub}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ))}
                        </View>

                        {/* Steps checklist — only while verification is incomplete */}
                        {!isVerified && (
                            <CoreCard noPadding>
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
                                                <Text style={[kit.cardTitle, styles.stepLabel]}>
                                                    {step.label}
                                                </Text>
                                                <Badge variant={meta.variant} size="sm">
                                                    {meta.label}
                                                </Badge>
                                            </View>
                                        </View>
                                    );
                                })}
                            </CoreCard>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const useStyles = makeStyles((t) => ({
    screen: { flex: 1, backgroundColor: t.colors.surface },
    flex: { flex: 1 },
    scroll: {
        paddingHorizontal: t.spacing[5],
        paddingTop: t.spacing[2],
        gap: t.spacing[4],
    },
    /* 2×2 quick tiles — two explicit rows, tiles flex to half width */
    tileGrid: { gap: t.spacing[3] },
    tileRow: { flexDirection: 'row', gap: t.spacing[3] },
    tile: {
        flex: 1,
        backgroundColor: t.colors.surfaceSunken,
        borderRadius: t.radii.lg,
        padding: t.spacing[3],
        gap: t.spacing[2],
    },
    tileIcon: {
        width: 44,
        height: 44,
        borderRadius: t.radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
}));
