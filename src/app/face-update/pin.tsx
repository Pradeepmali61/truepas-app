import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { isMockApi } from '@/api';
import { MOCK_PIN } from '@/api/mock';
import { Alert, FormField, OtpInput, ScreenHeader } from '@/components/composite';
import { Button, NeuBox, Typography } from '@/components/ui';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { formatCountdown } from '@/hooks/useCountdown';
import { useKeyboardScrollPad } from '@/hooks/useKeyboardScrollPad';
import { flowGuards } from '@/services/flowGuards';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Update face — PIN verification (PRD FR-04: PIN required for face updates).
 *  Forwards `personId` (when present) so the face update targets the family
 *  member instead of the authenticated main user. Shares attempts/lockout
 *  logic with confirm-pin via usePinVerification. */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const kbd = useKeyboardScrollPad();
  const { personId, age } = useLocalSearchParams<{ personId?: string; age?: string }>();
  const gate = usePinVerification();

  const handleComplete = async (value?: string) => {
    const code = await gate.submit(value);
    if (!code) return;
    flowGuards.grant('face-update:camera');
    router.push({
      pathname: '/face-update/camera',
      params: personId ? { personId, ...(age ? { age } : {}) } : {},
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScreenHeader title="Confirm PIN" onBack={router.back} />
        <ScrollView
          {...kbd.scrollProps}
          contentContainerStyle={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[4],
            gap: theme.spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
            <NeuBox
              variant="raised"
              radius={theme.radii.full}
              depth={4}
              style={{
                width: 64,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing[2],
              }}>
              <ShieldCheck size={iconSize.lg} color={theme.colors.actionPrimary} />
            </NeuBox>
            <Typography variant="h3" center>
              Enter your PIN
            </Typography>
            <Typography color="secondary" center>
              Verify it&apos;s you to update your face
            </Typography>
          </View>

          <FormField error={gate.error ?? undefined}>
            <OtpInput
              length={PIN_LENGTH}
              value={gate.pin}
              onChange={gate.setPin}
              onComplete={(v) => void handleComplete(v)}
              error={gate.error != null}
              disabled={gate.locked}
              autoFocus
              accessibilityLabel="Current PIN"
            />
          </FormField>

          {gate.locked ? (
            <Alert variant="error" title="PIN locked">
              Too many incorrect attempts. Try again in {formatCountdown(gate.lockSecondsLeft)}.
            </Alert>
          ) : gate.error ? (
            <Alert
              variant="error"
              title={
                gate.attemptsLeft < gate.maxAttempts
                  ? `${gate.attemptsLeft} attempt${gate.attemptsLeft === 1 ? '' : 's'} remaining`
                  : 'Verification failed'
              }>
              {gate.error}
            </Alert>
          ) : null}

          {__DEV__ && isMockApi() && (
            <Typography variant="caption" color="muted" center>
              Demo PIN: {MOCK_PIN}
            </Typography>
          )}
        </ScrollView>

        <View
          {...kbd.footerProps}
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[6],
            paddingBottom: theme.spacing[4] + insets.bottom,
            gap: theme.spacing[2],
          }}>
          <Button
            label="Verify"
            size="lg"
            loading={gate.isPending}
            disabled={gate.pin.length !== PIN_LENGTH || gate.locked}
            onPress={() => void handleComplete()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
