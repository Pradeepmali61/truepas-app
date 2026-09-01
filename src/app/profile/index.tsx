import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Avatar, Card, Icon, ListItem, SectionTitle } from '@/components/ui';
import { sessionEnded } from '@/features/auth/slice';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/store';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: documents } = useDocuments();
  const { data: family } = useFamily();
  const toast = useToast();

  const initials =
    user?.fullName
      .split(' ')
      .map((part) => part[0])
      .join('') ?? 'U';

  const docCount = documents?.length ?? 0;
  const familyCount = family?.length ?? 0;

  const handleLogout = () => {
    dispatch(sessionEnded());
    toast.show('success', 'Logged out successfully');
  };

  return (
    <ScreenContainer>
      <View className="items-center px-5 pb-3 pt-6">
        <Avatar initials={initials} size={72} />
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
