import { Pressable, Text, View } from "react-native";
import { Delete } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";

interface PinDotsProps {
  length: number;
  filled: number;
}

/** PIN dots — themed version of the legacy `.pin-dots`. */
export function PinDots({ length, filled }: PinDotsProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View
      accessibilityLabel={`${filled} of ${length} digits entered`}
      accessibilityLiveRegion="polite"
      style={styles.dotsRow}
    >
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < filled ? theme.colors.actionPrimary : theme.colors.borderSubtle },
          ]}
        />
      ))}
    </View>
  );
}

interface PinPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

/** Numeric PIN pad — themed version of the legacy `.pin-pad`. */
export function PinPad({ onDigit, onBackspace }: PinPadProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.pad}>
      {KEYS.map((key, i) => {
        if (key === "") {
          return <View key={i} style={styles.keyCell} />;
        }
        if (key === "back") {
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel="Delete digit"
              onPress={onBackspace}
              style={({ pressed }) => [styles.keyCell, pressed && styles.keyPressed]}
            >
              <Delete size={theme.iconSize.lg} color={theme.colors.textPrimary} />
            </Pressable>
          );
        }
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Digit ${key}`}
            onPress={() => onDigit(key)}
            style={({ pressed }) => [styles.keyCell, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyLabel}>{key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: t.spacing[4],
    marginVertical: t.spacing[4],
  },
  dot: { width: 16, height: 16, borderRadius: t.radii.full },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: t.spacing[10],
    paddingBottom: 30,
  },
  keyCell: {
    height: 56,
    width: "33.333%",
    alignItems: "center",
    justifyContent: "center",
  },
  keyPressed: { opacity: t.opacity.pressed },
  keyLabel: {
    fontSize: 24,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textPrimary,
  },
}));
