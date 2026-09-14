import { View } from "react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { Typography } from "@/components/ui/Typography";
import { Alert } from "@/components/composite/Alert";
import { Card, CardContent } from "@/components/composite/Card";
import { ShowcasePage } from "../demos";
import { AuthScreens } from "../screens/auth";
import { SecurityScreens } from "../screens/security";
import { IdentityScreens } from "../screens/identity";
import { FaceScreens } from "../screens/face";
import { FamilyScreens } from "../screens/family";
import { BookingScreens } from "../screens/bookings";

const COVERAGE = [
  { group: "Auth & recovery", endpoints: 8, calls: "register Â· verify-otp Ã—3 Â· account-details Â· login Â· forgot/reset-password Â· logout" },
  { group: "Profile & security", endpoints: 7, calls: "user/me GET/PUT/DELETE Â· change-password Â· verify/change-pin Â· biometric-consent" },
  { group: "Identity & documents", endpoints: 9, calls: "identity/summary Â· documents CRUD+issued Â· verification-sessions create/verify/poll" },
  { group: "Liveness & face", endpoints: 6, calls: "challenge Â· evidence Â· finalize Â· status Â· face enroll/update" },
  { group: "Family", endpoints: 5, calls: "family list/detail Â· add/remove Â· activity" },
  { group: "Bookings & notifications", endpoints: 3, calls: "bookings list/detail Â· notifications inbox" },
];

const useStyles = makeStyles((t) => ({
  intro: { gap: t.spacing[2] },
  covRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing[3],
    paddingVertical: t.spacing[2],
  },
  covText: { flex: 1, gap: 2 },
}));

/**
 * Static API-reference screens â€” every customer-facing GET/POST/PUT/DELETE
 * on the BFF rendered as a contract-accurate mockup. Presentation only;
 * no network calls. Shapes follow docs/CUSTOMER_APP_FRONTEND_INTEGRATION.md.
 */
export function ScreensSection() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const total = COVERAGE.reduce((n, c) => n + c.endpoints, 0);

  return (
    <ShowcasePage>
      <View style={styles.intro}>
        <Typography variant="h2">Customer app screens</Typography>
        <Typography color="secondary">
          Static reference designs for the full customer BFF surface ({total} endpoints).
          Each frame shows the exact call it represents â€” request shape, response fields
          and edge states from the integration contract.
        </Typography>
        <Alert variant="info" title="Read-only reference">
          These are design targets, not wired screens. The app calls only /cb/* on the BFF â€”
          never internal services.
        </Alert>
        <Card>
          <CardContent>
            {COVERAGE.map((c) => (
              <View key={c.group} style={styles.covRow}>
                <View style={styles.covText}>
                  <Typography variant="body">{c.group}</Typography>
                  <Typography variant="caption" color="muted" numberOfLines={2}>
                    {c.calls}
                  </Typography>
                </View>
                <Typography variant="body-sm" color="muted" style={{ fontFamily: theme.fontFamily.mono.medium }}>
                  {c.endpoints}
                </Typography>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      <AuthScreens />
      <SecurityScreens />
      <IdentityScreens />
      <FaceScreens />
      <FamilyScreens />
      <BookingScreens />
    </ShowcasePage>
  );
}

