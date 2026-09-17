import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CircleHelp, Clock, FileText, Home, ScanFace, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
    AppHeader,
    NavigationDrawer,
    NotificationCenter,
    UserMenu,
    type AppNotification,
    type NavSection,
} from '@/components/complex';
import { useLogout } from '@/features/auth/mutations';
import { sessionEnded } from '@/features/auth/slice';
import { useNotifications } from '@/features/notifications/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { useToast } from '@/hooks/useToast';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';
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

/** Home chrome — repo AppHeader composition (design-repo ChromeSection):
 *  hamburger → navigation drawer, brand lockup, bell with unread badge,
 *  account avatar chip. */
export function AppChrome() {
    const theme = useThemeTokens();
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const user = useAppSelector((state) => state.auth.user);
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const toast = useToast();
    const logout = useLogout();
    const { url: avatarUri } = useProfilePicture();
    const { data: notifData, isPending: notifLoading } = useNotifications();

    const notifications = (notifData?.pages.flat() ?? []).map((n) =>
        toAppNotification(n, () => router.push('/notification' as never)),
    );

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

    const drawerSections: NavSection[] = [
        {
            items: [
                { key: 'home', label: 'Home', icon: <Home size={iconSize.sm} color={theme.colors.textSecondary} />, active: true },
                {
                    key: 'docs',
                    label: 'Documents',
                    icon: <FileText size={iconSize.sm} color={theme.colors.textSecondary} />,
                    onPress: () => router.push('/(tabs)/documents' as never),
                },
                {
                    key: 'family',
                    label: 'Family',
                    icon: <Users size={iconSize.sm} color={theme.colors.textSecondary} />,
                    onPress: () => router.push('/(tabs)/family' as never),
                },
                {
                    key: 'history',
                    label: 'History',
                    icon: <Clock size={iconSize.sm} color={theme.colors.textSecondary} />,
                    onPress: () => router.push('/(tabs)/history' as never),
                },
                {
                    key: 'help',
                    label: 'Help & FAQ',
                    icon: <CircleHelp size={iconSize.sm} color={theme.colors.textSecondary} />,
                    onPress: () => router.push('/help' as never),
                },
            ],
        },
    ];

    return (
        <>
            <AppHeader
                onMenuPress={() => setDrawerOpen(true)}
                left={<ScanFace size={iconSize.lg} color={theme.colors.actionPrimary} />}
                title="Truepas"
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
                visible={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                header={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                        <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />
                        <Text style={{ fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary }}>
                            Truepas
                        </Text>
                    </View>
                }
                sections={drawerSections}
            />
        </>
    );
}
