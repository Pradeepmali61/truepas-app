import { useState } from "react";
import { Image, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  style?: StyleProp<ViewStyle>;
}

const PX = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 } as const;
const FONT = { xs: 10, sm: 13, md: 14, lg: 16, xl: 18 } as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ uri, name, size = "md", style }: AvatarProps) {
  const styles = useStyles();
  const [imgError, setImgError] = useState(false);
  const showImage = uri && !imgError;

  return (
    <View
      style={[styles.avatar, { width: PX[size], height: PX[size] }, style]}
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
        <Text style={[styles.fallback, { fontSize: FONT[size] }]}>
          {name ? initials(name) : "?"}
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
