import { View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  style?: StyleProp<ViewStyle>;
}

export function Divider({ orientation = "horizontal", style }: DividerProps) {
  const styles = useStyles();
  return (
    <View
      style={[styles.base, styles[orientation], style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const useStyles = makeStyles((t) => ({
  base: { backgroundColor: t.colors.borderSubtle },
  horizontal: { height: 1, alignSelf: "stretch" },
  vertical: { width: 1, alignSelf: "stretch" },
}));
