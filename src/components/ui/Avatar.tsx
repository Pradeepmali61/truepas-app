import { useState } from "react";
import { Image, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens, type SemanticColors } from "../../theme";

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Hash-based accent tint for the fallback (design-repo: family members). */
  tinted?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PX = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 } as const;
const FONT = { xs: 10, sm: 13, md: 14, lg: 16, xl: 18 } as const;

const TINTS: [keyof SemanticColors, keyof SemanticColors][] = [
  ["actionPrimarySubtle", "actionPrimary"],
  ["accentSubtle", "onAccentSubtle"],
  ["successSubtle", "onSuccessSubtle"],
  ["infoSubtle", "onInfoSubtle"],
  ["warningSubtle", "onWarningSubtle"],
];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => Array.from(w)[0]?.toUpperCase() ?? "")
    .join("");
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ uri, name, size = "md", tinted, style }: AvatarProps) {
  const styles = useStyles();
  const t = useThemeTokens();
  const [imgError, setImgError] = useState(false);
  const showImage = uri && !imgError;

  const tint = tinted && name ? TINTS[hashName(name) % TINTS.length] : null;
  const tintStyle = tint ? { backgroundColor: t.colors[tint[0]] } : null;
  const tintText = tint ? { color: t.colors[tint[1]] } : null;

  return (
    <View
      style={[styles.avatar, { width: PX[size], height: PX[size] }, tintStyle, style]}
      accessibilityLabel={name ? `Avatar for ${name}` : "Avatar"}
      accessibilityRole="image"
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={styles.image}
          onError={() => setImgError(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.fallback, { fontSize: FONT[size] }, tintText]}>
          {name?.trim() ? initials(name) : "?"}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  avatar: {
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  fallback: { color: t.colors.actionPrimary, fontWeight: t.fontWeight.semibold },
}));
