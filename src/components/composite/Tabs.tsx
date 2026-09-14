import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "pills";
  style?: StyleProp<ViewStyle>;
}

export function Tabs({ items, value, defaultValue, onValueChange, variant = "underline", style }: TabsProps) {
  const styles = useStyles();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? internal;

  const select = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };

  const activeItem = items.find((i) => i.value === active);

  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        contentContainerStyle={[styles.list, styles[variant]]}
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled: item.disabled }}
              disabled={item.disabled}
              onPress={() => select(item.value)}
              style={[
                styles.trigger,
                variant === "pills" && isActive && styles.triggerPillActive,
                variant === "underline" && isActive && styles.triggerUnderlineActive,
                item.disabled && styles.triggerDisabled,
              ]}
            >
              {item.icon}
              <Text
                style={[
                  styles.triggerText,
                  isActive && (variant === "pills" ? styles.triggerTextActivePill : styles.triggerTextActive),
                  item.disabled && styles.triggerTextDisabled,
                ]}
              >
                {item.label}
              </Text>
              {item.badge}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.panel} accessibilityRole="none">
        {activeItem?.content}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing[1] },
  underline: { borderBottomWidth: t.sizes.fieldBorderWidth, borderBottomColor: t.colors.borderSubtle },
  pills: {
    backgroundColor: t.colors.surfaceSunken,
    borderRadius: t.radii.lg,
    padding: t.spacing[1],
    alignSelf: "flex-start",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[2],
    borderRadius: t.radii.md,
    minHeight: t.sizes.heightSm,
  },
  triggerPillActive: { backgroundColor: t.colors.surface, ...t.shadows.sm },
  triggerUnderlineActive: {
    borderBottomWidth: 2,
    borderBottomColor: t.colors.actionPrimary,
    borderRadius: 0,
  },
  triggerDisabled: { opacity: t.opacity.disabled },
  triggerText: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textSecondary },
  triggerTextActive: { color: t.colors.actionPrimary },
  triggerTextActivePill: { color: t.colors.textPrimary },
  triggerTextDisabled: { color: t.colors.textDisabled },
  panel: { paddingTop: t.spacing[4] },
}));
