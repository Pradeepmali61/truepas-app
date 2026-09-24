/** @jsxImportSource react */
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import {
    ChevronLeft,
    ChevronRight,
    Ellipsis,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    Send,
    Star,
    UserPlus,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { CircleButton, SoftCard } from "./core";
import { useStyles } from "./styles";

/* Family members — avatar strip, profile, access request, chat, week strip. */

export type FamilyStatusDot = "success" | "warning" | "error";

export interface FamilyMemberRef {
  name: string;
  /** Small status dot on the avatar — success/warning/error tone. */
  statusDot?: FamilyStatusDot;
}
export interface FamilyMemberFull extends FamilyMemberRef {
  relationship?: string;
}

const DEFAULT_MESSAGES = [
  { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat." },
  { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { out: true, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
];
/* Vivid signal colors — the theme's semantic tones are palette-muted
 * (violetLedger warning reads brown), but a status dot must read as
 * traffic-light green/yellow/red in every palette. */
const DOT_HEX: Record<FamilyStatusDot, string> = {
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
};

const DOT_LABEL: Record<FamilyStatusDot, string> = {
  success: "verified",
  warning: "action needed",
  error: "verification failed",
};

export function FamilyStripCell({
  name,
  add,
  you,
  selected,
  statusDot,
  onPress,
}: {
  name: string;
  add?: boolean;
  you?: boolean;
  selected?: boolean;
  statusDot?: FamilyStatusDot;
  onPress?: () => void;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.stripCell}>
      {add ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add family member"
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View style={styles.stripAdd}>
            <UserPlus size={iconSize.md} color={theme.colors.actionPrimary} />
          </View>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={statusDot ? `${name}, ${DOT_LABEL[statusDot]}` : name}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View>
            <View style={[styles.stripRing, selected && styles.stripRingSelected]}>
              <Avatar name={name} size="lg" />
            </View>
            {statusDot && (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: DOT_HEX[statusDot], borderColor: theme.colors.surface },
                ]}
              />
            )}
          </View>
        </Pressable>
      )}
      <Text style={[styles.stripName, selected && styles.stripNameSelected]} numberOfLines={1}>
        {you ? "You" : name.split(" ")[0]}
      </Text>
    </View>
  );
}

/** Horizontal member strip — pinned add slot, ringed avatars scroll beside it. */
export function FamilyStrip({
  members,
  youIndex = 0,
  onAdd,
  selectedIndex = 0,
  onSelect,
  style,
}: {
  members: FamilyMemberRef[];
  youIndex?: number;
  onAdd?: () => void;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  return (
    <SoftCard style={[styles.wideCard, style]}>
      <Text style={styles.helper}>family members</Text>
      <View style={styles.stripRow}>
        <FamilyStripCell name="Add" add onPress={onAdd} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stripScroll}
          contentContainerStyle={[styles.stripRow, styles.stripContent]}
        >
          {members.map((m, i) => (
            <FamilyStripCell
              key={m.name}
              name={m.name}
              you={i === youIndex}
              selected={i === selectedIndex}
              statusDot={m.statusDot}
              onPress={() => onSelect?.(i)}
            />
          ))}
        </ScrollView>
      </View>
    </SoftCard>
  );
}

