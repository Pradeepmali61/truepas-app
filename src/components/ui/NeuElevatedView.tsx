import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

import { getNeuBoxShadow, Neumorphism } from '@/constants/theme';

interface NeuElevatedViewProps extends ViewProps {
  baseColor?: string;
  className?: string;
}

const SHADOW_DISTANCE = 6;
const SHADOW_BLUR = 12;

export function NeuElevatedView({
  children,
  baseColor = Neumorphism.base,
  className = '',
  style,
  ...rest
}: NeuElevatedViewProps) {
  const colors = Neumorphism.getColors(baseColor);
  return (
    <View
      className={`${className}`}
      style={[
        { borderRadius: Neumorphism.radius, backgroundColor: colors.base },
        Platform.OS === 'web' ? ({ boxShadow: getNeuBoxShadow(baseColor) } as any) : null,
        Platform.OS === 'android' ? { elevation: 6 } : null,
        style,
      ]}
      {...rest}>
      {Platform.OS === 'ios' && (
        <>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: Neumorphism.radius,
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
                borderRadius: Neumorphism.radius,
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
      {Platform.OS === 'android' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: Neumorphism.radius,
              backgroundColor: colors.fillStart,
            },
          ]}
        />
      ) : (
        <LinearGradient
          colors={[colors.fillStart, colors.fillEnd]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={[StyleSheet.absoluteFill, { borderRadius: Neumorphism.radius }]}
        />
      )}
      {children}
    </View>
  );
}
