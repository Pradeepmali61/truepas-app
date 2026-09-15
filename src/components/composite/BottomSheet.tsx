import type { ReactNode } from "react";
import { Pressable, Modal as RNModal, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useThemeTokens } from "../../theme";

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Footer slot (usually actions) */
  footer?: ReactNode;
  /** Max sheet height fraction (default 0.7) */
  maxHeightRatio?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The mobile-native overlay: anchored to the bottom, scrim dismiss.
 * Use for pickers, filters, confirmations — anywhere web would use a dropdown
 * or side drawer.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  footer,
  maxHeightRatio = 0.7,
  children,
  style,
}: BottomSheetProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close sheet" />
        <View style={[styles.sheet, { maxHeight: `${maxHeightRatio * 100}%` as const, paddingBottom: theme.spacing[8] + insets.bottom }, style]}>
          <View style={styles.grabber} />
          {title != null && <Text style={styles.title}>{title}</Text>}
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
  backdrop: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.scrim },
  sheet: {
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: t.radii["2xl"],
    borderTopRightRadius: t.radii["2xl"],
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
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textPrimary,
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[2],
    paddingBottom: t.spacing[1],
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: t.spacing[4], paddingVertical: t.spacing[2], gap: t.spacing[2] },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[4],
    paddingTop: t.spacing[3],
  },
}));
