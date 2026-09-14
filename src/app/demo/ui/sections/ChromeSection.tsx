import { useState } from "react";
import { Text, View } from "react-native";
import { Calendar, FileText, Home, ScanFace, Users } from "lucide-react-native";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { AppHeader } from "@/components/complex/AppHeader";
import { ScreenHeader } from "@/components/composite/ScreenHeader";
import { NavigationDrawer } from "@/components/complex/NavigationDrawer";
import { UserMenu } from "@/components/complex/UserMenu";
import { NotificationCenter } from "@/components/complex/NotificationCenter";
import { DashboardCard } from "@/components/complex/DashboardCard";
import { ActivityFeed } from "@/components/complex/ActivityFeed";
import { MultiStepForm } from "@/components/complex/MultiStepForm";
import { FileUploader, type UploadedFile } from "@/components/complex/FileUploader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/composite/FormField";
import { Input } from "@/components/ui/Input";
import { ShowcasePage, Section } from "../demos";

export function ChromeSection() {
  const theme = useThemeTokens();
  const muted = theme.colors.textSecondary;
  const [drawer, setDrawer] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([
    { key: "1", name: "passport.jpg", size: "2.4 MB", progress: 100 },
    { key: "2", name: "aadhaar.png", size: "3.1 MB", progress: 62 },
    { key: "3", name: "license.pdf", size: "14 MB", error: "Exceeds 10 MB limit" },
  ]);

  return (
    <ShowcasePage>
      <Section title="AppHeader">
        <AppHeader
          onMenuPress={() => setDrawer(true)}
          left={<ScanFace size={iconSize.lg} color={theme.colors.actionPrimary} />}
          title="Truepas"
          subtitle="Koramangala"
          actions={
            <>
              <NotificationCenter
                notifications={[
                  { key: "1", title: "Check-in complete", description: "Kiosk 4", timestamp: "2m ago", read: false },
                  { key: "2", title: "Document verified", timestamp: "1h ago", read: false },
                  { key: "3", title: "Booking reminder", timestamp: "Yesterday", read: true },
                ]}
                onMarkAllRead={() => {}}
              />
              <UserMenu name="Priya Nair" email="priya@truepas.com" onProfile={() => {}} onSettings={() => {}} onLogout={() => {}} />
            </>
          }
        />
      </Section>

      <Section title="NavigationDrawer">
        <Button variant="outline" onPress={() => setDrawer(true)}>Open drawer</Button>
        <NavigationDrawer
          visible={drawer}
          onClose={() => setDrawer(false)}
          header={
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />
              <Text style={{ fontFamily: theme.fontFamily.sans.semibold, fontWeight: "600", color: theme.colors.textPrimary }}>Truepas</Text>
            </View>
          }
          sections={[
            {
              items: [
                { key: "home", label: "Home", icon: <Home size={iconSize.sm} color={muted} />, active: true },
                { key: "book", label: "Bookings", icon: <Calendar size={iconSize.sm} color={muted} />, badge: <Badge size="sm" variant="primary">3</Badge> },
              ],
            },
            {
              heading: "Identity",
              items: [
                { key: "docs", label: "Documents", icon: <FileText size={iconSize.sm} color={muted} /> },
                { key: "family", label: "Family", icon: <Users size={iconSize.sm} color={muted} /> },
              ],
            },
          ]}
        />
      </Section>

      <Section title="ScreenHeader (pushed screen)">
        <ScreenHeader
          title="Booking BK-1042"
          subtitle="Koramangala Kiosk 4"
          onBack={() => {}}
          actions={<Button size="sm" variant="outline">Share</Button>}
        />
      </Section>

      <Section title="DashboardCard">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 150 }}>
            <DashboardCard title="Check-ins" value="1,240" delta="+12.4%" deltaLabel="vs last month" />
          </View>
          <View style={{ flex: 1, minWidth: 150 }}>
            <DashboardCard title="Active bookings" value="38" delta="-3.1%" deltaLabel="vs last month" />
          </View>
          <View style={{ flex: 1, minWidth: 150 }}>
            <DashboardCard title="Verifications" loading />
          </View>
        </View>
      </Section>

      <Section title="ActivityFeed">
        <ActivityFeed
          events={[
            { key: "1", actor: { name: "Priya Nair" }, title: "Face profile updated", timestamp: "2m ago" },
            { key: "2", icon: <FileText size={iconSize.sm} color={muted} />, title: "Passport verified", description: "Session dv_3928", timestamp: "1h ago" },
            { key: "3", actor: { name: "Ravi Shankar" }, title: "Checked in at Kiosk 4", timestamp: "Yesterday" },
          ]}
        />
      </Section>

      <Section title="MultiStepForm">
        <MultiStepForm
          steps={[
            { key: "info", title: "Info", content: <FormField label="Full name"><Input placeholder="Priya Nair" /></FormField> },
            { key: "doc", title: "Document", content: <Text>Upload step.</Text> },
            { key: "review", title: "Review", content: <Text>Confirm and submit.</Text> },
          ]}
          onComplete={() => {}}
          onCancel={() => {}}
        />
      </Section>

      <Section title="FileUploader">
        <FileUploader
          files={files}
          hint="PDF, JPG or PNG Â· max 10 MB"
          onPick={() => setFiles((f) => [...f, { key: String(Date.now()), name: "new-doc.pdf", progress: 0 }])}
          onRemove={(k) => setFiles((f) => f.filter((x) => x.key !== k))}
        />
      </Section>
    </ShowcasePage>
  );
}

