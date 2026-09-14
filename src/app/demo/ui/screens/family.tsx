import { View } from "react-native";
import { Baby, Camera, CircleCheck, FileText, ScanFace, UserPlus, Users } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { Divider } from "@/components/ui/Divider";
import { Alert } from "@/components/composite/Alert";
import { FormField } from "@/components/composite/FormField";
import { DatePicker } from "@/components/composite/DatePicker";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { Card, CardContent } from "@/components/composite/Card";
import { EmptyState } from "@/components/composite/states";
import { Section } from "../demos";
import { ScreenFrame, RowIcon } from "./ScreenFrame";
import { FadeUp, PopIn } from "./motion";
import { ScreenBody, StickyFooter } from "./shared";
import { FAMILY } from "./mock";

const RELATIONSHIPS = [
  { value: "Child", label: "Child" },
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Guardian", label: "Guardian" },
  { value: "Other", label: "Other" },
];

function verificationBadge(v: string) {
  const map: Record<string, { v: "success" | "warning" | "error" | "neutral"; label: string }> = {
    verified: { v: "success", label: "Verified" },
    pending_document: { v: "warning", label: "Needs document" },
    pending_face: { v: "warning", label: "Needs face" },
    failed: { v: "error", label: "Failed" },
  };
  const s = map[v] ?? { v: "neutral" as const, label: v };
  return <Badge variant={s.v}>{s.label}</Badge>;
}

const useStyles = makeStyles((t) => ({
  head: { alignItems: "center", gap: t.spacing[2] },
  chipRow: { flexDirection: "row", gap: t.spacing[2], flexWrap: "wrap", justifyContent: "center" },
  card: { gap: t.spacing[3] },
  stepRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  stepText: { flex: 1, gap: 2 },
}));

