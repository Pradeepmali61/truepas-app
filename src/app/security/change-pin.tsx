import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { FormField, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Typography } from '@/components/ui';
import { useChangePin } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { pinStore } from '@/services/pinStore';
import { useThemeTokens } from '@/theme';

const PIN_LENGTH = 4;

/** Two-step progress (step 1 verify → step 2 create). */
function StepDots({ total, current }: { total: number; current: number }) {
  const theme = useThemeTokens();
  return (
    <View
      style={{ flexDirection: 'row', gap: theme.spacing[1.5], alignSelf: 'center' }}
      accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 6,
            borderRadius: 3,
            width: i === current ? 18 : 6,
            backgroundColor: i === current ? theme.colors.actionPrimary : theme.colors.borderStrong,
          }}
        />
      ))}
    </View>
  );
}

/**
 * Change PIN — create step. The current PIN is verified by the confirm-pin
 * gate and stashed in pinStore; this screen only asks for the new PIN +
 * confirmation, then calls POST /auth/change-pin.
 */
export default function ChangePinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const currentPin = pinStore.get();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const changePin = useChangePin();
  const toast = useToast();

  useEffect(() => {
    if (!currentPin) {
      // Direct entry without the PIN gate — send the user back to security.
      router.replace('/security' as never);
    }
    // Release the stashed PIN when leaving — success clears it too, this
    // covers back-out so a stale PIN can't be replayed later.
    return () => pinStore.clear();
  }, [currentPin, router]);

  if (!currentPin) {
    return null;
  }

  const canSubmit =
    newPin.length === PIN_LENGTH && confirmPin.length === PIN_LENGTH && newPin === confirmPin;

  const handleUpdate = async () => {
    if (newPin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH) {
      setError('Enter your new PIN twice');
      return;
    }
    if (newPin !== confirmPin) { setError('PINs do not match'); return; }
    setError('');
    try {
      await changePin.mutateAsync({ currentPin, newPin });
      pinStore.clear();
      toast.show('success', 'Your PIN has been updated.');
      router.back();
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not update PIN. Please try again.');
    }
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Change PIN" onBack={router.back} />
      <View
        style={{
          flex: 1,
          padding: theme.spacing[4],
          paddingTop: theme.spacing[6],
          gap: theme.spacing[4],
        }}>
        <StepDots total={2} current={1} />
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography variant="h3" center>
            Choose a new PIN
          </Typography>
          <Typography color="secondary" center>
            4 digits. Avoid birthdays and repeated numbers.
          </Typography>
        </View>
        <FormField label="New PIN">
          <OtpInput length={PIN_LENGTH} value={newPin} onChange={setNewPin} accessibilityLabel="New PIN" />
        </FormField>
        <FormField label="Confirm new PIN" error={error || undefined}>
          <OtpInput
            length={PIN_LENGTH}
            value={confirmPin}
            onChange={setConfirmPin}
            accessibilityLabel="Confirm new PIN"
          />
        </FormField>
      </View>

      <View
        style={{
          padding: theme.spacing[4],
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <Button
          label="Update PIN"
          size="lg"
          loading={changePin.isPending}
          disabled={!canSubmit}
          onPress={handleUpdate}
        />
      </View>
    </ScreenContainer>
  );
}
