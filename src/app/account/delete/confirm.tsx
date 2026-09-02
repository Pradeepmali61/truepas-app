import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, FloatingInput } from '@/components/ui';
import { useDeleteAccount } from '@/features/auth/mutations';

/** Delete account — type DELETE + PIN verification. */
export default function ConfirmDeletionScreen() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const deleteAccount = useDeleteAccount();

  const canDelete = confirmation.trim() === 'DELETE' && pin.length === 4;

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Confirm Deletion" />
      <View className="flex-1 px-6">
        <View className="py-6">
          <Text className="text-[14px] leading-[21px] text-muted">
            Type <Text className="font-bold text-primary">DELETE</Text> to confirm you want to
            permanently delete your account and all associated data.
          </Text>
        </View>
        <View className="-mx-6">
          <FloatingInput
            label="Type DELETE"
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect={false}
            value={confirmation}
            onChangeText={setConfirmation}
          />
          <FloatingInput
            label="Enter PIN"
            placeholder="• • • •"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={(value) => setPin(value.replace(/\D/g, ''))}
          />
        </View>
        <Spacer />
        <View className="pb-6 pt-4">
          <Button
            label="Delete My Account"
            variant="danger"
            disabled={!canDelete}
            loading={deleteAccount.isPending}
            onPress={async () => {
              try {
                await deleteAccount.mutateAsync();
                router.push('/account/delete/processing');
              } catch {
                router.push('/account/delete/processing');
              }
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
