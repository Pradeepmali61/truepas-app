import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card, Icon, ListItem, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" />

      <SectionTitle>Preferences</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="bell" size={20} color={Colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.ink }}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#E5E7EB', true: '#08B6FC' }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="my-1 h-px bg-divider" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="face" size={20} color={Colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.ink }}>Face ID Login</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: '#E5E7EB', true: '#08B6FC' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <SectionTitle>Privacy & Legal</SectionTitle>
      <Card>
        <ListItem icon="document" title="Data & Privacy" showChevron onPress={() => router.push('/legal/data-privacy')} />
        <View className="my-1 h-px bg-divider" />
        <ListItem icon="document" title="Privacy Policy" showChevron onPress={() => router.push('/legal/privacy-policy')} />
        <View className="my-1 h-px bg-divider" />
        <ListItem icon="document" title="Terms of Service" showChevron onPress={() => router.push('/legal/terms')} />
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card>
        <ListItem icon="info" title="About Truepas" showChevron onPress={() => router.push('/about' as never)} />
        <View className="my-1 h-px bg-divider" />
        <ListItem icon="document" title="Version" rightSlot={<Text style={{ fontSize: 14, color: Colors.textMuted }}>1.0.0</Text>} />
      </Card>

      <SectionTitle>Danger Zone</SectionTitle>
      <Card>
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Account?',
              'This action is permanent and cannot be undone. All your data will be deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => router.push('/account/delete' as never) },
              ],
            );
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 4,
          }}>
          <Icon name="trash" size={20} color="#EF4444" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#EF4444' }}>Delete Account</Text>
        </Pressable>
      </Card>

      <View style={{ height: 24 }} />
    </ScreenContainer>
  );
}
