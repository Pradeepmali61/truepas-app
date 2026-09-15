import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, PinDots, PinPad } from '@/components/ui';
import { useVerifyPin } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';

const PIN_LENGTH = 4;

/** Update face — PIN verification (PRD FR-04: PIN required for face updates).
 *  Forwards `personId` (when present) so the face update targets the family
 *  member instead of the authenticated main user. */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const [pin, setPin] = useState('');
  const verifyPin = useVerifyPin();
  const toast = useToast();

  const handleDigit = (digit: string) => {
    const next = (pin + digit).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(async () => {
        try {
          await verifyPin.mutateAsync(next);
          router.push({
            pathname: '/face-update/camera',
            params: personId ? { personId } : {},
          });
        } catch (err: any) {
          // toApiError maps raw axios messages ("Request failed with status
          // code 400") to user-presentable copy.
          toast.show('error', toApiError(err).message ?? 'Incorrect PIN. Please try again.');
          setPin('');
        }
      }, 250);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <ScreenHeader title="Confirm PIN" />
      <View className="flex-1 items-center justify-center p-5">
        <Icon name="lock" size={36} color="#08B6FC" />
        <Text accessibilityRole="header" className="mb-1 mt-4 text-[18px] font-bold text-primary">
          Enter Your PIN
        </Text>
        <Text className="mb-[10px] text-[14px] text-muted">
          Verify it's you to update your face
        </Text>
        <PinDots length={PIN_LENGTH} filled={pin.length} />
      </View>
      <PinPad onDigit={handleDigit} onBackspace={() => setPin((p) => p.slice(0, -1))} />
    </ScreenContainer>
  );
}
