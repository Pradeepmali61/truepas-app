import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import {
    Car,
    ChevronDown,
    ChevronRight,
    Contact,
    CreditCard,
    FileText,
    Globe,
    Landmark,
    RefreshCw,
    Share,
    ShieldCheck
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SoftCard } from "./core";
import type { ProductDocument } from "./product";
import { useStyles } from "./styles";

/*
 * Document presentation — four variants over the real backend record
 * (identity_documents.as_dict). Selective by default: label, masked number,
 * status, expiry and match score are shown; extracted fields (DOB,
 * nationality, issuing state, images) stay hidden behind disclosure.
 */

export const DOC_ICON: Record<string, typeof FileText> = {
  passport: Globe,
  drivingLicense: Car,
  idCard: Contact,
  greenCard: CreditCard,
  birthCertificate: FileText,
  usVisa: Landmark,
};

function DocIcon({ doc, onDark = false, size = iconSize.md }: { doc: ProductDocument; onDark?: boolean; size?: number }) {
  const theme = useThemeTokens();
  const Icon = DOC_ICON[doc.type ?? ""] ?? FileText;
  return <Icon size={size} color={onDark ? theme.colors.onActionPrimary : theme.colors.onBrandSubtle} />;
}

/** Mirrors chrome.tsx StatusChip semantics so kit cards agree with app chips. */
const STATUS_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: "success", label: "Verified" },
  approved: { variant: "success", label: "Approved" },
  pending: { variant: "warning", label: "Pending" },
  review: { variant: "warning", label: "In review" },
  failed: { variant: "error", label: "Failed" },
  rejected: { variant: "error", label: "Rejected" },
  expired: { variant: "error", label: "Expired" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status.toLowerCase()] ?? {
    variant: "neutral" as const,
    label: status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
  };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function shortYear(date?: string | null) {
  if (!date) return "—";
  const [y, m] = date.split("-");
  return y && m ? `${m}/${y}` : date;
}

