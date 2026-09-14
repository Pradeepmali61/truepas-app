import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { CircleAlert, CircleCheck } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Label } from "../ui/Label";

export interface FormFieldProps {
  label?: ReactNode;
  description?: ReactNode;
  /** Error message — icon + text + marks the control invalid */
  error?: ReactNode;
  success?: ReactNode;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** A single form control (Input, Select, …) — `state` is injected */
  children: ReactElement;
  style?: StyleProp<ViewStyle>;
}

export function FormField({
  label,
  description,
  error,
  success,
  helperText,
  required,
  disabled,
  children,
  style,
}: FormFieldProps) {
  const styles = useStyles();
  const theme = useThemeTokens();

  const control = isValidElement(children)
    ? cloneElement(children, {
        state: error ? "error" : success ? "success" : (children.props as { state?: string }).state,
        editable: disabled ? false : (children.props as { editable?: boolean }).editable,
        accessibilityInvalid: !!error,
      } as Record<string, unknown>)
    : children;

  return (
    <View style={[styles.field, style]}>
      {label != null && (
        <Label required={required} disabled={disabled}>
          {label}
        </Label>
      )}
      {description != null && <Text style={styles.description}>{description}</Text>}
      {control}
      {error != null && (
        <View style={styles.message} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <CircleAlert size={iconSize.sm} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {error == null && success != null && (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <CircleCheck size={iconSize.sm} color={theme.colors.success} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
      {error == null && success == null && helperText != null && (
        <Text style={styles.helper}>{helperText}</Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: { gap: t.spacing[1.5] },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  message: { flexDirection: "row", alignItems: "flex-start", gap: t.spacing[1.5] },
  errorText: { flex: 1, fontSize: t.fontSize.sm, color: t.colors.error },
  successText: { flex: 1, fontSize: t.fontSize.sm, color: t.colors.success },
  helper: { fontSize: t.fontSize.sm, color: t.colors.textMuted },
}));
