/**
 * NotificationsScreen — inbox pushed over the tabs. Read state is local
 * only (the contract exposes no mark-read endpoint).
 */
import { useRouter } from 'expo-router';
import {
    Bell,
    CalendarClock,
    CircleUserRound,
    FileText,
    ScanFace,
    Users,
    type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncBlock, ScreenHeader, Section, SectionTitle, SkeletonRows } from '@/components/composite';
import { Divider, NeuBox } from '@/components/ui';
import { useNotifications } from '@/features/notifications/hooks';
import { makeStyles, useThemeTokens } from '@/theme';
import type { Notification } from '@/types/domain';

const TYPE_ICON: Record<string, LucideIcon> = {
  identity: ScanFace,
  document: FileText,
  account: CircleUserRound,
  booking: CalendarClock,
  family: Users,
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relTime(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isPending, isError, error, isRefetching, refetch } = useNotifications();
  const list = data ? data.pages.flat() : undefined;
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});

  const isUnread = (n: Notification) => !n.read && !readIds[n.id];
  const markRead = (id: string) => setReadIds((s) => ({ ...s, [id]: true }));
  const markAll = () =>
    setReadIds((s) => {
      const next = { ...s };
      for (const n of list ?? []) next[n.id] = true;
      return next;
    });
  const unreadCount = (list ?? []).filter(isUnread).length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.back()}
        actions={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all read"
            accessibilityState={{ disabled: unreadCount === 0 }}
            disabled={unreadCount === 0}
            onPress={markAll}
            style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
          >
            <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllDisabled]}>
              Mark all read
            </Text>
          </Pressable>
        }
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={t.colors.actionPrimary}
            colors={[t.colors.actionPrimary]}
          />
        }
        contentContainerStyle={{
          padding: t.spacing[4],
          gap: t.spacing[6],
          paddingBottom: t.spacing[8] + insets.bottom,
        }}
      >
        <AsyncBlock
          state={{ data: list, isPending, isError, error, refetch }}
          empty={(l) => l.length === 0}
          emptyTitle="You're all caught up"
          emptyBody="Identity, document, and booking updates land here."
          skeleton={<SkeletonRows rows={4} />}
        >
          {(items) => {
            const groups: { label: string; items: Notification[] }[] = [];
            for (const n of items) {
              const label = dayLabel(n.createdAt);
              const group = groups.find((g) => g.label === label);
              if (group) group.items.push(n);
              else groups.push({ label, items: [n] });
            }
            return groups.map((g) => (
              <Section key={g.label}>
                <SectionTitle>{g.label}</SectionTitle>
                <NeuBox variant="raised" style={styles.groupCard}>
                  {g.items.map((n, i) => {
                    const unread = isUnread(n);
                    const Icon = TYPE_ICON[n.type ?? ''] ?? Bell;
                    return (
                      <View key={n.id}>
                        {i > 0 && <Divider />}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={n.title}
                          onPress={() => markRead(n.id)}
                          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                        >
                          <View style={[styles.iconSq, unread && styles.iconSqUnread]}>
                            <Icon
                              size={t.iconSize.md}
                              color={unread ? t.colors.actionPrimary : t.colors.textSecondary}
                            />
                          </View>
                          <View style={styles.flex}>
                            <Text
                              style={[styles.title, unread && styles.titleUnread]}
                              numberOfLines={1}
                            >
                              {n.title}
                            </Text>
                            <Text style={styles.body} numberOfLines={2}>
                              {n.body}
                            </Text>
                            <Text style={styles.time}>{relTime(n.createdAt)}</Text>
                          </View>
                          {unread && <View style={styles.dot} />}
                        </Pressable>
                      </View>
                    );
                  })}
                </NeuBox>
              </Section>
            ));
          }}
        </AsyncBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  pressed: { opacity: t.opacity.pressed },
  markAll: {
    minHeight: t.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: t.spacing[1],
  },
  markAllText: { fontSize: t.fontSize.base, color: t.colors.textLink },
  markAllDisabled: { color: t.colors.textDisabled },
  groupCard: { paddingHorizontal: t.spacing[3], paddingVertical: t.spacing[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing[3],
    paddingVertical: t.spacing[3],
    minHeight: t.sizes.touchTarget,
  },
  iconSq: {
    width: 40,
    height: 40,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSqUnread: { backgroundColor: t.colors.actionPrimarySubtle },
  title: { fontSize: t.fontSize.base, color: t.colors.textPrimary },
  titleUnread: { fontWeight: t.fontWeight.semibold },
  body: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  time: { fontSize: t.fontSize.xs, color: t.colors.textMuted, marginTop: t.spacing[0.5] },
  dot: {
    width: 8,
    height: 8,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
    marginTop: t.spacing[1.5],
  },
}));
