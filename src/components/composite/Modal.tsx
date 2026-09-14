import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { X } from "lucide-react-native";
import { makeStyles } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { IconButton } from "../ui/IconButton";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  /** Centered dialog (default) or bottom sheet */
  position?: "center" | "bottom";
  hideClose?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Modal({
  visible,
  onClose,
  title,
  description,
  footer,
  position = "center",
  hideClose,
  children,
  style,
}: ModalProps) {
  const styles = useStyles();
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={[styles.backdrop, position === "bottom" && styles.backdropBottom]}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close dialog" />
        <View style={[styles.dialog, position === "bottom" && styles.sheet, style]}>
          {(title != null || !hideClose) && (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {title != null && <Text style={styles.title}>{title}</Text>}
                {description != null && <Text style={styles.description}>{description}</Text>}
              </View>
              {!hideClose && (
                <IconButton accessibilityLabel="Close" icon={<X size={iconSize.md} />} size="sm" onPress={onClose} />
              )}
            </View>
          )}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
          {footer != null && <View style={styles.footer}>{footer}</View>}
        </View>
      </View>
    </RNModal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1, justifyContent: "center", padding: t.spacing[4] },
  backdropBottom: { justifyContent: "flex-end", padding: 0 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.overlay },
  dialog: {
    backgroundColor: t.colors.surfaceRaised,
    borderRadius: t.radii.xl,
    maxHeight: "85%",
    ...t.shadows.xl,
  },
  sheet: {
    borderRadius: 0,
    borderTopLeftRadius: t.radii["2xl"],
    borderTopRightRadius: t.radii["2xl"],
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: t.spacing[4],
    padding: t.spacing[5],
    paddingBottom: t.spacing[3],
  },
  headerText: { flex: 1 },
  title: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  description: { marginTop: t.spacing[1], fontSize: t.fontSize.base, color: t.colors.textSecondary },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: t.spacing[6], paddingVertical: t.spacing[2], gap: t.spacing[3] },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: t.spacing[3],
    padding: t.spacing[4],
    paddingHorizontal: t.spacing[6],
    paddingBottom: t.spacing[6],
  },
}));
