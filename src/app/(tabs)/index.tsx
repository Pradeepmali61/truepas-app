/** @jsxImportSource react */
/**
 * HomeScreen — dashboard tab. Ported 1:1 from UI-design-repo
 * `screens/main/HomeScreen.tsx`: brand header (logo + bell + avatar that
 * opens the profile drawer), next check-in hero, family-members card,
 * document wallet preview, and previous check-ins.
 *
 * Data comes from the real hooks (useFamily / useDocuments / useBookings /
 * useNotifications) in place of the design's useApiData store.
 */
import { useRouter } from 'expo-router';
import { Bell, CalendarDays, Plus, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TruepasIcon } from '@/components/app/TruepasIcon';
import { AsyncBlock, EmptyState, ProfileDrawer, Section, SectionTitle, SkeletonRows } from '@/components/composite';
import { BookingCard, DocumentRow, NextCheckinCard } from '@/components/truepas';
import { Avatar, FadeUp, Link, NeuBox, Skeleton, SoftIconButton, Typography } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useBookings } from '@/features/history/hooks';
import { useNotifications } from '@/features/notifications/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Height of the custom bottom tab bar (see (tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = 88;

export default function HomeScreen() {
    const styles = useStyles();
    const t = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAppSelector((state) => state.auth.user);
    const { url: avatarUri } = useProfilePicture();
    const [drawer, setDrawer] = useState(false);

    const family = useFamily();
    const documents = useDocuments();
    const bookings = useBookings();
    const unread = useNotifications(true);

    const hasUnread = (unread.data?.pages.flat() ?? []).length > 0;
    const past = bookings.data?.filter((b) => b.status !== 'upcoming') ?? [];
    const upcoming = bookings.data?.filter((b) => b.status === 'upcoming') ?? [];
    const nextUpcoming = upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
    const hasDocs = (documents.data?.length ?? 0) > 0;

    const refreshing =
        family.isRefetching || documents.isRefetching || bookings.isRefetching || unread.isRefetching;
    const onRefresh = () => {
        void family.refetch();
        void documents.refetch();
        void bookings.refetch();
        void unread.refetch();
    };

    const scrollBottom = TAB_BAR_HEIGHT + insets.bottom + t.spacing[4];

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.flex}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={[styles.body, { paddingBottom: scrollBottom }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.actionPrimary} />
                    }>
                    {/* ---------- header: brand + bell + avatar ---------- */}
                    <View style={styles.header}>
                        <View style={styles.brand}>
                            <TruepasIcon size={iconSize.lg} />
                            <Typography variant="h4">Truepas</Typography>
                        </View>
                        <View style={styles.headerActions}>
                            <View>
                                <SoftIconButton
                                    icon={Bell}
                                    accessibilityLabel="Notifications"
                                    onPress={() => router.push('/notification' as never)}
                                />
                                {hasUnread && <View pointerEvents="none" style={styles.unreadDot} />}
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Profile"
                                onPress={() => setDrawer(true)}
                                style={({ pressed }) => pressed && styles.pressed}>
                                <Avatar name={user?.fullName} uri={avatarUri ?? undefined} size="md" />
                            </Pressable>
                        </View>
                    </View>

                    {/* ---------- next check-in hero ---------- */}
                    {nextUpcoming != null && (
                        <FadeUp>
                            <NextCheckinCard
                                booking={{
                                    venue: nextUpcoming.venue,
                                    location: nextUpcoming.location,
                                    status: nextUpcoming.status,
                                    checkIn: nextUpcoming.checkIn,
                                    guests: nextUpcoming.guests,
                                    amount: nextUpcoming.amount,
                                    checkedInMembers: nextUpcoming.checkedInMembers ?? [],
                                    image: nextUpcoming.image,
                                }}
                                onPress={() => router.push(`/booking/${nextUpcoming.id}` as never)}
                            />
                        </FadeUp>
                    )}

                    {/* ---------- family members card ---------- */}
                    <FadeUp>
                        <NeuBox variant="raised" style={styles.card}>
                            <View style={styles.cardHead}>
                                <Text style={styles.cardLabel}>family members</Text>
                                <Link accessibilityLabel="See all family members" onPress={() => router.push('/family' as never)}>
                                    See all
                                </Link>
                            </View>
                            <AsyncBlock
                                state={{
                                    data: family.data,
                                    isPending: family.isPending,
                                    isError: family.isError,
                                    error: family.error,
                                    refetch: () => void family.refetch(),
                                }}
                                skeleton={
                                    <View style={styles.strip}>
                                        {[0, 1, 2, 3].map((i) => (
                                            <View key={i} style={styles.stripCell}>
                                                <Skeleton variant="circle" width={56} height={56} />
                                                <Skeleton variant="text" width={40} />
                                            </View>
                                        ))}
                                    </View>
                                }>
                                {(members) => (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.strip}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Add family member"
                                            onPress={() => router.push('/family/add' as never)}
                                            style={({ pressed }) => [styles.stripCell, pressed && styles.pressed]}>
                                            <View style={styles.stripAdd}>
                                                <UserPlus size={iconSize.md} color={t.colors.actionPrimary} />
                                            </View>
                                            <Text style={styles.stripName}>Add</Text>
                                        </Pressable>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Your profile"
                                            onPress={() => setDrawer(true)}
                                            style={({ pressed }) => [styles.stripCell, pressed && styles.pressed]}>
                                            <View>
                                                <Avatar name={user?.fullName} uri={avatarUri ?? undefined} size="lg" />
                                                <View
                                                    style={[
                                                        styles.faceDot,
                                                        { backgroundColor: user?.faceEnrolled ? t.colors.success : t.colors.warning },
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.stripName}>You</Text>
                                        </Pressable>
                                        {members.map((m) => (
                                            <Pressable
                                                key={m.id}
                                                accessibilityRole="button"
                                                accessibilityLabel={m.name}
                                                onPress={() => router.push(`/family/${m.id}` as never)}
                                                style={({ pressed }) => [styles.stripCell, pressed && styles.pressed]}>
                                                <View>
                                                    <Avatar name={m.name} size="lg" tinted />
                                                    <View
                                                        style={[
                                                            styles.faceDot,
                                                            { backgroundColor: m.faceEnrolled ? t.colors.success : t.colors.warning },
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={styles.stripName} numberOfLines={1}>
                                                    {m.name.split(' ')[0]}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                )}
                            </AsyncBlock>
                        </NeuBox>
                    </FadeUp>

                    {/* ---------- your documents ---------- */}
                    <FadeUp delay={90}>
                        <Section>
                            <SectionTitle
                                action={
                                    <Link accessibilityLabel="See all documents" onPress={() => router.push('/(tabs)/documents' as never)}>
                                        See all
                                    </Link>
                                }>
                                Your documents
                            </SectionTitle>
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
                            {!hasDocs && documents.data != null && (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Add your documents"
                                    onPress={() => router.push('/document/select-type' as never)}
                                    style={({ pressed }) => pressed && styles.pressed}>
                                    <NeuBox variant="raised" depth={4} style={styles.addRow}>
                                        <Plus size={iconSize.md} color={t.colors.actionPrimary} />
                                        <Text style={styles.addRowText}>Add your documents</Text>
                                    </NeuBox>
                                </Pressable>
                            )}
                        </Section>
                    </FadeUp>

                    {/* ---------- previous check-ins ---------- */}
                    <FadeUp delay={170}>
                        <Section>
                            <SectionTitle
                                action={
                                    <Link accessibilityLabel="See all check-ins" onPress={() => router.push('/(tabs)/history' as never)}>
                                        See all
                                    </Link>
                                }>
                                Previous check-ins
                            </SectionTitle>
                            <AsyncBlock
                                state={{
                                    data: bookings.data,
                                    isPending: bookings.isPending,
                                    isError: bookings.isError,
                                    error: bookings.error,
                                    refetch: () => void bookings.refetch(),
                                }}
                                skeleton={<SkeletonRows />}>
                                {() =>
                                    past.length === 0 ? (
                                        <EmptyState
                                            compact
                                            title="No check-ins yet"
                                            description="When you check in at a venue with Truepas, it shows up here."
                                            icon={<CalendarDays size={iconSize.lg} color={t.colors.textMuted} />}
                                        />
                                    ) : (
                                        <Section>
                                            {past.map((b, i) => (
                                                <FadeUp key={b.id} delay={Math.min(i, 8) * 60}>
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`${b.venue}, ${b.location}`}
                                                        onPress={() => router.push(`/booking/${b.id}` as never)}
                                                        style={({ pressed }) => pressed && styles.pressed}>
                                                        <BookingCard
                                                            booking={{
                                                                venue: b.venue,
                                                                location: b.location,
                                                                status: b.status,
                                                                checkIn: b.checkIn,
                                                                guests: b.guests,
                                                                amount: b.amount,
                                                                checkedInMembers: b.checkedInMembers ?? [],
                                                                image: b.image,
                                                            }}
                                                        />
                                                    </Pressable>
                                                </FadeUp>
                                            ))}
                                        </Section>
                                    )
                                }
                            </AsyncBlock>
                        </Section>
                    </FadeUp>
                </ScrollView>
            </SafeAreaView>

            <ProfileDrawer visible={drawer} onClose={() => setDrawer(false)} />
        </View>
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
    pressed: { opacity: t.opacity.pressed },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
    unreadDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 10,
        height: 10,
        borderRadius: t.radii.full,
        backgroundColor: t.colors.actionPrimary,
        borderWidth: 2,
        borderColor: t.colors.background,
    },
    card: { padding: t.spacing[4], gap: t.spacing[3] },
    cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLabel: { fontSize: t.fontSize.sm, color: t.colors.textMuted },
    strip: { flexDirection: 'row', gap: t.spacing[4], paddingRight: t.spacing[4] },
    stripCell: { alignItems: 'center', gap: t.spacing[1.5], width: 56 },
    stripName: { fontSize: t.fontSize.xs, color: t.colors.textSecondary },
    stripAdd: {
        width: 48,
        height: 48,
        borderRadius: t.radii.full,
        borderWidth: t.sizes.fieldBorderWidth,
        borderStyle: 'dashed',
        borderColor: t.colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    faceDot: {
        position: 'absolute',
        right: -1,
        bottom: -1,
        width: 12,
        height: 12,
        borderRadius: t.radii.full,
        borderWidth: 2,
        borderColor: t.colors.background,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.spacing[2],
        paddingVertical: t.spacing[3],
    },
    addRowText: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.actionPrimary },
}));
