/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, FileText, Info, Palette, ScanFace, Sun, Trash2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardContent, Modal, ScreenHeader } from '@/components/composite';
import { CoreButton, Divider, Select, Switch, Typography } from '@/components/ui';
import { BRAND_PRESETS, useTheme, useThemeTokens, type BrandPreset, type ColorScheme, type RadiusPreset } from '@/theme';
import { iconSize } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { scheme, setScheme, brand, setBrand, radius, setRadius } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const settingRow = (icon: ReactNode, label: string, right: ReactNode) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[3],
        paddingVertical: theme.spacing[2],
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], flexShrink: 1 }}>
        {icon}
        <Typography variant="body">{label}</Typography>
      </View>
      {right}
    </View>
  );

  const linkRow = (icon: ReactNode, title: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[3],
        },
        pressed && { opacity: 0.7 },
      ]}>
      {icon}
      <Typography variant="body" style={{ flex: 1 }}>
        {title}
      </Typography>
      <ChevronRight size={iconSize.sm} color={theme.colors.textMuted} />
    </Pressable>
  );

  const sectionLabel = (text: string) => (
    <Typography variant="caption" color="muted" style={{ letterSpacing: theme.letterSpacing.caps }}>
      {text}
    </Typography>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Settings" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom,
          gap: theme.spacing[5],
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('PREFERENCES')}
          <Card>
            <CardContent>
              {settingRow(
                <Bell size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Notifications',
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />,
              )}
              <Divider />
              {settingRow(
                <ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Face ID Login',
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                />,
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('APPEARANCE')}
          <Card>
            <CardContent>
              {/* Theme — light/dark/system, resolved against the OS when system */}
              {settingRow(
                <Sun size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Theme',
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
                />,
              )}
              <Divider />
              {/* Accent — swaps the brand ramp; every token-built screen recolors */}
              {settingRow(
                <Palette size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Accent',
                <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
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
                        borderRadius: theme.radii.full,
                        backgroundColor: BRAND_PRESETS[p].b500,
                        borderWidth: brand === p ? 3 : 0,
                        borderColor: theme.colors.actionPrimary,
                      }}
                    />
                  ))}
                </View>,
              )}
              <Divider />
              {/* Corner radius preset */}
              {settingRow(
                <Palette size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Radius',
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
                />,
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('PRIVACY & LEGAL')}
          <Card>
            <CardContent style={{ paddingVertical: theme.spacing[1] }}>
              {linkRow(
                <FileText size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Data & Privacy',
                () => router.push('/legal/data-privacy'),
              )}
              <Divider />
              {linkRow(
                <FileText size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Privacy Policy',
                () => router.push('/legal/privacy-policy'),
              )}
              <Divider />
              {linkRow(
                <FileText size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Terms of Service',
                () => router.push('/legal/terms'),
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('ABOUT')}
          <Card>
            <CardContent style={{ paddingVertical: theme.spacing[1] }}>
              {linkRow(
                <Info size={iconSize.md} color={theme.colors.actionPrimary} />,
                'About Truepas',
                () => router.push('/about' as never),
              )}
              <Divider />
              {settingRow(
                <FileText size={iconSize.md} color={theme.colors.actionPrimary} />,
                'Version',
                <Typography variant="body-sm" color="muted">
                  1.0.0
                </Typography>,
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('DANGER ZONE')}
          <Card>
            <CardContent style={{ paddingVertical: theme.spacing[1] }}>
              <Pressable
                onPress={() => setConfirmDelete(true)}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    paddingVertical: theme.spacing[3],
                  },
                  pressed && { opacity: 0.7 },
                ]}>
                <Trash2 size={iconSize.md} color={theme.colors.error} />
                <Typography variant="body" style={{ color: theme.colors.error, flex: 1 }}>
                  Delete Account
                </Typography>
              </Pressable>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}
