import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, PinDots } from '@/components/ui';

const PIN_LENGTH = 4;

/** Update face — PIN verification sheet (PRD FR-04: PIN required for face updates). */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <Pressable className="flex-1" accessibilityLabel="Dismiss" onPress={() => router.back()} />
      <View className="rounded-t-[20px] bg-white px-6 pb-7 pt-7 shadow-lg" style={{ elevation: 8 }}>
        <Text accessibilityRole="header" className="mb-1 text-center text-[18px] font-bold text-primary">
          Confirm PIN
        </Text>
        <Text className="mb-5 text-center text-[14px] text-muted">
          Enter your PIN to update your face
        </Text>
        <Pressable accessibilityLabel="Enter PIN" className="items-center">
          <PinDots length={PIN_LENGTH} filled={pin.length} />
          <TextInput
            value={pin}
            onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
            keyboardType="number-pad"
            secureTextEntry
            autoFocus
            maxLength={PIN_LENGTH}
            className="absolute h-full w-full opacity-0"
            accessibilityLabel="PIN input"
          />
        </Pressable>
        <View className="mt-3">
          <Button
            label="Confirm"
            disabled={pin.length !== PIN_LENGTH}
            onPress={() => router.push('/face-update/camera')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
