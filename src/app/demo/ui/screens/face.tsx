import { Text, View } from "react-native";
import { Camera, CircleCheck, Eye, ScanFace, TriangleAlert } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/composite/Alert";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { Card, CardContent } from "@/components/composite/Card";
import { Section } from "../demos";
import { ScreenFrame, RowIcon, StepDots } from "./ScreenFrame";
import { Blink, FadeUp, PopIn, Pulse, ScanLine } from "./motion";
import { KV, Row, ScreenBody, StickyFooter } from "./shared";
import { LIVENESS_CHALLENGE } from "./mock";

const useStyles = makeStyles((t) => ({
  viewfinder: {
    aspectRatio: 3 / 4,
    borderRadius: t.radii.xl,
    backgroundColor: t.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[3],
    overflow: "hidden",
  },
  faceRing: {
    width: 168,
    height: 208,
    borderRadius: 104,
    borderWidth: 3,
    borderColor: t.colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    paddingHorizontal: t.spacing[4],
    paddingVertical: t.spacing[2],
    borderRadius: t.radii.full,
    backgroundColor: t.colors.actionPrimary,
  },
  instructionText: { color: t.colors.onActionPrimary, fontFamily: t.fontFamily.sans.semibold, fontSize: t.fontSize.base },
  recDot: { width: 8, height: 8, borderRadius: t.radii.full, backgroundColor: t.colors.onActionPrimary },
  stepRow: { flexDirection: "row", justifyContent: "center", gap: t.spacing[2] },
  center: { alignItems: "center", gap: t.spacing[2] },
  cameraPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    alignSelf: "center",
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[1],
    borderRadius: t.radii.full,
    backgroundColor: t.colors.surfaceSunken,
  },
}));

