import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Alert as RNAlert, View } from 'react-native';

import { Alert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Link, Typography } from '@/components/ui';
import { sessionEnded } from '@/features/auth/slice';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { formatCountdown } from '@/hooks/useCountdown';
import { pinStore } from '@/services/pinStore';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/**
 * Re-auth PIN gate shown before sensitive actions (change password / change
 * PIN / delete account). Verifies the PIN via POST /auth/verify-pin, then
 * replaces to the `next` route passed as a query param. The verified PIN is
 * stashed in pinStore (not a route param — params can leak into logs) for
 * change-pin's currentPin.
 */
export default function ConfirmPinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const gate = usePinVerification();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  // PIN can't be recovered in-app — the only way back is an email password
  // reset, which ends this session first.
  const handleForgotPin = () => {
    RNAlert.alert(
      'Forgot PIN?',
      "You'll be signed out. Reset your password via email to sign back in.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out & reset',
          style: 'destructive',
          onPress: () => {
            pinStore.clear();
            queryClient.clear();
            dispatch(sessionEnded());
            router.replace('/(auth)/forgot-password' as never);
          },
        },
      ],
    );
  };

  const submit = async (value?: string) => {
    const code = await gate.submit(value);
    if (!code) return;
    pinStore.set(code);
    router.replace(next ? ({ pathname: next } as never) : ('/' as never));
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
          value={gate.pin}
          onChange={gate.setPin}
          onComplete={submit}
          state={gate.error ? 'error' : 'default'}
          disabled={gate.locked}
          autoFocus
          accessibilityLabel="Account PIN"
        />

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
            {gate.attemptsLeft < gate.maxAttempts
              ? ' PIN entry locks for 15 minutes after 5 wrong tries.'
              : ''}
          </Alert>
        ) : null}

        <View style={{ alignItems: 'center' }}>
          <Link onPress={handleForgotPin} accessibilityLabel="Forgot PIN">
            Forgot PIN?
          </Link>
        </View>
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
          loading={gate.isPending}
          disabled={gate.pin.length !== PIN_LENGTH || gate.locked}
          onPress={() => void submit()}
        />
      </View>
    </ScreenContainer>
  );
}
