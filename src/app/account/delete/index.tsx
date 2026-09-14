import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card, Alert as InlineAlert, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input, Typography } from '@/components/ui';
import { useDeleteAccount } from '@/features/auth/mutations';
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
  const deleteAccount = useDeleteAccount();

  const canDelete = confirmation.trim() === 'DELETE' && pin.length === 4;

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      await deleteAccount.mutateAsync({ confirmation, pin });
    } catch {
      // Original behavior: proceed to processing even on a failed call.
    }
    router.push('/account/delete/processing');
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
            <OtpInput length={4} value={pin} onChange={setPin} accessibilityLabel="Account PIN" />
          </View>
        </Card>
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
