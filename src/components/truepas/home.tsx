/** @jsxImportSource react */
import { BrandMark } from "@/components/app/BrandMark";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Typography } from "@/components/ui/Typography";
import { alpha, makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import {
    ArrowRight,
    Bell,
    ChevronRight,
    CircleCheck,
    Clock,
    FileText,
    Home,
    Lock,
    MapPin,
    ScanFace,
    Search,
    ShieldCheck,
    Ticket,
    Users,
    Wallet
} from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";
import { CircleButton, SoftCard, VariantTag } from "./core";
import { FamilyStripCell, type FamilyMemberRef } from "./family";
import { formatCheckIn, type ProductBooking, type ProductUser } from "./product";
import { useStyles } from "./styles";

/* Home screens — four compositions of the same product primitives. */

const HOME_NAV = [
  { key: "home", label: "Home", Icon: Home },
  { key: "documents", label: "Docs", Icon: FileText },
  { key: "family", label: "Family", Icon: Users },
  { key: "history", label: "History", Icon: Clock },
] as const;

/** Static bottom bar — the same circles as the animated NavDemo. */
export function HomeNav({ active = "home" }: { active?: (typeof HOME_NAV)[number]["key"] }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.homeNavRow}>
      {HOME_NAV.map((it) => {
        const isActive = it.key === active;
        return (
          <View key={it.key} style={styles.homeNavItem}>
            <CircleButton
              tone={isActive ? "solid" : "plain"}
              label={it.label}
              icon={
                <it.Icon
                  size={iconSize.md}
                  color={isActive ? theme.colors.onActionPrimary : theme.colors.actionPrimary}
                />
              }
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** V1 — verification hero: the camera ring is the whole point. */
export function HomeVerifyHero() {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={styles.homeCard}>
      <VariantTag>1 · Verify-first</VariantTag>
      <View style={styles.rowBetween}>
        <BrandMark compact />
        <CircleButton label="Notifications" icon={<Bell size={iconSize.md} color={theme.colors.actionPrimary} />} />
      </View>
      <View style={styles.centerCol}>
        <Typography variant="h2">Verify your identity</Typography>
        <Typography color="secondary">Secure identity verification in seconds.</Typography>
      </View>
      <View style={styles.centerCol}>
        <View style={styles.heroRing}>
          <ScanFace size={44} color={theme.colors.actionPrimary} />
        </View>
        <View style={styles.rowCenter}>
          <Badge variant="success">Face detected</Badge>
          <Badge variant="info">Liveness ready</Badge>
        </View>
      </View>
      <Button
        fullWidth
        size="lg"
        iconRight={<ArrowRight size={iconSize.sm} color={theme.colors.onActionPrimary} />}
      >
        Verify identity
      </Button>
      <View style={[styles.rowCenter, { justifyContent: "center" }]}>
        <Lock size={12} color={theme.colors.textSecondary} />
        <Text style={styles.helper}>Your image is not stored</Text>
      </View>
      <HomeNav />
    </SoftCard>
  );
}

/** V2 — dashboard: greeting, status panel, 2×2 quick tiles. */
export function HomeDashboard({
  user,
  confidence = 98.7,
}: {
  user: ProductUser;
  confidence?: number;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const tiles = [
    { label: "Documents", sub: "4 stored", Icon: FileText },
    { label: "Family", sub: "3 members", Icon: Users },
    { label: "Check-ins", sub: "1 upcoming", Icon: Ticket },
    { label: "History", sub: "12 events", Icon: Clock },
  ];
  return (
    <SoftCard style={styles.homeCard}>
      <VariantTag>2 · Dashboard</VariantTag>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <Avatar name={user.fullName} size="lg" />
          <View style={{ gap: 2 }}>
            <Text style={styles.helper}>Good morning</Text>
            <Text style={styles.cardTitle}>{user.fullName.split(" ")[0]}</Text>
          </View>
        </View>
        <CircleButton label="Notifications" icon={<Bell size={iconSize.md} color={theme.colors.actionPrimary} />} />
      </View>
      <View style={styles.homePanel}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Identity verified</Text>
          <Badge variant="success">Verified</Badge>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.metric}>{confidence}%</Text>
          <Text style={styles.helper}>match confidence</Text>
        </View>
        <Progress value={confidence} variant="success" />
      </View>
      <View style={styles.quickGrid}>
        {tiles.map((t) => (
          <View key={t.label} style={styles.quickTile}>
            <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
              <t.Icon size={iconSize.md} color={theme.colors.onBrandSubtle} />
            </View>
            <Text style={styles.cardTitle}>{t.label}</Text>
            <Text style={styles.helper}>{t.sub}</Text>
          </View>
        ))}
      </View>
      <HomeNav />
    </SoftCard>
  );
}

/** V3 — feed: verified banner, family strip, document rows. */
export function HomeFeed({
  user,
  members,
}: {
  user: ProductUser;
  members: FamilyMemberRef[];
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const docs = [
    { label: "US Passport", status: "verified" as const },
    { label: "Driver licence", status: "review" as const },
  ];
  return (
    <SoftCard style={styles.homeCard}>
      <VariantTag>3 · Feed</VariantTag>
      <View style={styles.rowBetween}>
        <View style={{ gap: 2 }}>
          <Text style={styles.helper}>Good morning</Text>
          <Typography variant="h3">{user.fullName.split(" ")[0]}</Typography>
        </View>
        <Avatar name={user.fullName} size="lg" />
      </View>
      <View style={[styles.homePanel, { backgroundColor: theme.colors.successSubtle }]}>
        <View style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <CircleCheck size={iconSize.md} color={theme.colors.success} />
            <View style={{ gap: 2 }}>
              <Text style={styles.strong}>Verified</Text>
              <Text style={styles.helper}>98.7% match confidence</Text>
            </View>
          </View>
          <ChevronRight size={iconSize.sm} color={theme.colors.success} />
        </View>
      </View>
      <Text style={styles.helper}>Family</Text>
      <View style={styles.stripRow}>
        <FamilyStripCell name="Add" add />
        {members.map((m) => (
          <FamilyStripCell key={m.name} name={m.name} />
        ))}
      </View>
      <Text style={styles.helper}>Documents</Text>
      {docs.map((d) => (
        <View key={d.label} style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
              <FileText size={iconSize.md} color={theme.colors.onBrandSubtle} />
            </View>
            <Text style={styles.cardTitle}>{d.label}</Text>
          </View>
          <Badge variant={d.status === "verified" ? "success" : "warning"}>
            {d.status === "verified" ? "Verified" : "In review"}
          </Badge>
        </View>
      ))}
      <HomeNav />
    </SoftCard>
  );
}

/** V4 — command: search first, one task card, quiet shortcut rows. */
export function HomeCommand({ user }: { user: ProductUser }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const shortcuts = [
    { label: "Credentials", Icon: Wallet },
    { label: "Security & PIN", Icon: ShieldCheck },
    { label: "Activity", Icon: Clock },
  ];
  return (
    <SoftCard style={styles.homeCard}>
      <VariantTag>4 · Command</VariantTag>
      <Input
        placeholder="Search documents, people, check-ins"
        iconLeft={<Search size={iconSize.md} color={theme.colors.actionPrimary} />}
      />
      <View style={{ gap: 2 }}>
        <Typography variant="h2">Hi, {user.fullName.split(" ")[0]}.</Typography>
        <Typography color="secondary">Tuesday, 9 September</Typography>
      </View>
      <View style={styles.homePanel}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Finish verification</Text>
          <Text style={styles.helper}>2 of 3</Text>
        </View>
        <Progress value={66} />
        <Button fullWidth>Continue</Button>
      </View>
      <View>
        {shortcuts.map((s, i) => (
          <View key={s.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.historyRow}>
              <View style={[styles.productIcon, { backgroundColor: theme.colors.brandSubtle }]}>
                <s.Icon size={iconSize.md} color={theme.colors.onBrandSubtle} />
              </View>
              <Text style={[styles.cardTitle, { flex: 1 }]}>{s.label}</Text>
              <ChevronRight size={iconSize.sm} color={theme.colors.textSecondary} />
            </View>
          </View>
        ))}
      </View>
      <HomeNav />
    </SoftCard>
  );
}

/**
 * Next check-in hero — filled actionPrimary card (the deepest surface on the
 * Home tab). Shows the venue, the party's check-in progress as the standout
 * mono metric, and pushes to the booking detail on press.
 * Ported 1:1 from UI-design-repo `components/truepas/home.tsx`.
 */
export function NextCheckinCard({
  booking,
  onPress,
}: {
  booking: ProductBooking & { image?: string | null };
  onPress?: () => void;
}) {
  const styles = useStyles();
  const hero = useHeroStyles();
  const theme = useThemeTokens();
  const onPrimary = theme.colors.onActionPrimary;
  const checkedIn = booking.checkedInMembers.length;
  const progress = Math.min(1, checkedIn / Math.max(booking.guests, 1));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Next check-in at ${booking.venue}, ${booking.location}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={hero.card}>
        <View style={styles.rowBetween}>
          <Text style={hero.eyebrow}>Next check-in</Text>
          <View style={hero.statusPill}>
            <Text style={hero.statusText}>Upcoming</Text>
          </View>
        </View>
        <View style={hero.venueRow}>
          <View style={hero.venueText}>
            <Typography variant="h3" style={{ color: onPrimary }} numberOfLines={1}>
              {booking.venue}
            </Typography>
            <View style={hero.locRow}>
              <MapPin size={iconSize.sm} color={alpha(onPrimary, 0.75)} />
              <Text style={hero.locText} numberOfLines={1}>
                {booking.location}
              </Text>
            </View>
          </View>
          {booking.image != null && /^https?:\/\//.test(booking.image) && <Image source={{ uri: booking.image }} style={hero.thumb} />}
        </View>
        <View style={styles.rowBetween}>
          <View style={hero.metaItem}>
            <Text style={hero.metaLabel}>Check-in</Text>
            <Text style={hero.metaValue}>{formatCheckIn(booking.checkIn)}</Text>
          </View>
          <View style={hero.metaItem}>
            <Text style={hero.metaLabel}>Guests</Text>
            <Text style={hero.metaValue}>{booking.guests}</Text>
          </View>
          <View style={[hero.metaItem, hero.metaItemEnd]}>
            <Text style={hero.metaLabel}>Total</Text>
            <Text style={hero.metaValue}>${booking.amount.toFixed(2)}</Text>
          </View>
        </View>
        <View style={hero.countBlock}>
          <View style={hero.countRow}>
            <Text style={hero.count}>
              {checkedIn}
              <Text style={hero.countTotal}>/{booking.guests}</Text>
            </Text>
            <Text style={hero.countLabel}>checked in</Text>
          </View>
          <View style={hero.track}>
            <View style={[hero.fill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* Hero-card styles live here (not the shared sheet) — the violet fill
   inverts every color, so none of the shared surface styles apply. */
const useHeroStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.actionPrimary,
    borderRadius: t.radii.xl,
    padding: t.spacing[5],
    gap: t.spacing[4],
    ...t.shadows.lg,
  },
  eyebrow: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    letterSpacing: t.letterSpacing.caps,
    textTransform: "uppercase",
    color: alpha(t.colors.onActionPrimary, 0.7),
  },
  statusPill: {
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[1],
    borderRadius: t.radii.full,
    backgroundColor: alpha(t.colors.onActionPrimary, 0.16),
  },
  statusText: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.onActionPrimary,
  },
  venueRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  venueText: { flex: 1, gap: 4 },
  locRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[1.5] },
  locText: { fontSize: t.fontSize.sm, color: alpha(t.colors.onActionPrimary, 0.75) },
  thumb: { width: 56, height: 56, borderRadius: t.radii.lg },
  metaItem: { gap: 2 },
  metaItemEnd: { alignItems: "flex-end" },
  metaLabel: { fontSize: t.fontSize.xs, color: alpha(t.colors.onActionPrimary, 0.6) },
  metaValue: {
    fontFamily: t.fontFamily.mono.medium,
    fontSize: t.fontSize.sm,
    color: t.colors.onActionPrimary,
  },
  countBlock: { gap: t.spacing[2] },
  countRow: { flexDirection: "row", alignItems: "baseline", gap: t.spacing[2] },
  count: {
    fontFamily: t.fontFamily.mono.bold,
    fontSize: t.fontSize["3xl"],
    color: t.colors.onActionPrimary,
    letterSpacing: t.letterSpacing.tight,
  },
  countTotal: {
    fontFamily: t.fontFamily.mono.medium,
    fontSize: t.fontSize.xl,
    color: alpha(t.colors.onActionPrimary, 0.6),
  },
  countLabel: { fontSize: t.fontSize.sm, color: alpha(t.colors.onActionPrimary, 0.75) },
  track: {
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: alpha(t.colors.onActionPrimary, 0.25),
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: t.radii.full, backgroundColor: t.colors.onActionPrimary },
}));
