import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { FormField, Alert as InlineAlert, OtpInput, ScreenHeader, Section } from '@/components/composite';
import { Button, Input } from '@/components/ui';
import { useDeleteAccount } from '@/features/auth/mutations';
import { useKeyboardScrollPad } from '@/hooks/useKeyboardScrollPad';
import { useToast } from '@/hooks/useToast';
import { flowGuards } from '@/services/flowGuards';
import { useThemeTokens } from '@/theme';

/**
 * Delete account — DELETE /user/me { confirmation: "DELETE", pin }.
 * Removes face + documents before tombstone. Type DELETE + enter PIN, then
 * the destructive footer CTA enables.
 * Ported 1:1 from UI-design-repo screens/settings/DeleteAccountScreen.tsx —
 * success still routes through our real processing/success pipeline.
 */
export default function DeleteAccountScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const kbd = useKeyboardScrollPad();
  const toast = useToast();
  const [confirmation, setConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const deleteAccount = useDeleteAccount();

  const canDelete = confirmation.trim() === 'DELETE' && pin.length === 4;

  const handleDelete = async () => {
    if (!canDelete || deleteAccount.isPending) return;
    setPinError(false);
    try {
      await deleteAccount.mutateAsync({ confirmation: confirmation.trim(), pin });
      flowGuards.grant('account:deleting');
      router.push('/account/delete/processing');
    } catch (err: any) {
      // A 422 here means the confirmation passed client-side but the PIN was
      // rejected — flag the PIN field and let the user retry it. A failed
      // delete must NOT reach the success flow either way.
      if (toApiError(err).status === 422) setPinError(true);
      toast.show('error', toApiError(err).message || 'Could not delete account. Please try again.');
      setPin('');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScreenHeader title="Delete account" onBack={router.back} />
        <ScrollView
          {...kbd.scrollProps}
          contentContainerStyle={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[4],
            gap: theme.spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <InlineAlert variant="error" title="This can't be undone">
            Deleting your account permanently removes your face templates, documents, family data and
            active sessions.
          </InlineAlert>

          <Section>
            <FormField label='Type "DELETE" to confirm'>
              <Input
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder="DELETE"
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
              />
            </FormField>
            <FormField
              label="Account PIN"
              error={pinError ? 'Incorrect PIN — try again.' : undefined}>
              <OtpInput
                length={4}
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setPinError(false);
                }}
                error={pinError}
                autoFocus
                accessibilityLabel="Account PIN"
              />
            </FormField>
          </Section>
        </ScrollView>

        <View
          {...kbd.footerProps}
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[6],
            paddingBottom: theme.spacing[4] + insets.bottom,
            gap: theme.spacing[2],
          }}>
          <Button
            label="Permanently delete"
            variant="danger"
            size="lg"
            disabled={!canDelete}
            loading={deleteAccount.isPending}
            onPress={() => void handleDelete()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
