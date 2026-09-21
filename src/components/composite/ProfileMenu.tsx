/**
 * ProfileMenu — the settings menu on ProfileScreen: account actions,
 * delete account, version footer, and the sign-out action sheet.
 *
 * Ported from UI-design-repo `src/app/ui/ProfileMenu.tsx` — the mock/live
 * "Data source" tile and its picker sheet are intentionally omitted (the
 * app has a single hosted backend; demo browsing lives in dev.tsx).
 */
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { LogOut, Palette, Pencil, ShieldCheck, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { useLogoutFlow } from "../../features/auth/useLogoutFlow";
import { Typography } from "../ui/Typography";
import { ActionSheet } from "./ActionSheet";
import { ListTile } from "./ListTile";
import { Section, SectionTitle } from "./Section";

export function ProfileMenu() {
  const styles = useStyles();
  const t = useThemeTokens();
  const router = useRouter();
  const { logout } = useLogoutFlow();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <>
      <Section>
        <SectionTitle>Account</SectionTitle>
        <ListTile icon={Pencil} tone="brand" title="Edit profile" onPress={() => router.push("/profile/edit")} />
        <ListTile icon={ShieldCheck} tone="brand" title="Security & sign-in" onPress={() => router.push("/security")} />
        <ListTile icon={Palette} tone="brand" title="Appearance" onPress={() => router.push("/settings")} />
        <ListTile icon={LogOut} tone="brand" title="Sign out" onPress={() => setConfirmSignOut(true)} />
      </Section>

      <Section>
        <SectionTitle>Data</SectionTitle>
        <ListTile
          icon={Trash2}
          title={
            <Text style={{ color: t.colors.error, fontWeight: t.fontWeight.semibold }}>
              Delete account
            </Text>
          }
          tone="error"
          onPress={() => router.push("/account/delete")}
        />
      </Section>

      <View style={styles.footerMeta}>
        <Typography variant="caption" color="muted">
          Truepas {Constants.expoConfig?.version ?? "1.0.0"}
        </Typography>
      </View>

      <ActionSheet
        visible={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Sign out of Truepas?"
        items={[
          {
            key: "signout",
            label: "Sign out",
            destructive: true,
            icon: <LogOut size={iconSize.md} color={t.colors.error} />,
            onSelect: () => void logout(),
          },
        ]}
      />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[2],
  },
}));
