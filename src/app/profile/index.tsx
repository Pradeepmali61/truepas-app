import { useRouter } from 'expo-router';
import {
    Camera,
    ChevronRight,
    Fingerprint,
    Mail,
    PenLine,
    Phone
} from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Card, ScreenHeader } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProfileHeader } from '@/components/truepas';
import { Avatar, Divider, Spinner, Typography } from '@/components/ui';
import { useLogout } from '@/features/auth/mutations';
import { sessionEnded } from '@/features/auth/slice';
import { useProfilePicture, useUploadProfilePicture } from '@/features/profile/hooks';
import { useToast } from '@/hooks/useToast';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import { useQueryClient } from '@tanstack/react-query';

/** Icon-in-tile + value/label row used for the contact card. */
function InfoRow({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  const theme = useThemeTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.actionSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Typography variant="body">{value}</Typography>
        <Typography variant="body-sm" color="secondary">{label}</Typography>
      </View>
    </View>
  );
}

/** Tappable label + chevron row used for the actions card. */
function ActionRow({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        minHeight: 52,
      }}>
      <View style={{ flex: 1 }}>
        <Typography variant="body" color={destructive ? 'error' : 'primary'}>
          {label}
        </Typography>
      </View>
      <ChevronRight size={iconSize.md} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const theme = useThemeTokens();
  const user = useAppSelector((state) => state.auth.user);
  const { url: profilePictureUrl } = useProfilePicture();
  const { mutateAsync: uploadProfilePicture, isPending: isUploading } = useUploadProfilePicture();
  const toast = useToast();
  const logout = useLogout();

  const handlePickProfilePicture = async () => {
    try {
      // Lazy-require: keeps expo-image-picker's native module out of the
      // startup import chain so older dev clients don't crash on launch.
      const ImagePicker = require('expo-image-picker');
      if (Platform.OS === 'ios') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          toast.show('error', 'Photo access is needed to upload a profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await uploadProfilePicture(result.assets[0].uri);
        toast.show('success', 'Profile picture updated');
      }
    } catch {
      toast.show('error', 'Failed to update profile picture. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await logout.mutateAsync({ refreshToken });
      }
    } catch {
      // Best-effort — clear local state regardless
    }
    queryClient.clear();
    dispatch(sessionEnded());
    router.dismissTo('/(auth)/login' as never);
    toast.show('success', 'Logged out successfully');
  };

  const consentDate = user?.biometricConsentAt
    ? new Date(user.biometricConsentAt).toLocaleDateString()
    : null;

  // Sensitive actions go through the re-auth PIN gate first.
  const gate = (next: string) => () =>
    router.push({ pathname: '/security/confirm-pin', params: { next } } as never);

  return (
    <ScreenContainer scroll background={false}>
      <ScreenHeader
        title="Profile"
        actions={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => router.push('/profile/edit')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1], padding: theme.spacing[2] }}
            hitSlop={8}>
            <PenLine size={iconSize.sm} color={theme.colors.actionPrimary} />
            <Typography variant="body" style={{ color: theme.colors.actionPrimary, fontWeight: theme.fontWeight.medium }}>
              Edit
            </Typography>
          </Pressable>
        }
      />

      {/* Hero — design-repo ProfileHeader; the avatar slot carries the real
          photo-upload affordance (preview, spinner, camera badge). */}
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
        <ProfileHeader
          user={{
            fullName: user?.fullName ?? 'User',
            email: user?.email ?? '—',
            faceEnrolled: user?.faceEnrolled ?? false,
          }}
          avatar={
            <View>
              <Avatar
                uri={profilePictureUrl ?? undefined}
                name={user?.fullName}
                size="xl"
                style={{ width: 72, height: 72 }}
              />
              {isUploading && (
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: theme.radii.full,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Spinner size="md" color="#FFFFFF" label="Uploading photo" />
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                onPress={handlePickProfilePicture}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.colors.actionPrimary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: theme.colors.surface,
                }}>
                <Camera size={14} color={theme.colors.onActionPrimary} />
              </Pressable>
            </View>
          }
          style={{ width: '100%' }}
        />
      </View>

      {/* Contact / consent card */}
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4], gap: theme.spacing[4] }}>
        <Card noPadding>
          <InfoRow
            icon={<Mail size={iconSize.sm} color={theme.colors.textSecondary} />}
            value={user?.email ?? '—'}
            label="Email"
          />
          <Divider style={{ marginLeft: 40 + theme.spacing[3] + theme.spacing[4] }} />
          <InfoRow
            icon={<Phone size={iconSize.sm} color={theme.colors.textSecondary} />}
            value={user?.phone ?? '—'}
            label="Mobile"
          />
          <Divider style={{ marginLeft: 40 + theme.spacing[3] + theme.spacing[4] }} />
          <InfoRow
            icon={<Fingerprint size={iconSize.sm} color={theme.colors.textSecondary} />}
            value="Biometric consent"
            label={consentDate ? `Granted ${consentDate}` : 'Not granted'}
          />
        </Card>

        {/* Account actions card */}
        <Card noPadding>
          <ActionRow label="Change password" onPress={gate('/security/change-password')} />
          <Divider style={{ marginHorizontal: theme.spacing[4] }} />
          <ActionRow label="Change PIN" onPress={gate('/security/change-pin')} />
          <Divider style={{ marginHorizontal: theme.spacing[4] }} />
          {/* Direct push, not gate(): /face-update/pin is itself the PIN
              verification step — wrapping it would ask for the PIN twice. */}
          <ActionRow label="Update face" onPress={() => router.push('/face-update/pin')} />
          <Divider style={{ marginHorizontal: theme.spacing[4] }} />
          <ActionRow label="Delete account" destructive onPress={gate('/account/delete')} />
        </Card>

        {/* Log out — only entry point in the app, so it stays reachable */}
        <Card noPadding>
          <ActionRow label="Log out" destructive onPress={handleLogout} />
        </Card>
      </View>
    </ScreenContainer>
  );
}
