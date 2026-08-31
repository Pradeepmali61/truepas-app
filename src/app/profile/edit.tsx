import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, FloatingInput, Icon } from '@/components/ui';
import { useAppSelector } from '@/store';

/** Edit profile — prefilled account fields. */
export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dob, setDob] = useState('04/12/1994');

  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Edit Profile" />
      <View className="flex-1">
        <View className="items-center py-5">
          <View>
            <Avatar initials={initials} size={80} />
            <View className="absolute -bottom-[2px] -right-[2px] h-7 w-7 items-center justify-center rounded-full border-2 border-primary-light bg-primary">
              <Icon name="camera" size={12} color="#08B6FC" />
            </View>
          </View>
        </View>
        <FloatingInput label="Full Name" value={fullName} onChangeText={setFullName} />
        <FloatingInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FloatingInput label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <FloatingInput label="Date of Birth" value={dob} onChangeText={setDob} />
        <Spacer />
        <View className="px-6 pb-6 pt-4">
          <Button label="Save Changes" onPress={() => router.back()} />
        </View>
      </View>
    </ScreenContainer>
  );
}
