import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { BatteryFull, Signal, Wifi } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { Typography } from "@/components/ui/Typography";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ScreenFrameProps {
  /** Screen name shown above the frame */
  title: string;
  method: HttpMethod;
  path: string;
  /** Optional contract note under the endpoint line */
  note?: string;
  /** Frame content height â€” defaults to a tall phone body */
  height?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

function StatusBar() {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>
      <View style={styles.statusIcons}>
        <Signal size={14} color={theme.colors.textPrimary} />
        <Wifi size={14} color={theme.colors.textPrimary} />
        <BatteryFull size={16} color={theme.colors.textPrimary} />
      </View>
    </View>
  );
}

/**
 * Static phone mockup â€” status bar + screen body + the BFF endpoint it
 * represents. Used to present contract-accurate reference screens without
 * any network wiring.
 */
export function ScreenFrame({ title, method, path, note, height, children, style }: ScreenFrameProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const methodColor = {
    GET: theme.colors.info,
    POST: theme.colors.actionPrimary,
    PUT: theme.colors.warning,
    DELETE: theme.colors.error,
  }[method];

  return (
    <View style={[styles.demo, style]}>
      <View style={styles.captionRow}>
        <Typography variant="label" color="muted">
          {title}
        </Typography>
        <View style={styles.endpoint}>
          <Text style={[styles.method, { color: methodColor }]}>{method}</Text>
          <Text style={styles.path} numberOfLines={2}>
            {path}
          </Text>
        </View>
        {note != null && (
          <Typography variant="caption" color="muted">
            {note}
          </Typography>
        )}
      </View>
      <View style={styles.phone}>
        <StatusBar />
        <View style={[styles.body, height != null && { height }]}>{children}</View>
      </View>
    </View>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  const styles = useStyles();
  return (
    <View style={styles.dots} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i < current && styles.dotDone, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

/** Small square icon chip used on list rows. */
export function RowIcon({ icon, tone = "neutral" }: { icon: ReactNode; tone?: "neutral" | "primary" | "success" | "warning" | "error" | "info" }) {
  const styles = useStyles();
  return <View style={[styles.rowIcon, styles[`icon_${tone}`]]}>{icon}</View>;
}

const useStyles = makeStyles((t) => ({
  demo: { gap: t.spacing[2] },
  captionRow: { gap: t.spacing[1] },
  endpoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    paddingVertical: t.spacing[1],
    paddingHorizontal: t.spacing[2],
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surfaceSunken,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  method: { fontFamily: t.fontFamily.mono.semibold, fontSize: t.fontSize.xs },
  path: {
    fontFamily: t.fontFamily.mono.regular,
    fontSize: t.fontSize.xs,
    color: t.colors.textSecondary,
    flexShrink: 1,
  },
  phone: {
    borderRadius: t.radii["2xl"],
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.background,
    overflow: "hidden",
    ...t.shadows.md,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.spacing[5],
    paddingVertical: t.spacing[2],
    backgroundColor: t.colors.surface,
    borderBottomWidth: t.sizes.fieldBorderWidth,
    borderBottomColor: t.colors.borderSubtle,
  },
  statusTime: { fontFamily: t.fontFamily.sans.semibold, fontSize: t.fontSize.sm, color: t.colors.textPrimary },
  statusIcons: { flexDirection: "row", alignItems: "center", gap: t.spacing[1] + 2 },
  body: { gap: 0 },
  dots: { flexDirection: "row", gap: t.spacing[1], justifyContent: "center", paddingVertical: t.spacing[2] },
  dot: { width: 6, height: 6, borderRadius: t.radii.full, backgroundColor: t.colors.border },
  dotDone: { backgroundColor: t.colors.actionPrimary },
  dotActive: { width: 18, backgroundColor: t.colors.actionPrimary },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: t.radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  icon_neutral: { backgroundColor: t.colors.actionSecondary },
  icon_primary: { backgroundColor: t.colors.actionPrimarySubtle },
  icon_success: { backgroundColor: t.colors.successSubtle },
  icon_warning: { backgroundColor: t.colors.warningSubtle },
  icon_error: { backgroundColor: t.colors.errorSubtle },
  icon_info: { backgroundColor: t.colors.infoSubtle },
}));

