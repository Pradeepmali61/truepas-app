import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Alert as RNAlert, ScrollView, View } from 'react-native';

import { isMockApi } from '@/api';
import { MOCK_PIN } from '@/api/mock';
import { Alert, FormField, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Link, NeuBox, Typography } from '@/components/ui';
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
 * Visuals ported 1:1 from UI-design-repo screens/settings/VerifyPinScreen.tsx;
 * the attempt lockout alert and Forgot-PIN escape hatch are real backend
 * contract features kept on top.
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
      <ScrollView
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
            Required before changing security settings.
          </Typography>
        </View>

        <FormField error={gate.error ?? undefined}>
          <OtpInput
            length={PIN_LENGTH}
            value={gate.pin}
            onChange={gate.setPin}
            onComplete={submit}
            error={gate.error != null}
            disabled={gate.locked}
            autoFocus
            accessibilityLabel="Account PIN"
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

        {__DEV__ && isMockApi() && (
          <Typography variant="caption" color="muted" center>
            Demo PIN: {MOCK_PIN}
          </Typography>
        )}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4],
          gap: theme.spacing[2],
        }}>
        <Button
          label="Verify"
          size="lg"
          loading={gate.isPending}
          disabled={gate.pin.length !== PIN_LENGTH || gate.locked}
          onPress={() => void submit()}
        />
      </View>
    </ScreenContainer>
  );
}
