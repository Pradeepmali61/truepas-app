/** @jsxImportSource react */
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pulse } from "@/components/ui/motion";
import { Progress } from "@/components/ui/Progress";
import { Switch } from "@/components/ui/Switch";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import {
    Bell,
    ChevronRight,
    CircleCheck,
    Clock,
    FileText,
    Hotel,
    Lock,
    MapPin,
    ShieldCheck,
    Ticket,
    TriangleAlert,
    User
} from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { CircleButton, SoftCard, StepDots } from "./core";
import { useStyles } from "./styles";

/* TruePas product components — verification, documents, family, history. */

/** Design-repo home.tsx formatCheckIn — ISO or date-only → "Mon d, yyyy". */
export function formatCheckIn(iso: string): string {
  return new Date(iso.includes("T") ? iso : `${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface ProductDocument {
  label: string;
  number: string;
  status: string;
  expiresAt: string | null;
  matchScore?: number | null;
  type?: string;
  addedAt?: string;
  source?: string;
  extractedName?: string | null;
  extractedDob?: string | null;
  nationality?: string | null;
  issuingState?: string | null;
}
export interface ProductIssued {
  name: string;
  issuer: string;
  status: string;
  number: string;
  issuedAt: string;
}
export interface ProductBooking {
  venue: string;
  location: string;
  status: string;
  /** ISO date — formatted internally (design-repo formatCheckIn). */
  checkIn: string;
  guests: number;
  amount: number;
  checkedInMembers: unknown[];
  image?: string;
}
export interface ProductNotification {
  title: string;
  body: string;
  read: boolean;
  /** Optional timestamp line rendered under the body (e.g. "Sep 2"). */
  meta?: string;
}
export interface ProductUser {
  fullName: string;
  email: string;
  faceEnrolled: boolean;
}
export interface ProductMember {
  name: string;
  relationship: string;
  age: number;
  ageBand: string;
  verification: string;
  faceCaptureMode?: string;
  allowedCameras?: string[];
  profileImageUrl?: string | null;
}

export function VerificationStatusCard({
  state = "verified",
  style,
}: {
  state?: "verified" | "pending" | "failed";
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const map = {
    verified: {
      Icon: ShieldCheck,
      tone: theme.colors.success,
      subtle: theme.colors.successSubtle,
      title: "Identity verified",
      body: "All checks passed. You're ready for contactless check-in.",
      badge: <Badge variant="success">Verified</Badge>,
    },
    pending: {
      Icon: Clock,
      tone: theme.colors.warning,
      subtle: theme.colors.warningSubtle,
      title: "Review in progress",
      body: "Your passport is being checked. We'll notify you shortly.",
      badge: <Badge variant="warning">Pending</Badge>,
    },
    failed: {
      Icon: TriangleAlert,
      tone: theme.colors.error,
      subtle: theme.colors.errorSubtle,
      title: "Verification failed",
      body: "We couldn't confirm your identity. Retry with better lighting.",
      badge: <Badge variant="error">Failed</Badge>,
    },
  }[state];
  const { Icon } = map;

  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowBetween}>
        <View style={[styles.productIcon, { backgroundColor: map.subtle }]}>
          <Icon size={iconSize.md} color={map.tone} />
        </View>
        {map.badge}
      </View>
      <View style={{ gap: 4 }}>
        <Text style={styles.cardTitle}>{map.title}</Text>
        <Text style={styles.helper}>{map.body}</Text>
      </View>
    </SoftCard>
  );
}

/** Confidence gauge — SVG progress ring. */
export function ConfidenceRing({
  value = 98.7,
  label = "Match confidence",
  style,
}: {
  value?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const size = 134;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <SoftCard style={[styles.ringCard, style]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.colors.actionPrimarySubtle}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.colors.actionPrimary}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c}`}
            strokeDashoffset={c * (1 - value / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringValue}>{value}%</Text>
        </View>
      </View>
      <Text style={styles.helper}>{label}</Text>
    </SoftCard>
  );
}