/** Contact row inside the member profile card (mail / phone / address). */
export function ContactRow({ icon, text }: { icon: ReactNode; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.contactRow}>
      {icon}
      <Text style={styles.helper} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** Member profile — avatar, name, stars, contact rows, two actions. */
export function MemberProfileCard({
  member,
  stars = 4,
  email,
  phone,
  address,
}: {
  member: FamilyMemberRef;
  stars?: number;
  email?: string;
  phone?: string;
  address?: string;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={styles.productCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.helper}>member profile</Text>
        <Ellipsis size={iconSize.sm} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.centerCol}>
        <Avatar name={member.name} size="xl" />
        <Text style={styles.cardTitle}>{member.name}</Text>
        <View style={styles.starRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={14}
              color={i < stars ? theme.colors.actionPrimary : theme.colors.borderStrong}
              fill={i < stars ? theme.colors.actionPrimary : "transparent"}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {email && <ContactRow icon={<Mail size={14} color={theme.colors.actionPrimary} />} text={email} />}
        {phone && <ContactRow icon={<Phone size={14} color={theme.colors.actionPrimary} />} text={phone} />}
        {address && <ContactRow icon={<MapPin size={14} color={theme.colors.actionPrimary} />} text={address} />}
      </View>
      <Button fullWidth>Manage access</Button>
      <Button fullWidth variant="secondary" iconLeft={<MessageCircle size={iconSize.sm} color={theme.colors.actionPrimary} />}>
        Message
      </Button>
    </SoftCard>
  );
}

/** Access request — the "user review" card shape as a consent prompt. */
export function AccessRequestCard({
  member,
  role = "Guardian · family member",
  when,
  title,
  message,
}: {
  member: FamilyMemberRef;
  role?: string;
  when: string;
  title: string;
  message: string;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={styles.productCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.helper}>access request</Text>
        <Ellipsis size={iconSize.sm} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.rowCenter}>
        <Avatar name={member.name} size="sm" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.cardTitle}>{member.name}</Text>
          <Text style={styles.helper}>{role}</Text>
        </View>
        <Badge variant="warning">Pending</Badge>
      </View>
      <Text style={styles.helper}>{when}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.paragraph}>{message}</Text>
      <View style={styles.divider} />
      <Text style={styles.helper}>Share this document?</Text>
      <Button fullWidth>Approve</Button>
      <Button fullWidth variant="secondary">
        Decline
      </Button>
    </SoftCard>
  );
}

/** Member chat — bubbles, online presence, reply row ("Adam Suley" card). */
export function FamilyChatCard({
  member,
  when,
  messages = DEFAULT_MESSAGES,
}: {
  member: FamilyMemberRef;
  when?: string;
  messages?: { out?: boolean; text: string }[];
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={styles.productCard}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <View>
            <Avatar name={member.name} size="md" />
            <View style={[styles.onlineDot, { borderColor: theme.colors.surface }]} />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.cardTitle}>{member.name}</Text>
            <Text style={[styles.helper, { color: theme.colors.success }]}>online</Text>
          </View>
        </View>
        <View style={styles.rowCenter}>
          <CircleButton
            label="Add"
            icon={<Plus size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
          <Ellipsis size={iconSize.sm} color={theme.colors.textSecondary} />
        </View>
      </View>
      {when && <Text style={[styles.helper, styles.centerText]}>{when}</Text>}
      {messages.map((m, i) =>
        m.out ? (
          <View key={i} style={styles.bubbleOut}>
            <Text style={[styles.paragraph, { color: theme.colors.onActionPrimary }]}>{m.text}</Text>
          </View>
        ) : (
          <View key={i} style={styles.bubbleIn}>
            <Text style={styles.paragraph}>{m.text}</Text>
          </View>
        ),
      )}
      <View style={styles.chatInputRow}>
        <View style={{ flex: 1 }}>
          <Input placeholder="Write a reply…" />
        </View>
        <CircleButton
          tone="solid"
          label="Send"
          icon={<Send size={iconSize.sm} color={theme.colors.onActionPrimary} />}
        />
      </View>
    </SoftCard>
  );
}

/** Week strip — the "schedule" widget mapped to family check-in days. */
export function WeekStrip() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const days: { d: string; n: number; active?: boolean; dot?: boolean }[] = [
    { d: "Mon", n: 5 },
    { d: "Tue", n: 6 },
    { d: "Wed", n: 7, active: true },
    { d: "Thu", n: 8 },
    { d: "Fri", n: 9 },
    { d: "Sat", n: 10, dot: true },
    { d: "Sun", n: 11 },
  ];
  return (
    <SoftCard style={styles.wideCard}>
      <Text style={[styles.helper, styles.centerText]}>July 2026</Text>
      <View style={styles.rowBetween}>
        <CircleButton label="Previous week" icon={<ChevronLeft size={iconSize.md} color={theme.colors.actionPrimary} />} />
        <View style={styles.weekStripRow}>
          {days.map((day) => (
            <View key={day.d} style={[styles.weekDay, day.active && styles.weekDayActive]}>
              <Text style={[styles.helper, day.active && { color: theme.colors.onActionPrimary }]}>{day.d}</Text>
              <Text style={[styles.weekNum, day.active && { color: theme.colors.onActionPrimary }]}>{day.n}</Text>
              {day.dot && !day.active && (
                <View style={[styles.unreadDot, { alignSelf: "center" }]} />
              )}
            </View>
          ))}
        </View>
        <CircleButton label="Next week" icon={<ChevronRight size={iconSize.md} color={theme.colors.actionPrimary} />} />
      </View>
    </SoftCard>
  );
}
