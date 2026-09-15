import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, Clock3 } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ScreenHeader, Tabs } from '@/components/composite';
import { Badge, Blink, CoreButton, Divider, RowIcon, Skeleton, Typography } from '@/components/ui';
import { useNotifications } from '@/features/notifications/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Notifications inbox — GET /cb/notifications?limit=50&offset=…&unread_only=…
 *  Inbox reads only (no push delivery); "Load more" paginates via offset. */
export default function NotificationsScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [unreadOnly, setUnreadOnly] = useState(filter === 'unread');
  const { data, isPending, isError, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications(unreadOnly);

  const notifications = data?.pages.flat() ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadOnly ? 'Unread' : unread > 0 ? `${unread} unread` : 'Inbox'}
        onBack={() => router.back()}
      />
      <Tabs
        variant="underline"
        value={unreadOnly ? 'unread' : 'all'}
        onValueChange={(v) => setUnreadOnly(v === 'unread')}
        items={[
          { value: 'all', label: 'All', content: null },
          {
            value: 'unread',
            label: 'Unread',
            content: null,
            badge:
              !unreadOnly && unread > 0 ? (
                <Badge variant="info" size="sm">{unread}</Badge>
              ) : undefined,
          },
        ]}
      />
      {isPending ? (
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={64} radius={theme.radii.xl} />)}
        </View>
      ) : isError ? (
        <ErrorState
          title="Couldn't load notifications"
          description="Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: theme.spacing[4],
            paddingBottom: theme.spacing[4] + insets.bottom,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={{ flexDirection: 'row', gap: theme.spacing[3], paddingVertical: theme.spacing[1] }}
              accessibilityRole="button">
              {item.read ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: theme.radii.full,
                    marginTop: theme.spacing[2],
                    backgroundColor: 'transparent',
                  }}
                />
              ) : (
                <Blink ms={1400} min={0.4} style={{ marginTop: theme.spacing[2] }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: theme.radii.full,
                      backgroundColor: theme.colors.actionPrimary,
                    }}
                  />
                </Blink>
              )}
              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Typography
                  variant="body"
                  style={{ fontWeight: item.read ? theme.fontWeight.regular : theme.fontWeight.semibold }}>
                  {item.title}
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  {item.body}
                </Typography>
                <Typography variant="caption" color="muted">
                  {(() => {
                    const d = new Date(item.createdAt);
                    return Number.isNaN(d.getTime())
                      ? ''
                      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  })()}
                </Typography>
              </View>
              <RowIcon
                tone={item.read ? 'neutral' : 'primary'}
                icon={
                  <Bell size={iconSize.sm} color={item.read ? theme.colors.textMuted : theme.colors.actionPrimary} />
                }
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="You're all caught up"
              description="Identity, document and booking updates land here."
              icon={<Clock3 size={iconSize.lg} color={theme.colors.textMuted} />}
            />
          }
          ListFooterComponent={
            notifications.length > 0 ? (
              <View style={{ marginTop: theme.spacing[3], gap: theme.spacing[3] }}>
                <Divider />
                {hasNextPage ? (
                  <CoreButton
                    variant="outline"
                    size="sm"
                    loading={isFetchingNextPage}
                    accessibilityLabel="Load more notifications"
                    onPress={() => fetchNextPage()}
                    style={{ alignSelf: 'center' }}>
                    Load more
                  </CoreButton>
                ) : null}
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
          }
        />
      )}
    </SafeAreaView>
  );
}
