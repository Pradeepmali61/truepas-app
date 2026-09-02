import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, FloatingInput } from '@/components/ui';
import { useChangePassword } from '@/features/auth/mutations';
import { sessionEnded } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

/** Change Password — verify current, enter new password. */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const changePassword = useChangePassword();

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      // Contract: change-password revokes refresh sessions and the current
      // access token becomes stale. Clear local state and send to login.
      queryClient.clear();
      dispatch(sessionEnded());
      Alert.alert('Success', 'Your password has been updated. Please log in again.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      setError(err?.message ?? 'Could not update password. Please try again.');
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <ScreenHeader title="Change Password" />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center' }}>
          Enter your current password and choose a new one.
        </Text>

        <FloatingInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <FloatingInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <FloatingInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error ? (
          <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <View style={{ paddingBottom: 24, paddingTop: 16 }}>
          <Button label="Update Password" onPress={handleChange} loading={changePassword.isPending} />
        </View>
      </View>
    </ScreenContainer>
  );
}
