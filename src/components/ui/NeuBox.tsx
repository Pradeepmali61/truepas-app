/**
 * Neumorphic (soft-UI) primitive — ported from UI-design-repo `src/app/ui/neu.tsx`.
 *
 * RN supports one shadow per view, so the classic dual-shadow look is
 * composed: two absolutely-filled sibling layers — a light highlight toward
 * the top-left and a dark shadow toward the bottom-right — sit on an
 * UNCLIPPED outer wrapper behind a clipped inner view that carries the fill
 * and content. Android falls back to elevation on the dark shadow layer.
 *
 *   <NeuBox variant="raised">…</NeuBox>     — extruded card/tile
 *   <NeuBox variant="inset">…</NeuBox>      — pressed-in well/track
 */
import type { LucideIcon } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { alpha, mix, useThemeTokens } from "../../theme";

export type NeuVariant = "raised" | "inset" | "flat";

/**
 * Caller-style keys that describe the *inside* of the box — paint, padding,
 * child layout and corner radii. They move to the clipped inner view so the
 * outer shadow host stays unclipped and unpainted; every other key (size,
 * position, margins, opacity…) stays on the host.
 */
const RADIUS_KEYS = new Set([
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderTopStartRadius",
  "borderTopEndRadius",
  "borderBottomStartRadius",
  "borderBottomEndRadius",
]);

const INNER_STYLE_KEYS = new Set([
  ...RADIUS_KEYS,
  "backgroundColor",
  "overflow",
  "borderColor",
  "borderStyle",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStartWidth",
  "borderEndWidth",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderStartColor",
  "borderEndColor",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingStart",
  "paddingEnd",
  "paddingHorizontal",
  "paddingVertical",
  "flexDirection",
  "alignItems",
  "alignContent",
  "justifyContent",
  "flexWrap",
  "gap",
  "rowGap",
  "columnGap",
]);

