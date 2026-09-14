import type { ReactNode } from "react";
import { ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";
import { Avatar } from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../composite/states";

export interface FeedEvent {
  key: string;
  /** Either an actor (renders Avatar) or a custom icon */
  actor?: { name: string; uri?: string };
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  onPress?: () => void;
}

export interface ActivityFeedProps {
  events: FeedEvent[];
  loading?: boolean;
  emptyState?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ActivityFeed({ events, loading, emptyState, style }: ActivityFeedProps) {
  const styles = useStyles();

  if (loading) {
    return (
      <View style={[styles.feed, style]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.event}>
            <Skeleton variant="circle" width={32} height={32} />
            <View style={styles.eventBody}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="45%" />
            </View>
          </View>
        ))}
      </View>
    );
  }
  if (events.length === 0) {
    return <>{emptyState ?? <EmptyState compact title="No activity yet" />}</>;
  }

  return (
    <ScrollView style={style} contentContainerStyle={styles.feed}>
      {events.map((e, i) => (
        <View key={e.key} style={styles.event}>
          <View style={styles.rail}>
            {e.actor ? (
              <Avatar name={e.actor.name} uri={e.actor.uri} size="sm" />
            ) : e.icon ? (
              <View style={styles.iconWrap}>{e.icon}</View>
            ) : null}
            {i < events.length - 1 && <View style={styles.connector} />}
          </View>
          <View style={styles.eventBody}>
            <Text style={styles.title}>{e.title}</Text>
            {e.description != null && <Text style={styles.description}>{e.description}</Text>}
            {e.timestamp != null && <Text style={styles.timestamp}>{e.timestamp}</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  feed: { gap: 0 },
  event: { flexDirection: "row", gap: t.spacing[3] },
  rail: { alignItems: "center", width: 32 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: { flex: 1, width: 1, backgroundColor: t.colors.borderSubtle, marginVertical: 2 },
  eventBody: { flex: 1, paddingBottom: t.spacing[5], gap: 2 },
  title: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  timestamp: { fontSize: t.fontSize.xs, color: t.colors.textMuted, marginTop: t.spacing[1] },
}));
