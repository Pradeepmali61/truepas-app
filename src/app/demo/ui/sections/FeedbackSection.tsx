import { View } from "react-native";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/composite/Alert";
import { useToast } from "@/components/composite/Toast";
import { EmptyState, ErrorState, LoadingState } from "@/components/composite/states";
import { Skeleton } from "@/components/ui/Skeleton";
import { Demo, ShowcasePage, Section } from "../demos";

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Demo label="toast (tap to fire)" row>
      {(["default", "info", "success", "warning", "error"] as const).map((v) => (
        <Button
          key={v}
          variant="outline"
          size="sm"
          onPress={() => toast({ variant: v, title: `${v} toast`, description: "Auto-dismisses in 4s." })}
        >
          {v}
        </Button>
      ))}
    </Demo>
  );
}

export function FeedbackSection() {
  const [, setAlerts] = useState({ maintenance: true });
  return (
    <ShowcasePage>
      <Section title="Alert">
        <Alert variant="info" title="Scheduled maintenance" onDismiss={() => setAlerts((s) => ({ ...s, maintenance: false }))}>
          Kiosk network restarts Sunday 02:00â€“02:15 IST.
        </Alert>
        <Alert variant="success" title="Face enrolled">Your face profile is active.</Alert>
        <Alert variant="warning" title="Session expiring">Expires in 60 seconds.</Alert>
        <Alert variant="error" title="Verification failed" action={<Button size="sm" variant="outline">Retry</Button>}>
          We could not read the document.
        </Alert>
      </Section>

      <Section title="Toast">
        <ToastDemo />
      </Section>

      <Section title="States">
        <Demo label="empty">
          <EmptyState title="No bookings yet" description="Your upcoming visits will appear here." action={<Button size="sm">Book a visit</Button>} />
        </Demo>
        <Demo label="error">
          <ErrorState onRetry={() => {}} compact />
        </Demo>
        <Demo label="loading">
          <LoadingState label="Loading bookingsâ€¦" />
        </Demo>
        <Demo label="loading skeletons">
          <View style={{ gap: 12 }}>
            <Skeleton variant="text" />
            <Skeleton variant="rect" height={80} />
          </View>
        </Demo>
      </Section>
    </ShowcasePage>
  );
}

