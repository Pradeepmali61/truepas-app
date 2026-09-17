import { useRouter } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppChrome } from '@/components/app/AppChrome';
import { AddDocumentButton, CheckInRow, DocumentRow, EmptyStateCard, FamilyStrip, type FamilyMemberRef } from '@/components/truepas';
import { EmptyState, ErrorState, LoadingState, Typography } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useBookings } from '@/features/history/hooks';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

function formatDate(value: string): string {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
}

/** Home tab — app header + family members strip (design-repo truepas/family.tsx).
 *  The selected person's documents list below; index 0 is self ("You"),
 *  i ≥ 1 maps to family members. */
export default function HomeScreen() {
    const styles = useStyles();
    const t = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAppSelector((state) => state.auth.user);
    const { data: members } = useFamily();
    const [selected, setSelected] = useState(0);

    // No personId = the signed-in user's own documents ("You").
    const selectedMember = selected === 0 ? undefined : members?.[selected - 1];
    const selectedPersonId = selectedMember?.id;
    const { data: documents, isPending, isError, isRefetching, refetch } = useDocuments(selectedPersonId);

    // Possessive labels — "Your documents" for self, "Manju's documents" for members.
    const firstName = selectedMember?.name.split(' ')[0];
    const documentsHeading = selectedMember ? `${firstName}'s documents` : 'Your documents';
    const addDocumentLabel = selectedMember ? `Add ${firstName}'s documents` : 'Add your documents';

    // Previous check-ins are account-level — the bookings projection has no
    // personId scope yet. Upcoming stays out; latest 2 shown.
    const { data: bookings, isPending: bookingsPending, isError: bookingsError } = useBookings();
    const allCheckIns = (bookings ?? []).filter((b) => b.status !== 'upcoming');
    const previousCheckIns = allCheckIns.slice(0, 2);

    // Same add-document flow as family/[id].tsx — family params scope the
    // scan to the selected member; index 0 ("You") adds for the signed-in user.
    const handleAddDocument = () => {
        if (selectedMember) {
            router.push({
                pathname: '/document/select-type',
                params: {
                    family: '1',
                    personId: selectedMember.id,
                    memberName: selectedMember.name,
                    band: selectedMember.ageBand,
                },
            } as never);
        } else {
            router.push('/document/select-type' as never);
        }
    };

    const stripMembers: FamilyMemberRef[] = [
        { name: user?.fullName ?? 'You' },
        ...(members ?? []).map((m) => ({
            name: m.name,
            statusDot: m.verification === 'verified' ? ('success' as const)
                : m.verification === 'failed' ? ('error' as const)
                : ('warning' as const),
        })),
    ];

    const scrollBottom = TAB_BAR_HEIGHT + insets.bottom + t.spacing[4];

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']}>
                <AppChrome />
            </SafeAreaView>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.body, { paddingBottom: scrollBottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.actionPrimary} />
                }>
                <FamilyStrip
                    members={stripMembers}
                    selectedIndex={selected}
                    onSelect={setSelected}
                    onAdd={() => router.push('/family/add' as never)}
                    style={styles.strip}
                />
                <View style={styles.sectionHead}>
                    <Typography variant="label" color="muted">{documentsHeading}</Typography>
                    {(selectedMember != null || (documents?.length ?? 0) > 2) && (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={selectedMember ? `View ${firstName}'s details` : 'See all documents'}
                            onPress={() =>
                                router.push(
                                    (selectedMember ? `/family/${selectedMember.id}` : '/(tabs)/documents') as never,
                                )
                            }
                            style={({ pressed }) => pressed && { opacity: 0.6 }}>
                            <Typography variant="body-sm" style={{ color: t.colors.actionPrimary }}>
                                {selectedMember ? `${firstName}'s details` : 'See all'}
                            </Typography>
                        </Pressable>
                    )}
                </View>
                {isPending ? (
                    <LoadingState label="Loading documents…" />
                ) : isError ? (
                    <ErrorState
                        title="Couldn't load documents"
                        message="Please check your connection and try again."
                        onRetry={refetch}
                    />
                ) : !documents?.length ? (
                    <EmptyState
                        title="No documents yet"
                        description="Documents for this member will appear here."
                    />
                ) : (
                    documents.slice(0, 2).map((doc) => (
                        <DocumentRow
                            key={doc.id}
                            doc={{
                                label: doc.label,
                                number: doc.number,
                                status: doc.status,
                                expiresAt: doc.expiresAt ? doc.expiresAt.split('T')[0] : null,
                                matchScore: doc.matchScore,
                                type: doc.type,
                            }}
                            onPress={() => router.push(`/document/${doc.id}` as never)}
                            style={styles.docRow}
                        />
                    ))
                )}
                {!isPending && !isError && (
                    <AddDocumentButton onPress={handleAddDocument} label={addDocumentLabel} style={styles.docRow} />
                )}
                {!bookingsPending && !bookingsError && (
                    <View style={styles.checkInSection}>
                        <View style={styles.sectionHead}>
                            <Typography variant="label" color="muted">Previous check-ins</Typography>
                            {allCheckIns.length > 2 && (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="See all check-ins"
                                    onPress={() => router.push('/(tabs)/history' as never)}
                                    style={({ pressed }) => pressed && { opacity: 0.6 }}>
                                    <Typography variant="body-sm" style={{ color: t.colors.actionPrimary }}>
                                        See all
                                    </Typography>
                                </Pressable>
                            )}
                        </View>
                        {previousCheckIns.length > 0 ? (
                            previousCheckIns.map((b) => (
                                <CheckInRow
                                    key={b.id}
                                    booking={{
                                        venue: b.venue,
                                        location: b.location,
                                        type: b.type,
                                        status: b.status,
                                        checkIn: formatDate(b.checkIn),
                                    }}
                                    onPress={() => router.push(`/booking/${b.id}` as never)}
                                    style={styles.docRow}
                                />
                            ))
                        ) : (
                            <EmptyStateCard
                                title="No check-ins yet"
                                description="When you check in at a venue with Truepas, it shows up here."
                                icon={<Ticket size={iconSize.xl} color={t.colors.actionPrimary} />}
                                style={styles.emptyCard}
                            />
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const useStyles = makeStyles((t) => ({
    screen: { flex: 1, backgroundColor: t.colors.surface },
    flex: { flex: 1 },
    body: {
        paddingHorizontal: t.spacing[5],
        paddingTop: t.spacing[2],
        gap: t.spacing[4],
    },
    strip: { width: '100%' },
    docRow: { width: '100%' },
    checkInSection: { width: '100%', gap: t.spacing[3] },
    // Full-width empty card, taller than a row so the section reads as a
    // real block next to the document list.
    emptyCard: { width: '100%', paddingVertical: t.spacing[8] },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: t.spacing[1],
    },
}));
