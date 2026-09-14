import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { TrendingDown, TrendingUp } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { Card } from "../composite/Card";
import { Skeleton } from "../ui/Skeleton";

export interface DashboardCardProps {
  title: ReactNode;
  value?: ReactNode;
  /** e.g. "+12.4%" or "-3.1%" */
  delta?: string;
  deltaLabel?: ReactNode;
  trend?: "up" | "down";
  icon?: ReactNode;
  loading?: boolean;
  /** Small chart/progress slot below the metric */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DashboardCard({
  title,
  value,
  delta,
  deltaLabel,
  trend,
  icon,
  loading,
  children,
  style,
}: DashboardCardProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const resolvedTrend = trend ?? (delta?.startsWith("-") ? "down" : delta ? "up" : undefined);

  if (loading) {
    return (
      <Card style={style}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="30%" />
      </Card>
    );
  }

  return (
    <Card style={style}>
      <View style={styles.top}>
        <Text style={styles.title}>{title}</Text>
        {icon}
      </View>
      {value != null && <Text style={styles.value}>{value}</Text>}
      {(delta != null || deltaLabel != null) && (
        <View style={styles.deltaRow}>
          {delta != null && (
            <>
              {resolvedTrend === "down" ? (
                <TrendingDown size={iconSize.xs} color={theme.colors.error} />
              ) : (
                <TrendingUp size={iconSize.xs} color={theme.colors.success} />
              )}
              <Text
                style={[
                  styles.delta,
                  { color: resolvedTrend === "down" ? theme.colors.error : theme.colors.success },
                ]}
              >
                {delta}
              </Text>
            </>
          )}
          {deltaLabel != null && <Text style={styles.deltaLabel}>{deltaLabel}</Text>}
        </View>
      )}
      {children != null && <View style={styles.chart}>{children}</View>}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium, color: t.colors.textSecondary },
  value: {
    marginTop: t.spacing[2],
    fontSize: t.fontSize["2xl"],
    fontWeight: t.fontWeight.bold,
    fontFamily: t.fontFamily.mono.bold,
    color: t.colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[1], marginTop: t.spacing[1] },
  delta: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.medium,
    fontFamily: t.fontFamily.mono.medium,
    fontVariant: ["tabular-nums"],
  },
  deltaLabel: { fontSize: t.fontSize.xs, color: t.colors.textMuted },
  chart: { marginTop: t.spacing[3] },
}));
