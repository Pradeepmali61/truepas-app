/**
 * StatusChip — contract status → feedback hue chip.
 *
 * Ported 1:1 from UI-design-repo `src/app/ui/chrome.tsx` (STATUS_TONE,
 * STATUS_LABEL, humanize, StatusChip).
 */
import { Text, View } from "react-native";
import { useThemeTokens } from "../../theme";

const STATUS_TONE = {
  verified: "success",
  approved: "success",
  completed: "success",
  active: "success",
  upcoming: "info",
  pending: "warning",
  pending_document: "warning",
  pending_liveness: "warning",
  review: "warning",
  missing: "neutral",
  incomplete: "neutral",
  failed: "error",
  rejected: "error",
  cancelled: "neutral",
  expired: "error",
} as const;

/** Contract enum → human copy. Falls back to a humanized status string. */
const STATUS_LABEL: Record<keyof typeof STATUS_TONE, string> = {
  verified: "Verified",
  approved: "Approved",
  completed: "Completed",
  active: "Active",
  upcoming: "Upcoming",
  pending: "Pending",
  pending_document: "Document needed",
  pending_liveness: "Liveness needed",
  review: "In review",
  missing: "Not added yet",
  incomplete: "Incomplete",
  failed: "Failed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

function humanize(status: string): string {
  const mapped = (STATUS_LABEL as Record<string, string>)[status.toLowerCase()];
  return mapped ?? status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusChip({ status }: { status: string }) {
  const t = useThemeTokens();
  const tone = ((STATUS_TONE as Record<string, string>)[status.toLowerCase()] ?? "neutral") as
    | "neutral"
    | "success"
    | "warning"
    | "error"
    | "info";
  const pair: Record<typeof tone, { bg: string; fg: string }> = {
    neutral: { bg: t.colors.surfaceSunken, fg: t.colors.textSecondary },
    success: { bg: t.colors.successSubtle, fg: t.colors.onSuccessSubtle },
    warning: { bg: t.colors.warningSubtle, fg: t.colors.onWarningSubtle },
    error: { bg: t.colors.errorSubtle, fg: t.colors.onErrorSubtle },
    info: { bg: t.colors.infoSubtle, fg: t.colors.onInfoSubtle },
  };
  return (
    <View
      style={{
        paddingHorizontal: t.spacing[2] + t.spacing[0.5],
        paddingVertical: t.spacing[1],
        borderRadius: t.radii.full,
        alignSelf: "flex-start",
        backgroundColor: pair[tone].bg,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: t.fontSize.xs,
          fontWeight: t.fontWeight.semibold,
          color: pair[tone].fg,
          maxWidth: 200,
        }}
      >
        {humanize(status)}
      </Text>
    </View>
  );
}