/** Risk meter — level shown by segments AND text (never colour alone). */
export function RiskMeter({
  level = "low",
  style,
}: {
  level?: "low" | "medium" | "high";
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const filled = { low: 1, medium: 2, high: 3 }[level];
  const tone = { low: theme.colors.success, medium: theme.colors.warning, high: theme.colors.error }[level];
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowBetween}>
        <Text style={styles.helper}>Security assessment</Text>
        <Text style={[styles.riskLabel, { color: tone }]}>{level.toUpperCase()} RISK</Text>
      </View>
      <View style={styles.riskTrack}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.riskSeg, { backgroundColor: i < filled ? tone : theme.colors.surfaceSunken }]} />
        ))}
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.helper}>0</Text>
        <Text style={styles.helper}>100</Text>
      </View>
    </SoftCard>
  );
}

const DOC_STATUS: Record<string, { variant: "success" | "warning" | "error" | "neutral"; label: string }> = {
  verified: { variant: "success", label: "Verified" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "error", label: "Failed" },
  missing: { variant: "neutral", label: "Missing" },
};

/** Document card — type, masked number, status and expiry. */
export function DocumentCard({
  doc,
  onPress,
  style,
}: {
  doc: ProductDocument;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const status = DOC_STATUS[doc.status] ?? { variant: "neutral" as const, label: doc.status };
  const body = (
    <>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
            <FileText size={iconSize.md} color={theme.colors.onBrandSubtle} />
          </View>
          <View style={{ gap: 2, flexShrink: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{doc.label}</Text>
            <Text style={styles.mono} numberOfLines={1}>{doc.number}</Text>
          </View>
        </View>
        <Badge variant={status.variant}>{status.label}</Badge>
      </View>
      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={styles.helper}>Expires {doc.expiresAt ?? "—"}</Text>
        {doc.matchScore != null && <Text style={styles.mono}>{Math.round(doc.matchScore * 100)}% match</Text>}
      </View>
    </>
  );
  return (
    <SoftCard style={[styles.productCard, style]}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${doc.label}, ${doc.status}`}
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </SoftCard>
  );
}

/** Family member card — relationship, age band, capture mode. */
export function FamilyCard({ member, style }: { member: ProductMember; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const verified = member.verification === "verified";
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowBetween}>
        <View style={[styles.rowCenter, { flex: 1 }]}>
          <Avatar name={member.name} uri={member.profileImageUrl ?? undefined} size="lg" tinted />
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{member.name}</Text>
            <Text style={styles.helper} numberOfLines={1}>
              {member.relationship} · age {member.age}
            </Text>
          </View>
        </View>
        <Badge variant={verified ? "success" : "warning"}>
          {verified ? "Verified" : "Action needed"}
        </Badge>
      </View>
      <View style={styles.rowWrap}>
        <Badge variant="neutral">{member.faceCaptureMode === "liveness" ? "Liveness" : "Photo"}</Badge>
        <Badge variant="neutral">{member.ageBand} yrs</Badge>
        <Badge variant="neutral">{(member.allowedCameras ?? ["front"]).join(" + ")} cam</Badge>
      </View>
    </SoftCard>
  );
}

/** Issued credential — REAL ID, TSA PreCheck, etc. */
export function IssuedCard({ doc, style }: { doc: ProductIssued; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.actionPrimarySubtle }]}>
            <Ticket size={iconSize.md} color={theme.colors.actionPrimary} />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.cardTitle}>{doc.name}</Text>
            <Text style={styles.helper}>{doc.issuer}</Text>
          </View>
        </View>
        <Badge variant="success">{doc.status}</Badge>
      </View>
      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={styles.mono}>{doc.number}</Text>
        <Text style={styles.helper}>Issued {doc.issuedAt}</Text>
      </View>
    </SoftCard>
  );
}

const BOOKING_STATUS: Record<string, { variant: "success" | "info" | "neutral" | "error"; label: string }> = {
  completed: { variant: "success", label: "Completed" },
  upcoming: { variant: "info", label: "Upcoming" },
  cancelled: { variant: "neutral", label: "Cancelled" },
  failed: { variant: "error", label: "Failed" },
};

/** Booking / check-in card with the check-in progress. */
export function BookingCard({
  booking,
  onPress,
  style,
}: {
  booking: ProductBooking;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const completed = booking.status === "completed";
  const cancelled = booking.status === "cancelled";
  const status = BOOKING_STATUS[booking.status] ?? { variant: "neutral" as const, label: booking.status };
  const checkedIn = booking.checkedInMembers.length;
  const body = (
    <>
      {booking.image != null && /^https?:\/\//.test(booking.image) ? (
        <Image
          source={{ uri: booking.image }}
          style={{
            width: "100%",
            height: 98,
            borderRadius: theme.radii.md,
          }}
        />
      ) : null}
      <View style={styles.rowBetween}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{booking.venue}</Text>
          <View style={styles.pinRow}>
            <MapPin size={14} color={theme.colors.textMuted} />
            <Text style={styles.helper} numberOfLines={1}>{booking.location}</Text>
          </View>
        </View>
        <Badge variant={status.variant}>{status.label}</Badge>
      </View>
      <View style={styles.rowBetween}>
        <View style={{ gap: 2 }}>
          <Text style={styles.helper}>Check-in</Text>
          <Text style={styles.body} numberOfLines={1}>{formatCheckIn(booking.checkIn)}</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={styles.helper}>Guests</Text>
          <Text style={styles.body} numberOfLines={1}>{booking.guests}</Text>
        </View>
        <View style={{ gap: 2, alignItems: "flex-end" }}>
          <Text style={styles.helper}>Total</Text>
          <Text style={styles.body} numberOfLines={1}>${booking.amount.toFixed(2)}</Text>
        </View>
      </View>
      {!cancelled && (
        <>
          <View style={{ gap: theme.spacing[1] }}>
            <Text
              style={{
                fontFamily: theme.fontFamily.mono.semibold,
                fontSize: theme.fontSize["2xl"],
                color: theme.colors.textPrimary,
              }}
            >
              {checkedIn}/{booking.guests}
            </Text>
            <Text style={styles.helper}>checked in</Text>
          </View>
          <Progress
            value={completed ? 100 : Math.round((checkedIn / Math.max(booking.guests, 1)) * 100)}
          />
        </>
      )}
    </>
  );
  return (
    <SoftCard style={[styles.productCard, style]}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={booking.venue}
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </SoftCard>
  );
}

/** History row — one verification event. */
export function HistoryRow({
  title,
  meta,
  outcome,
  when,
  style,
}: {
  title: string;
  meta: string;
  outcome: "success" | "warning" | "error";
  when: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const tone = {
    success: { Icon: CircleCheck, color: theme.colors.success, bg: theme.colors.successSubtle },
    warning: { Icon: Clock, color: theme.colors.warning, bg: theme.colors.warningSubtle },
    error: { Icon: TriangleAlert, color: theme.colors.error, bg: theme.colors.errorSubtle },
  }[outcome];
  const { Icon } = tone;
  return (
    <View style={[styles.historyRow, style]}>
      <View style={[styles.productIcon, { backgroundColor: tone.bg }]}>
        <Icon size={iconSize.sm} color={tone.color} />
      </View>
      <View style={styles.grow}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.helper}>{meta}</Text>
      </View>
      <Text style={styles.helper}>{when}</Text>
    </View>
  );
}

/** Check-in row — compact booking row (design-repo bookings.tsx history row)
 *  on the app's list-row shape so it matches DocumentRow above it. */
export function CheckInRow({
  booking,
  onPress,
  style,
}: {
  booking: Pick<ProductBooking, "venue" | "location" | "status" | "checkIn"> & { type?: string };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const status = BOOKING_STATUS[booking.status] ?? { variant: "neutral" as const, label: booking.status };
  const Icon = booking.type?.toLowerCase() === "hotel" ? Hotel : Ticket;
  return (
    <SoftCard style={[styles.productCard, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${booking.venue}, ${status.label}`}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle, width: 50, height: 50 }]}>
              <Icon size={iconSize.lg} color={theme.colors.onBrandSubtle} />
            </View>
            <View style={{ gap: 2, flexShrink: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{booking.venue}</Text>
              <Text style={styles.helper} numberOfLines={1}>{booking.location} · {booking.checkIn}</Text>
            </View>
          </View>
          <View style={styles.rowCenter}>
            <Badge variant={status.variant} style={{ height: 30 }}>{status.label}</Badge>
            <ChevronRight size={iconSize.md} color={theme.colors.textSecondary} />
          </View>
        </View>
      </Pressable>
    </SoftCard>
  );
}

/** Liveness challenge progress card. */
export function LivenessStepsCard({
  steps,
  secondsLeft,
  total,
  current,
  title = "Liveness check",
  style,
}: {
  steps: { label: string; state: "done" | "active" | "pending" }[];
  /** Omit to hide the countdown (e.g. verification progress without a timer). */
  secondsLeft?: number;
  total: number;
  current: number;
  title?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{title}</Text>
        {secondsLeft != null && (
          <Text style={styles.mono}>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} left</Text>
        )}
      </View>
      {steps.map((s) => (
        <View key={s.label} style={styles.stepRow}>
          {s.state === "done" ? (
            <CircleCheck size={iconSize.md} color={theme.colors.success} />
          ) : s.state === "active" ? (
            <Pulse to={1.3} ms={700}>
              <View style={styles.stepActive} />
            </Pulse>
          ) : (
            <View
              style={[
                styles.stepActive,
                {
                  backgroundColor: "transparent",
                  borderWidth: 2,
                  borderColor: theme.colors.borderStrong,
                },
              ]}
            />
          )}
          <Text
            style={[
              styles.body,
              s.state === "active" && styles.strong,
              s.state === "pending" && { color: theme.colors.textMuted },
            ]}>
            {s.label}
          </Text>
        </View>
      ))}
      <StepDots total={total} current={current} />
    </SoftCard>
  );
}

