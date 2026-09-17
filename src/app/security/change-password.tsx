import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { FormField, Alert as InlineAlert, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input, Typography } from '@/components/ui';
import { useChangePassword } from '@/features/auth/mutations';
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const changePassword = useChangePassword();
  const toast = useToast();

  const eye = (visible: boolean, toggle: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      onPress={toggle}
      hitSlop={8}>
      {visible
        ? <EyeOff size={iconSize.sm} color={theme.colors.textMuted} />
        : <Eye size={iconSize.sm} color={theme.colors.textMuted} />}
    </Pressable>
  );

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
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
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
            autoCorrect={false}
            iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
            iconRight={eye(showCurrent, () => setShowCurrent((v) => !v))}
          />
        </FormField>

        <FormField label="New password" required helperText="8+ characters.">
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry={!showNew}
            autoCapitalize="none"
            autoCorrect={false}
            iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
            iconRight={eye(showNew, () => setShowNew((v) => !v))}
          />
        </FormField>

        <FormField label="Confirm new password" required>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoCorrect={false}
            iconLeft={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
            iconRight={eye(showConfirm, () => setShowConfirm((v) => !v))}
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
