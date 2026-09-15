import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Calendar, CircleHelp, FileText, Home, ScanFace, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/complex/AppHeader';
import { NavigationDrawer } from '@/components/complex/NavigationDrawer';
import { NotificationCenter, type AppNotification } from '@/components/complex/NotificationCenter';
import { UserMenu } from '@/components/complex/UserMenu';
import { Badge } from '@/components/ui/Badge';
import { useLogout } from '@/features/auth/mutations';
import { sessionEnded } from '@/features/auth/slice';
import { useBookings } from '@/features/history/hooks';
import { useNotifications } from '@/features/notifications/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { useToast } from '@/hooks/useToast';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { Notification } from '@/types/domain';

function toAppNotification(n: Notification, onPress: () => void): AppNotification {
    const d = new Date(n.createdAt);
    return {
        key: n.id,
        title: n.title,
        description: n.body,
        timestamp: Number.isNaN(d.getTime())
            ? ''
            : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        read: n.read,
        onPress,
    };
}

/** App chrome for the home screen — brand header (menu/bell/avatar) + navigation drawer. */
export function AppChrome() {
    const styles = useStyles();
    const theme = useThemeTokens();
    const router = useRouter();
    const [drawer, setDrawer] = useState(false);

    const user = useAppSelector((state) => state.auth.user);
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const toast = useToast();
    const logout = useLogout();
    const { url: avatarUri } = useProfilePicture();
    const { data: notifData, isPending: notifLoading } = useNotifications();
    const { data: bookings } = useBookings();

    const notifications = (notifData?.pages.flat() ?? []).map((n) =>
        toAppNotification(n, () => router.push('/notification' as never)),
    );
    const upcomingCount = bookings?.filter((b) => b.status === 'upcoming').length ?? 0;
    const muted = theme.colors.textSecondary;

    // No mark-read endpoint on the BFF — update the inbox cache locally.
    const markAllRead = () => {
        queryClient.setQueriesData<InfiniteData<Notification[]>>({ queryKey: ['notifications'] }, (data) =>
            data
                ? { ...data, pages: data.pages.map((page) => page.map((n) => ({ ...n, read: true }))) }
                : data,
        );
    };

    const handleLogout = async () => {
        try {
            const refreshToken = await secureStorage.getRefreshToken();
            if (refreshToken) {
                await logout.mutateAsync({ refreshToken });
            }
        } catch {
            // Best-effort — clear local state regardless
        }
        queryClient.clear();
        dispatch(sessionEnded());
        router.dismissTo('/(auth)/login' as never);
        toast.show('success', 'Logged out successfully');
    };

    return (
        <>
            <AppHeader
                onMenuPress={() => setDrawer(true)}
                left={<ScanFace size={iconSize.lg} color={theme.colors.actionPrimary} />}
                title="Truepas"
                subtitle="Koramangala"
                actions={
                    <>
                        <NotificationCenter
                            notifications={notifications}
                            loading={notifLoading}
                            onMarkAllRead={markAllRead}
                        />
                        <UserMenu
                            name={user?.fullName ?? 'User'}
                            email={user?.email}
                            avatarUri={avatarUri ?? undefined}
                            onProfile={() => router.push('/profile' as never)}
                            onSettings={() => router.push('/settings' as never)}
                            onLogout={handleLogout}
                        />
                    </>
                }
            />
            <NavigationDrawer
                visible={drawer}
                onClose={() => setDrawer(false)}
                header={
                    <View style={styles.drawerBrand}>
                        <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />
                        <Text style={styles.drawerBrandText}>Truepas</Text>
                    </View>
                }
                sections={[
                    {
                        items: [
                            {
                                key: 'home',
                                label: 'Home',
                                icon: <Home size={iconSize.sm} color={muted} />,
                                active: true,
                            },
                            {
                                key: 'book',
                                label: 'Bookings',
                                icon: <Calendar size={iconSize.sm} color={muted} />,
                                badge:
                                    upcomingCount > 0 ? (
                                        <Badge size="sm" variant="primary">
                                            {upcomingCount}
                                        </Badge>
                                    ) : undefined,
                                onPress: () => router.push('/history' as never),
                            },
                        ],
                    },
                    {
                        heading: 'Identity',
                        items: [
                            {
                                key: 'docs',
                                label: 'Documents',
                                icon: <FileText size={iconSize.sm} color={muted} />,
                                onPress: () => router.push('/documents' as never),
                            },
                            {
                                key: 'family',
                                label: 'Family',
                                icon: <Users size={iconSize.sm} color={muted} />,
                                onPress: () => router.push('/family' as never),
                            },
                        ],
                    },
                    {
                        heading: 'Support',
                        items: [
                            {
                                key: 'help',
                                label: 'Help & FAQ',
                                icon: <CircleHelp size={iconSize.sm} color={muted} />,
                                onPress: () => router.push('/help' as never),
                            },
                        ],
                    },
                ]}
            />
        </>
    );
}

const useStyles = makeStyles((t) => ({
    drawerBrand: { flexDirection: 'row', gap: t.spacing[2], alignItems: 'center' },
    drawerBrandText: {
        fontFamily: t.fontFamily.sans.semibold,
        fontWeight: '600',
        color: t.colors.textPrimary,
    },
}));
