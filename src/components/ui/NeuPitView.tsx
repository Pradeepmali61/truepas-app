import { StyleSheet, View, ViewProps } from 'react-native';

import { getNeuBoxShadow, Neumorphism } from '@/constants/theme';

interface NeuPitViewProps extends ViewProps {
  baseColor?: string;
  className?: string;
}

export function NeuPitView({
  children,
  baseColor = Neumorphism.base,
  className = '',
  style,
  ...rest
}: NeuPitViewProps) {
  const colors = Neumorphism.getColors(baseColor);
  return (
    <View
      className={`${className}`}
      style={[
        styles.container,
        {
          borderRadius: Neumorphism.radius,
          backgroundColor: colors.base,
          borderTopColor: colors.dark,
          borderLeftColor: colors.dark,
          borderBottomColor: colors.light,
          borderRightColor: colors.light,
        },
        Platform.OS === 'web' ? ({ boxShadow: getNeuBoxShadow(baseColor, true, 4, 8) } as any) : null,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
});
