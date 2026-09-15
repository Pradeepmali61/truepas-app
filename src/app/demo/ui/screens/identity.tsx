import { FileUploader } from "@/components/complex/FileUploader";
import { Alert } from "@/components/composite/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/composite/Card";
import { DatePicker } from "@/components/composite/DatePicker";
import { FormField } from "@/components/composite/FormField";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { EmptyState } from "@/components/composite/states";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Select } from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import {
    BadgeCheck,
    CreditCard,
    FileText,
    ScanFace,
    ShieldCheck,
    UserRoundCheck
} from "lucide-react-native";
import { View } from "react-native";
import { Section } from "../demos";
import { RowIcon, ScreenFrame } from "./ScreenFrame";
import { DOCUMENTS, IDENTITY_SUMMARY, VERIFICATION_SESSION } from "./mock";
import { FadeUp, PopIn, Pulse, ScanLine } from "./motion";
import { KV, ScreenBody, StickyFooter } from "./shared";

const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivingLicense", label: "Driving license" },
  { value: "greenCard", label: "Green card" },
  { value: "birthCertificate", label: "Birth certificate" },
  { value: "usVisa", label: "US visa" },
];

function statusBadge(status: string) {
  const map: Record<string, { v: "success" | "warning" | "error" | "neutral"; label: string }> = {
    verified: { v: "success", label: "Verified" },
    pending: { v: "warning", label: "Pending" },
    missing: { v: "neutral", label: "Missing" },
    failed: { v: "error", label: "Failed" },
    incomplete: { v: "warning", label: "Incomplete" },
    approved: { v: "success", label: "Approved" },
    rejected: { v: "error", label: "Rejected" },
    review: { v: "warning", label: "In review" },
  };
  const s = map[status] ?? { v: "neutral" as const, label: status };
  return <Badge variant={s.v}>{s.label}</Badge>;
}

