import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, Card, CardContent, ScreenHeader } from '@/components/composite';
import { CoreButton, PopIn, RowIcon, Typography } from '@/components/ui';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const SESSION_TTL_SECONDS = 15 * 60;

/** Profile mismatch session — 15-minute TTL, accept or retry (PRD). */
export default function MismatchScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { seconds } = useCountdown(SESSION_TTL_SECONDS);
  const params = useLocalSearchParams<{
    profileName?: string;
    profileDob?: string;
    docName?: string;
    docDob?: string;
    reason?: string;
  }>();

  const profileName = params.profileName || '—';
  const docName = params.docName || '—';
  const profileDob = params.profileDob || '—';
  const docDob = params.docDob || '—';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Details Mismatch" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: theme.spacing[2], paddingVertical: theme.spacing[3] }}>
          <PopIn>
            <RowIcon
              tone="warning"
              icon={<TriangleAlert size={iconSize.lg} color={theme.colors.onWarningSubtle} />}
            />
          </PopIn>
          <Typography variant="h3">Details Mismatch</Typography>
          <Typography variant="body-sm" color="secondary" center>
            Extracted details don&apos;t match your profile
          </Typography>
        </View>

        <Card>
          <CardContent>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing[3],
              }}>
              <Typography variant="caption" color="muted" style={{ letterSpacing: theme.letterSpacing.caps }}>
                PROFILE
              </Typography>
              <Typography variant="caption" color="muted" style={{ letterSpacing: theme.letterSpacing.caps }}>
                DOCUMENT
              </Typography>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: theme.sizes.fieldBorderWidth,
                borderBottomColor: theme.colors.borderSubtle,
                paddingBottom: theme.spacing[2],
                marginBottom: theme.spacing[2],
              }}>
              <Typography variant="body" style={{ fontWeight: theme.fontWeight.semibold }}>
                {profileName}
              </Typography>
              <Typography variant="body" style={{ fontWeight: theme.fontWeight.semibold }}>
                {docName}
              </Typography>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Typography variant="body" style={{ fontWeight: theme.fontWeight.semibold }}>
                {profileDob}
              </Typography>
              <Typography variant="body" style={{ fontWeight: theme.fontWeight.semibold }}>
                {docDob}
              </Typography>
            </View>
          </CardContent>
        </Card>

        {params.reason ? <Alert variant="info">{params.reason}</Alert> : null}

        <Alert variant="warning">
          Session expires in {formatCountdown(seconds)}. If the session expires, you&apos;ll need to
          re-verify your document.
        </Alert>
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
          accessibilityLabel="Accept and update profile"
          onPress={() => router.replace('/document/verified')}>
          Accept & Update Profile
        </CoreButton>
        <CoreButton
          fullWidth
          variant="outline"
          accessibilityLabel="Retry with different document"
          onPress={() => router.replace('/document/select-type')}>
          Retry with Different Document
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
