import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Avatar, Card, Icon, ListItem, SectionTitle } from '@/components/ui';
import { sessionEnded } from '@/features/auth/slice';
import { useAppDispatch, useAppSelector } from '@/store';

/** Profile — identity-focused profile hub. */
export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const initials =
    user?.fullName
      .split(' ')
      .map((part) => part[0])
      .join('') ?? 'U';

  return (
    <ScreenContainer>
      <View className="items-center px-5 pb-3 pt-6">
        <Avatar initials={initials} size={72} />
        <Text accessibilityRole="header" className="mt-[10px] text-[18px] font-bold text-primary">
          {user?.fullName ?? 'User'}
        </Text>
        <Text className="text-[14px] text-muted">{user?.email ?? ''}</Text>
      </View>

      <Card>
        <Text className="mb-2 text-[12px] text-muted">Identity Status</Text>
        <View className="mb-[6px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon name="shield" size={18} />
            <Text className="text-[13px] text-ink">Face Enrolled</Text>
          </View>
          <Icon name="check" size={16} color="#2727d6" />
        </View>
        <View className="mb-[6px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon name="idCard" size={18} />
            <Text className="text-[13px] text-ink">Documents Verified</Text>
          </View>
          <Text className="text-[12px] font-semibold text-primary">2</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon name="family" size={18} />
            <Text className="text-[13px] text-ink">Family Members</Text>
          </View>
          <Text className="text-[12px] font-semibold text-primary">3</Text>
        </View>
      </Card>

      <SectionTitle>Account</SectionTitle>
      <ListItem icon="edit" title="Edit Profile" showChevron onPress={() => router.push('/profile/edit')} />
      <ListItem icon="documents" title="Documents" showChevron onPress={() => router.push('/(tabs)/documents')} />
      <ListItem icon="family" title="Family Members" showChevron onPress={() => router.push('/(tabs)/family')} />
      <ListItem icon="lock" title="PIN & Security" showChevron onPress={() => router.push('/security')} />
      <ListItem icon="face" title="Update Face" showChevron onPress={() => router.push('/face-update/pin')} />

      <SectionTitle>General</SectionTitle>
      <ListItem icon="document" title="Data & Privacy" showChevron onPress={() => router.push('/legal/data-privacy')} />
      <ListItem icon="document" title="Privacy Policy" showChevron onPress={() => router.push('/legal/privacy-policy')} />
      <ListItem icon="document" title="Terms of Service" showChevron onPress={() => router.push('/legal/terms')} />
      <ListItem icon="info" title="About Truepas" showChevron />
      <ListItem icon="logout" title="Log Out" onPress={() => dispatch(sessionEnded())} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Identity"
        onPress={() => router.dismissTo('/(tabs)')}
        className="border-t border-surface bg-white px-5 py-3">
        <Text className="text-center text-[14px] font-medium text-primary">Back to Identity</Text>
      </Pressable>
    </ScreenContainer>
  );
}
