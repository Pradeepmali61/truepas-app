/** @jsxImportSource react */
import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Modal as RNModal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export interface ActionItem {
  key: string;
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionItem[];
  /** Render a Cancel row at the bottom (default true) */
  showCancel?: boolean;
  cancelLabel?: string;
}

/** The mobile analog of a dropdown menu — bottom-anchored action list. */
export function ActionSheet({
  visible,
  onClose,
  title,
  items,
  showCancel = true,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close menu" />
        <View style={[styles.sheet, { paddingBottom: theme.spacing[6] + insets.bottom }]}>
          <View style={styles.grabber} />
          {title != null && <Text style={styles.title}>{title}</Text>}
          <ScrollView style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ disabled: item.disabled, selected: item.selected }}
                disabled={item.disabled}
                onPress={() => {
                  item.onSelect?.();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                  item.disabled && styles.itemDisabled,
                ]}
              >
                {item.icon && <View style={styles.itemIcon}>{item.icon}</View>}
                <Text
                  style={[
                    styles.itemText,
                    item.destructive && styles.itemDestructive,
                    item.disabled && styles.itemTextDisabled,
                  ]}
                >
                  {item.label}
                </Text>
                {item.selected && <Check size={iconSize.sm} color={theme.colors.actionPrimary} />}
              </Pressable>
            ))}
          </ScrollView>
          {showCancel && (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.cancel, pressed && styles.itemPressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.scrim },
  sheet: {
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: t.radii["2xl"],
    borderTopRightRadius: t.radii["2xl"],
    maxHeight: "75%",
    ...t.shadows.xl,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.borderStrong,
    marginTop: t.spacing[2],
  },
  title: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textMuted,
    textAlign: "center",
    paddingVertical: t.spacing[3],
    textTransform: "uppercase",
    letterSpacing: t.letterSpacing.caps,
  },
  list: { flexGrow: 0 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    minHeight: t.sizes.touchTarget,
    paddingHorizontal: t.spacing[4],
    paddingVertical: t.spacing[3],
  },
  itemPressed: { backgroundColor: t.colors.actionSecondary },
  itemDisabled: { opacity: t.opacity.disabled },
  itemIcon: {},
  itemText: { flex: 1, fontSize: t.fontSize.md, color: t.colors.textPrimary },
  itemDestructive: { color: t.colors.error },
  itemTextDisabled: { color: t.colors.textDisabled },
  cancel: {
    marginTop: t.spacing[2],
    marginHorizontal: t.spacing[4],
    minHeight: t.sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.actionSecondary,
  },
  cancelText: { fontSize: t.fontSize.md, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
}));
