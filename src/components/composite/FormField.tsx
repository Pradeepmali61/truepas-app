import { CircleAlert, CircleCheck } from "lucide-react-native";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Label } from "../ui/Label";
import { useFieldLabelStyle } from "./FieldLabelStyle";

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
  const overlap = useFieldLabelStyle().labelStyle === "overlap" && label != null;

  const control = isValidElement(children)
    ? cloneElement(children, {
        state: error ? "error" : success ? "success" : (children.props as { state?: string }).state,
        editable: disabled ? false : (children.props as { editable?: boolean }).editable,
        accessibilityInvalid: !!error,
      } as Record<string, unknown>)
    : children;

  return (
    <View style={[styles.field, overlap && styles.fieldOverlap, style]}>
      {label != null && !overlap && (
        <Label required={required} disabled={disabled}>
          {label}
        </Label>
      )}
      {description != null && (
        <Text style={[styles.description, overlap && styles.descriptionOverlap]}>{description}</Text>
      )}
      <View>
        {overlap && (
          <View pointerEvents="none" style={styles.overlapLabel}>
            <Label required={required} disabled={disabled} style={styles.overlapLabelText}>
              {label}
            </Label>
          </View>
        )}
        {control}
      </View>
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
  fieldOverlap: { marginTop: t.spacing[3] },
  overlapLabel: {
    position: "absolute",
    top: -10,
    left: t.spacing[3],
    zIndex: 1,
    // Screens paint `colors.background`; the chip doubles as the border notch,
    // so it must match the screen — not the input's opaque `surface` fill.
    backgroundColor: t.colors.background,
    paddingHorizontal: t.spacing[1.5],
    borderRadius: t.radii.sm,
  },
  overlapLabelText: { fontSize: t.fontSize.sm },
  description: { fontSize: t.fontSize.sm, color: t.colors.textSecondary },
  // The chip protrudes 10px above the control, so the description needs at
  // least that much clearance on top of the field gap.
  descriptionOverlap: { marginBottom: t.sizes.labelGap },
  message: { flexDirection: "row", alignItems: "flex-start", gap: t.spacing[1.5] },
  errorText: { flex: 1, fontSize: t.fontSize.sm, color: t.colors.error },
  successText: { flex: 1, fontSize: t.fontSize.sm, color: t.colors.success },
  helper: { fontSize: t.fontSize.sm, color: t.colors.textMuted },
}));
