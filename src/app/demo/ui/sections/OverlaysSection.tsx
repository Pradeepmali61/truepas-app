import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/composite/Modal";
import { BottomSheet } from "@/components/composite/BottomSheet";
import { ActionSheet } from "@/components/composite/ActionSheet";
import { FormField } from "@/components/composite/FormField";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { CreditCard, Pencil, Share2, Trash2 } from "lucide-react-native";
import { Demo, ShowcasePage, Section } from "../demos";

export function OverlaysSection() {
  const theme = useThemeTokens();
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [actions, setActions] = useState(false);

  return (
    <ShowcasePage>
      <Section title="Overlays">
        <Demo label="modal (centered)" row>
          <Button onPress={() => setModal(true)}>Open modal</Button>
          <Button variant="destructive" onPress={() => setConfirm(true)}>Delete confirm</Button>
        </Demo>
        <Demo label="bottom sheet + action sheet" row>
          <Button variant="outline" onPress={() => setSheet(true)}>Open sheet</Button>
          <Button variant="outline" onPress={() => setActions(true)}>Action menu</Button>
        </Demo>
        <Text style={{ fontFamily: theme.fontFamily.sans.regular, fontSize: 13, opacity: 0.6 }}>
          On mobile, dropdowns/drawers become bottom sheets â€” same components, platform-native reach.
        </Text>
      </Section>

      <Modal
        visible={modal}
        onClose={() => setModal(false)}
        title="Edit profile"
        description="Update how your name appears at check-in."
        footer={
          <>
            <Button variant="outline" onPress={() => setModal(false)}>Cancel</Button>
            <Button onPress={() => setModal(false)}>Save</Button>
          </>
        }
      >
        <FormField label="Full name" required>
          <Input defaultValue="Priya Nair" />
        </FormField>
      </Modal>

      <Modal
        visible={confirm}
        onClose={() => setConfirm(false)}
        title="Delete document?"
        footer={
          <>
            <Button variant="ghost" onPress={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onPress={() => setConfirm(false)}>Delete</Button>
          </>
        }
      >
        <Text style={{ fontFamily: theme.fontFamily.sans.regular, color: theme.colors.textSecondary }}>
          The document will be removed from your identity wallet. This cannot be undone.
        </Text>
      </Modal>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Filters">
        <FormField label="Status"><Input placeholder="Any" /></FormField>
        <FormField label="Site"><Input placeholder="All sites" /></FormField>
        <Button fullWidth onPress={() => setSheet(false)}>Apply filters</Button>
      </BottomSheet>

      <ActionSheet
        visible={actions}
        onClose={() => setActions(false)}
        title="Booking actions"
        items={[
          { key: "edit", label: "Edit booking", icon: <Pencil size={iconSize.sm} color={theme.colors.textSecondary} /> },
          { key: "share", label: "Share", icon: <Share2 size={iconSize.sm} color={theme.colors.textSecondary} /> },
          { key: "pay", label: "Payment method", icon: <CreditCard size={iconSize.sm} color={theme.colors.textSecondary} /> },
          { key: "cancel", label: "Cancel booking", icon: <Trash2 size={iconSize.sm} color={theme.colors.error} />, destructive: true },
        ]}
      />
    </ShowcasePage>
  );
}

