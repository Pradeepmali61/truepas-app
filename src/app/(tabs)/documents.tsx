/**
 * Documents tab — ported 1:1 from UI-design-repo `screens/main/IdentityScreen.tsx`:
 * identity-status summary hero, the user's document wallet (DocumentRow), and
 * venue-issued credentials (IssuedCard).
 *
 * Data comes from the real hooks (useIdentitySummary / useDocuments) in place
 * of the design's useApiData store. There is no issued-credentials endpoint in
 * our API yet, so that section renders the design's empty state.
 */
import { useRouter } from 'expo-router';
import { FileText, Plus, ScanFace, UserRoundCheck } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncBlock, EmptyState, ScreenHeader, Section, SectionTitle, SkeletonRows } from '@/components/composite';
import { DocumentRow } from '@/components/truepas';
import { Divider, FadeUp, NeuBox, Skeleton, SoftIconButton, StatusChip, Typography } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useIdentitySummary } from '@/features/identity/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Height of the floating bottom tab pill (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

export default function DocumentsScreen() {
    const styles = useStyles();
    const t = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const summary = useIdentitySummary();
    const documents = useDocuments();

    const refreshing = summary.isRefetching || documents.isRefetching;
    const onRefresh = () => {
        void summary.refetch();
        void documents.refetch();
    };

    const scrollBottom = TAB_BAR_HEIGHT + insets.bottom + t.spacing[4];

    return (
        <SafeAreaView edges={['top']} style={styles.screen}>
            <ScreenHeader
                title="Documents"
                actions={
                    <SoftIconButton
                        icon={Plus}
                        size={44}
                        accessibilityLabel="Add document"
                        onPress={() => router.push('/document/select-type' as never)}
                    />
                }
            />
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.body, { paddingBottom: scrollBottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.actionPrimary} />
                }>
                {/* ---------- identity status hero ---------- */}
                <AsyncBlock
                    state={{
                        data: summary.data,
                        isPending: summary.isPending,
                        isError: summary.isError,
                        error: summary.error,
                        refetch: () => void summary.refetch(),
                    }}
                    skeleton={<Skeleton variant="rect" height={168} style={styles.skeletonCard} />}>
                    {(s) => {
                        const checks = [
                            { label: 'Face enrollment', value: s.face, icon: ScanFace },
                            { label: 'Identity document', value: s.document, icon: FileText },
                            { label: 'Selfie match', value: s.selfieMatch, icon: UserRoundCheck },
                        ];
                        return (
                            <NeuBox variant="raised" style={styles.card}>
                                <View style={styles.row}>
                                    <Typography variant="h4" style={styles.flex}>
                                        Identity status
                                    </Typography>
                                    <StatusChip status={s.status} />
                                </View>
                                <Divider />
                                {checks.map((c, i) => (
                                    <View key={c.label}>
                                        {i > 0 && <Divider />}
                                        <View style={styles.row}>
                                            <c.icon size={iconSize.md} color={t.colors.actionPrimary} />
                                            <Typography variant="body" style={styles.flex}>
                                                {c.label}
                                            </Typography>
                                            <StatusChip status={c.value} />
                                        </View>
                                    </View>
                                ))}
                            </NeuBox>
                        );
                    }}
                </AsyncBlock>

                {/* ---------- your documents ---------- */}
                <Section>
                    <SectionTitle>Your documents</SectionTitle>
                    <AsyncBlock
                        state={{
                            data: documents.data,
                            isPending: documents.isPending,
                            isError: documents.isError,
                            error: documents.error,
                            refetch: () => void documents.refetch(),
                        }}
                        empty={(docs) => docs.length === 0}
                        emptyTitle="No documents yet"
                        emptyBody="Add a passport, ID card, or license to verify your identity."
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
                                                expiresAt: d.expiresAt ? d.expiresAt.split('T')[0] : null,
                                                matchScore: d.matchScore,
                                                type: d.type,
                                            }}
                                            onPress={() => router.push(`/document/${d.id}` as never)}
                                        />
                                    </FadeUp>
                                ))}
                            </Section>
                        )}
                    </AsyncBlock>
                </Section>

                {/* ---------- issued to you ---------- */}
                <Section>
                    <SectionTitle>Issued to you</SectionTitle>
                    <EmptyState
                        title="No issued credentials"
                        description="Credentials issued at venue check-ins appear here."
                    />
                </Section>
            </ScrollView>
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
    },
    card: { padding: t.spacing[4], gap: t.spacing[3] },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
    skeletonCard: { borderRadius: t.radii.xl },
}));
