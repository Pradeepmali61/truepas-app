import type { ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert } as const;

export function Alert({ variant = "info", title, children, action, onDismiss, style }: AlertProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const IconComponent = ICONS[variant];
  const iconColor = {
    info: theme.colors.onInfoSubtle,
    success: theme.colors.onSuccessSubtle,
    warning: theme.colors.onWarningSubtle,
    error: theme.colors.onErrorSubtle,
  }[variant];

  return (
    <View
      accessibilityRole={variant === "error" || variant === "warning" ? "alert" : "text"}
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      style={[styles.alert, styles[variant], style]}
    >
      <IconComponent size={iconSize.md} color={iconColor} style={styles.icon} />
      <View style={styles.body}>
        {title != null && <Text style={[styles.title, styles[`${variant}Text`]]}>{title}</Text>}
        {children != null && <Text style={[styles.content, styles[`${variant}Text`]]}>{children}</Text>}
        {action != null && <View style={styles.action}>{action}</View>}
      </View>
      {onDismiss && (
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={onDismiss} hitSlop={8}>
          <X size={iconSize.sm} color={iconColor} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  alert: {
    flexDirection: "row",
    gap: t.spacing[3],
    padding: t.spacing[3],
    paddingHorizontal: t.spacing[4],
    borderWidth: t.sizes.fieldBorderWidth,
    borderRadius: t.radii.lg,
    alignItems: "flex-start",
  },
  info: { backgroundColor: t.colors.infoSubtle, borderColor: t.colors.info },
  success: { backgroundColor: t.colors.successSubtle, borderColor: t.colors.success },
  warning: { backgroundColor: t.colors.warningSubtle, borderColor: t.colors.warning },
  error: { backgroundColor: t.colors.errorSubtle, borderColor: t.colors.error },
  infoText: { color: t.colors.onInfoSubtle },
  successText: { color: t.colors.onSuccessSubtle },
  warningText: { color: t.colors.onWarningSubtle },
  errorText: { color: t.colors.onErrorSubtle },
  icon: { marginTop: 1 },
  body: { flex: 1, gap: t.spacing[1] },
  title: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.semibold },
  content: { fontSize: t.fontSize.base, lineHeight: t.fontSize.base * t.lineHeight.normal },
  action: { marginTop: t.spacing[1] },
}));
