import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, PinDots, PinPad } from '@/components/ui';

const PIN_LENGTH = 4;

/** Update face — PIN verification (PRD FR-04: PIN required for face updates). */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    const next = (pin + digit).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => router.push('/face-update/camera'), 250);
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
