/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import {
    ChevronRight,
    FileText,
    Info,
    Lock,
    Shield,
    Trash2,
    User
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardContent, Modal, ScreenHeader } from '@/components/composite';
import { Badge, CoreButton, Divider, RowIcon, Select, Switch, Typography } from '@/components/ui';
import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useIdentitySummary } from '@/features/identity/hooks';
import { useAppSelector } from '@/store';
import { BRAND_PRESETS, useTheme, useThemeTokens, type BrandPreset, type ColorScheme, type RadiusPreset } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Settings — quiet chrome + whitespace (design ref: showcase verification.tsx #9).
 *  User row → toggle card → Privacy/Change PIN card → utility sections → ghost sign out. */
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { logout: handleLogout, isPending: loggingOut } = useLogoutFlow();
  const { scheme, setScheme, palette, setPalette, radius, setRadius } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  // Real verification status (face + document) — faceEnrolled alone is not "Verified".
  const { data: identity } = useIdentitySummary();
  const [faceIdEnabled, setFaceIdEnabled] = useState(!!user?.faceEnrolled);
  const [biometricConsent, setBiometricConsent] = useState(!!user?.biometricConsentAt);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const settingRow = (label: string, right: ReactNode) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[3],
        paddingVertical: theme.spacing[2],
      }}>
      <Typography variant="body">{label}</Typography>
      {right}
    </View>
  );

  const linkRow = (icon: ReactNode, title: string, subtitle: string | null, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[2],
        },
        pressed && { opacity: 0.7 },
      ]}>
      {icon}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Typography variant="body">{title}</Typography>
        {subtitle ? (
          <Typography variant="body-sm" color="muted">
            {subtitle}
          </Typography>
        ) : null}
      </View>
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
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom,
          gap: theme.spacing[5],
        }}
        showsVerticalScrollIndicator={false}>
        {/* User — GET /cb/user/me */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
          <RowIcon
            tone="primary"
            icon={<User size={iconSize.md} color={theme.colors.actionPrimary} />}
          />
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Typography variant="body" numberOfLines={1}>
              {user?.fullName ?? 'User'}
            </Typography>
            <Typography variant="body-sm" color="muted" numberOfLines={1}>
              {user?.email ?? ''}
            </Typography>
          </View>
          {identity ? (
            <Badge variant={identity.status === 'verified' ? 'success' : 'warning'}>
              {identity.status === 'verified' ? 'Verified' : 'Incomplete'}
            </Badge>
          ) : null}
        </View>

        <Card>
          <CardContent style={{ gap: theme.spacing[1] }}>
            {settingRow(
              'Face ID sign-in',
              <Switch value={faceIdEnabled} onValueChange={setFaceIdEnabled} />,
            )}
            {settingRow(
              'Biometric consent',
              <Switch value={biometricConsent} onValueChange={setBiometricConsent} />,
            )}
            {settingRow(
              'Verification alerts',
              <Switch value={alertsEnabled} onValueChange={setAlertsEnabled} />,
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ gap: theme.spacing[1] }}>
            {linkRow(
              <RowIcon
                tone="neutral"
                icon={<Shield size={iconSize.md} color={theme.colors.textSecondary} />}
              />,
              'Privacy',
              'Your image is never stored',
              () => router.push('/legal/data-privacy'),
            )}
            {linkRow(
              <RowIcon
                tone="neutral"
                icon={<Lock size={iconSize.md} color={theme.colors.textSecondary} />}
              />,
              'Change PIN',
              null,
              () => router.push('/security/change-pin' as never),
            )}
          </CardContent>
        </Card>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('APPEARANCE')}
          <Card>
            <CardContent>
              {settingRow(
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
              {settingRow(
                'Accent',
                <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                  {(Object.keys(BRAND_PRESETS) as BrandPreset[]).map((p) => (
                    <Pressable
                      key={p}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: palette === p }}
                      accessibilityLabel={`${p} accent`}
                      onPress={() => setPalette(p)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: theme.radii.full,
                        backgroundColor: BRAND_PRESETS[p].b500,
                        borderWidth: palette === p ? 3 : 0,
                        borderColor: theme.colors.actionPrimary,
                      }}
                    />
                  ))}
                </View>,
              )}
              <Divider />
              {settingRow(
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
            <CardContent style={{ gap: theme.spacing[1] }}>
              {linkRow(
                <RowIcon
                  tone="neutral"
                  icon={<FileText size={iconSize.md} color={theme.colors.textSecondary} />}
                />,
                'Privacy Policy',
                null,
                () => router.push('/legal/privacy-policy'),
              )}
              {linkRow(
                <RowIcon
                  tone="neutral"
                  icon={<FileText size={iconSize.md} color={theme.colors.textSecondary} />}
                />,
                'Terms of Service',
                null,
                () => router.push('/legal/terms'),
              )}
            </CardContent>
          </Card>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          {sectionLabel('ABOUT')}
          <Card>
            <CardContent style={{ gap: theme.spacing[1] }}>
              {linkRow(
                <RowIcon
                  tone="neutral"
                  icon={<Info size={iconSize.md} color={theme.colors.textSecondary} />}
                />,
                'About Truepas',
                null,
                () => router.push('/about' as never),
              )}
              {settingRow(
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
            <CardContent style={{ gap: theme.spacing[1] }}>
              <Pressable
                onPress={() => setConfirmDelete(true)}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    paddingVertical: theme.spacing[2],
                  },
                  pressed && { opacity: 0.7 },
                ]}>
                <RowIcon
                  tone="error"
                  icon={<Trash2 size={iconSize.md} color={theme.colors.onErrorSubtle} />}
                />
                <Typography variant="body" style={{ color: theme.colors.error, flex: 1 }}>
                  Delete Account
                </Typography>
              </Pressable>
            </CardContent>
          </Card>
        </View>

        {/* Ghost sign out — quiet, centered (design pattern) */}
        <CoreButton
          variant="ghost"
          accessibilityLabel="Sign out"
          loading={loggingOut}
          onPress={handleLogout}>
          Sign out
        </CoreButton>
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