export function FamilyScreens() {
  const styles = useStyles();
  const theme = useThemeTokens();

  return (
    <Section title="Family members">
      {/* ---------- GET /cb/family ---------- */}
      <ScreenFrame
        title="Family list"
        method="GET"
        path="/cb/family"
        note="faceCaptureMode: 'photo' under 5, 'liveness' 5+ Â· allowedCameras adds 'back' under 10"
      >
        <ScreenHeader title="Family" subtitle="2 members" />
        <ScreenBody>
          {FAMILY.map((m, i) => (
            <FadeUp key={m.id} delay={i * 110}>
              <Card onPress={() => {}}>
                <View style={styles.stepRow}>
                  <Avatar name={m.name} size="lg" />
                  <View style={styles.stepText}>
                    <Typography variant="body">{m.name}</Typography>
                    <Typography variant="body-sm" color="muted">
                      {m.relationship} Â· age {m.age} Â· {m.faceCaptureMode === "photo" ? "photo capture" : "liveness"}
                    </Typography>
                  </View>
                  {verificationBadge(m.verification)}
                </View>
              </Card>
            </FadeUp>
          ))}
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth variant="outline" iconLeft={<UserPlus size={iconSize.sm} color={theme.colors.actionPrimary} />}>
            Add family member
          </Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/family ---------- */}
      <ScreenFrame
        title="Add family member"
        method="POST"
        path="/cb/family"
        note='{ name, dateOfBirth, relationship } â€” any age accepted; flow branches on computed age'
      >
        <ScreenHeader title="Add member" onBack={() => {}} />
        <ScreenBody>
          <FormField label="Full name" required helperText="As on their document.">
            <Input placeholder="Maya Example" />
          </FormField>
          <FormField label="Date of birth" required>
            <DatePicker placeholder="YYYY-MM-DD" maxDate="2026-09-06" />
          </FormField>
          <FormField label="Relationship" required>
            <Select options={RELATIONSHIPS} value="Child" placeholder="Chooseâ€¦" title="Relationship" />
          </FormField>
          <Alert variant="info" title="Verification depends on age">
            Under 5: document + photo. Ages 5â€“9: document + liveness (any camera). 10+: document + front-camera liveness.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Add member</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- GET /cb/family/{personId} â€” age 10+ ---------- */}
      <ScreenFrame
        title="Member detail â€” age 10+"
        method="GET"
        path="/cb/family/{personId}"
        note="ageBand 5-17 Â· liveness Â· front camera only"
        height={560}
      >
        <ScreenHeader title="Maya Example" subtitle="Child Â· age 10" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.head}>
            <Avatar name="Maya Example" size="xl" />
            <View style={styles.chipRow}>
              {verificationBadge("pending_document")}
              <Badge variant="info" icon={<Camera size={iconSize.xs} color={theme.colors.onInfoSubtle} />}>
                Front camera
              </Badge>
            </View>
          </View>
          <Card>
            <CardContent style={styles.card}>
              <View style={styles.stepRow}>
                <RowIcon tone="warning" icon={<FileText size={iconSize.md} color={theme.colors.onWarningSubtle} />} />
                <View style={styles.stepText}>
                  <Typography variant="body">1 Â· Verify a document</Typography>
                  <Typography variant="body-sm" color="muted">
                    Birth certificate or passport.
                  </Typography>
                </View>
                <Badge variant="warning">Next</Badge>
              </View>
              <Divider />
              <View style={styles.stepRow}>
                <RowIcon icon={<ScanFace size={iconSize.md} color={theme.colors.textSecondary} />} />
                <View style={styles.stepText}>
                  <Typography variant="body">2 Â· Liveness check</Typography>
                  <Typography variant="body-sm" color="muted">
                    Front camera, challenge prompts.
                  </Typography>
                </View>
              </View>
              <Divider />
              <View style={styles.stepRow}>
                <RowIcon icon={<CircleCheck size={iconSize.md} color={theme.colors.textSecondary} />} />
                <View style={styles.stepText}>
                  <Typography variant="body">3 Â· Face enrollment</Typography>
                  <Typography variant="body-sm" color="muted">
                    Automatic after liveness passes.
                  </Typography>
                </View>
              </View>
            </CardContent>
          </Card>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth>Add Maya&apos;s document</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- GET /cb/family/{personId} â€” under 5 ---------- */}
      <ScreenFrame
        title="Member detail â€” under 5"
        method="GET"
        path="/cb/family/{personId}"
        note="ageBand 0-4 Â· photo mode Â· front or back camera Â· no liveness"
        height={540}
      >
        <ScreenHeader title="Noah Example" subtitle="Child Â· age 3" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.head}>
            <PopIn>
              <Avatar name="Noah Example" size="xl" />
            </PopIn>
            <View style={styles.chipRow}>
              {verificationBadge("verified")}
              <Badge variant="info" icon={<Baby size={iconSize.xs} color={theme.colors.onInfoSubtle} />}>
                Photo enrollment
              </Badge>
            </View>
          </View>
          <Card>
            <CardContent style={styles.card}>
              <View style={styles.stepRow}>
                <RowIcon tone="success" icon={<FileText size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />
                <View style={styles.stepText}>
                  <Typography variant="body">Document</Typography>
                  <Typography variant="body-sm" color="muted">Birth certificate verified.</Typography>
                </View>
                <Badge variant="success">Done</Badge>
              </View>
              <Divider />
              <View style={styles.stepRow}>
                <RowIcon tone="success" icon={<Camera size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />
                <View style={styles.stepText}>
                  <Typography variant="body">Photo captured</Typography>
                  <Typography variant="body-sm" color="muted">
                    No liveness needed under 5 â€” one clear photo enrolls the face.
                  </Typography>
                </View>
                <Badge variant="success">Done</Badge>
              </View>
            </CardContent>
          </Card>
          <Alert variant="success" title="Ready for check-in">
            Noah can be added to venue check-ins with you.
          </Alert>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/family/{personId}/activity ---------- */}
      <ScreenFrame
        title="Member activity"
        method="GET"
        path="/cb/family/{personId}/activity"
        note="Returns [] until the activity projection is connected â€” do not fabricate events"
        height={440}
      >
        <ScreenHeader title="Maya&apos;s activity" onBack={() => {}} />
        <ScreenBody>
          <EmptyState
            title="No activity yet"
            description="Check-ins and verification events for Maya will appear here once venues start reporting them."
            icon={<Users size={iconSize.lg} color={theme.colors.textMuted} />}
          />
        </ScreenBody>
      </ScreenFrame>
    </Section>
  );
}

