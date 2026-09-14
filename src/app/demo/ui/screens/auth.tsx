import { View } from "react-native";
import { Lock, Mail, Phone } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Alert } from "@/components/composite/Alert";
import { FormField } from "@/components/composite/FormField";
import { OtpInput } from "@/components/composite/OtpInput";
import { DatePicker } from "@/components/composite/DatePicker";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { Section } from "../demos";
import { ScreenFrame, StepDots } from "./ScreenFrame";
import { FadeUp } from "./motion";
import { BrandMark, ScreenBody, StickyFooter } from "./shared";

const useStyles = makeStyles((t) => ({
  heading: { gap: t.spacing[1] },
  helperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  center: { alignItems: "center", gap: t.spacing[1] },
  phoneRow: { flexDirection: "row", gap: t.spacing[2] },
  ccBox: {
    width: 84,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.surface,
  },
  ccText: { fontFamily: t.fontFamily.sans.medium, fontSize: t.fontSize.base, color: t.colors.textPrimary },
  legal: { textAlign: "center" },
  logoutCard: {
    padding: t.spacing[4],
    borderRadius: t.radii.xl,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    gap: t.spacing[3],
  },
}));

export function AuthScreens() {
  const styles = useStyles();
  const theme = useThemeTokens();

  return (
    <Section title="Authentication & recovery">
      {/* ---------- POST /cb/auth/register ---------- */}
      <ScreenFrame
        title="Register â€” enter phone"
        method="POST"
        path="/cb/auth/register"
        note='{ "phone": "4155550123", "countryCode": "+1" } â†’ 202, registrationId, nextStep: verifyPhone'
      >
        <ScreenBody>
          <BrandMark />
          <StepDots total={6} current={0} />
          <View style={styles.heading}>
            <Typography variant="h2">Create your account</Typography>
            <Typography color="secondary">We&apos;ll text a verification code to your phone.</Typography>
          </View>
          <FormField label="Mobile number" required>
            <View style={styles.phoneRow}>
              <View style={styles.ccBox}>
                <Typography style={styles.ccText}>+1</Typography>
              </View>
              <Input
                placeholder="(555) 555-0123"
                keyboardType="phone-pad"
                containerStyle={{ flex: 1 }}
                iconLeft={<Phone size={iconSize.sm} color={theme.colors.textMuted} />}
              />
            </View>
          </FormField>
          <Typography variant="caption" color="muted" style={styles.legal}>
            By continuing you agree to the Terms of Service and acknowledge the Privacy Policy.
          </Typography>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Send code</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/verify-otp (phone) ---------- */}
      <ScreenFrame
        title="Verify phone â€” OTP"
        method="POST"
        path="/cb/auth/verify-otp"
        note='{ phone, countryCode, otp, purpose: "phone" } â†’ registrationToken, nextStep: accountDetails'
      >
        <ScreenHeader title="Verify your phone" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.center}>
            <Typography variant="h3">Enter the 6-digit code</Typography>
            <Typography color="secondary" center>
              Sent by SMS to +1 â€¢â€¢â€¢ â€¢â€¢â€¢ 0123
            </Typography>
          </View>
          <FadeUp delay={120}>
            <OtpInput length={6} value="123" accessibilityLabel="Phone verification code" />
          </FadeUp>
          <View style={styles.center}>
            <Typography variant="body-sm" color="muted">
              Didn&apos;t get it? <Link>Resend code</Link> (00:24)
            </Typography>
          </View>
          <Alert variant="info" title="Demo code">
            Local dev accepts 123456. Production requires a configured SMS provider.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg" disabled>Verify</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/account-details ---------- */}
      <ScreenFrame
        title="Account details"
        method="POST"
        path="/cb/auth/account-details"
        note="Bearer registrationToken Â· { fullName, dateOfBirth, pin, email, password, confirmPassword } â†’ 202, nextStep: verifyEmail"
        height={560}
      >
        <ScreenHeader title="Your details" subtitle="Step 3 of 6" onBack={() => {}} />
        <ScreenBody style={{ gap: 12 }}>
          <FormField label="Full name" required helperText="As on your government ID.">
            <Input placeholder="Ada Example" defaultValue="Ada Example" />
          </FormField>
          <FormField label="Date of birth" required>
            <DatePicker placeholder="MM/DD/YYYY" value="1990-01-02" />
          </FormField>
          <FormField label="App PIN" required helperText="4 digits â€” used for quick unlock.">
            <OtpInput length={4} value="12" accessibilityLabel="App PIN" />
          </FormField>
          <FormField label="Email" required>
            <Input
              placeholder="ada@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />}
            />
          </FormField>
          <FormField label="Password" required>
            <Input placeholder="Create a password" secureTextEntry iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <FormField label="Confirm password" required>
            <Input placeholder="Repeat password" secureTextEntry iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Continue</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/verify-otp (email) ---------- */}
      <ScreenFrame
        title="Verify email â€” OTP"
        method="POST"
        path="/cb/auth/verify-otp"
        note='{ email, otp, purpose: "email" } â†’ AuthResponse (session starts; route to consent)'
      >
        <ScreenHeader title="Verify your email" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.center}>
            <Typography variant="h3">Check your inbox</Typography>
            <Typography color="secondary" center>
              We emailed a code to ada@example.com
            </Typography>
          </View>
          <FadeUp delay={120}>
            <OtpInput length={6} accessibilityLabel="Email verification code" />
          </FadeUp>
          <Alert variant="error" title="Incorrect code">
            That code doesn&apos;t match. Check the latest email â€” codes expire in 10 minutes.
          </Alert>
          <View style={styles.center}>
            <Typography variant="body-sm" color="muted">
              Wrong address? <Link>Start over</Link>
            </Typography>
          </View>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Verify email</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/login ---------- */}
      <ScreenFrame
        title="Login"
        method="POST"
        path="/cb/auth/login"
        note='{ identifier, password } â†’ AuthResponse. identifier accepts email or international phone'
      >
        <ScreenBody>
          <BrandMark />
          <View style={styles.heading}>
            <Typography variant="h2">Welcome back</Typography>
            <Typography color="secondary">Sign in with your email or phone.</Typography>
          </View>
          <FormField label="Email or phone">
            <Input
              placeholder="ada@example.com"
              autoCapitalize="none"
              iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />}
            />
          </FormField>
          <FormField label="Password">
            <Input
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              secureTextEntry
              iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
            />
          </FormField>
          <View style={styles.helperRow}>
            <Link>Forgot password?</Link>
          </View>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Sign in</Button>
          <Typography variant="body-sm" color="muted" center>
            New to Truepas? <Link>Create account</Link>
          </Typography>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/forgot-password ---------- */}
      <ScreenFrame
        title="Forgot password"
        method="POST"
        path="/cb/auth/forgot-password"
        note="Always returns 202 â€” never reveals whether the account exists"
      >
        <ScreenHeader title="Reset password" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.heading}>
            <Typography variant="h3">Find your account</Typography>
            <Typography color="secondary">
              Enter your account email. If it exists, we&apos;ll send a reset code.
            </Typography>
          </View>
          <FormField label="Email">
            <Input
              placeholder="ada@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />}
            />
          </FormField>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Send reset code</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/reset-password ---------- */}
      <ScreenFrame
        title="Reset password"
        method="POST"
        path="/cb/auth/reset-password"
        note="{ email, otp, newPassword } â€” success revokes all existing sessions"
        height={520}
      >
        <ScreenHeader title="Choose a new password" onBack={() => {}} />
        <ScreenBody>
          <FormField label="Reset code" required helperText="6-digit code emailed to you.">
            <FadeUp delay={100}>
              <OtpInput length={6} value="123456" accessibilityLabel="Reset code" />
            </FadeUp>
          </FormField>
          <FormField label="New password" required>
            <Input secureTextEntry placeholder="New password" iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <FormField label="Confirm new password" required>
            <Input secureTextEntry placeholder="Repeat password" iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />} />
          </FormField>
          <Alert variant="warning" title="Sessions revoked">
            You&apos;ll be signed out of every device after the reset.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Reset password</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/auth/logout + POST /cb/auth/refresh ---------- */}
      <ScreenFrame
        title="Sign out & session refresh"
        method="POST"
        path="/cb/auth/logout Â· /cb/auth/refresh"
        note="Logout clears Redux, in-memory token, caches and secure storage even on network error. Refresh is silent â€” no UI."
        height={440}
      >
        <ScreenHeader title="Settings" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.logoutCard}>
            <Typography variant="h4">Sign out of Truepas?</Typography>
            <Typography color="secondary">
              Your session on this device will end. Your verified identity stays on your account.
            </Typography>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button variant="outline" style={{ flex: 1 }}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1 }}>Sign out</Button>
            </View>
          </View>
          <Alert variant="info" title="Token refresh is silent">
            POST /cb/auth/refresh runs in the Axios single-flight interceptor â€” 15-min access tokens rotate against a 30-day refresh token with no screen.
          </Alert>
        </ScreenBody>
      </ScreenFrame>
    </Section>
  );
}

