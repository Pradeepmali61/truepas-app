import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleX } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/composite';
import { CoreButton, PopIn, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Add family — 18+ rejected: adults must create their own account (PRD). */
export default function AgeRejectedScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, age } = useLocalSearchParams<{ name?: string; age?: string }>();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Add Family Member" />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[5],
          gap: theme.spacing[2],
        }}>
        <PopIn>
          <RowIcon
            tone="error"
            icon={<CircleX size={iconSize.xl} color={theme.colors.onErrorSubtle} />}
          />
        </PopIn>
        <Typography variant="h3" center>
          Adults need their own account
        </Typography>
        <Typography variant="body" color="secondary" center style={{ maxWidth: 280 }}>
          {name ?? 'This person'} is {age ?? '18 or more'} years old. Family onboarding is only for
          dependents under 18. Please ask them to register independently.
        </Typography>
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
          variant="outline"
          accessibilityLabel="Go back"
          onPress={() => router.back()}>
          Go Back
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
