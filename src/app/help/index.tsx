import { useRouter } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { Linking, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Accordion, Card, CardContent, ScreenHeader } from '@/components/composite';
import { CoreButton, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const FAQS = [
  {
    value: 'checkin',
    title: 'How does face check-in work?',
    content:
      'At a participating venue, open Truepas and glance at the kiosk camera. Your enrolled face proves your identity — no documents needed. Every check-in appears in your History tab.',
  },
  {
    value: 'biometric',
    title: 'Is my biometric data shared?',
    content:
      'Your face template is used only to verify your identity. Check-in consent is separate from biometric consent, and you can withdraw either at any time from Settings → Privacy.',
  },
  {
    value: 'doc-fail',
    title: 'Why did my document verification fail?',
    content:
      'Most failures are image quality — glare, blur, or the document not filling the frame. Recapture in good light on a flat, dark surface and try again.',
  },
  {
    value: 'family',
    title: 'How are family members verified?',
    content:
      'Members under 5 need an identity document plus a clear photo. Members 5 and older need a document plus a short liveness check in the app.',
  },
  {
    value: 'update-face',
    title: 'How do I update my face?',
    content:
      'Go to Profile → Update face. You\'ll repeat a quick liveness check so we can be sure it\'s really you before replacing the enrolled face.',
  },
];

/** Help & FAQ — static content screen; entry points: liveness failure
 *  "Get help", history "How check-in works", and the About page. */
export default function HelpScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Help & FAQ" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}>
        <Accordion
          multiple
          items={FAQS.map((f) => ({
            value: f.value,
            title: f.title,
            content: (
              <Typography variant="body-sm" color="secondary">
                {f.content}
              </Typography>
            ),
          }))}
        />

        <Card>
          <CardContent>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <RowIcon
                tone="info"
                icon={<CircleHelp size={iconSize.md} color={theme.colors.onInfoSubtle} />}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Typography variant="body">Still stuck?</Typography>
                <Typography variant="body-sm" color="secondary">
                  Our support team can help with verification issues.
                </Typography>
              </View>
              <CoreButton
                variant="outline"
                size="sm"
                accessibilityLabel="Email support"
                onPress={() => Linking.openURL('mailto:support@truepas.com')}>
                Email us
              </CoreButton>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
