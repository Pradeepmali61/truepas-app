import { useState, type ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultValue?: string[];
  style?: StyleProp<ViewStyle>;
}

export function Accordion({ items, multiple, defaultValue, style }: AccordionProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [open, setOpen] = useState<string[]>(defaultValue ?? []);

  const toggle = (v: string) => {
    setOpen((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : multiple ? [...cur, v] : [v],
    );
  };

  return (
    <View style={[styles.root, style]}>
      {items.map((item, i) => {
        const isOpen = open.includes(item.value);
        return (
          <View key={item.value} style={i > 0 ? styles.itemBorder : undefined}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen, disabled: item.disabled }}
              disabled={item.disabled}
              onPress={() => toggle(item.value)}
              style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
            >
              <Text style={[styles.triggerText, item.disabled && styles.triggerDisabled]}>
                {item.title}
              </Text>
              <ChevronDown
                size={iconSize.sm}
                color={theme.colors.textMuted}
                style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
              />
            </Pressable>
            {isOpen && <View style={styles.content}>{item.content}</View>}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.surface,
    overflow: "hidden",
  },
  itemBorder: { borderTopWidth: t.sizes.fieldBorderWidth, borderTopColor: t.colors.borderSubtle },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing[3],
    padding: t.spacing[4],
    minHeight: t.sizes.touchTarget,
  },
  triggerPressed: { backgroundColor: t.colors.actionSecondary },
  triggerText: { flex: 1, fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  triggerDisabled: { color: t.colors.textDisabled },
  content: { paddingHorizontal: t.spacing[4], paddingBottom: t.spacing[4] },
}));
