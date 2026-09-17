import { Text, View } from "react-native";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  Home,
  Lock,
  ScanFace,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  Wallet,
} from "lucide-react-native";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Typography } from "@/components/ui/Typography";
import { BrandMark } from "@/components/app/BrandMark";
import { SoftCard, CircleButton, VariantTag } from "./core";
import { FamilyStripCell, type FamilyMemberRef } from "./family";
import type { ProductUser } from "./product";
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
