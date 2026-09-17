import { Pressable, Text, View } from "react-native";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  UserMinus,
  X,
} from "lucide-react-native";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Button } from "@/components/ui/Button";
import { SoftCard, VariantTag } from "./core";
import { useStyles } from "./styles";

/* Popups & alerts — three variants (dialog / toast / sheet) per kind. */

export type PopupTone = "success" | "warning" | "error" | "info" | "confirm";

export interface PopupSpec {
  tone: PopupTone;
  title: string;
  message: string;
  cta: string;
}

export const TONE_ICON = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
  info: Info,
  confirm: UserMinus,
} as const;

export function useTone(tone: PopupTone) {
  const theme = useThemeTokens();
  const c = theme.colors;
  const map: Record<PopupTone, { fg: string; bg: string }> = {
    success: { fg: c.success, bg: c.successSubtle },
    warning: { fg: c.warning, bg: c.warningSubtle },
    error: { fg: c.error, bg: c.errorSubtle },
    info: { fg: c.info, bg: c.infoSubtle },
    confirm: { fg: c.actionPrimary, bg: c.actionPrimarySubtle },
  };
  return map[tone];
}


export function PopupDialog({ spec }: { spec: PopupSpec }) {
  const styles = useStyles();
  const tone = useTone(spec.tone);
  const Icon = TONE_ICON[spec.tone];
  return (
    <SoftCard style={styles.popupCard}>
      <VariantTag>A · Dialog</VariantTag>
      <View style={styles.centerCol}>
        <View style={[styles.popupIcon, { backgroundColor: tone.bg }]}>
          <Icon size={22} color={tone.fg} />
        </View>
        <Text style={[styles.cardTitle, styles.centerText]}>{spec.title}</Text>
        <Text style={[styles.paragraph, styles.centerText]}>{spec.message}</Text>
      </View>
      <Button fullWidth variant={spec.tone === "confirm" ? "destructive" : "primary"}>
        {spec.cta}
      </Button>
      <Button fullWidth variant="ghost" size="sm">
        Not now
      </Button>
    </SoftCard>
  );
}

/** Variant B — floating toast: tinted icon chip, one line, close affordance. */
export function PopupToast({ spec }: { spec: PopupSpec }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const tone = useTone(spec.tone);
  const Icon = TONE_ICON[spec.tone];
  return (
    <SoftCard style={styles.toastCard}>
      <VariantTag>B · Toast</VariantTag>
      <View style={styles.toastRow}>
        <View style={[styles.toastIcon, { backgroundColor: tone.bg }]}>
          <Icon size={iconSize.sm} color={tone.fg} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.cardTitle}>{spec.title}</Text>
          <Text style={styles.helper} numberOfLines={2}>
            {spec.message}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8}>
          <X size={iconSize.sm} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <View style={[styles.toastBar, { backgroundColor: tone.fg }]} />
    </SoftCard>
  );
}

/** Variant C — bottom sheet: grabber, title row, message, split actions. */
export function PopupSheet({ spec }: { spec: PopupSpec }) {
  const styles = useStyles();
  const tone = useTone(spec.tone);
  const Icon = TONE_ICON[spec.tone];
  return (
    <SoftCard style={styles.popupCard}>
      <VariantTag>C · Sheet</VariantTag>
      <View style={styles.grabber} />
      <View style={styles.rowCenter}>
        <View style={[styles.toastIcon, { backgroundColor: tone.bg }]}>
          <Icon size={iconSize.sm} color={tone.fg} />
        </View>
        <Text style={styles.cardTitle}>{spec.title}</Text>
      </View>
      <Text style={styles.paragraph}>{spec.message}</Text>
      <View style={styles.divider} />
      <View style={styles.sheetActions}>
        <View style={{ flex: 1 }}>
          <Button fullWidth variant="secondary">
            Later
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button fullWidth variant={spec.tone === "confirm" ? "destructive" : "primary"}>
            {spec.cta}
          </Button>
        </View>
      </View>
    </SoftCard>
  );
}
