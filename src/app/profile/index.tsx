import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card, Icon, ListItem, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useLogout } from '@/features/auth/mutations';
import { sessionEnded } from '@/features/auth/slice';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useProfilePicture, useUploadProfilePicture } from '@/features/profile/hooks';
import { useToast } from '@/hooks/useToast';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const { data: documents } = useDocuments();
  const { data: family } = useFamily();
  const { url: profilePictureUrl } = useProfilePicture();
  const { mutateAsync: uploadProfilePicture, isPending: isUploading } = useUploadProfilePicture();
  const toast = useToast();
  const logout = useLogout();

  const initials =
    user?.fullName
      .split(' ')
      .map((part) => part[0])
      .join('') ?? 'U';

  const docCount = documents?.length ?? 0;
  const familyCount = family?.length ?? 0;

  const handlePickProfilePicture = async () => {
    try {
      // Lazy-require: keeps expo-image-picker's native module out of the
      // startup import chain so older dev clients don't crash on launch.
      const ImagePicker = require('expo-image-picker');
      // Android uses the system photo picker — no storage permission needed.
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
    // Best-effort logout API call — clear local state even on error
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await logout.mutateAsync({ refreshToken });
      }
    } catch {
      // Ignore — we clear local state regardless
    }
    // Clear all React Query caches containing customer data
    queryClient.clear();
    dispatch(sessionEnded());
    // The entry gate only redirects when the index route renders — navigate
    // explicitly so the user lands on the login screen immediately.
    router.dismissTo('/(auth)/login' as never);
    toast.show('success', 'Logged out successfully');
  };

  return (
    <ScreenContainer>
      <View className="items-center px-5 pb-3 pt-6">
        <View>
          {profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              style={{ width: 72, height: 72, borderRadius: 24 }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#08B6FC', '#84dbfe']}
              style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
                {initials}
              </Text>
            </LinearGradient>
          )}
          {isUploading && (
            <View
              style={{
                position: 'absolute',
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            onPress={handlePickProfilePicture}
            disabled={isUploading}
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: Colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}>
            <Icon name="camera" size={13} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text accessibilityRole="header" className="mt-[10px] text-[18px] font-bold text-primary">
          {user?.fullName ?? 'User'}
        </Text>
        <Text className="text-[14px] text-muted">{user?.email ?? ''}</Text>
        <View className="mt-2 flex-row items-center gap-1 rounded-full bg-success-bg px-3 py-1">
          <Icon name="checkCircle" size={14} color="#059669" />
          <Text className="text-[12px] font-semibold text-success">Verified Identity</Text>
        </View>
      </View>

      <SectionTitle>Account</SectionTitle>
      <Card>
        <ListItem icon="edit" title="Personal Information" showChevron onPress={() => router.push('/profile/edit')} />
        <View className="my-1 h-px bg-divider" />
        <ListItem icon="documents" title="Documents" showChevron onPress={() => router.push('/(tabs)/documents')} />
        <View className="my-1 h-px bg-divider" />
        <ListItem icon="family" title="Family Members" showChevron onPress={() => router.push('/(tabs)/family')} />
      </Card>

      <SectionTitle>Security</SectionTitle>
      <Card>
        <ListItem icon="lock" title="PIN & Security" showChevron onPress={() => router.push('/security')} />
        <View className="my-1 h-px bg-divider" />
        <ListItem icon="face" title="Update Face" showChevron onPress={() => router.push('/face-update/pin')} />
      </Card>

      <SectionTitle>More</SectionTitle>
      <Card>
        <ListItem icon="settings" title="Settings" showChevron onPress={() => router.push('/settings')} />
      </Card>

      <View className="px-5 py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 rounded-btn border border-danger-bg bg-white py-[14px] active:opacity-80">
          <Icon name="logout" size={18} color="#dc2626" />
          <Text className="text-[16px] font-bold text-danger">Log Out</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
