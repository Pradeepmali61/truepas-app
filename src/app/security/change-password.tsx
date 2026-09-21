import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { FormField, Alert as InlineAlert, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input, Typography } from '@/components/ui';
import { useChangePassword } from '@/features/auth/mutations';
import { newPasswordSchema } from '@/features/auth/schemas';
import { sessionEnded } from '@/features/auth/slice';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/**
 * Change password — POST /auth/change-password { currentPassword, newPassword }.
 * Success revokes refresh sessions and the current access token, so local
 * state is cleared and the user is returned to login.
 */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const theme = useThemeTokens();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const changePassword = useChangePassword();
  const toast = useToast();

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    const passwordCheck = newPasswordSchema.safeParse(newPassword);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0].message);
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current one');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      // Contract: success revokes refresh sessions and the current access
      // token — clear local state and send the user back to login.
      queryClient.clear();
      dispatch(sessionEnded());
      toast.show('success', 'Your password has been updated. Please log in again.');
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(toApiError(err).message || 'Could not update password. Please try again.');
    }
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Change password" onBack={router.back} />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[4], paddingTop: theme.spacing[6], gap: theme.spacing[4] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {error ? (
          <Typography variant="body-sm" color="error">
            {error}
          </Typography>
        ) : null}
        <FormField label="Current password" required>
          <Input
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
          />
        </FormField>

        <FormField label="New password" required helperText="8+ characters with uppercase, lowercase, number & symbol.">
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
          />
        </FormField>

        <FormField label="Confirm new password" required>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
          />
        </FormField>

        <InlineAlert variant="warning" title="You'll be signed out">
          All sessions end when the password changes. Sign in again afterwards.
        </InlineAlert>
      </ScrollView>

      <View
        style={{
          padding: theme.spacing[4],
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <Button
          label="Update password"
          size="lg"
          loading={changePassword.isPending}
          onPress={handleChange}
        />
      </View>
    </ScreenContainer>
  );
}
