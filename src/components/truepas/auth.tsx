import { BrandMark } from "@/components/app/BrandMark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Eye, EyeOff, KeyRound, Lock, Mail, User } from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SoftCard } from "./core";
import { useStyles } from "./styles";

/* Auth screens — login, registration, forgot password, reset PIN. */

/** Labelled field wrapper — label sits above the control. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

/** Login screen in the same card language: logo → heading → form → actions. */
export function LoginCard() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [remember, setRemember] = useState(true);

  return (
    <SoftCard style={styles.loginCard}>
      <View style={styles.loginHead}>
        <BrandMark compact />
        <View style={{ gap: 6 }}>
          <Typography variant="h2">Welcome back</Typography>
          <Typography color="secondary">Sign in to continue your verification.</Typography>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <Field label="Email">
          <Input
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            iconLeft={<Mail size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
        </Field>
        <Field label="Password">
          <Input
            placeholder="Enter your password"
            secureTextEntry
            iconLeft={<Lock size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
        </Field>
      </View>

      <View style={styles.rowBetween}>
        <Switch value={remember} onValueChange={setRemember} label="Remember me" />
        <Pressable accessibilityRole="link">
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </View>

      <Button fullWidth size="lg">
        Sign in
      </Button>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.helper}>or</Text>
        <View style={styles.orLine} />
      </View>

      <Button fullWidth variant="secondary">
        Continue with Face ID
      </Button>

      <Text style={[styles.helper, styles.centerText]}>
        New to TruePas? <Text style={styles.link}>Create an account</Text>
      </Text>
    </SoftCard>
  );
}

export function RegisterCard({
  style,
  onCreateAccount,
  onSignIn,
  onTerms,
  onPrivacy,
}: {
  style?: StyleProp<ViewStyle>;
  onCreateAccount?: () => void;
  onSignIn?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
}) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [show, setShow] = useState(false);
  return (
    <SoftCard style={[styles.loginCard, style]}>
      <View style={styles.loginHead}>
        <BrandMark compact />
        <View style={{ gap: 6 }}>
          <Typography variant="h2">Create your account</Typography>
          <Typography color="secondary">Verify once. Check in anywhere.</Typography>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <Field label="Full name">
          <Input
            placeholder="Ada Example"
            autoCapitalize="words"
            iconLeft={<User size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
        </Field>
        <Field label="Email">
          <Input
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            iconLeft={<Mail size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
        </Field>
        <Field label="Password">
          <Input
            placeholder="8+ characters"
            secureTextEntry={!show}
            iconLeft={<Lock size={iconSize.md} color={theme.colors.actionPrimary} />}
            iconRight={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={show ? "Hide password" : "Show password"}
                onPress={() => setShow((s) => !s)}
                hitSlop={8}
              >
                {show ? (
                  <EyeOff size={iconSize.md} color={theme.colors.actionPrimary} />
                ) : (
                  <Eye size={iconSize.md} color={theme.colors.actionPrimary} />
                )}
              </Pressable>
            }
          />
        </Field>
      </View>

      <Text style={styles.helper}>
        By continuing you agree to our{" "}
        <Text style={styles.link} onPress={onTerms}>Terms</Text> and{" "}
        <Text style={styles.link} onPress={onPrivacy}>Privacy policy</Text>.
      </Text>

      <Button fullWidth size="lg" onPress={onCreateAccount} accessibilityLabel="Create account">
        Create account
      </Button>

      <Text style={[styles.helper, styles.centerText]}>
        Already verified?{" "}
        <Text style={styles.link} onPress={onSignIn}>Sign in</Text>
      </Text>
    </SoftCard>
  );
}

/** Forgot password — email step, then the code-entry state. */
export function ForgotPasswordCard() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [sent, setSent] = useState(false);
  return (
    <SoftCard style={styles.loginCard}>
      <View style={styles.loginHead}>
        <BrandMark compact />
        <View style={{ gap: 6 }}>
          <Typography variant="h2">{sent ? "Check your inbox" : "Forgot password"}</Typography>
          <Typography color="secondary">
            {sent
              ? "We sent a 4-digit code to ada@example.com."
              : "Enter the email linked to your account."}
          </Typography>
        </View>
      </View>

      {sent ? (
        <PinRow filled={2} />
      ) : (
        <Field label="Email">
          <Input
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            iconLeft={<Mail size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
        </Field>
      )}

      <Button fullWidth size="lg" onPress={() => setSent((s) => !s)}>
        {sent ? "Verify code" : "Send reset link"}
      </Button>

      <Text style={[styles.helper, styles.centerText]}>
        {sent ? (
          <>
            Didn&apos;t get it? <Text style={styles.link}>Resend</Text>
          </>
        ) : (
          <>
            Remembered it? <Text style={styles.link}>Back to sign in</Text>
          </>
        )}
      </Text>
    </SoftCard>
  );
}

/** Row of PIN cells — filled dots plus a focused empty cell. */
export function PinRow({ filled = 0, cells = 4 }: { filled?: number; cells?: number }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.pinRowCells}>
      {Array.from({ length: cells }).map((_, i) => {
        const isFilled = i < filled;
        const isActive = i === filled;
        return (
          <View
            key={i}
            style={[
              styles.pinCell,
              isActive && { borderColor: theme.colors.borderFocus, shadowColor: theme.colors.actionPrimary, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
            ]}
          >
            {isFilled && <View style={styles.pinDot} />}
          </View>
        );
      })}
    </View>
  );
}

/** Reset PIN — new PIN + confirm, then a single strong CTA. */
export function ResetPinCard() {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <SoftCard style={styles.loginCard}>
      <View style={styles.loginHead}>
        <BrandMark compact />
        <View style={{ gap: 6 }}>
          <Typography variant="h2">Reset PIN</Typography>
          <Typography color="secondary">
            Your PIN unlocks TruePas on this device.
          </Typography>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <Field label="New PIN">
          <PinRow filled={2} />
        </Field>
        <Field label="Confirm PIN">
          <PinRow filled={0} />
        </Field>
      </View>

      <View style={styles.pinHintRow}>
        <KeyRound size={iconSize.sm} color={theme.colors.actionPrimary} />
        <Text style={styles.helper}>4 digits — no repeats or sequences.</Text>
      </View>

      <Button fullWidth size="lg">
        Reset PIN
      </Button>

      <Text style={[styles.helper, styles.centerText]}>
        Face ID stays on — <Text style={styles.link}>use it instead</Text>
      </Text>
    </SoftCard>
  );
}
