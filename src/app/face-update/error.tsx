import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, ScreenHeader } from '@/components/composite';
import { CoreButton, PopIn, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Update face — ROC retry error. Never marks success on failure (PRD).
 *  `retry` param (when set) routes Retry back to the flow that failed —
 *  registration passes '/(onboarding)/face-scan', the default is the
 *  face-update camera. */
export default function FaceUpdateErrorScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { message, retry } = useLocalSearchParams<{ message?: string; retry?: string }>();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Face Update" />
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
            tone="error"
            icon={<TriangleAlert size={iconSize.xl} color={theme.colors.onErrorSubtle} />}
          />
        </PopIn>
        <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
          <Typography variant="h3" center>
            Registration Failed
          </Typography>
          <Typography variant="body" color="secondary" center style={{ maxWidth: 280 }}>
            {message ?? "We couldn't complete your face update. Please try again later."}
          </Typography>
        </View>
        <Alert variant="error" style={{ alignSelf: 'stretch' }}>
          Your face has NOT been marked as updated. Please retry.
        </Alert>
      </View>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[2],
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel="Retry now"
          onPress={() => router.replace((retry as any) ?? '/face-update/camera')}>
          Retry Now
        </CoreButton>
        <CoreButton
          fullWidth
          variant="ghost"
          accessibilityLabel="Try again later"
          onPress={() => router.dismissTo('/(tabs)')}>
          Try Again Later
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
