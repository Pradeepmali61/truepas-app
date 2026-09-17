import { Pulse } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type FlowStepState = 'done' | 'active' | 'pending' | 'error';
export type FlowStepStatus = FlowStepState | 'failed';

export interface FlowStepItem {
  label: string;
  state: FlowStepState;
}

/**
 * Staged flow rows — done check / pulsing active dot / hollow pending dot /
 * error icon. The visual pattern from the design-repo verification frames,
 * made a shared component for processing screens (document upload, family
 * add, liveness finalize).
 */
export function FlowStepRow({
  state,
  label,
  trailing,
}: {
  state: FlowStepState;
  label: string;
  trailing?: ReactNode;
}) {
  const t = useThemeTokens();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3], minHeight: 28 }}
      accessibilityState={{ busy: state === 'active' }}>
      {state === 'done' && <CircleCheck size={iconSize.md} color={t.colors.success} />}
      {state === 'error' && <CircleAlert size={iconSize.md} color={t.colors.error} />}
      {state === 'active' && (
        <Pulse to={1.3} ms={700}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: t.radii.full,
              backgroundColor: t.colors.actionPrimary,
              marginHorizontal: 2,
            }}
          />
        </Pulse>
      )}
      {state === 'pending' && (
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: t.radii.full,
            borderWidth: 2,
            borderColor: t.colors.borderStrong,
            marginHorizontal: 2,
          }}
        />
      )}
      <Text
        style={{
          flex: 1,
          fontSize: t.fontSize.base,
          color:
            state === 'error'
              ? t.colors.error
              : state === 'active'
                ? t.colors.textPrimary
                : state === 'done'
                  ? t.colors.textSecondary
                  : t.colors.textMuted,
          ...(state === 'active' ? { fontWeight: '600' as const } : null),
        }}>
        {label}
      </Text>
      {trailing}
    </View>
  );
}

/** A vertical stack of flow steps driven by a step list. */
export function FlowSteps({ steps, gap }: { steps: FlowStepItem[]; gap?: number }) {
  const t = useThemeTokens();
  return (
    <View style={{ gap: gap ?? t.spacing[3] }}>
      {steps.map((s, i) => (
        <FlowStepRow key={`${s.label}-${i}`} state={s.state} label={s.label} />
      ))}
    </View>
  );
}

/**
 * Index-driven variant — steps before `index` are done, the step at `index`
 * is active, the rest pending. `status: "failed"` marks the active step error.
 */
export function StagedFlow({
  steps,
  index,
  status = 'active',
}: {
  steps: string[];
  index: number;
  status?: FlowStepStatus;
}) {
  return (
    <FlowSteps
      steps={steps.map((label, i) => ({
        label,
        state:
          i < index ? 'done' : i === index ? (status === 'failed' ? 'error' : status) : 'pending',
      }))}
    />
  );
}
