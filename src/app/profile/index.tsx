/**
 * ProfileScreen — profile tab. Account card plus the shared ProfileMenu
 * (settings, sign out).
 * Ported 1:1 from UI-design-repo `src/app/screens/main/ProfileScreen.tsx`.
 */
import { useRouter } from 'expo-router';
import { Mail, Phone } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingState, ProfileMenu, ScreenHeader } from '@/components/composite';
import { Avatar, NeuBox, StatusChip, Typography } from '@/components/ui';
import { useProfilePicture } from '@/features/profile/hooks';
import { useAppSelector } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

export default function ProfileScreen() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state) => state.auth.user);
  const { url: profilePictureUrl } = useProfilePicture();

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Profile" />
        <LoadingState fullPage />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[6],
          paddingBottom: theme.spacing[8] + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}>
        {/* ---------- account card ---------- */}
        <NeuBox variant="raised" style={styles.card}>
          <View style={styles.headRow}>
            <Avatar name={user.fullName} uri={profilePictureUrl ?? undefined} size="lg" />
            <View style={styles.flex}>
              <Typography variant="h4" numberOfLines={1}>
                {user.fullName}
              </Typography>
              <StatusChip status={user.faceEnrolled ? 'verified' : 'missing'} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <Mail size={iconSize.sm} color={theme.colors.textMuted} />
            <Text style={styles.info} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={iconSize.sm} color={theme.colors.textMuted} />
            <Text style={styles.info} numberOfLines={1}>
              {user.phone}
            </Text>
          </View>
        </NeuBox>

        {/* ---------- menu ---------- */}
        <ProfileMenu />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  card: { padding: t.spacing[4], gap: t.spacing[3] },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] },
  info: { flex: 1, fontSize: t.fontSize.base, color: t.colors.textSecondary },
}));
