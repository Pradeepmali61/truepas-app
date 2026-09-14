import type { ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import { makeStyles } from "../../theme";

export interface LabelProps {
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
}

export function Label({ children, required, disabled, style }: LabelProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessibilityElementsHidden={false}>
      <Text style={[styles.label, disabled && styles.disabled, style]}>
        {children}
        {required && <Text style={styles.required}> *</Text>}
        {required && <Text style={styles.srOnly} accessibilityLabel="required" />}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: {},
  label: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.medium,
    color: t.colors.textPrimary,
  },
  disabled: { color: t.colors.textDisabled },
  required: { color: t.colors.error, fontWeight: t.fontWeight.semibold },
  srOnly: { fontSize: 0.1, color: "transparent" },
}));