export function FaceScreens() {
  const styles = useStyles();
  const theme = useThemeTokens();

  return (
    <Section title="Liveness & face enrollment">
      {/* ---------- POST /cb/liveness/v2/challenge ---------- */}
      <ScreenFrame
        title="Liveness â€” intro"
        method="POST"
        path="/cb/liveness/v2/challenge"
        note="Returns challenge_sequence + ui_copy â€” render the returned order, never hard-code"
      >
        <ScreenHeader title="Face verification" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.center}>
            <Pulse to={1.06} ms={1400}>
              <RowIcon tone="primary" icon={<ScanFace size={iconSize.xl} color={theme.colors.actionPrimary} />} />
            </Pulse>
            <Typography variant="h3">Prove it&apos;s really you</Typography>
            <Typography color="secondary" center>
              We&apos;ll ask you to do two quick actions on camera. It takes about 10 seconds.
            </Typography>
          </View>
          <FadeUp delay={100}>
          <Card>
            <CardContent style={{ gap: 12 }}>
              <Row
                leading={<RowIcon icon={<Eye size={iconSize.md} color={theme.colors.textSecondary} />} />}
                title={LIVENESS_CHALLENGE.ui_copy.turn_left}
                subtitle="Step 1"
              />
              <Row
                leading={<RowIcon icon={<Eye size={iconSize.md} color={theme.colors.textSecondary} />} />}
                title={LIVENESS_CHALLENGE.ui_copy.blink}
                subtitle="Step 2"
              />
            </CardContent>
          </Card>
          </FadeUp>
          <Alert variant="info" title="Good conditions help">
            Even lighting, hold the phone at eye level, remove hats and glasses.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg" iconLeft={<Camera size={iconSize.sm} color={theme.colors.onActionPrimary} />}>
            Start verification
          </Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/liveness/v2/challenge/{id}/evidence ---------- */}
      <ScreenFrame
        title="Liveness â€” challenge step"
        method="POST"
        path="/cb/liveness/v2/challenge/{sessionId}/evidence"
        note="multipart: challenge, step_index, client_ts_ms, duration_ms Â· X-Session-Token header"
      >
        <ScreenHeader title="Face verification" subtitle="Session lx-session" />
        <ScreenBody>
          <View style={styles.viewfinder}>
            <ScanLine color={theme.colors.accent} />
            <Pulse to={1.04} ms={900}>
              <View style={styles.faceRing}>
                <ScanFace size={56} color={theme.colors.onActionPrimary} />
              </View>
            </Pulse>
            <View style={styles.instructionChip}>
              <Blink ms={650}>
                <View style={styles.recDot} />
              </Blink>
              <Text style={styles.instructionText}>{LIVENESS_CHALLENGE.ui_copy.turn_left}</Text>
            </View>
          </View>
          <StepDots total={LIVENESS_CHALLENGE.challenge_sequence.length} current={0} />
          <Typography variant="caption" color="muted" center>
            Session expires in 5:00 Â· front camera
          </Typography>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- POST /cb/liveness/v2/challenge/{id}/finalize ---------- */}
      <ScreenFrame
        title="Liveness â€” finalize"
        method="POST"
        path="/cb/liveness/v2/challenge/{sessionId}/finalize"
        note="multipart field `frame`: high-res JPEG captured at completion"
        height={420}
      >
        <ScreenHeader title="Face verification" />
        <ScreenBody>
          <View style={styles.center}>
            <Pulse to={1.08} ms={800}>
              <RowIcon tone="primary" icon={<ScanFace size={iconSize.lg} color={theme.colors.actionPrimary} />} />
            </Pulse>
            <Typography variant="h3">Verifyingâ€¦</Typography>
            <Typography variant="body-sm" color="secondary" center>
              Uploading your final frame and running anti-spoof checks. Don&apos;t close the app.
            </Typography>
          </View>
          <Button loading disabled fullWidth>
            Verifying
          </Button>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/liveness/v2/challenge/{id} â€” passed ---------- */}
      <ScreenFrame
        title="Liveness â€” passed"
        method="GET"
        path="/cb/liveness/v2/challenge/{sessionId}"
        note='{ success: true, status: "passed", antispoof_score: 0.87 } â€” result consumed once'
      >
        <ScreenHeader title="Face verification" />
        <ScreenBody>
          <View style={styles.center}>
            <PopIn>
              <RowIcon tone="success" icon={<CircleCheck size={iconSize.xl} color={theme.colors.onSuccessSubtle} />} />
            </PopIn>
            <Typography variant="h3">Liveness verified</Typography>
            <Badge variant="success">Passed</Badge>
          </View>
          <FadeUp delay={120}>
            <Card>
              <CardContent style={{ gap: 10 }}>
                <KV label="Session" value="lx-session" mono />
                <KV label="Anti-spoof score" value="0.87" mono />
                <KV label="Next step" value="Face enrollment" />
              </CardContent>
            </Card>
          </FadeUp>
          <Alert variant="info" title="One-time result">
            This liveness result is consumed by face enrollment â€” if enrollment fails you&apos;ll start a new challenge.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Enroll my face</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- GET /cb/liveness/v2/challenge/{id} â€” failed ---------- */}
      <ScreenFrame
        title="Liveness â€” failed"
        method="GET"
        path="/cb/liveness/v2/challenge/{sessionId}"
        note="success:false, status:'failed' + error code â†’ restart with a NEW challenge"
        height={460}
      >
        <ScreenHeader title="Face verification" />
        <ScreenBody>
          <View style={styles.center}>
            <PopIn from={0.5}>
              <RowIcon tone="error" icon={<TriangleAlert size={iconSize.xl} color={theme.colors.onErrorSubtle} />} />
            </PopIn>
            <Typography variant="h3">We couldn&apos;t verify liveness</Typography>
            <Badge variant="error">Failed</Badge>
          </View>
          <Alert variant="warning" title="Try again in better light">
            Move to a brighter spot and keep your face inside the ring for the whole step.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Restart verification</Button>
          <Button fullWidth variant="ghost">Get help</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/face/enroll ---------- */}
      <ScreenFrame
        title="Face enrolled"
        method="POST"
        path="/cb/face/enroll"
        note='{ livenessSessionId, sessionToken } â†’ { ok: true, faceEnrolled: true, faceId }'
        height={460}
      >
        <ScreenBody>
          <View style={styles.center}>
            <PopIn>
              <RowIcon tone="success" icon={<ScanFace size={iconSize.xl} color={theme.colors.onSuccessSubtle} />} />
            </PopIn>
            <Typography variant="h2" center>
              You&apos;re all set
            </Typography>
            <Typography color="secondary" center>
              Your face is enrolled. Check in at venues with a glance â€” no documents needed.
            </Typography>
          </View>
          <FadeUp delay={140}>
            <Card>
              <CardContent style={{ gap: 10 }}>
                <Row
                  leading={<RowIcon tone="success" icon={<CircleCheck size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />}
                  title="Face ID"
                  subtitle="Enrolled"
                  trailing={<Badge variant="success">Active</Badge>}
                />
              </CardContent>
            </Card>
          </FadeUp>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Continue to Truepas</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/face/enroll â€” under-5 photo path ---------- */}
      <ScreenFrame
        title="Child photo capture (under 5)"
        method="POST"
        path="/cb/face/enroll"
        note="Under-5 members can't run liveness â€” send selfieBase64 + personId instead"
        height={500}
      >
        <ScreenHeader title="Add Noah&apos;s photo" subtitle="Age 3 Â· photo enrollment" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.viewfinder}>
            <ScanLine color={theme.colors.accent} ms={2400} />
            <Pulse to={1.03} ms={1200}>
              <View style={styles.faceRing}>
                <ScanFace size={56} color={theme.colors.onActionPrimary} />
              </View>
            </Pulse>
            <View style={styles.instructionChip}>
              <Text style={styles.instructionText}>Hold still â€” one clear photo</Text>
            </View>
          </View>
          <View style={styles.cameraPill}>
            <Camera size={iconSize.sm} color={theme.colors.textSecondary} />
            <Typography variant="body-sm" color="secondary">
              Front or back camera allowed
            </Typography>
          </View>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Capture photo</Button>
        </StickyFooter>
      </ScreenFrame>
    </Section>
  );
}

