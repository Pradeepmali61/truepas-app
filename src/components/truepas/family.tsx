import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
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
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SoftCard, CircleButton } from "./core";
import { useStyles } from "./styles";

/* Family members — avatar strip, profile, access request, chat, week strip. */

export interface FamilyMemberRef {
  name: string;
}
export interface FamilyMemberFull extends FamilyMemberRef {
  relationship?: string;
}

const DEFAULT_MESSAGES = [
  { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat." },
  { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { out: true, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
];
export function FamilyStripCell({
  name,
  add,
  you,
  onPress,
}: {
  name: string;
  add?: boolean;
  you?: boolean;
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
          style={({ pressed }) => [styles.stripAdd, pressed && styles.pressed]}
        >
          <UserPlus size={iconSize.md} color={theme.colors.actionPrimary} />
        </Pressable>
      ) : (
        <View style={styles.stripRing}>
          <Avatar name={name} size="lg" />
        </View>
      )}
      <Text style={styles.stripName} numberOfLines={1}>
        {you ? "You" : name.split(" ")[0]}
      </Text>
    </View>
  );
}

/** Horizontal member strip — add slot, ringed avatars, scroll chevron. */
export function FamilyStrip({
  members,
  youIndex = 0,
  onAdd,
}: {
  members: FamilyMemberRef[];
  youIndex?: number;
  onAdd?: () => void;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={styles.wideCard}>
      <Text style={styles.helper}>family members</Text>
      <View style={styles.stripRow}>
        <FamilyStripCell name="Add" add onPress={onAdd} />
        {members.map((m, i) => (
          <FamilyStripCell key={m.name} name={m.name} you={i === youIndex} />
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="More members" style={styles.stripChevron}>
          <ChevronRight size={iconSize.sm} color={theme.colors.actionPrimary} />
        </Pressable>
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
              size={12}
              color={i < stars ? theme.colors.actionPrimary : theme.colors.borderStrong}
              fill={i < stars ? theme.colors.actionPrimary : "transparent"}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {email && <ContactRow icon={<Mail size={12} color={theme.colors.actionPrimary} />} text={email} />}
        {phone && <ContactRow icon={<Phone size={12} color={theme.colors.actionPrimary} />} text={phone} />}
        {address && <ContactRow icon={<MapPin size={12} color={theme.colors.actionPrimary} />} text={address} />}
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
