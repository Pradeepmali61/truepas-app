import { useState } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { BottomSheet } from "./BottomSheet";
import { Button } from "../ui/Button";

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

  const openPicker = () => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    setView({ year: base.getFullYear(), month: base.getMonth() });
    setDraft(value);
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
        <Calendar size={iconSize.sm} color={theme.colors.textMuted} />
        <Text style={[styles.valueText, !value && styles.placeholder]}>{value ? fmt(value) : placeholder}</Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Select date">
        <View style={styles.calHeader}>
          <Pressable accessibilityLabel="Previous month" onPress={() => navMonth(-1)} hitSlop={8} style={styles.navBtn}>
            <ChevronLeft size={iconSize.md} color={theme.colors.textSecondary} />
          </Pressable>
          <Text style={styles.monthLabel}>{MONTHS[view.month]} {view.year}</Text>
          <Pressable accessibilityLabel="Next month" onPress={() => navMonth(1)} hitSlop={8} style={styles.navBtn}>
            <ChevronRight size={iconSize.md} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
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
