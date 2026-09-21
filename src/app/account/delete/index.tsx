import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { Card, Alert as InlineAlert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input, Typography } from '@/components/ui';
import { useDeleteAccount } from '@/features/auth/mutations';
import { flowGuards } from '@/services/flowGuards';
import { useThemeTokens } from '@/theme';

/**
 * Delete account — DELETE /user/me { confirmation: "DELETE", pin }.
 * Removes face + documents before tombstone. Type DELETE + enter PIN, then
 * the destructive footer CTA enables.
 */
export default function DeleteAccountScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const [confirmation, setConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const deleteAccount = useDeleteAccount();

  const canDelete = confirmation.trim() === 'DELETE' && pin.length === 4;

  const handleDelete = async () => {
    if (!canDelete || deleteAccount.isPending) return;
    setError('');
    try {
      await deleteAccount.mutateAsync({ confirmation: confirmation.trim(), pin });
      flowGuards.grant('account:deleting');
      router.push('/account/delete/processing');
    } catch (err: any) {
      // A failed delete must NOT reach the success flow — a wrong PIN or a
      // network drop means the account still exists server-side.
      setError(toApiError(err).message || 'Could not delete account. Please try again.');
      setPin('');
    }
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Delete account" onBack={router.back} />
      <View
        style={{
          flex: 1,
          padding: theme.spacing[4],
          paddingTop: theme.spacing[6],
          gap: theme.spacing[4],
        }}>
        <InlineAlert variant="error" title="This can't be undone">
          Your identity, face template, documents and family links are permanently removed.
        </InlineAlert>

        <Card noPadding style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Typography variant="label" color="muted">
            Type DELETE to confirm
          </Typography>
          <Input
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
          />
          <View style={{ gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
            <Typography variant="body">Account PIN</Typography>
            <OtpInput
              length={4}
              value={pin}
              onChange={(v) => { setPin(v); if (error) setError(''); }}
              state={error ? 'error' : 'default'}
              accessibilityLabel="Account PIN"
            />
          </View>
        </Card>

        {error ? (
          <InlineAlert variant="error" title="Deletion failed">
            {error}
          </InlineAlert>
        ) : null}
      </View>

      <View
        style={{
          padding: theme.spacing[4],
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <Button
          label="Permanently delete account"
          variant="danger"
          size="lg"
          disabled={!canDelete}
          loading={deleteAccount.isPending}
          onPress={handleDelete}
        />
      </View>
    </ScreenContainer>
  );
}
