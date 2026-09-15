import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Modal } from '@/components/composite';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card, CoreButton, Icon, ListItem, SectionTitle, Select, Typography } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { BRAND_PRESETS, useTheme, useThemeTokens, type BrandPreset, type ColorScheme, type RadiusPreset } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const { scheme, setScheme, brand, setBrand, radius, setRadius } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

      <SectionTitle>Appearance</SectionTitle>
      <Card>
        {/* Theme — light/dark/system, resolved against the OS when system */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="settings" size={20} color={Colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.ink }}>Theme</Text>
          </View>
          <Select
            size="sm"
            title="Theme"
            accessibilityLabel="Choose theme"
            style={{ minWidth: 120 }}
            value={scheme}
            onValueChange={(v) => setScheme(v as ColorScheme)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </View>
        <View className="my-1 h-px bg-divider" />
        {/* Accent — swaps the brand ramp; every token-built screen recolors */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="settings" size={20} color={Colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.ink }}>Accent</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(Object.keys(BRAND_PRESETS) as BrandPreset[]).map((p) => (
              <Pressable
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ selected: brand === p }}
                accessibilityLabel={`${p} accent`}
                onPress={() => setBrand(p)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: BRAND_PRESETS[p].b500,
                  borderWidth: brand === p ? 3 : 0,
                  borderColor: theme.colors.actionPrimary,
                }}
              />
            ))}
          </View>
        </View>
        <View className="my-1 h-px bg-divider" />
        {/* Corner radius preset */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="settings" size={20} color={Colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.ink }}>Radius</Text>
          </View>
          <Select
            size="sm"
            title="Corner radius"
            accessibilityLabel="Choose corner radius"
            style={{ minWidth: 120 }}
            value={radius}
            onValueChange={(v) => setRadius(v as RadiusPreset)}
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'default', label: 'Default' },
              { value: 'round', label: 'Round' },
            ]}
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
          onPress={() => setConfirmDelete(true)}
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

      <Modal
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Account?"
        footer={
          <>
            <CoreButton variant="ghost" onPress={() => setConfirmDelete(false)}>
              Cancel
            </CoreButton>
            <CoreButton
              variant="destructive"
              onPress={() => {
                setConfirmDelete(false);
                router.push('/account/delete' as never);
              }}>
              Delete
            </CoreButton>
          </>
        }>
        <Typography variant="body" color="secondary">
          This action is permanent and cannot be undone. All your data will be deleted.
        </Typography>
      </Modal>

      <View style={{ height: 24 }} />
    </ScreenContainer>
  );
}