/** A · List row — the compact one for document lists. */
export function DocumentRow({ doc, onPress, style }: { doc: ProductDocument; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={[styles.productCard, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${doc.label}, ${doc.status}`}
        onPress={onPress}
        style={({ pressed }) => [styles.rowBetween, pressed && styles.pressed]}
      >
        <View style={[styles.rowCenter, { flex: 1 }]}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
            <DocIcon doc={doc} />
          </View>
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{doc.label}</Text>
            <Text style={styles.mono} numberOfLines={1}>{doc.number}</Text>
          </View>
        </View>
        <View style={styles.rowCenter}>
          <StatusBadge status={doc.status} />
          <ChevronRight size={iconSize.sm} color={theme.colors.textSecondary} />
        </View>
      </Pressable>
    </SoftCard>
  );
}

/** B · ID card — the physical-card presentation, solid brand surface. */
export function DocumentIdCard({ doc, style }: { doc: ProductDocument; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const on = theme.colors.onActionPrimary;
  return (
    <View style={[styles.card, styles.idCard, style]}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <DocIcon doc={doc} onDark />
          <Text style={[styles.idCardTitle, { color: on }]}>{doc.label}</Text>
        </View>
        <StatusBadge status={doc.status} />
      </View>
      <Text style={styles.idNumber}>{doc.number}</Text>
      <View style={styles.rowBetween}>
        <View style={{ gap: 2 }}>
          <Text style={[styles.idCardMeta, { color: on, letterSpacing: theme.letterSpacing.caps }]}>HOLDER</Text>
          <Text style={[styles.idCardMetaValue, { color: on }]}>{doc.extractedName ?? "—"}</Text>
        </View>
        <View style={{ gap: 2, alignItems: "flex-end" }}>
          <Text style={[styles.idCardMeta, { color: on, letterSpacing: theme.letterSpacing.caps }]}>EXPIRES</Text>
          <Text style={[styles.idCardMetaValue, { color: on }]}>{shortYear(doc.expiresAt)}</Text>
        </View>
      </View>
      <View style={styles.rowCenter}>
        <ShieldCheck size={14} color={on} />
        <Text style={[styles.idCardMeta, { color: on }]}>TruePas verified credential</Text>
      </View>
    </View>
  );
}

/** C · Detail — selective fields up front, extracted data behind disclosure. */
export function DocumentDetailCard({ doc }: { doc: ProductDocument }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [expanded, setExpanded] = useState(false);
  const rows: [string, string][] = [
    ["Number", doc.number],
    ["Holder", doc.extractedName ?? "—"],
    ["Added", doc.addedAt ? doc.addedAt.slice(0, 10) : "—"],
    ["Expires", doc.expiresAt ?? "—"],
    ["Match", doc.matchScore != null ? `${Math.round(doc.matchScore * 100)}%` : "—"],
    ["Source", doc.source ?? "—"],
  ];
  const sensitive: [string, string][] = [
    ["Date of birth", doc.extractedDob ?? "—"],
    ["Nationality", doc.nationality ?? "—"],
    ["Issuing state", doc.issuingState ?? "—"],
  ];
  return (
    <SoftCard style={styles.productCard}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
            <DocIcon doc={doc} />
          </View>
          <Text style={styles.cardTitle}>{doc.label}</Text>
        </View>
        <StatusBadge status={doc.status} />
      </View>
      <View style={styles.kvGrid}>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.kvItem}>
            <Text style={styles.helper}>{k}</Text>
            <Text style={styles.body}>{v}</Text>
          </View>
        ))}
      </View>
      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? "Hide extracted fields" : "View extracted fields"}
        onPress={() => setExpanded((e) => !e)}
        style={({ pressed }) => [styles.rowBetween, pressed && styles.pressed]}
      >
        <View style={styles.rowCenter}>
          <ShieldCheck size={iconSize.sm} color={theme.colors.actionPrimary} />
          <Text style={styles.link}>Extracted fields</Text>
        </View>
        {expanded ? (
          <ChevronDown size={iconSize.sm} color={theme.colors.actionPrimary} />
        ) : (
          <ChevronRight size={iconSize.sm} color={theme.colors.actionPrimary} />
        )}
      </Pressable>
      {expanded && (
        <View style={styles.kvGrid}>
          {sensitive.map(([k, v]) => (
            <View key={k} style={styles.kvItem}>
              <Text style={styles.helper}>{k}</Text>
              <Text style={styles.body}>{v}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.helper}>Sensitive fields stay hidden until needed.</Text>
    </SoftCard>
  );
}

/** D · Verify — match score and re-verify action up front. */
export function DocumentVerifyCard({
  doc,
  onShare,
  onReverify,
}: {
  doc: ProductDocument;
  /** Share handler — the Share button renders only when provided. */
  onShare?: () => void;
  /** Re-verify handler — the Re-verify button renders only when provided. */
  onReverify?: () => void;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const pct = doc.matchScore != null ? Math.round(doc.matchScore * 100) : null;
  return (
    <SoftCard style={styles.productCard}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
            <DocIcon doc={doc} />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.cardTitle}>{doc.label}</Text>
            <Text style={styles.helper}>Verified {doc.addedAt ? doc.addedAt.slice(0, 10) : "—"}</Text>
          </View>
        </View>
        <StatusBadge status={doc.status} />
      </View>
      <View style={styles.homePanel}>
        <View style={styles.rowBetween}>
          <Text style={styles.metric}>{pct != null ? `${pct}%` : "—"}</Text>
          <Text style={styles.helper}>document match</Text>
        </View>
        {pct != null && <Progress value={pct} />}
      </View>
      {(onShare || onReverify) && (
        <View style={styles.sheetActions}>
          {onShare && (
            <View style={{ flex: 1 }}>
              <Button
                fullWidth
                variant="secondary"
                onPress={onShare}
                iconLeft={<Share size={iconSize.sm} color={theme.colors.actionPrimary} />}
              >
                Share
              </Button>
            </View>
          )}
          {onReverify && (
            <View style={{ flex: 1 }}>
              <Button
                fullWidth
                onPress={onReverify}
                iconLeft={<RefreshCw size={iconSize.sm} color={theme.colors.onActionPrimary} />}
              >
                Re-verify
              </Button>
            </View>
          )}
        </View>
      )}
    </SoftCard>
  );
}

/** Add row — full-width solid CTA below a document list
 *  (design-repo family.tsx member detail "Add Maya's document" sticky action,
 *  inlined for scroll). */
export function AddDocumentButton({ onPress, label = "Add document", style }: { onPress?: () => void; label?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Button
      fullWidth
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
    >
      {label}
    </Button>
  );
}
