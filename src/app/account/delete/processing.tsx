import { Redirect, useRouter } from 'expo-router';
import { Check, Hourglass } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NeuBox, Spinner, Typography } from '@/components/ui';
import { flowGuards } from '@/services/flowGuards';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const PROCESSING_MS = 2500;

/** Delete account — processing across PostgreSQL, S3, ROC (PRD). */
export default function DeleteProcessingScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Only reachable after DELETE /user/me succeeded — a deep link here must not
  // fall through to the session-wiping success screen.
  const [allowed] = useState(() => flowGuards.has('account:deleting'));

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(() => {
      flowGuards.consume('account:deleting');
      flowGuards.grant('account:deleted');
      router.replace('/account/delete/success');
    }, PROCESSING_MS);
    return () => clearTimeout(timer);
  }, [router, allowed]);

  if (!allowed) return <Redirect href="/" />;

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
        <NeuBox
          variant="raised"
          depth={4}
          color={theme.colors.surface}
          style={{ padding: theme.spacing[4], alignSelf: 'stretch' }}>
          {step(<Check size={iconSize.sm} color={theme.colors.success} />, 'Account data removed (PostgreSQL)')}
          {step(<Check size={iconSize.sm} color={theme.colors.success} />, 'Images deleted (S3)')}
          {step(<Hourglass size={iconSize.sm} color={theme.colors.actionPrimary} />, 'Removing face template (ROC)…')}
        </NeuBox>
      </View>
    </SafeAreaView>
  );
}
