import {
    createContext,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { BRAND_PRESETS, type BrandPreset, type BrandRamp } from "./palette";
import { buildTheme, type Theme } from "./themes";

export type ColorScheme = "light" | "dark" | "system";

export type RadiusPreset = "sharp" | "default" | "round";

/** Radius scale multipliers applied as token overrides. */
const RADIUS_TOKENS: Record<RadiusPreset, DeepPartial<Theme>> = {
  sharp: { radii: { sm: 2, md: 3, lg: 4, xl: 6, "2xl": 8 } },
  default: {},
  round: { radii: { sm: 6, md: 10, lg: 14, xl: 18, "2xl": 24 } },
};

/**
 * Deep-partial overrides — merge into the resolved theme.
 * Example: { colors: { actionPrimary: "#7c3aed" }, radii: { md: 2 } }
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;
  const out = { ...(base as object) } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override)) {
    const bv = (base as Record<string, unknown>)[k];
    out[k] =
      bv && typeof bv === "object" && v && typeof v === "object" && !Array.isArray(v)
        ? deepMerge(bv, v as DeepPartial<typeof bv>)
        : v;
  }
  return out as T;
}

interface ThemeContextValue {
  scheme: ColorScheme;
  resolvedScheme: "light" | "dark";
  setScheme: (s: ColorScheme) => void;
  brand: BrandPreset;
  setBrand: (b: BrandPreset) => void;
  radius: RadiusPreset;
  setRadius: (r: RadiusPreset) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  scheme?: ColorScheme;
  /** Curated brand ramp */
  brand?: BrandPreset;
  /** Full custom ramp (takes precedence over `brand`) */
  brandRamp?: BrandRamp;
  /** Deep-partial theme overrides applied after scheme+brand resolution */
  tokens?: DeepPartial<Theme>;
  children: ReactNode;
}

export function ThemeProvider({
  scheme: schemeProp = "system",
  brand: brandProp = "blue",
  brandRamp,
  tokens,
  children,
}: ThemeProviderProps) {
  const [scheme, setScheme] = useState<ColorScheme>(schemeProp);
  const [brand, setBrand] = useState<BrandPreset>(brandProp);
  const [radius, setRadius] = useState<RadiusPreset>("default");
  const system = useColorScheme();

  const resolvedScheme: "light" | "dark" =
    scheme === "system" ? (system === "dark" ? "dark" : "light") : scheme;

  const theme = useMemo(() => {
    const ramp = brandRamp ?? BRAND_PRESETS[brand];
    return deepMerge(deepMerge(buildTheme(resolvedScheme, ramp), RADIUS_TOKENS[radius]), tokens);
  }, [resolvedScheme, brand, brandRamp, tokens, radius]);

  const value = useMemo<ThemeContextValue>(
    () => ({ scheme, resolvedScheme, setScheme, brand, setBrand, radius, setRadius, theme }),
    [scheme, resolvedScheme, brand, theme, radius],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/** Shorthand: just the resolved theme object. */
export function useThemeTokens(): Theme {
  return useTheme().theme;
}

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/** weight value → fontFamily key in theme.fontFamily.sans */
const WEIGHT_TO_KEY: Record<string, "regular" | "medium" | "semibold" | "bold"> = {
  "400": "regular",
  "500": "medium",
  "600": "semibold",
  "700": "bold",
};

/**
 * Text styles (styles with fontSize/fontWeight) get the Inter face for their
 * weight automatically. An explicit fontFamily (e.g. mono) always wins.
 */
function resolveFontFamily(theme: Theme, style: ViewStyle | TextStyle | ImageStyle): string | undefined {
  const s = style as TextStyle;
  if (s.fontSize == null && s.fontWeight == null) return undefined;
  if (s.fontFamily != null) return undefined;
  const key = WEIGHT_TO_KEY[String(s.fontWeight ?? "400")] ?? "regular";
  return theme.fontFamily.sans[key];
}

function applyFonts<T extends NamedStyles>(theme: Theme, styles: T): T {
  const out: NamedStyles = {};
  for (const k of Object.keys(styles)) {
    const s = styles[k];
    const family = s && typeof s === "object" ? resolveFontFamily(theme, s) : undefined;
    out[k] = family ? { ...s, fontFamily: family } : s;
  }
  return out as T;
}

/**
 * The styling contract for every component — the RN equivalent of a CSS
 * module fed by tokens:
 *
 *   const styles = useStyles();
 *   const useStyles = makeStyles((t) => ({
 *     root: { backgroundColor: t.colors.surface, borderRadius: t.radii.md },
 *   }));
 *
 * Styles are rebuilt only when the theme object changes (brand/scheme/
 * overrides), so retargeting the theme restyles every component.
 */
export function makeStyles<T extends NamedStyles>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const { theme } = useTheme();
    const cache = useRef<{ theme: Theme; styles: T } | null>(null);
    if (!cache.current || cache.current.theme !== theme) {
      cache.current = { theme, styles: StyleSheet.create(applyFonts(theme, factory(theme))) };
    }
    return cache.current.styles;
  };
}
