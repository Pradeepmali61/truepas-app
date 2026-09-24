import { Check } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Button } from "../ui/Button";

export interface FormStep {
  key: string;
  title: string;
  description?: string;
  content: ReactNode;
  /** Return true/void to allow advancing; false stays */
  validate?: () => boolean | void | Promise<boolean | void>;
}

export interface MultiStepFormProps {
  steps: FormStep[];
  onComplete?: () => void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function MultiStepForm({ steps, onComplete, onCancel, submitting, submitLabel = "Submit", style }: MultiStepFormProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = async () => {
    if (step.validate) {
      setBusy(true);
      try {
        const ok = await step.validate();
        if (ok === false) return;
      } finally {
        setBusy(false);
      }
    }
    if (isLast) onComplete?.();
    else setIndex(index + 1);
  };

  return (
    <View style={[styles.form, style]}>
      <View style={styles.rail} accessibilityRole="progressbar" accessibilityLabel={`Step ${index + 1} of ${steps.length}: ${step.title}`}>
        {steps.map((s, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <View key={s.key} style={styles.railStep}>
              <View style={[styles.bubble, done && styles.bubbleDone, current && styles.bubbleCurrent]}>
                {done ? (
                  <Check size={iconSize.xs} color={theme.colors.onActionPrimary} strokeWidth={3} />
                ) : (
                  <Text style={[styles.bubbleText, current && styles.bubbleTextActive]}>{i + 1}</Text>
                )}
              </View>
              <Text
                style={[styles.railLabel, current && styles.railLabelActive]}
                numberOfLines={1}
                accessibilityElementsHidden
              >
                {s.title}
              </Text>
              {i < steps.length - 1 && <View style={[styles.connector, done && styles.connectorDone]} />}
            </View>
          );
        })}
      </View>

      <View style={styles.body}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.description != null && <Text style={styles.stepDesc}>{step.description}</Text>}
        <View style={styles.content}>{step.content}</View>
      </View>

      <View style={styles.footer}>
        {onCancel && (
          <Button variant="ghost" onPress={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <View style={styles.spacer} />
        {index > 0 && (
          <Button variant="outline" onPress={() => setIndex(index - 1)} disabled={submitting || busy}>
            Back
          </Button>
        )}
        <Button onPress={next} loading={busy || submitting}>
          {isLast ? submitLabel : "Next"}
        </Button>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  form: { gap: t.spacing[5] },
  rail: { flexDirection: "row", alignItems: "flex-start" },
  railStep: { flex: 1, alignItems: "center", gap: t.spacing[1] },
  bubble: {
    width: 30,
    height: 30,
    // Android: borderRadius > h/2 + borderWidth breaks the background fill.
    borderRadius: 14,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleDone: { backgroundColor: t.colors.actionPrimary, borderColor: t.colors.actionPrimary },
  bubbleCurrent: { borderColor: t.colors.actionPrimary, borderWidth: 2 },
  bubbleText: { fontSize: t.fontSize.xs, fontWeight: t.fontWeight.semibold, color: t.colors.textSecondary },
  bubbleTextActive: { color: t.colors.actionPrimary },
  railLabel: { fontSize: t.fontSize.xs, color: t.colors.textMuted },
  railLabelActive: { color: t.colors.actionPrimary, fontWeight: t.fontWeight.medium },
  connector: {
    position: "absolute",
    top: 14,
    left: "60%",
    right: "-40%",
    height: 1,
    backgroundColor: t.colors.borderSubtle,
    zIndex: -1,
  },
  connectorDone: { backgroundColor: t.colors.actionPrimary },
  body: { gap: t.spacing[2] },
  stepTitle: { fontSize: t.fontSize.xl, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary },
  stepDesc: { fontSize: t.fontSize.base, color: t.colors.textSecondary },
  content: { marginTop: t.spacing[3] },
  footer: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  spacer: { flex: 1 },
}));
