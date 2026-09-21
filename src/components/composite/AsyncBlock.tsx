/**
 * AsyncBlock — wraps a React Query result and renders loading / error /
 * empty states. Mirrors the design-repo chrome.tsx AsyncBlock (which wraps
 * its useApiData store) — adapted to the `useQuery`/`useInfiniteQuery`
 * result shape used by `@/features` hooks.
 *
 * SkeletonRows — standard list loading placeholder; pass to AsyncBlock's
 * `skeleton`.
 */
import type { ReactNode } from "react";
import { View } from "react-native";
import { makeStyles } from "../../theme";
import { NeuBox } from "../ui/NeuBox";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState, ErrorState, LoadingState } from "./states";

/** Minimal structural shape — any React Query result satisfies this. */
export interface AsyncQueryState<T> {
  data: T | null | undefined;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => void;
}

export function AsyncBlock<T>({
  state,
  empty,
  emptyTitle,
  emptyBody,
  skeleton,
  children,
}: {
  state: AsyncQueryState<T>;
  /** Predicate: data present but empty (e.g. []). */
  empty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyBody?: string;
  /** Loading placeholder (e.g. <SkeletonRows/>) — replaces the spinner. */
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  /* Keep content visible while refreshing — pull-to-refresh spins at the top. */
  if (state.isPending && state.data == null) {
    return skeleton != null ? <>{skeleton}</> : <LoadingState label="Loading…" />;
  }
  if (state.isError) {
    return (
      <ErrorState
        title="Couldn't load"
        description={state.error instanceof Error ? state.error.message : undefined}
        onRetry={state.refetch}
      />
    );
  }
  if (state.data != null && empty?.(state.data)) {
    return <EmptyState title={emptyTitle ?? "Nothing here yet"} description={emptyBody} />;
  }
  if (state.data == null) return <EmptyState title="Nothing here yet" />;
  return <>{children(state.data)}</>;
}

/** Standard list loading placeholder — pass to AsyncBlock's `skeleton`. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: rows }, (_, i) => (
        <NeuBox key={i} variant="raised" depth={3} style={styles.tile}>
          <Skeleton variant="circle" width={44} height={44} />
          <View style={styles.tileText}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </View>
        </NeuBox>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    padding: t.spacing[3],
    paddingRight: t.spacing[4],
    minHeight: t.sizes.touchTarget,
  },
  tileText: { flex: 1, gap: t.spacing[0.5] },
  skeletonList: { gap: t.spacing[3] },
}));