/** Biometric consent card — explicit opt-in with the privacy promise. */
export function ConsentCard({
  value,
  onValueChange,
  style,
}: {
  /** Controlled value; falls back to internal state (default on) when omitted. */
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [internal, setInternal] = useState(true);
  const consent = value ?? internal;
  const setConsent = onValueChange ?? setInternal;
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
            <Lock size={iconSize.md} color={theme.colors.onBrandSubtle} />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.cardTitle}>Biometric consent</Text>
            <Text style={styles.helper}>Required for face check-in</Text>
          </View>
        </View>
        <Switch value={consent} onValueChange={setConsent} />
      </View>
      <Text style={styles.paragraph}>
        Your face template is encrypted and never shared with venues. You can
        revoke consent at any time.
      </Text>
    </SoftCard>
  );
}

/** Notification row with unread state. */
export function NotificationRow({ item, style }: { item: ProductNotification; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={[styles.historyRow, style]}>
      <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
        <Bell size={iconSize.sm} color={theme.colors.onBrandSubtle} />
      </View>
      <View style={styles.grow}>
        <View style={styles.rowCenter}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.helper} numberOfLines={2}>
          {item.body}
        </Text>
        {item.meta != null && <Text style={styles.helper}>{item.meta}</Text>}
      </View>
    </View>
  );
}

