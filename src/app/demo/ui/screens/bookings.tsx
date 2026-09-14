import { View } from "react-native";
import { Bell, CalendarDays, CircleCheck, Clock3, Hotel, MapPin, Ticket } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/composite/Card";
import { EmptyState } from "@/components/composite/states";
import { Section } from "../demos";
import { ScreenFrame, RowIcon } from "./ScreenFrame";
import { Blink, FadeUp } from "./motion";
import { KV, Row, ScreenBody } from "./shared";
import { BOOKINGS, NOTIFICATIONS } from "./mock";

function bookingBadge(status: string) {
  const map: Record<string, { v: "success" | "info" | "neutral"; label: string }> = {
    completed: { v: "success", label: "Completed" },
    upcoming: { v: "info", label: "Upcoming" },
    cancelled: { v: "neutral", label: "Cancelled" },
  };
  const s = map[status] ?? { v: "neutral" as const, label: status };
  return <Badge variant={s.v}>{s.label}</Badge>;
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  rowText: { flex: 1, gap: 2 },
  amount: { fontFamily: t.fontFamily.mono.semibold, fontSize: t.fontSize.md, color: t.colors.textPrimary },
  dates: { flexDirection: "row", gap: t.spacing[3] },
  dateCell: { flex: 1, gap: 2 },
  hero: { gap: t.spacing[1] },
  notifRow: { flexDirection: "row", gap: t.spacing[3], paddingVertical: t.spacing[1] },
  notifDot: { width: 8, height: 8, borderRadius: t.radii.full, backgroundColor: t.colors.actionPrimary, marginTop: 6 },
  notifDotRead: { backgroundColor: "transparent" },
}));

export function BookingScreens() {
  const styles = useStyles();
  const theme = useThemeTokens();

  return (
    <Section title="Bookings & notifications">
      {/* ---------- GET /cb/bookings ---------- */}
      <ScreenFrame
        title="Booking history"
        method="GET"
        path="/cb/bookings"
        note="Projection is valid empty until the check-in event producer is connected"
      >
        <ScreenHeader title="History" subtitle="Your check-ins" />
        <ScreenBody>
          {BOOKINGS.map((b, i) => (
            <FadeUp key={b.id} delay={i * 110}>
              <Card onPress={() => {}}>
                <View style={styles.row}>
                  <RowIcon
                    tone={b.type === "hotel" ? "primary" : "info"}
                    icon={
                      b.type === "hotel" ? (
                        <Hotel size={iconSize.md} color={theme.colors.actionPrimary} />
                      ) : (
                        <Ticket size={iconSize.md} color={theme.colors.onInfoSubtle} />
                      )
                    }
                  />
                  <View style={styles.rowText}>
                    <Typography variant="body">{b.venue}</Typography>
                    <Typography variant="body-sm" color="muted">
                      {b.location} Â· {b.checkIn} â†’ {b.checkOut}
                    </Typography>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    {bookingBadge(b.status)}
                    <Typography style={styles.amount}>${b.amount.toFixed(2)}</Typography>
                  </View>
                </View>
              </Card>
            </FadeUp>
          ))}
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/bookings â€” empty ---------- */}
      <ScreenFrame
        title="Booking history â€” empty"
        method="GET"
        path="/cb/bookings"
        note="Legitimate production state until upstream events populate the projection"
        height={420}
      >
        <ScreenHeader title="History" subtitle="Your check-ins" />
        <ScreenBody>
          <EmptyState
            title="No bookings yet"
            description="When you check in at a venue with Truepas, it shows up here."
            icon={<CalendarDays size={iconSize.lg} color={theme.colors.textMuted} />}
            action={<Button variant="outline" size="sm">How check-in works</Button>}
          />
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/bookings/{bookingId} ---------- */}
      <ScreenFrame
        title="Booking detail"
        method="GET"
        path="/cb/bookings/{bookingId}"
        note="checkedInMembers contains person IDs â€” resolve names via family/user data"
        height={560}
      >
        <ScreenHeader title="Example Hotel" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.hero}>
            <View style={styles.row}>
              <RowIcon tone="primary" icon={<Hotel size={iconSize.lg} color={theme.colors.actionPrimary} />} />
              <View style={styles.rowText}>
                <Typography variant="h4">Example Hotel</Typography>
                <Typography variant="body-sm" color="secondary">
                  <MapPin size={iconSize.xs} color={theme.colors.textMuted} /> Orlando, FL
                </Typography>
              </View>
              {bookingBadge("completed")}
            </View>
          </View>
          <Card>
            <CardContent style={{ gap: 12 }}>
              <View style={styles.dates}>
                <View style={styles.dateCell}>
                  <KV label="Check-in" value="Sep 1, 2026" mono />
                </View>
                <View style={styles.dateCell}>
                  <KV label="Check-out" value="Sep 3, 2026" mono />
                </View>
              </View>
              <Divider />
              <View style={styles.dates}>
                <View style={styles.dateCell}>
                  <KV label="Guests" value="2" mono />
                </View>
                <View style={styles.dateCell}>
                  <KV label="Total" value="$499.00" mono />
                </View>
              </View>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Checked-in members</CardTitle>
            </CardHeader>
            <Row
              leading={<RowIcon tone="success" icon={<CircleCheck size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />}
              title="Ada Example"
              subtitle="Face check-in Â· Sep 1, 3:42 PM"
              trailing={<Badge variant="success">Checked in</Badge>}
            />
          </Card>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/notifications ---------- */}
      <ScreenFrame
        title="Notifications inbox"
        method="GET"
        path="/cb/notifications?limit=50&offset=0&unread_only=false"
        note="Push delivery not implemented â€” inbox reads only; paginate with limit/offset"
      >
        <ScreenHeader title="Notifications" subtitle="2 unread" />
        <ScreenBody>
          {NOTIFICATIONS.map((n) => (
            <View key={n.id} style={styles.notifRow} accessibilityRole="button">
              {n.read ? (
                <View style={[styles.notifDot, styles.notifDotRead]} />
              ) : (
                <Blink ms={1400} min={0.4}>
                  <View style={styles.notifDot} />
                </Blink>
              )}
              <View style={styles.rowText}>
                <Typography variant="body" style={{ fontWeight: n.read ? theme.fontWeight.regular : theme.fontWeight.semibold }}>
                  {n.title}
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  {n.body}
                </Typography>
                <Typography variant="caption" color="muted">
                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </Typography>
              </View>
              <RowIcon
                tone={n.read ? "neutral" : "primary"}
                icon={<Bell size={iconSize.sm} color={n.read ? theme.colors.textMuted : theme.colors.actionPrimary} />}
              />
            </View>
          ))}
          <Divider />
          <Button variant="outline" size="sm" style={{ alignSelf: "center" }}>
            Load more
          </Button>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/notifications â€” empty ---------- */}
      <ScreenFrame
        title="Notifications â€” empty"
        method="GET"
        path="/cb/notifications?unread_only=true"
        note="unread_only filter with no matches"
        height={400}
      >
        <ScreenHeader title="Notifications" subtitle="Unread" />
        <ScreenBody>
          <EmptyState
            title="You&apos;re all caught up"
            description="Identity, document and booking updates land here."
            icon={<Clock3 size={iconSize.lg} color={theme.colors.textMuted} />}
          />
        </ScreenBody>
      </ScreenFrame>
    </Section>
  );
}

