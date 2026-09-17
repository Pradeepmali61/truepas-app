import { useRouter } from 'expo-router';
import { FileText, ScanFace, ShieldCheck, UserRoundCheck, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    EmptyState,
    ErrorState,
    LoadingState,
    ScreenHeader,
} from '@/components/composite';
import { Badge, CoreButton, Divider, FadeUp, RowIcon, Typography, type BadgeVariant } from '@/components/ui';
import { useIdentitySummary } from '@/features/identity/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { ActivityItem } from '@/types/domain';

const STATUS_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
    verified: { variant: 'success', label: 'Verified' },
    pending: { variant: 'warning', label: 'Pending' },
    missing: { variant: 'neutral', label: 'Missing' },
    failed: { variant: 'error', label: 'Failed' },
    incomplete: { variant: 'warning', label: 'Incomplete' },
};

type RowTone = 'success' | 'warning' | 'error' | 'neutral';
const ROW_VISUAL: Record<string, { tone: RowTone; colorKey: 'onSuccessSubtle' | 'onWarningSubtle' | 'onErrorSubtle' | 'textSecondary' }> = {
    verified: { tone: 'success', colorKey: 'onSuccessSubtle' },
    pending: { tone: 'warning', colorKey: 'onWarningSubtle' },
    failed: { tone: 'error', colorKey: 'onErrorSubtle' },
};

function statusBadge(status: string) {
    const s = STATUS_BADGE[status] ?? { variant: 'neutral' as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
}

function CheckRow({ icon: Icon, title, status }: { icon: LucideIcon; title: string; status: string }) {
    const theme = useThemeTokens();
    const visual = ROW_VISUAL[status] ?? { tone: 'neutral' as const, colorKey: 'textSecondary' as const };
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <RowIcon tone={visual.tone} icon={<Icon size={iconSize.md} color={theme.colors[visual.colorKey]} />} />
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Typography variant="body">{title}</Typography>
            </View>
            {statusBadge(status)}
        </View>
    );
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const theme = useThemeTokens();
    const dotColor = item.tone === 'success' ? theme.colors.success
        : item.tone === 'error' ? theme.colors.error
        : theme.colors.warning;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
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
    const theme = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { data: summary, isPending, isError, refetch } = useIdentitySummary();

    if (isPending) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScreenHeader title="Your identity" subtitle="Verification status" onBack={() => router.back()} />
                <LoadingState label="Loading identity…" />
            </SafeAreaView>
        );
    }

    if (isError || !summary) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Your identity"
                subtitle="Verification status"
                onBack={() => router.back()}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: theme.spacing[4],
                    gap: theme.spacing[4],
                    paddingBottom: cta ? theme.sizes.heightLg + theme.spacing[8] : theme.spacing[6],
                }}
                showsVerticalScrollIndicator={false}>
                <FadeUp>
                    <Card appearance="elevated">
                        <CardContent style={{ gap: theme.spacing[2] }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                                <RowIcon
                                    tone={verified ? 'success' : 'warning'}
                                    icon={
                                        <ShieldCheck
                                            size={iconSize.lg}
                                            color={verified ? theme.colors.onSuccessSubtle : theme.colors.onWarningSubtle}
                                        />
                                    }
                                />
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Typography variant="h4">{verified ? "You're verified" : 'Almost there'}</Typography>
                                    <Typography variant="body-sm" color="secondary">
                                        {verified ? 'Your face and document are verified.' : incompleteHint}
                                    </Typography>
                                </View>
                                {statusBadge(summary.status)}
                            </View>
                        </CardContent>
                    </Card>
                </FadeUp>
                <FadeUp delay={110}>
                    <Card>
                        <CardContent style={{ gap: 0 }}>
                            <CheckRow icon={ScanFace} title="Face enrollment" status={summary.face} />
                            <Divider style={{ marginVertical: theme.spacing[3] }} />
                            <CheckRow icon={FileText} title="Identity document" status={summary.document} />
                            <Divider style={{ marginVertical: theme.spacing[3] }} />
                            <CheckRow icon={UserRoundCheck} title="Selfie match" status={summary.selfieMatch} />
                        </CardContent>
                    </Card>
                </FadeUp>
                <FadeUp delay={200}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent activity</CardTitle>
                        </CardHeader>
                        <CardContent style={{ gap: theme.spacing[3] }}>
                            {summary.activity.length > 0 ? (
                                summary.activity.map((item) => <ActivityRow key={item.id} item={item} />)
                            ) : (
                                <EmptyState
                                    compact
                                    title="No activity yet"
                                    description="Verification events will appear here."
                                />
                            )}
                        </CardContent>
                    </Card>
                </FadeUp>
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