/** Profile header with verification badge. */
export function ProfileHeader({
  user,
  memberSince,
  avatar,
  style,
}: {
  user: ProductUser;
  /** Renders the divider + "Member since" row only when provided. */
  memberSince?: string;
  /** Replaces the default icon avatar (e.g. a photo avatar with upload badge). */
  avatar?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.rowCenter}>
        {avatar ?? (
          <View style={styles.avatar}>
            <User size={iconSize.lg} color={theme.colors.onActionPrimary} />
          </View>
        )}
        <View style={styles.grow}>
          <Text style={styles.cardTitle}>{user.fullName}</Text>
          <Text style={styles.helper}>{user.email}</Text>
        </View>
        {/* "Face enrolled" — a face-scoped fact, not the overall verified
            status (that's face + document, see /identity). */}
        {user.faceEnrolled && <Badge variant="success">Face enrolled</Badge>}
      </View>
      {memberSince != null && (
        <>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.helper}>Member since</Text>
            <Text style={styles.body}>{memberSince}</Text>
          </View>
        </>
      )}
    </SoftCard>
  );
}

/** Empty state for a list that has nothing yet. */
export function EmptyStateCard({
  title = "No documents yet",
  description = "Add a passport or licence to unlock contactless check-in.",
  actionLabel = "Add document",
  icon,
  onAction,
  style,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  /** Overrides the default FileText glyph (e.g. Ticket for check-ins). */
  icon?: ReactNode;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={[styles.productCard, style]}>
      <View style={styles.centerCol}>
        <CircleButton icon={icon ?? <FileText size={iconSize.md} color={theme.colors.actionPrimary} />} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.helper, styles.centerText]}>{description}</Text>
        {onAction && (
          <Button size="sm" onPress={onAction}>
            {actionLabel}
          </Button>
        )}
      </View>
    </SoftCard>
  );
}
