/** @jsxImportSource react */
import { CreditCard, LogOut, Settings, User } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Pressable } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { ActionSheet, type ActionItem } from "../composite/ActionSheet";
import { Avatar } from "../ui/Avatar";

export interface UserMenuProps {
  name: string;
  email?: string;
  avatarUri?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onBilling?: () => void;
  onLogout?: () => void;
  /** Extra action rows */
  extra?: ActionItem[];
  /** Replaces the default avatar trigger */
  trigger?: ReactNode;
}

/** Avatar trigger → action sheet with account actions. */
export function UserMenu({ name, email, avatarUri, onProfile, onSettings, onBilling, onLogout, extra = [], trigger }: UserMenuProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const [open, setOpen] = useState(false);

  const items: ActionItem[] = [
    ...(onProfile ? [{ key: "profile", label: "Profile", icon: <User size={iconSize.sm} color={theme.colors.textSecondary} />, onSelect: onProfile }] : []),
    ...(onSettings ? [{ key: "settings", label: "Settings", icon: <Settings size={iconSize.sm} color={theme.colors.textSecondary} />, onSelect: onSettings }] : []),
    ...(onBilling ? [{ key: "billing", label: "Billing", icon: <CreditCard size={iconSize.sm} color={theme.colors.textSecondary} />, onSelect: onBilling }] : []),
    ...extra,
    ...(onLogout ? [{ key: "logout", label: "Log out", icon: <LogOut size={iconSize.sm} color={theme.colors.error} />, destructive: true, onSelect: onLogout }] : []),
  ];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Account menu for ${name}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.8 }]}
      >
        {trigger ?? <Avatar uri={avatarUri} name={name} size="md" />}
      </Pressable>
      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={email ?? name}
        items={items}
        showCancel
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  trigger: { borderRadius: 9999 },
}));
