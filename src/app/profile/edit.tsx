import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { DatePicker, FormField, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Input } from '@/components/ui';
import { useUpdateProfile } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Edit profile — PUT /user/me only accepts { fullName, dateOfBirth, address }.
 * Email & phone are server-locked (409 until re-verification), so they render
 * read-only with a lock affordance.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  // Registration stores DOB as MM/DD/YYYY while the picker speaks ISO —
  // normalize on the way in so an existing value renders instead of "Invalid Date".
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const raw = user?.dateOfBirth ?? '';
    return /^\d{2}\/\d{2}\/\d{4}$/.test(raw)
      ? `${raw.slice(6)}-${raw.slice(0, 2)}-${raw.slice(3, 5)}`
      : raw;
  });
  const [address, setAddress] = useState(user?.address ?? '');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    setError('');
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
      });
      toast.show('success', 'Profile updated');
      router.back();
    } catch (err: any) {
      const apiErr = toApiError(err);
      // A 409 here means a locked field (email/phone) was rejected — the shared
      // mapper's fallback ("account already exists") is written for register.
      setError(
        apiErr.code === 'CONFLICT'
          ? 'Email and phone are locked to your account — contact support to change them.'
          : apiErr.message || 'Could not save changes. Please try again.',
      );
    }
  };

  return (
    <ScreenContainer scroll={false} background={false}>
      <ScreenHeader title="Edit profile" onBack={router.back} />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[4], paddingTop: theme.spacing[6], gap: theme.spacing[4] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <FormField label="Full name" error={error || undefined}>
          <Input
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ada Example"
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Date of birth">
          <DatePicker
            value={dateOfBirth}
            onValueChange={setDateOfBirth}
            placeholder="Jan 2, 1990"
            maxDate={todayIso()}
            accessibilityLabel="Date of birth"
          />
        </FormField>

        <FormField label="Address" helperText="Optional — used for venue pre-fill.">
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="1 Example Street, Orlando, FL"
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Email" description="Locked — contact support to change." disabled>
          <Input
            value={user?.email ?? ''}
            editable={false}
            iconRight={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
          />
        </FormField>

        <FormField label="Phone" description="Locked — contact support to change." disabled>
          <Input
            value={user?.phone ?? ''}
            editable={false}
            iconRight={<Lock size={iconSize.sm} color={theme.colors.textMuted} />}
          />
        </FormField>
      </ScrollView>

      <View
        style={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[4],
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <Button label="Save changes" size="lg" loading={updateProfile.isPending} onPress={handleSave} />
      </View>
    </ScreenContainer>
  );
}