export interface NeuBoxProps {
  variant?: NeuVariant;
  /** Corner radius — defaults to the theme xl radius (soft-UI: 22). */
  radius?: number;
  /** Fill color — defaults to the screen background so the shadows read. */
  color?: string;
  /** Shadow reach in dp (distance + blur driver). Default 6. */
  depth?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function NeuBox({ variant = "raised", radius, color, depth = 6, style, children }: NeuBoxProps) {
  const t = useThemeTokens();
  const r = radius ?? t.radii.xl;
  const fill = color ?? t.colors.background;
  // Shadow colors derive from the theme so single-brand palettes (combo null)
  // stay on-hue: dark = background pulled toward a dark neutral/brand dark,
  // light = background pulled toward white (a raised highlight in dark mode).
  const dark =
    t.combo?.neutral.shadow ??
    mix(t.colors.background, t.scheme === "dark" ? t.colors.textInverse : t.brand.b700, t.scheme === "dark" ? 0.75 : 0.5);
  const light =
    t.scheme === "dark" ? alpha(t.colors.surfaceRaised, 0.12) : mix(t.colors.background, t.colors.textInverse, 0.55);
  const darkO = t.scheme === "dark" ? 0.45 : 0.28;
  const lightO = t.scheme === "dark" ? 0.5 : 0.9;

  // Split the caller style across the two layers: the outer view hosts the
  // shadow siblings and must never clip or paint (a background there would
  // swallow the shadows), so paint/content keys forward to the inner view.
  const flat = StyleSheet.flatten(style) ?? {};
  const outerStyle: ViewStyle = {};
  const innerStyle: ViewStyle = {};
  const radiusStyle: ViewStyle = {};
  for (const [k, v] of Object.entries(flat)) {
    if (RADIUS_KEYS.has(k)) (radiusStyle as Record<string, unknown>)[k] = v;
    ((INNER_STYLE_KEYS.has(k) ? innerStyle : outerStyle) as Record<string, unknown>)[k] = v;
  }
  const paint = innerStyle.backgroundColor ?? fill;

  // Dark-mode raised surfaces melt into the background — drop shadows barely
  // read on dark paints — so the inner view gets a hairline light rim that
  // restores the elevation cue (the top-edge catch the highlight shadow can't
  // deliver). Skipped when the caller passes any real border key (radius keys
  // don't count) and applied before innerStyle, so caller borders always win.
  const callerHasBorder = Object.keys(innerStyle).some((k) => k.startsWith("border") && !k.endsWith("Radius"));
  const hairline: ViewStyle | null =
    t.scheme === "dark" && variant === "raised" && !callerHasBorder
      ? {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: alpha(t.colors.textPrimary, 0.09),
        }
      : null;

  return (
    <View style={[{ borderRadius: r }, radiusStyle, outerStyle]}>
      {variant === "raised" && (
        <>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: r,
                backgroundColor: paint,
                shadowColor: dark,
                shadowOffset: { width: depth, height: depth },
                shadowOpacity: darkO,
                shadowRadius: depth * 1.8,
              },
              radiusStyle,
              Platform.OS === "android" ? { elevation: Math.max(2, depth - 2) } : null,
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: r,
                backgroundColor: paint,
                shadowColor: light,
                shadowOffset: { width: -depth, height: -depth },
                shadowOpacity: lightO,
                shadowRadius: depth * 1.8,
              },
              radiusStyle,
            ]}
          />
        </>
      )}
      <View
        style={[
          { flexGrow: 1, alignSelf: "stretch", borderRadius: r, backgroundColor: paint, overflow: "hidden" },
          hairline,
          innerStyle,
        ]}
      >
        {variant === "inset" && (
          <>
            {/* inner shadow: dark creep from the top-left, light from bottom-right */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: r,
                  borderTopWidth: 2,
                  borderLeftWidth: 2,
                  borderTopColor: alpha(dark, t.scheme === "dark" ? 0.5 : 0.16),
                  borderLeftColor: alpha(dark, t.scheme === "dark" ? 0.35 : 0.1),
                  borderBottomWidth: 2,
                  borderRightWidth: 2,
                  borderBottomColor: t.scheme === "dark" ? light : alpha(light, 0.9),
                  borderRightColor: t.scheme === "dark" ? light : alpha(light, 0.55),
                },
                radiusStyle,
              ]}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(10, Math.min(r, t.radii["2xl"]) * 0.55),
                borderTopLeftRadius: r,
                borderTopRightRadius: r,
                backgroundColor: alpha(dark, t.scheme === "dark" ? 0.18 : 0.06),
              }}
            />
          </>
        )}
        {children}
      </View>
    </View>
  );
}

/** Sunken well — shorthand for NeuBox inset on the sunken tint. */
export function NeuWell(props: Omit<NeuBoxProps, "variant">) {
  const t = useThemeTokens();
  return <NeuBox variant="inset" color={props.color ?? t.colors.surfaceSunken} {...props} />;
}

/** Round raised icon button (design-repo neu.tsx SoftIconButton) — the
 *  header bell / close affordance. `solid` gives the filled brand variant. */
export interface SoftIconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  size?: number;
  /** Solid brand fill (primary actions). */
  solid?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function SoftIconButton({
  icon: IconCmp,
  onPress,
  size = 48,
  solid,
  disabled,
  accessibilityLabel,
  style,
}: SoftIconButtonProps) {
  const t = useThemeTokens();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={style}
    >
      <NeuBox
        variant={pressed && !solid ? "inset" : "raised"}
        radius={size / 2}
        color={solid ? t.colors.actionPrimary : t.colors.background}
        depth={4}
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? t.opacity.disabled : 1,
        }}
      >
        <IconCmp
          size={Math.round(size * 0.42)}
          color={solid ? t.colors.onActionPrimary : t.colors.actionPrimary}
        />
      </NeuBox>
    </Pressable>
  );
}
