import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Alert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Typography } from '@/components/ui';
import { useVerifyPin } from '@/features/auth/mutations';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;

/**
 * Re-auth PIN gate shown before sensitive actions (change password / change
 * PIN / delete account). Verifies the PIN via POST /auth/verify-pin, then
 * replaces to the `next` route passed as a query param.
 */
export default function ConfirmPinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [pin, setPin] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [hasError, setHasError] = useState(false);
  const verifyPin = useVerifyPin();

  const submit = async (value?: string) => {
    const code = typeof value === 'string' ? value : pin;
    if (code.length !== PIN_LENGTH || verifyPin.isPending) return;
    setHasError(false);
    try {
      await verifyPin.mutateAsync(code);
      router.replace((next as never) ?? '/');
    } catch {
      setAttemptsLeft((a) => Math.max(0, a - 1));
      setHasError(true);
      setPin('');
    }
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Confirm it's you" onBack={router.back} />
      <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4] }}>
        <View
          style={{
            alignItems: 'center',
            gap: theme.spacing[2],
            paddingTop: theme.spacing[6],
          }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.actionPrimarySubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ShieldCheck size={iconSize.lg} color={theme.colors.actionPrimary} />
          </View>
          <Typography variant="h3" center>
            Enter your PIN
          </Typography>
          <Typography color="secondary" center>
            Required before changing security settings.
          </Typography>
        </View>

        <OtpInput
          length={PIN_LENGTH}
          value={pin}
          onChange={setPin}
          onComplete={submit}
          state={hasError ? 'error' : 'default'}
          autoFocus
          accessibilityLabel="Account PIN"
        />

        {hasError && (
          <Alert variant="error" title={`${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining`}>
            Too many wrong tries locks the app for 5 minutes.
          </Alert>
        )}
      </View>

      <View
        style={{
          padding: theme.spacing[4],
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <Button
          label="Continue"
          size="lg"
          loading={verifyPin.isPending}
          disabled={pin.length !== PIN_LENGTH}
          onPress={() => void submit()}
        />
      </View>
    </ScreenContainer>
  );
}
