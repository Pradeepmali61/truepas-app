/**
 * FamilyScreen — pushed route (Home → See all). FamilyCard per member;
 * empty state pushes the add-member flow.
 * Ported 1:1 from UI-design-repo `src/app/screens/main/FamilyScreen.tsx`.
 */
import { useRouter } from 'expo-router';
import { Plus, UserPlus, Users } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncBlock, ScreenHeader, Section, SkeletonRows } from '@/components/composite';
import { EmptyState } from '@/components/composite/states';
import { FamilyCard } from '@/components/truepas';
import { FadeUp, NeuBox, SoftIconButton } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/features/family/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

export default function FamilyScreen() {
    const styles = useStyles();
    const t = useThemeTokens();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const members = useFamily();

    return (
        <SafeAreaView edges={['top']} style={styles.screen}>
            <ScreenHeader
                title="Family"
                onBack={() => router.back()}
                actions={
                    <SoftIconButton
                        icon={Plus}
                        size={44}
                        accessibilityLabel="Add family member"
                        onPress={() => router.push('/family/add' as never)}
                    />
                }
            />
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[styles.body, { paddingBottom: t.spacing[8] + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={members.isRefetching}
                        onRefresh={() => void members.refetch()}
                        tintColor={t.colors.actionPrimary}
                    />
                }>
                <AsyncBlock
                    state={{
                        data: members.data,
                        isPending: members.isPending,
                        isError: members.isError,
                        error: members.error,
                        refetch: () => void members.refetch(),
                    }}
                    skeleton={<SkeletonRows />}>
                    {(list) =>
                        list.length === 0 ? (
                            <EmptyState
                                title="No family members"
                                description="Add family to check them in with you at venues."
                                icon={<Users size={iconSize.lg} color={t.colors.textMuted} />}
                                action={
                                    <Button
                                        iconLeft={<UserPlus size={iconSize.sm} color={t.colors.onActionPrimary} />}
                                        onPress={() => router.push('/family/add' as never)}>
                                        Add your first member
                                    </Button>
                                }
                            />
                        ) : (
                            <Section>
                                {list.map((m, i) => (
                                    <FadeUp key={m.id} delay={Math.min(i, 8) * 60}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={m.name}
                                            onPress={() => router.push(`/family/${m.id}` as never)}
                                            style={({ pressed }) => pressed && styles.pressed}>
                                            <FamilyCard
                                                member={{
                                                    name: m.name,
                                                    relationship: m.relationship,
                                                    age: m.age,
                                                    ageBand: m.ageBand,
                                                    verification: m.verification,
                                                    faceCaptureMode: m.faceCaptureMode,
                                                    allowedCameras: m.allowedCameras,
                                                }}
                                            />
                                        </Pressable>
                                    </FadeUp>
                                ))}
                                <FadeUp delay={Math.min(list.length, 8) * 60}>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Add family member"
                                        onPress={() => router.push('/family/add' as never)}
                                        style={({ pressed }) => pressed && styles.pressed}>
                                        <NeuBox variant="raised" depth={3} style={styles.addRow}>
                                            <UserPlus size={iconSize.md} color={t.colors.actionPrimary} />
                                            <Text style={styles.addRowText}>Add family member</Text>
                                        </NeuBox>
                                    </Pressable>
                                </FadeUp>
                            </Section>
                        )
                    }
                </AsyncBlock>
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
        flexGrow: 1,
    },
    pressed: { opacity: t.opacity.pressed },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.spacing[2],
        paddingVertical: t.spacing[3],
    },
    addRowText: {
        fontSize: t.fontSize.base,
        fontWeight: t.fontWeight.medium,
        color: t.colors.actionPrimary,
    },
}));
