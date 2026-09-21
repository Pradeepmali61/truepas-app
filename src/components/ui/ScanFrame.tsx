/**
 * ScanFrame — the corner-bracket viewfinder, the TruePas scan motif. Four
 * L-shaped brackets frame a target: the liveness ring, a document card,
 * a capture zone. Pure chrome — the brackets never intercept touches.
 *
 * Ported 1:1 from UI-design-repo `src/app/ui/ScanFrame.tsx`.
 *
 *   <ScanFrame padding={12}>…</ScanFrame>  — wrap content, brackets float outside
 *   <ScanFrame size={264}>…</ScanFrame>    — fixed square, content centered
 */
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";

export interface ScanFrameProps {
  children?: ReactNode;
  /** Fixed square edge — omit to wrap the content instead. */
  size?: number;
  /** Gap between the content and the brackets when wrapping (default 0: hug the edges). */
  padding?: number;
  /** Bracket color — defaults to colors.actionPrimary. */
  color?: string;
  /** Length of each corner arm (default 28). */
  corner?: number;
  /** Bracket stroke width (default 3). */
  thickness?: number;
  /** Corner bend radius — defaults to radii.md; match the framed surface. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScanFrame({
  children,
  size,
  padding = 0,
  color,
  corner = 28,
  thickness = 3,
  radius,
  style,
}: ScanFrameProps) {
  const styles = useStyles();
  const t = useThemeTokens();
  const c = color ?? t.colors.actionPrimary;
  const r = radius ?? t.radii.md;
  const arm: ViewStyle = {
    position: "absolute",
    width: corner,
    height: corner,
    borderColor: c,
  };
  return (
    <View style={[styles.frame, size != null && { width: size, height: size }, { padding }, style]}>
      {children}
      <View
        pointerEvents="none"
        style={[arm, { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness, borderTopLeftRadius: r }]}
      />
      <View
        pointerEvents="none"
        style={[arm, { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness, borderTopRightRadius: r }]}
      />
      <View
        pointerEvents="none"
        style={[arm, { bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness, borderBottomLeftRadius: r }]}
      />
      <View
        pointerEvents="none"
        style={[arm, { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness, borderBottomRightRadius: r }]}
      />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  /* The scan target sits centered in its frame. */
  frame: { alignItems: "center", justifyContent: "center" },
}));
