import { View } from "react-native";
import { makeStyles, useThemeTokens } from "@/theme";

interface StepperProps {
  total: number;
  done: number;
}

/** Segmented progress stepper — themed version of the legacy `.stepper`. */
export function Stepper({ total, done }: StepperProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={styles.row}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < done ? theme.colors.actionPrimary : theme.colors.surfaceSunken },
          ]}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", gap: 6, paddingHorizontal: t.spacing[6], paddingBottom: t.spacing[4] },
  segment: { height: 4, flex: 1, borderRadius: t.radii.full },
}));
