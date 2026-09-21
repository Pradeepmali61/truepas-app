/**
 * ProfileDrawer — right-edge slide-out opened from the home avatar.
 * Shows the account card plus the same settings menu the Profile screen
 * offers (edit profile, security, appearance, sign out).
 * Ported from UI-design-repo `src/app/ui/ProfileDrawer.tsx` — session reads
 * via Redux + useProfilePicture instead of the design's useSession store.
 */
import { Mail, Phone, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Animated,
    Easing,
    Pressable,
    Modal as RNModal,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfilePicture } from "../../features/profile/hooks";
import { useAppSelector } from "../../store";
import { makeStyles, useThemeTokens } from "../../theme";
import { Avatar } from "../ui/Avatar";
import { NeuBox, SoftIconButton } from "../ui/NeuBox";
import { StatusChip } from "../ui/StatusChip";
import { Typography } from "../ui/Typography";
import { ProfileMenu } from "./ProfileMenu";

export function ProfileDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useStyles();
  const t = useThemeTokens();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state) => state.auth.user);
  const { url: avatarUri } = useProfilePicture();
  const { width: winW } = useWindowDimensions();
  const panelW = Math.min(340, Math.round(winW * 0.85));

  const [shown, setShown] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setShown(true);
  }

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setShown(false);
    });
  }, [visible, progress]);

  if (!shown || !user) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [panelW, 0] });

  return (
    <RNModal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: progress }]}>
          <Pressable style={styles.scrimPress} onPress={onClose} accessibilityLabel="Close menu" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              width: panelW,
              paddingTop: insets.top + t.spacing[2],
              paddingBottom: insets.bottom + t.spacing[4],
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={styles.header}>
            <Typography variant="h4">Profile</Typography>
            <SoftIconButton icon={X} size={44} accessibilityLabel="Close" onPress={onClose} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <NeuBox variant="raised" style={styles.card}>
              <View style={styles.headRow}>
                <Avatar name={user.fullName} uri={avatarUri ?? undefined} size="lg" tinted />
                <View style={styles.flex}>
                  <Typography variant="h4" numberOfLines={1}>
                    {user.fullName}
                  </Typography>
                  <StatusChip status={user.faceEnrolled ? "verified" : "missing"} />
                </View>
              </View>
              <View style={styles.infoRow}>
                <Mail size={t.iconSize.sm} color={t.colors.textMuted} />
                <Text style={styles.info} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Phone size={t.iconSize.sm} color={t.colors.textMuted} />
                <Text style={styles.info} numberOfLines={1}>
                  {user.phone}
                </Text>
              </View>
            </NeuBox>

            <ProfileMenu onNavigate={onClose} />
          </ScrollView>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.scrim },
  scrimPress: { flex: 1 },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: t.radii["2xl"],
    borderBottomLeftRadius: t.radii["2xl"],
    paddingHorizontal: t.spacing[4],
    ...t.shadows.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: t.spacing[2],
  },
  scroll: { gap: t.spacing[4], paddingTop: t.spacing[2], paddingBottom: t.spacing[4] },
  flex: { flex: 1 },
  card: { padding: t.spacing[4], gap: t.spacing[3] },
  headRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  infoRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  info: { flex: 1, fontSize: t.fontSize.base, color: t.colors.textSecondary },
}));
