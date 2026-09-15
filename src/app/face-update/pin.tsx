import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { FormField, OtpInput, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Typography } from '@/components/ui';
import { useVerifyPin } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { useThemeTokens } from '@/theme';

const PIN_LENGTH = 4;

/** Update face — PIN verification (PRD FR-04: PIN required for face updates).
 *  Forwards `personId` (when present) so the face update targets the family
 *  member instead of the authenticated main user. */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const [pin, setPin] = useState('');
  const verifyPin = useVerifyPin();
  const toast = useToast();

  const handleComplete = async (next: string) => {
    try {
      await verifyPin.mutateAsync(next);
      router.push({
        pathname: '/face-update/camera',
        params: personId ? { personId } : {},
      });
    } catch (err: any) {
      // toApiError maps raw axios messages ("Request failed with status
      // code 400") to user-presentable copy.
      toast.show('error', toApiError(err).message ?? 'Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Confirm PIN" onBack={router.back} />
      <View
        style={{
          flex: 1,
          padding: theme.spacing[4],
          paddingTop: theme.spacing[6],
          gap: theme.spacing[4],
        }}>
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography variant="h3" center>
            Enter Your PIN
          </Typography>
          <Typography color="secondary" center>
            Verify it&apos;s you to update your face
          </Typography>
        </View>
        <FormField>
          <OtpInput
            length={PIN_LENGTH}
            value={pin}
            onChange={setPin}
            onComplete={handleComplete}
            accessibilityLabel="Current PIN"
          />
        </FormField>
      </View>
    </ScreenContainer>
  );
}
