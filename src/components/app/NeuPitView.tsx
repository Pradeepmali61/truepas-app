import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { getNeuBoxShadow, getNeuColors, NEU_RADIUS, useNeuBase } from "./neumorphism";

interface NeuPitViewProps extends ViewProps {
  baseColor?: string;
}

export function NeuPitView({ children, baseColor, style, ...rest }: NeuPitViewProps) {
  const themeBase = useNeuBase();
  const base = baseColor ?? themeBase;
  const colors = getNeuColors(base);

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: NEU_RADIUS,
          backgroundColor: colors.base,
          borderTopColor: colors.dark,
          borderLeftColor: colors.dark,
          borderBottomColor: colors.light,
          borderRightColor: colors.light,
        },
        Platform.OS === "web" ? ({ boxShadow: getNeuBoxShadow(base, true, 4, 8) } as any) : null,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1.5, overflow: "hidden" },
});
