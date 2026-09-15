import { useRouter } from 'expo-router';
import { Check, Hourglass } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spinner, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const PROCESSING_MS = 2500;

/** Delete account — processing across PostgreSQL, S3, ROC (PRD). */
export default function DeleteProcessingScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/account/delete/success'), PROCESSING_MS);
    return () => clearTimeout(timer);
  }, [router]);

  const step = (icon: React.ReactNode, text: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], paddingVertical: theme.spacing[1.5] }}>
      {icon}
      <Typography variant="body-sm" color="secondary">
        {text}
      </Typography>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[5],
          paddingBottom: insets.bottom,
          gap: theme.spacing[4],
        }}>
        <Spinner size="lg" label="Deleting your data" />
        <Typography variant="h4" accessibilityLiveRegion="polite">
          Deleting your data…
        </Typography>
        <View>
          {step(<Check size={iconSize.sm} color={theme.colors.success} />, 'Account data removed (PostgreSQL)')}
          {step(<Check size={iconSize.sm} color={theme.colors.success} />, 'Images deleted (S3)')}
          {step(<Hourglass size={iconSize.sm} color={theme.colors.actionPrimary} />, 'Removing face template (ROC)…')}
        </View>
      </View>
    </SafeAreaView>
  );
}