const useStyles = makeStyles((t) => ({
  heroCard: { gap: t.spacing[2] },
  heroRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  heroText: { flex: 1, gap: 2 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  docArt: {
    height: 92,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.actionPrimarySubtle,
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[1],
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    borderStyle: "dashed",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[4] },
  gridItem: { width: "46%" },
  scoreBar: { gap: t.spacing[1] },
  center: { alignItems: "center", gap: t.spacing[2] },
}));

export function IdentityScreens() {
  const styles = useStyles();
  const theme = useThemeTokens();

  return (
    <Section title="Identity & documents">
      {/* ---------- GET /cb/identity/summary ---------- */}
      <ScreenFrame
        title="Identity dashboard"
        method="GET"
        path="/cb/identity/summary"
        note='{ status: "incomplete", face: "verified", document: "missing", selfieMatch: "missing" }'
      >
        <ScreenHeader title="Your identity" subtitle="Verification status" />
        <ScreenBody>
          <FadeUp>
            <Card appearance="elevated" style={styles.heroCard}>
            <View style={styles.heroRow}>
              <RowIcon tone="warning" icon={<ShieldCheck size={iconSize.lg} color={theme.colors.onWarningSubtle} />} />
              <View style={styles.heroText}>
                <Typography variant="h4">Almost there</Typography>
                <Typography variant="body-sm" color="secondary">
                  Add a document to finish verification.
                </Typography>
              </View>
              {statusBadge(IDENTITY_SUMMARY.status)}
            </View>
            </Card>
          </FadeUp>
          <FadeUp delay={110}>
          <Card>
            <View style={styles.checkRow}>
              <RowIcon tone="success" icon={<ScanFace size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />
              <View style={styles.heroText}>
                <Typography variant="body">Face enrollment</Typography>
              </View>
              {statusBadge(IDENTITY_SUMMARY.face)}
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.checkRow}>
              <RowIcon icon={<FileText size={iconSize.md} color={theme.colors.textSecondary} />} />
              <View style={styles.heroText}>
                <Typography variant="body">Identity document</Typography>
              </View>
              {statusBadge(IDENTITY_SUMMARY.document)}
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.checkRow}>
              <RowIcon icon={<UserRoundCheck size={iconSize.md} color={theme.colors.textSecondary} />} />
              <View style={styles.heroText}>
                <Typography variant="body">Selfie match</Typography>
              </View>
              {statusBadge(IDENTITY_SUMMARY.selfieMatch)}
            </View>
          </Card>
          </FadeUp>
          <FadeUp delay={200}>
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <EmptyState compact title="No activity yet" description="Verification events will appear here." />
          </Card>
          </FadeUp>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth>Add a document</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- GET /cb/documents ---------- */}
      <ScreenFrame
        title="Documents wallet"
        method="GET"
        path="/cb/documents"
        note="Numbers arrive masked â€” never render the raw document number"
      >
        <ScreenHeader title="Documents" onBack={() => {}} />
        <ScreenBody>
          {[DOCUMENTS[0], DOCUMENTS[1]].map((doc, i) => (
            <FadeUp key={doc.id} delay={i * 110}>
              <Card onPress={() => {}}>
                <View style={styles.checkRow}>
                  <RowIcon
                    tone={i === 0 ? "primary" : "neutral"}
                    icon={
                      i === 0 ? (
                        <FileText size={iconSize.md} color={theme.colors.actionPrimary} />
                      ) : (
                        <CreditCard size={iconSize.md} color={theme.colors.textSecondary} />
                      )
                    }
                  />
                  <View style={styles.heroText}>
                    <Typography variant="body">{doc.label}</Typography>
                    <Typography variant="body-sm" color="muted" style={{ fontFamily: theme.fontFamily.mono.regular }}>
                      {doc.number} Â· exp {doc.expiresAt}
                    </Typography>
                  </View>
                  {statusBadge(doc.status)}
                </View>
              </Card>
            </FadeUp>
          ))}
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth variant="outline">Add document</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/documents ---------- */}
      <ScreenFrame
        title="Add document â€” metadata"
        method="POST"
        path="/cb/documents"
        note='{ type, label, number, expiresAt, personId? } â†’ 201 pending IdentityDocument'
        height={540}
      >
        <ScreenHeader title="Add document" subtitle="Step 1 of 2 â€” details" onBack={() => {}} />
        <ScreenBody>
          <FormField label="Document type" required>
            <Select options={DOC_TYPES} value="passport" placeholder="Choose a type" title="Document type" />
          </FormField>
          <FormField label="Label" required>
            <Input defaultValue="US Passport" />
          </FormField>
          <FormField label="Document number" required>
            <Input placeholder="e.g. 123456789" keyboardType="number-pad" />
          </FormField>
          <FormField label="Expiry date" required>
            <DatePicker placeholder="YYYY-MM-DD" minDate="2026-09-06" />
          </FormField>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg">Continue to upload</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/documents/{id}/verification-sessions ---------- */}
      <ScreenFrame
        title="Upload captures"
        method="POST"
        path="/cb/documents/{documentId}/verification-sessions"
        note="front/back/selfie object keys must come from the signed upload pipeline (customers/{id}/â€¦)"
        height={540}
      >
        <ScreenHeader title="Scan your passport" subtitle="Step 2 of 2 â€” capture" onBack={() => {}} />
        <ScreenBody>
          <View style={styles.docArt}>
            <ScanLine color={theme.colors.actionPrimary} ms={1600} />
            <Pulse to={1.05} ms={1000}>
              <ScanFace size={iconSize.xl} color={theme.colors.actionPrimary} />
            </Pulse>
            <Typography variant="body-sm" color="secondary">
              Position the document inside the frame
            </Typography>
          </View>
          <FileUploader
            files={[
              { key: "front", name: "passport-front.jpg", size: "1.8 MB" },
              { key: "back", name: "passport-back.jpg", size: "1.6 MB", progress: 64 },
            ]}
            hint="Front + back of the document, JPG or PNG"
            onPick={() => {}}
          />
          <Alert variant="info" title="Good light, no glare">
            Capture both sides flat on a dark surface. We encrypt uploads in transit and at rest.
          </Alert>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth size="lg" loading>Creating sessionâ€¦</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- POST /cb/document-verification-sessions/{id}/verify ---------- */}
      <ScreenFrame
        title="Verify â€” processing"
        method="POST"
        path="/cb/document-verification-sessions/{sessionId}/verify"
        note="frontImageBase64 required (503 until signed uploads ship) Â· outcome: approved | rejected | review"
      >
        <ScreenHeader title="Verifying document" />
        <ScreenBody>
          <View style={styles.center}>
            <Pulse to={1.07} ms={850}>
              <RowIcon tone="primary" icon={<FileText size={iconSize.lg} color={theme.colors.actionPrimary} />} />
            </Pulse>
            <Typography variant="h3">Checking with the issuer</Typography>
            <Typography variant="body-sm" color="secondary" center>
              Regula DocReader is extracting and validating your document. Usually under a minute.
            </Typography>
          </View>
          <View style={styles.scoreBar}>
            <Progress value={64} />
            <Typography variant="caption" color="muted" center>
              Extracting MRZ â†’ matching portrait â†’ scoring
            </Typography>
          </View>
        </ScreenBody>
      </ScreenFrame>

      {/* ---------- GET /cb/document-verification-sessions/{id} ---------- */}
      <ScreenFrame
        title="Verification result"
        method="GET"
        path="/cb/document-verification-sessions/{sessionId}"
        note="Persisted session â€” statuses created/completed, outcomes approved/rejected/review"
        height={560}
      >
        <ScreenHeader title="Document verified" />
        <ScreenBody>
          <View style={styles.center}>
            <PopIn>
              <RowIcon tone="success" icon={<BadgeCheck size={iconSize.xl} color={theme.colors.onSuccessSubtle} />} />
            </PopIn>
            <Typography variant="h3">Approved</Typography>
            {statusBadge(VERIFICATION_SESSION.outcome)}
          </View>
          <FadeUp delay={130}>
          <Card>
            <CardContent style={{ gap: 12 }}>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <KV label="Extracted name" value={VERIFICATION_SESSION.extractedName} mono />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Date of birth" value={VERIFICATION_SESSION.extractedDob} mono />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Document no." value={VERIFICATION_SESSION.extractedDocumentNumber} mono />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Expiry" value={VERIFICATION_SESSION.dateOfExpiry} mono />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Nationality" value={VERIFICATION_SESSION.nationality} />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Issuing state" value={VERIFICATION_SESSION.issuingState} />
                </View>
              </View>
              <Divider />
              <View style={styles.scoreBar}>
                <KV label="Match score" value={`${Math.round(VERIFICATION_SESSION.matchScore * 100)}%`} mono />
                <Progress value={VERIFICATION_SESSION.matchScore * 100} />
              </View>
              <KV label="Provider reference" value={VERIFICATION_SESSION.providerReference} mono />
            </CardContent>
          </Card>
          </FadeUp>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth>Done</Button>
        </StickyFooter>
      </ScreenFrame>

      {/* ---------- GET /cb/documents/{id} â€” rejected variant ---------- */}
      <ScreenFrame
        title="Document detail â€” rejected"
        method="GET"
        path="/cb/documents/{documentId}"
        note="Outcome 'rejected' / 'review' surfaces reasonCode + retry guidance"
        height={500}
      >
        <ScreenHeader title="Driver&apos;s License" onBack={() => {}} />
        <ScreenBody>
          <Alert variant="error" title="Verification failed">
            The document image was unreadable (glare on the security strip). Recapture and try again.
          </Alert>
          <Card>
            <CardContent style={{ gap: 12 }}>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <KV label="Type" value="Driving license" />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Number" value="â€¢â€¢â€¢â€¢â€¢4120" mono />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Status" value="rejected" />
                </View>
                <View style={styles.gridItem}>
                  <KV label="Reason" value="IMAGE_QUALITY" mono />
                </View>
              </View>
            </CardContent>
          </Card>
        </ScreenBody>
        <StickyFooter>
          <Button fullWidth>Recapture &amp; retry</Button>
          <Button fullWidth variant="ghost">Remove document</Button>
        </StickyFooter>
      </ScreenFrame>

    </Section>
  );
}

