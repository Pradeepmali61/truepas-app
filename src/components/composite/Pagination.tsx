import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Compact mode (default on mobile): ‹ Page 3 of 8 › */
  summary?: string;
  style?: StyleProp<ViewStyle>;
}

/** Compact mobile pager. For dense data use DataList's load-more instead. */
export function Pagination({ page, totalPages, onPageChange, summary, style }: PaginationProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={[styles.nav, style]} accessibilityRole="adjustable" accessibilityLabel="Pagination">
      {summary != null && <Text style={styles.summary}>{summary}</Text>}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: page <= 1 }}
          disabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, page <= 1 && styles.btnDisabled]}
        >
          <ChevronLeft size={iconSize.sm} color={page <= 1 ? theme.colors.textDisabled : theme.colors.textSecondary} />
        </Pressable>
        <Text style={styles.pageLabel}>
          {page} / {totalPages}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: page >= totalPages }}
          disabled={page >= totalPages}
          onPress={() => onPageChange(page + 1)}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, page >= totalPages && styles.btnDisabled]}
        >
          <ChevronRight size={iconSize.sm} color={page >= totalPages ? theme.colors.textDisabled : theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: t.spacing[3] },
  summary: { fontSize: t.fontSize.sm, color: t.colors.textSecondary, flex: 1 },
  controls: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  btn: {
    width: t.sizes.heightSm,
    height: t.sizes.heightSm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.md,
  },
  btnPressed: { backgroundColor: t.colors.actionSecondary },
  btnDisabled: { opacity: t.opacity.disabled },
  pageLabel: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.medium,
    fontFamily: t.fontFamily.mono.medium,
    color: t.colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
}));
