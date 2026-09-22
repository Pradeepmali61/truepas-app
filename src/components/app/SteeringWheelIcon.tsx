import { createLucideIcon } from "lucide-react-native";

/**
 * Steering wheel — driving-license glyph. Lucide has no car steering wheel
 * (only ship-wheel / ferris-wheel), so this is a custom icon in the lucide
 * node format: 24×24 stroke, rim + horn-pad hub + three spokes with the side
 * spokes angled slightly up like a real wheel. Created via createLucideIcon
 * so it is a real LucideIcon — size / color / strokeWidth props work exactly
 * like Car or Globe and it drops into DOC_ICON / the AppIcon registry.
 */
export const SteeringWheelIcon = createLucideIcon("steering-wheel", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "sw-rim" }],
  ["circle", { cx: "12", cy: "12", r: "3", key: "sw-hub" }],
  ["path", { d: "M2.2 9.9l6.9 1.5", key: "sw-left" }],
  ["path", { d: "M21.8 9.9l-6.9 1.5", key: "sw-right" }],
  ["path", { d: "M12 15v7", key: "sw-bottom" }],
]);
