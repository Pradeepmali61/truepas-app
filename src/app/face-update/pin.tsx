import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Alert, FormField, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Typography } from '@/components/ui';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { formatCountdown } from '@/hooks/useCountdown';
import { useThemeTokens } from '@/theme';

/** Update face — PIN verification (PRD FR-04: PIN required for face updates).
 *  Forwards `personId` (when present) so the face update targets the family
 *  member instead of the authenticated main user. Shares attempts/lockout
 *  logic with confirm-pin via usePinVerification. */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const { personId, age } = useLocalSearchParams<{ personId?: string; age?: string }>();
  const gate = usePinVerification();

  const handleComplete = async (value: string) => {
    const code = await gate.submit(value);
    if (!code) return;
    router.push({
      pathname: '/face-update/camera',
      params: personId ? { personId, ...(age ? { age } : {}) } : {},
    });
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Confirm PIN" onBack={router.back} />
      <View
        style={{
          flex: 1,
          padding: theme.spacing[4],
          paddingTop: theme.spacing[6],
          gap: theme.spacing[4],
        }}>
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography variant="h3" center>
            Enter Your PIN
          </Typography>
          <Typography color="secondary" center>
            Verify it&apos;s you to update your face
          </Typography>
        </View>
        <FormField>
          <OtpInput
            length={PIN_LENGTH}
            value={gate.pin}
            onChange={gate.setPin}
            onComplete={handleComplete}
            state={gate.error ? 'error' : 'default'}
            disabled={gate.locked}
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
      </View>
    </ScreenContainer>
  );
}
