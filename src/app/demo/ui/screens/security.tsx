import { View } from "react-native";
import { CircleCheck, Fingerprint, Lock, Mail, Pencil, Phone, ScanFace, ShieldCheck } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Divider } from "@/components/ui/Divider";
import { Alert } from "@/components/composite/Alert";
import { FormField } from "@/components/composite/FormField";
import { OtpInput } from "@/components/composite/OtpInput";
import { DatePicker } from "@/components/composite/DatePicker";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { Section } from "../demos";
import { ScreenFrame, RowIcon, StepDots } from "./ScreenFrame";
import { FadeUp, PopIn } from "./motion";
import { KV, Row, ScreenBody, StickyFooter } from "./shared";
import { USER } from "./mock";

const useStyles = makeStyles((t) => ({
  profileHead: { alignItems: "center", gap: t.spacing[2], paddingVertical: t.spacing[2] },
  sectionLabel: { marginTop: t.spacing[2] },
  consentIllustration: {
    width: 88,
    height: 88,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  center: { alignItems: "center", gap: t.spacing[1] },
  card: {
    padding: t.spacing[4],
    borderRadius: t.radii.xl,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.surface,
    gap: t.spacing[3],
  },
}));

export function SecurityScreens() {
  const styles = useStyles();
  const theme = useThemeTokens();

  return (
    <Section title="Profile & security">
      {/* ---------- GET /cb/user/me ---------- */}
      <ScreenFrame
        title="Profile"
        method="GET"
        path="/cb/user/me"
        note="User object from AuthResponse â€” email/phone read-only until destination verification ships"
      >
        <ScreenHeader
          title="Profile"
          actions={<Button variant="ghost" size="sm" iconLeft={<Pencil size={iconSize.sm} color={theme.colors.actionPrimary} />}>Edit</Button>}
        />
        <ScreenBody>
          <View style={styles.profileHead}>
            <PopIn>
              <Avatar name={USER.fullName} size="xl" />
            </PopIn>
            <Typography variant="h3">{USER.fullName}</Typography>
            {USER.faceEnrolled ? (
              <Badge variant="success" icon={<CircleCheck size={iconSize.xs} color={theme.colors.onSuccessSubtle} />}>
                Face ID enrolled
              </Badge>
            ) : (
              <Badge variant="warning">Face ID not enrolled</Badge>
            )}
          </View>
          <View style={styles.card}>
            <Row
              leading={<RowIcon icon={<Mail size={iconSize.md} color={theme.colors.textSecondary} />} />}
              title={USER.email}
              subtitle="Email"
            />
            <Divider />
            <Row
              leading={<RowIcon icon={<Phone size={iconSize.md} color={theme.colors.textSecondary} />} />}
              title={USER.phone}
              subtitle="Mobile"
            />
            <Divider />
            <Row
              leading={<RowIcon icon={<Fingerprint size={iconSize.md} color={theme.colors.textSecondary} />} tone="primary" />}
              title="Biometric consent"
              subtitle={`Granted ${new Date(USER.biometricConsentAt!).toLocaleDateString()}`}
            />
          </View>
          <View style={styles.card}>
            <Row title="Change password" trailing={<Typography color="muted">â€º</Typography>} onPress={() => {}} />
            <Divider />
            <Row title="Change PIN" trailing={<Typography color="muted">â€º</Typography>} onPress={() => {}} />
            <Divider />
            <Row
              title={<Typography color="error">Delete account</Typography>}
              trailing={<Typography color="muted">â€º</Typography>}
              onPress={() => {}}
            />
          </View>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- PUT /cb/user/me ---------- */}
      <ScreenFrame
        title="Edit profile"
        method="PUT"
        path="/cb/user/me"
        note="{ fullName, dateOfBirth, address } â€” email & phone rejected with 409 until re-verification exists"
        height={520}
      >
        <ScreenHeader title="Edit profile" onBack={() => {}} />
        <ScreenBody>
          <FormField label="Full name">
            <Input defaultValue={USER.fullName} />
          </FormField>
          <FormField label="Date of birth">
            <DatePicker value="1990-01-02" maxDate="2026-12-31" />
          </FormField>
          <FormField label="Address" helperText="Optional â€” used for venue pre-fill.">
            <Input placeholder="1 Example Street, Orlando, FL" />
          </FormField>
          <FormField label="Email" description="Locked â€” contact support to change.">
            <Input defaultValue={USER.email} editable={false} iconRight={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <FormField label="Phone" description="Locked â€” contact support to change.">
            <Input defaultValue={USER.phone} editable={false} iconRight={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Save changes</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/verify-pin ---------- */}
      <ScreenFrame
        title="Verify PIN â€” security gate"
        method="POST"
        path="/cb/auth/verify-pin"
        note='{ "pin": "1234" } â€” gates face update, delete account and other sensitive actions'
      >
        <ScreenHeader title="Confirm it&apos;s you" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.center}>
            <RowIcon tone="primary" icon={<ShieldCheck size={iconSize.lg} color={theme.colors.actionPrimary} />} />
            <Typography variant="h3">Enter your PIN</Typography>
            <Typography color="secondary" center>
              Required before changing security settings.
            </Typography>
          </View>
          <OtpInput length={4} value="12" accessibilityLabel="Account PIN" />
          <Alert variant="error" title="1 attempt remaining">
            Too many wrong tries locks the app for 5 minutes.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg" disabled>Continue</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/change-pin ---------- */}
      <ScreenFrame
        title="Change PIN"
        method="POST"
        path="/cb/auth/change-pin"
        note='{ "currentPin": "1234", "newPin": "5678" }'
      >
        <ScreenHeader title="Change PIN" onBack={() => {}} />
        <ScreenBody>
          <StepDots total={2} current={1} />
          <View style={styles.center}>
            <Typography variant="h3">Choose a new PIN</Typography>
            <Typography color="secondary" center>
              4 digits. Avoid birthdays and repeated numbers.
            </Typography>
          </View>
          <FormField label="New PIN">
            <OtpInput length={4} accessibilityLabel="New PIN" />
          </FormField>
          <FormField label="Confirm new PIN">
            <OtpInput length={4} accessibilityLabel="Confirm new PIN" />
          </FormField>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg" disabled>Update PIN</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/change-password ---------- */}
      <ScreenFrame
        title="Change password"
        method="POST"
        path="/cb/auth/change-password"
        note="Success revokes refresh sessions and the current access token â€” return to login"
        height={500}
      >
        <ScreenHeader title="Change password" onBack={() => {}} />
        <ScreenBody>
          <FormField label="Current password" required>
            <Input secureTextEntry placeholder="Current password" iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <FormField label="New password" required helperText="8+ characters, one number, one symbol.">
            <Input secureTextEntry placeholder="New password" iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <FormField label="Confirm new password" required>
            <Input secureTextEntry placeholder="Repeat password" iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <Alert variant="warning" title="You&apos;ll be signed out">
            All sessions end when the password changes. Sign in again afterwards.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Update password</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/user/me/biometric-consent ---------- */}
      <ScreenFrame
        title="Biometric consent"
        method="POST"
        path="/cb/user/me/biometric-consent"
        note='{ "accepted": true } â€” withdrawal deletes face templates then sets faceEnrolled=false'
        height={540}
      >
        <ScreenBody>
          <View style={styles.center}>
            <PopIn from={0.7}>
              <View style={styles.consentIllustration}>
                <ScanFace size={44} color={theme.colors.actionPrimary} />
              </View>
            </PopIn>
            <Typography variant="h2" center>
              Faster check-in with your face
            </Typography>
            <Typography color="secondary" center>
              Truepas stores an encrypted face template â€” never your photo â€” to verify it&apos;s really you at venues.
            </Typography>
          </View>
          <FadeUp delay={160}>
          <View style={styles.card}>
            <Row
              leading={<RowIcon tone="success" icon={<CircleCheck size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />}
              title="Encrypted on-device capture"
              subtitle="Liveness runs first â€” photos and masks are rejected."
            />
            <Divider />
            <Row
              leading={<RowIcon tone="success" icon={<CircleCheck size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />}
              title="Withdraw anytime"
              subtitle="Turning this off deletes your face template immediately."
            />
          </View>
          </FadeUp>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">I agree â€” continue</Button>
          <Button fullWidth variant="ghost">Not now</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- DELETE /cb/user/me ---------- */}
      <ScreenFrame
        title="Delete account"
        method="DELETE"
        path="/cb/user/me"
        note='{ "confirmation": "DELETE", "pin": "1234" } â€” removes face + documents before tombstone'
        height={500}
      >
        <ScreenHeader title="Delete account" onBack={() => {}} />
        <ScreenBody>
          <Alert variant="error" title="This can&apos;t be undone">
            Your identity, face template, documents and family links are permanently removed.
          </Alert>
          <View style={styles.card}>
            <KV label="Type DELETE to confirm" value="" />
            <Input placeholder="DELETE" autoCapitalize="characters" />
            <FormField label="Account PIN">
              <OtpInput length={4} accessibilityLabel="Confirm PIN" />
            </FormField>
          </View>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg" variant="destructive" disabled>
            Permanently delete account
          </Button>
        </StickyFooter>
      </ScreenFrame>
    </Section>
  );
}

