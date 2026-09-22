import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { FormField, Alert as InlineAlert, ScreenHeader, Section } from '@/components/composite';
import { Button, Input } from '@/components/ui';
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
 * Ported 1:1 from UI-design-repo screens/settings/ChangePasswordScreen.tsx —
 * keeps our stricter newPasswordSchema as the field-level error.
 */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const changePassword = useChangePassword();
  const toast = useToast();

  const passwordCheck = newPasswordSchema.safeParse(newPassword);
  const nextError =
    newPassword.length > 0 && !passwordCheck.success
      ? passwordCheck.error.issues[0].message
      : undefined;
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? "Passwords don't match."
      : undefined;
  const canSubmit =
    currentPassword.length > 0 && passwordCheck.success && confirmPassword === newPassword;

  const handleChange = async () => {
    if (!canSubmit || changePassword.isPending) return;
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      // Contract: success revokes refresh sessions and the current access
      // token — clear local state and send the user back to login.
      queryClient.clear();
      dispatch(sessionEnded());
      toast.show('success', 'Password updated — sign in again.');
      router.replace('/(auth)/login');
    } catch (err: any) {
      toast.show('error', toApiError(err).message || 'Could not update password. Please try again.');
    }
  };

  const lockIcon = <Lock size={iconSize.md} color={theme.colors.actionPrimary} />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Change password" onBack={router.back} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[4],
          gap: theme.spacing[6],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Section>
          <FormField label="Current password" required>
            <Input
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              iconLeft={lockIcon}
            />
          </FormField>

          <FormField
            label="New password"
            required
            error={nextError}
            helperText={
              nextError == null
                ? '8+ characters with uppercase, lowercase, number & symbol.'
                : undefined
            }>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              iconLeft={lockIcon}
            />
          </FormField>

          <FormField label="Confirm new password" required error={confirmError}>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              iconLeft={lockIcon}
            />
          </FormField>
        </Section>

        <InlineAlert variant="warning" title="You'll be signed out">
          All sessions end when the password changes. Sign in again afterwards.
        </InlineAlert>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[2],
        }}>
        <Button
          label="Update password"
          size="lg"
          loading={changePassword.isPending}
          disabled={!canSubmit}
          onPress={() => void handleChange()}
        />
      </View>
    </SafeAreaView>
  );
}
