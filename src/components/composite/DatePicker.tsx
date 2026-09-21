import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Button } from "../ui/Button";
import { BottomSheet } from "./BottomSheet";

export interface DatePickerProps {
  /** ISO date string: "YYYY-MM-DD" */
  value?: string;
  onValueChange?: (iso: string) => void;
  placeholder?: string;
  state?: "default" | "error" | "success";
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmt(iso?: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  state = "default",
  disabled,
  minDate,
  maxDate,
  accessibilityLabel,
  style,
}: DatePickerProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [draft, setDraft] = useState<string | undefined>(value);
  const [mode, setMode] = useState<"days" | "years">("days");

  const openPicker = () => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    setView({ year: base.getFullYear(), month: base.getMonth() });
    setDraft(value);
    setMode("days");
    setOpen(true);
  };

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const todayISO = toISO(new Date());

  const inRange = (iso: string) => (!minDate || iso >= minDate) && (!maxDate || iso <= maxDate);

  const navMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const cells: (string | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(view.year, view.month, i + 1))),
  ];

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? parseInt(minDate.slice(0, 4), 10) : currentYear - 100;
  const maxYear = maxDate ? parseInt(maxDate.slice(0, 4), 10) : currentYear + 50;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const yearScrollOffset = Math.max(
    0,
    (Math.floor((maxYear - view.year) / 4) - 1) * theme.sizes.touchTarget,
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={[styles.field, state === "error" && styles.error, disabled && styles.disabled, style]}
      >
        <Calendar size={iconSize.sm} color={theme.colors.actionPrimary} />
        <Text style={[styles.valueText, !value && styles.placeholder]}>{value ? fmt(value) : placeholder}</Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Select date">
        <View style={styles.calHeader}>
          {mode === "years" ? (
            <Text style={[styles.monthLabel, styles.yearTitle]}>Select year</Text>
          ) : (
            <>
              <Pressable accessibilityLabel="Previous month" onPress={() => navMonth(-1)} hitSlop={8} style={styles.navBtn}>
                <ChevronLeft size={iconSize.md} color={theme.colors.textSecondary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose year"
                onPress={() => setMode("years")}
                hitSlop={8}
                style={styles.monthBtn}
              >
                <Text style={styles.monthLabel}>{MONTHS[view.month]} {view.year}</Text>
                <ChevronDown size={iconSize.sm} color={theme.colors.textSecondary} />
              </Pressable>
              <Pressable accessibilityLabel="Next month" onPress={() => navMonth(1)} hitSlop={8} style={styles.navBtn}>
                <ChevronRight size={iconSize.md} color={theme.colors.textSecondary} />
              </Pressable>
            </>
          )}
        </View>
        {mode === "years" ? (
          <ScrollView
            style={styles.yearScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentOffset={{ x: 0, y: yearScrollOffset }}
          >
            <View style={styles.yearGrid}>
              {years.map((y) => {
                const selected = y === view.year;
                return (
                  <Pressable
                    key={y}
                    accessibilityRole="button"
                    accessibilityLabel={`Year ${y}`}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setView({ year: y, month: view.month });
                      setMode("days");
                    }}
                    style={[styles.yearCell, selected && styles.daySelected]}
                  >
                    <Text style={[styles.dayText, selected && styles.daySelectedText]}>{y}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : (
        <View style={styles.grid}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.dayLabel}>{d}</Text>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <View key={`e${i}`} style={styles.cell} />;
            const day = parseInt(iso.slice(8, 10), 10);
            const selected = iso === draft;
            const isToday = iso === todayISO;
            const out = !inRange(iso);
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={fmt(iso)}
                accessibilityState={{ selected, disabled: out }}
                disabled={out}
                onPress={() => setDraft(iso)}
                style={[
                  styles.cell,
                  styles.dayCell,
                  selected && styles.daySelected,
                  !selected && isToday && styles.dayToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.daySelectedText,
                    out && styles.dayDisabledText,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
        )}
        <View style={styles.calFooter}>
          <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>Cancel</Button>
          <Button
            size="sm"
            onPress={() => {
              if (draft) onValueChange?.(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </View>
      </BottomSheet>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    height: t.sizes.heightMd,
    paddingHorizontal: t.sizes.controlPaddingXMd,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.md,
  },
  error: { borderColor: t.colors.error },
  disabled: { backgroundColor: t.colors.surfaceSunken, opacity: t.opacity.disabled },
  valueText: { flex: 1, fontSize: t.fontSize.base, color: t.colors.textPrimary },
  placeholder: { color: t.colors.textMuted },

  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.spacing[2],
    paddingVertical: t.spacing[2],
  },
  navBtn: { width: t.sizes.touchTarget, height: t.sizes.touchTarget, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: t.fontSize.md, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  monthBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[1],
    minHeight: t.sizes.touchTarget,
    paddingHorizontal: t.spacing[2],
  },
  yearTitle: { flex: 1, textAlign: "center" },
  yearScroll: { height: t.sizes.touchTarget * 6 },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: t.spacing[2] },
  yearCell: {
    width: "25%",
    height: t.sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.full,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: t.spacing[2] },
  dayLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: t.fontSize.xs,
    color: t.colors.textMuted,
    paddingVertical: t.spacing[1],
    fontWeight: t.fontWeight.medium,
  },
  cell: { width: `${100 / 7}%`, alignItems: "center" },
  dayCell: {
    height: t.sizes.touchTarget,
    justifyContent: "center",
    borderRadius: t.radii.full,
  },
  dayText: { fontSize: t.fontSize.base, color: t.colors.textPrimary, fontVariant: ["tabular-nums"] },
  daySelected: { backgroundColor: t.colors.actionPrimary },
  daySelectedText: { color: t.colors.onActionPrimary, fontWeight: t.fontWeight.semibold },
  dayToday: { borderWidth: t.sizes.fieldBorderWidth, borderColor: t.colors.actionPrimary },
  dayDisabledText: { color: t.colors.textDisabled },
  calFooter: { flexDirection: "row", justifyContent: "flex-end", gap: t.spacing[2], paddingTop: t.spacing[3] },
}));
