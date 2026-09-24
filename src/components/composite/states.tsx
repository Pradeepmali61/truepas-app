import { CircleAlert, Inbox } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

interface StateShellProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

function StateShell({ icon, title, description, action, compact, style }: StateShellProps) {
  const styles = useStyles();
  return (
    <View style={[styles.shell, compact && styles.compact, style]}>
      {icon != null && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description != null && <Text style={styles.description}>{description}</Text>}
      {action != null && <View style={styles.action}>{action}</View>}
    </View>
  );
}

export interface EmptyStateProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ title = "Nothing here yet", description, icon, action, compact, style }: EmptyStateProps) {
  const theme = useThemeTokens();
  return (
    <StateShell
      icon={icon ?? <Inbox size={iconSize.lg} color={theme.colors.textMuted} />}
      title={title}
      description={description}
      action={action}
      compact={compact}
      style={style}
    />
  );
}

export interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Try again.",
  onRetry,
  retryLabel = "Try again",
  compact,
  style,
}: ErrorStateProps) {
  const theme = useThemeTokens();
  return (
    <StateShell
      icon={<CircleAlert size={iconSize.lg} color={theme.colors.error} />}
      title={title}
      description={description}
      compact={compact}
      style={style}
      action={onRetry ? <Button variant="outline" size="sm" onPress={onRetry}>{retryLabel}</Button> : undefined}
    />
  );
}

export interface LoadingStateProps {
  label?: string;
  fullPage?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({ label = "Loading…", fullPage, style }: LoadingStateProps) {
  const styles = useStyles();
  return (
    <View style={[styles.loading, fullPage && styles.fullPage, style]} accessibilityRole="progressbar" accessibilityLabel={label}>
      <Spinner size="lg" label={label} />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  shell: {
    alignItems: "center",
    justifyContent: "center",
    padding: t.spacing[12],
    paddingHorizontal: t.spacing[6],
    gap: t.spacing[2],
  },
  compact: { padding: t.spacing[6], paddingHorizontal: t.spacing[4] },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: t.spacing[2],
  },
  title: { fontSize: t.fontSize.md, fontWeight: t.fontWeight.semibold, color: t.colors.textPrimary, textAlign: "center" },
  description: { fontSize: t.fontSize.base, color: t.colors.textSecondary, textAlign: "center" },
  action: { marginTop: t.spacing[3] },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[3],
    padding: t.spacing[8],
  },
  fullPage: { flex: 1, minHeight: 256 },
  loadingLabel: { fontSize: t.fontSize.sm, color: t.colors.textMuted },
}));
