import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { isMockApi } from '@/api';
import { toApiError } from '@/api/errors';
import { MOCK_PIN } from '@/api/mock';
import { FormField, OtpInput, ScreenHeader, Section } from '@/components/composite';
import { Button, Typography } from '@/components/ui';
import { useChangePin } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { pinStore } from '@/services/pinStore';
import { useThemeTokens } from '@/theme';

const PIN_LENGTH = 4;

/**
 * Change PIN — create step (design ChangePinScreen step "new"). The current
 * PIN is verified by the confirm-pin gate and stashed in pinStore; this
 * screen only asks for the new PIN + confirmation, then calls
 * POST /auth/change-pin.
 * Ported 1:1 from UI-design-repo screens/settings/ChangePinScreen.tsx.
 */
export default function ChangePinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const currentPin = pinStore.get();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
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

  const mismatch = confirmPin.length === PIN_LENGTH && newPin !== confirmPin;

  const handleUpdate = async (pin: string, confirm: string) => {
    if (
      !currentPin ||
      changePin.isPending ||
      pin.length !== PIN_LENGTH ||
      pin !== confirm
    ) {
      return;
    }
    try {
      await changePin.mutateAsync({ currentPin, newPin: pin });
      pinStore.clear();
      toast.show('success', 'PIN updated');
      router.back();
    } catch (err: any) {
      toast.show('error', toApiError(err).message || 'Could not update PIN. Please try again.');
      // Likely a mistyped current PIN — restart the gate.
      setNewPin('');
      setConfirmPin('');
    }
  };

  if (!currentPin) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Change PIN" onBack={router.back} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[4],
          gap: theme.spacing[6],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography variant="h3" center>
            Choose a new PIN
          </Typography>
          <Typography color="secondary" center>
            4 digits. Avoid birthdays and repeated numbers.
          </Typography>
        </View>

        <Section>
          <FormField label="New PIN">
            <OtpInput
              length={PIN_LENGTH}
              value={newPin}
              onChange={setNewPin}
              autoFocus
              accessibilityLabel="New PIN"
            />
          </FormField>
          <FormField label="Confirm new PIN" error={mismatch ? "PINs don't match." : undefined}>
            <OtpInput
              length={PIN_LENGTH}
              value={confirmPin}
              onChange={setConfirmPin}
              onComplete={(v) => void handleUpdate(newPin, v)}
              error={mismatch}
              accessibilityLabel="Confirm new PIN"
            />
          </FormField>
        </Section>

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
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[2],
        }}>
        <Button
          label="Update PIN"
          size="lg"
          loading={changePin.isPending}
          disabled={
            newPin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH || mismatch
          }
          onPress={() => void handleUpdate(newPin, confirmPin)}
        />
      </View>
    </SafeAreaView>
  );
}
