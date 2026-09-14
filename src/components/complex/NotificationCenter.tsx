import { useState, type ReactNode } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Bell, CheckCheck } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { IconButton } from "../ui/IconButton";
import { Skeleton } from "../ui/Skeleton";
import { BottomSheet } from "../composite/BottomSheet";
import { EmptyState } from "../composite/states";

export interface AppNotification {
  key: string;
  actor?: { name: string; uri?: string };
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  read?: boolean;
  onPress?: () => void;
}

export interface NotificationCenterProps {
  notifications: AppNotification[];
  loading?: boolean;
  onMarkAllRead?: () => void;
  /** Replaces the default bell trigger */
  trigger?: ReactNode;
}

/** Bell trigger w/ unread badge → bottom-sheet notification list. */
export function NotificationCenter({ notifications, loading, onMarkAllRead, trigger }: NotificationCenterProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      {trigger ? (
        <Pressable onPress={() => setOpen(true)} accessibilityLabel="Notifications">
          {trigger}
        </Pressable>
      ) : (
        <View>
          <IconButton
            accessibilityLabel={unread ? `Notifications, ${unread} unread` : "Notifications"}
            icon={<Bell size={iconSize.md} color={theme.colors.textPrimary} />}
            onPress={() => setOpen(true)}
          />
          {unread > 0 && (
            <View style={styles.badge} pointerEvents="none">
              <Badge variant="error" appearance="solid" size="sm">
                {unread > 9 ? "9+" : unread}
              </Badge>
            </View>
          )}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Notifications" maxHeightRatio={0.85}>
        {unread > 0 && onMarkAllRead && (
          <Pressable
            accessibilityRole="button"
            onPress={onMarkAllRead}
            style={({ pressed }) => [styles.markAll, pressed && styles.rowPressed]}
          >
            <CheckCheck size={iconSize.sm} color={theme.colors.actionPrimary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
        {loading ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={styles.row}>
              <Skeleton variant="circle" width={36} height={36} />
              <View style={styles.rowBody}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
              </View>
            </View>
          ))
        ) : notifications.length === 0 ? (
          <EmptyState compact title="All caught up" description="No notifications." />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(n) => n.key}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: false }}
                accessibilityLabel={`${item.read ? "" : "Unread, "}${item.title}`}
                onPress={item.onPress}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed, !item.read && styles.rowUnread]}
              >
                {item.actor ? (
                  <Avatar name={item.actor.name} uri={item.actor.uri} size="sm" />
                ) : (
                  <View style={styles.iconWrap}>{item.icon}</View>
                )}
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                  {item.description != null && (
                    <Text style={styles.rowDesc} numberOfLines={2}>{item.description}</Text>
                  )}
                  {item.timestamp != null && <Text style={styles.rowTime}>{item.timestamp}</Text>}
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </Pressable>
            )}
          />
        )}
      </BottomSheet>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  badge: { position: "absolute", top: -2, right: -2 },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    paddingVertical: t.spacing[2],
    paddingHorizontal: t.spacing[2],
    alignSelf: "flex-end",
    borderRadius: t.radii.md,
  },
  markAllText: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium, color: t.colors.actionPrimary },
  list: { flexGrow: 0 },
  row: {
    flexDirection: "row",
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[2],
    paddingVertical: t.spacing[3],
    borderRadius: t.radii.md,
    minHeight: t.sizes.touchTarget,
  },
  rowPressed: { backgroundColor: t.colors.actionSecondary },
  rowUnread: { backgroundColor: t.colors.actionPrimarySubtle },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  rowDesc: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  rowTime: { fontSize: t.fontSize.xs, color: t.colors.textMuted, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
    alignSelf: "center",
  },
}));
