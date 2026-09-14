import { useState } from "react";
import { ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "react-native";
import { Check, X } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { SearchBox } from "../composite/SearchBox";
import { BottomSheet } from "../composite/BottomSheet";
import { Badge } from "../ui/Badge";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface SearchAndFilterBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  values?: Record<string, string | undefined>;
  onFilterChange?: (key: string, value: string | undefined) => void;
  onClearAll?: () => void;
  /** Right-side slot (e.g. sort button) */
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Search + chip filters; each chip opens a bottom-sheet option list. */
export function SearchAndFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters = [],
  values = {},
  onFilterChange,
  onClearAll,
  actions,
  style,
}: SearchAndFilterBarProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [openFilter, setOpenFilter] = useState<FilterDef | null>(null);

  const activeCount = filters.filter((f) => values[f.key]).length;

  return (
    <View style={[styles.bar, style]}>
      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        style={styles.search}
      />
      {filters.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {activeCount > 0 && onClearAll && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              onPress={onClearAll}
              style={styles.clearChip}
            >
              <X size={iconSize.xs} color={theme.colors.error} />
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
          {filters.map((f) => {
            const active = values[f.key];
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: !!active }}
                onPress={() => setOpenFilter(f)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? `${f.label}: ${f.options.find((o) => o.value === active)?.label ?? active}` : f.label}
                </Text>
              </Pressable>
            );
          })}
          {activeCount > 0 && (
            <Badge variant="primary" size="sm">{activeCount}</Badge>
          )}
        </ScrollView>
      )}
      {actions}

      <BottomSheet
        visible={openFilter != null}
        onClose={() => setOpenFilter(null)}
        title={openFilter?.label}
      >
        {openFilter?.options.map((o) => {
          const selected = values[openFilter.key] === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onFilterChange?.(openFilter.key, selected ? undefined : o.value);
                setOpenFilter(null);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextActive]}>{o.label}</Text>
              {selected && <Check size={iconSize.sm} color={theme.colors.actionPrimary} />}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: { gap: t.spacing[2] },
  search: {},
  chips: { flexDirection: "row", gap: t.spacing[2], alignItems: "center", paddingVertical: t.spacing[1] },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: t.sizes.heightSm,
    paddingHorizontal: t.spacing[3],
    borderRadius: t.radii.full,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  chipActive: { borderColor: t.colors.actionPrimary, backgroundColor: t.colors.actionPrimarySubtle },
  chipText: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  chipTextActive: { color: t.colors.actionPrimary, fontWeight: t.fontWeight.medium },
  clearChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[1],
    height: t.sizes.heightSm,
    paddingHorizontal: t.spacing[2],
  },
  clearText: { fontSize: t.fontSize.sm, color: t.colors.error },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: t.sizes.touchTarget,
    paddingHorizontal: t.spacing[2],
    paddingVertical: t.spacing[3],
    borderRadius: t.radii.md,
  },
  optionPressed: { backgroundColor: t.colors.actionSecondary },
  optionText: { fontSize: t.fontSize.md, color: t.colors.textPrimary },
  optionTextActive: { color: t.colors.actionPrimary, fontWeight: t.fontWeight.semibold },
}));
