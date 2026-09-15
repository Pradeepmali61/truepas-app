/** @jsxImportSource react */
import { ChevronRight } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { FlatList, Pressable, Text, View, type RefreshControlProps, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { EmptyState, ErrorState } from "../composite/states";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

export interface ListItem {
  /** Stable key */
  key: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Left slot — Avatar, icon, thumbnail */
  leading?: ReactNode;
  /** Right slot — Badge, amount text, chevron default */
  trailing?: ReactNode;
  onPress?: () => void;
}

export interface DataListProps {
  items: ListItem[];
  status?: "loading" | "error" | "success";
  loadingSkeletonCount?: number;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  onRetry?: () => void;
  /** Infinite-scroll style: shown at the end when more pages exist */
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  /** Section header/footer slots */
  header?: ReactNode;
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * The mobile analog of DataTable: a tappable card-row list with
 * loading/empty/error states and load-more pagination.
 * Rows take plain data — no backend response assumptions.
 */
export function DataList({
  items,
  status = "success",
  loadingSkeletonCount = 5,
  emptyState,
  errorState,
  onRetry,
  onLoadMore,
  loadingMore,
  hasMore,
  header,
  footer,
  refreshControl,
  style,
  contentContainerStyle,
}: DataListProps) {
  const styles = useStyles();
  const theme = useThemeTokens();

  if (status === "loading") {
    return (
      <View style={[styles.list, style]}>
        {Array.from({ length: loadingSkeletonCount }, (_, i) => (
          <View key={i} style={styles.row}>
            <Skeleton variant="circle" width={40} height={40} />
            <View style={styles.rowText}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </View>
          </View>
        ))}
      </View>
    );
  }
  if (status === "error") {
    return <>{errorState ?? <ErrorState onRetry={onRetry} />}</>;
  }
  if (items.length === 0) {
    return <>{emptyState ?? <EmptyState title="Nothing here yet" description="New items will appear here." />}</>;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.key}
      style={style}
      contentContainerStyle={[styles.list, contentContainerStyle]}
      ListHeaderComponent={header != null ? <>{header}</> : undefined}
      refreshControl={refreshControl}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole={item.onPress ? "button" : "text"}
          disabled={!item.onPress}
          onPress={item.onPress}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          {item.leading}
          <View style={styles.rowText}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {item.subtitle != null && (
              <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
            )}
          </View>
          {item.trailing ??
            (item.onPress ? (
              <ChevronRight size={iconSize.sm} color={theme.colors.textMuted} />
            ) : null)}
        </Pressable>
      )}
      ListFooterComponent={
        <>
          {hasMore && onLoadMore && (
            <View style={styles.loadMore}>
              <Button variant="outline" size="sm" loading={loadingMore} onPress={onLoadMore}>
                Load more
              </Button>
            </View>
          )}
          {footer}
        </>
      }
    />
  );
}

const useStyles = makeStyles((t) => ({
  list: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[4],
    paddingVertical: t.spacing[3],
    minHeight: t.sizes.touchTarget + t.spacing[2],
    backgroundColor: t.colors.surface,
  },
  rowPressed: { backgroundColor: t.colors.actionSecondary },
  rowText: { flex: 1, gap: 2 },
  title: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  subtitle: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  separator: { height: 1, backgroundColor: t.colors.borderSubtle, marginLeft: t.spacing[4] },
  loadMore: { padding: t.spacing[4], alignItems: "center" },
}));
