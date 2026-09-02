import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Icon, PinDots, PinPad } from '@/components/ui';
import { useChangePin } from '@/features/auth/mutations';

const PIN_LENGTH = 4;

type Step = 'verify' | 'create';

/** Change PIN — step 1 verify current, step 2 create new. */
export default function ChangePinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('verify');
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const changePin = useChangePin();

  const handleDigit = (digit: string) => {
    const next = (pin + digit).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(async () => {
        if (step === 'verify') {
          setCurrentPin(next);
          setStep('create');
          setPin('');
        } else {
          try {
            await changePin.mutateAsync({ currentPin, newPin: next });
            Alert.alert('Success', 'Your PIN has been updated.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not update PIN. Please try again.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          }
        }
      }, 250);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Change PIN" />
      <View className="flex-1 items-center justify-center p-5">
        <Icon name="lock" size={36} />
        <Text accessibilityRole="header" className="mb-1 mt-4 text-[18px] font-bold text-primary">
          {step === 'verify' ? 'Enter Current PIN' : 'Create New PIN'}
        </Text>
        <Text className="mb-[10px] text-[14px] text-muted">
          {step === 'verify' ? "Verify it's you before changing PIN" : 'Enter a new 4-digit PIN'}
        </Text>
        <PinDots length={PIN_LENGTH} filled={pin.length} />
      </View>
      <PinPad onDigit={handleDigit} onBackspace={() => setPin((p) => p.slice(0, -1))} />
    </ScreenContainer>
  );
}
