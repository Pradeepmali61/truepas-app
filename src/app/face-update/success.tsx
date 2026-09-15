import { useRouter } from 'expo-router';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, CoreButton, FadeUp, PopIn, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Update face — success (ref: Facepe FaceSuccessModal). */
export default function FaceUpdateSuccessScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[5],
          gap: theme.spacing[4],
        }}>
        <PopIn>
          <RowIcon
            tone="success"
            icon={<ShieldCheck size={iconSize.xl} color={theme.colors.onSuccessSubtle} />}
          />
        </PopIn>
        <FadeUp delay={150} style={{ alignItems: 'center', gap: theme.spacing[2] }}>
          <Typography variant="h3" center>
            Face Updated!
          </Typography>
          <Typography variant="body" color="secondary" center>
            Your biometric profile is updated and ready for secure authentication.
          </Typography>
        </FadeUp>
        <FadeUp delay={240} style={{ alignItems: 'center', gap: theme.spacing[3] }}>
          <Badge variant="success">Verified & Secure</Badge>
          <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge variant="neutral" icon={<ShieldCheck size={iconSize.xs} color={theme.colors.textSecondary} />}>
              Bank-grade Encryption
            </Badge>
            <Badge variant="neutral" icon={<Sparkles size={iconSize.xs} color={theme.colors.textSecondary} />}>
              Instant Auth Enabled
            </Badge>
          </View>
        </FadeUp>
      </View>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel="Done"
          onPress={() => router.dismissTo('/(tabs)')}>
          Done
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
