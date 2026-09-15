import { useRouter } from 'expo-router';
import { Cake, Clock, Plus } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, Card, CardContent, ScreenHeader } from '@/components/composite';
import { CoreButton, PopIn, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Age-18 transition notification — dependent is eligible for own Truepas account. */
export default function Age18NotificationScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Notification" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing[4] }}>
          <PopIn>
            <RowIcon
              tone="primary"
              icon={<Cake size={iconSize.xl} color={theme.colors.actionPrimary} />}
            />
          </PopIn>
        </View>
        <Card>
          <CardContent style={{ alignItems: 'center', gap: theme.spacing[3] }}>
            <Typography variant="h3" center>
              You&apos;re eligible for a new Truepas account
            </Typography>
            <Typography variant="body" color="secondary" center>
              Max Kim has turned 18 and can now create an independent Truepas account to manage
              their own identity verification.
            </Typography>
            <View style={{ alignSelf: 'stretch', gap: theme.spacing[2] }}>
              <Alert variant="success">Eligible to create own account</Alert>
              <Alert variant="warning">Data retained for 30 days after removal</Alert>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
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
          accessibilityLabel="Create their own account"
          iconLeft={<Plus size={iconSize.sm} color={theme.colors.onActionPrimary} />}
          onPress={() => router.dismissTo('/(tabs)/family')}>
          Create their account
        </CoreButton>
        <CoreButton
          fullWidth
          variant="outline"
          accessibilityLabel="Remind later"
          iconLeft={<Clock size={iconSize.sm} color={theme.colors.actionPrimary} />}
          onPress={() => router.back()}>
          Remind me later
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
