import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { getNeuBoxShadow, getNeuColors, NEU_RADIUS, useNeuBase } from "./neumorphism";

interface NeuElevatedViewProps extends ViewProps {
  baseColor?: string;
}

export function NeuElevatedView({ children, baseColor, style, ...rest }: NeuElevatedViewProps) {
  const themeBase = useNeuBase();
  const base = baseColor ?? themeBase;
  const colors = getNeuColors(base);
  const SHADOW_DISTANCE = 6;
  const SHADOW_BLUR = 12;

  return (
    <View
      style={[
        { borderRadius: NEU_RADIUS, backgroundColor: colors.base },
        Platform.OS === "web" ? ({ boxShadow: getNeuBoxShadow(base) } as any) : null,
        Platform.OS === "android" ? { elevation: 6 } : null,
        style,
      ]}
      {...rest}>
      {Platform.OS === "ios" && (
        <>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: NEU_RADIUS,
                backgroundColor: colors.base,
                shadowColor: colors.dark,
                shadowOffset: { width: SHADOW_DISTANCE, height: SHADOW_DISTANCE },
                shadowOpacity: 0.35,
                shadowRadius: SHADOW_BLUR,
              },
            ]}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: NEU_RADIUS,
                backgroundColor: colors.base,
                shadowColor: colors.light,
                shadowOffset: { width: -SHADOW_DISTANCE, height: -SHADOW_DISTANCE },
                shadowOpacity: 0.85,
                shadowRadius: SHADOW_BLUR,
              },
            ]}
          />
        </>
      )}
      {Platform.OS === "android" ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: NEU_RADIUS, backgroundColor: colors.fillStart },
          ]}
        />
      ) : (
        <LinearGradient
          colors={[colors.fillStart, colors.fillEnd]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={[StyleSheet.absoluteFill, { borderRadius: NEU_RADIUS }]}
        />
      )}
      {children}
    </View>
  );
}
