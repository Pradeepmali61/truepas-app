import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export interface NavigationDrawerProps {
  visible: boolean;
  onClose: () => void;
  sections: NavSection[];
  /** Top slot — logo, account card */
  header?: ReactNode;
  /** Bottom slot — e.g. sign-out */
  footer?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Slide-in left drawer — the mobile analog of NavigationSidebar. */
export function NavigationDrawer({
  visible,
  onClose,
  sections,
  header,
  footer,
  accessibilityLabel = "Navigation menu",
  style,
}: NavigationDrawerProps) {
  const styles = useStyles();
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <View style={[styles.drawer, style]} accessibilityLabel={accessibilityLabel}>
          {header != null && <View style={styles.header}>{header}</View>}
          <ScrollView contentContainerStyle={styles.scroll}>
            {sections.map((section, si) => (
              <View key={si} style={styles.section}>
                {section.heading != null && <Text style={styles.heading}>{section.heading}</Text>}
                {section.items.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.active, disabled: item.disabled }}
                    accessibilityLabel={item.active ? `${item.label}, current page` : item.label}
                    disabled={item.disabled}
                    onPress={() => {
                      item.onPress?.();
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.item,
                      item.active && styles.itemActive,
                      pressed && styles.itemPressed,
                      item.disabled && styles.itemDisabled,
                    ]}
                  >
                    {item.icon}
                    <Text style={[styles.itemLabel, item.active && styles.itemLabelActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.badge}
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
          {footer != null && <View style={styles.footer}>{footer}</View>}
        </View>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close navigation" />
      </View>
    </RNModal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1, flexDirection: "row" },
  drawer: {
    width: t.sizes.sidebarWidth,
    backgroundColor: t.colors.surface,
    height: "100%",
    ...t.shadows.xl,
  },
  scrim: { flex: 1, backgroundColor: t.colors.overlay },
  header: {
    padding: t.spacing[4],
    borderBottomWidth: t.sizes.fieldBorderWidth,
    borderBottomColor: t.colors.borderSubtle,
    minHeight: t.sizes.headerHeight,
    justifyContent: "center",
  },
  scroll: { padding: t.spacing[2], paddingBottom: t.spacing[8] },
  section: { marginTop: t.spacing[2] },
  heading: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    letterSpacing: t.letterSpacing.caps,
    textTransform: "uppercase",
    color: t.colors.textMuted,
    paddingHorizontal: t.spacing[2],
    paddingVertical: t.spacing[2],
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    minHeight: t.sizes.touchTarget,
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[2],
    borderRadius: t.radii.md,
  },
  itemActive: { backgroundColor: t.colors.actionPrimarySubtle },
  itemPressed: { backgroundColor: t.colors.actionSecondary },
  itemDisabled: { opacity: t.opacity.disabled },
  itemLabel: { flex: 1, fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  itemLabelActive: { color: t.colors.actionPrimary },
  footer: {
    padding: t.spacing[3],
    borderTopWidth: t.sizes.fieldBorderWidth,
    borderTopColor: t.colors.borderSubtle,
  },
}));
