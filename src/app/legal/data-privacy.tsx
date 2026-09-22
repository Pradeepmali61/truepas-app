/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { ChevronRight, Download, ScanFace, Shield, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/composite';
import { Badge, Divider, NeuBox, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

const RETENTION = [
  { label: 'Account data', policy: 'Retained while account is active' },
  { label: 'Document images', policy: 'Stored in S3, deleted with account' },
  { label: 'Face template', policy: 'ROC gallery, deleted with account' },
];

/** Data & privacy — retention info, deletion rights, consent management (PRD). */
export default function DataPrivacyScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const actionRow = (
    icon: ReactNode,
    title: string,
    subtitle: string,
    onPress?: () => void,
  ) => (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${title} — ${subtitle}`}
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
      <RowIcon tone="neutral" icon={icon} />
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing[0.5] }}>
        <Typography variant="body">{title}</Typography>
        <Typography variant="body-sm" color="secondary">
          {subtitle}
        </Typography>
      </View>
      <ChevronRight size={iconSize.sm} color={theme.colors.textMuted} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Data & Privacy" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[5],
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing[2] }}>
          <Typography variant="caption" color="muted">
            YOUR DATA
          </Typography>
          <NeuBox
            variant="raised"
            depth={4}
            color={theme.colors.surface}
            style={{ paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[1] }}>
            {actionRow(
              <Download size={iconSize.md} color={theme.colors.actionPrimary} />,
              'Download My Data',
              'Export all your data as ZIP',
            )}
            <Divider />
            {actionRow(
              <Trash2 size={iconSize.md} color={theme.colors.error} />,
              'Delete Account',
              'Permanently remove all data',
              () => router.push('/account/delete'),
            )}
          </NeuBox>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          <Typography variant="caption" color="muted">
            BIOMETRIC DATA
          </Typography>
          <NeuBox
            variant="raised"
            depth={4}
            color={theme.colors.surface}
            style={{ padding: theme.spacing[4], gap: theme.spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <RowIcon
                tone="primary"
                icon={<ScanFace size={iconSize.md} color={theme.colors.actionPrimary} />}
              />
              <Typography variant="body" style={{ flex: 1 }}>
                Face Template
              </Typography>
              <Badge variant="success">Enrolled</Badge>
            </View>
            <Typography variant="body-sm" color="secondary">
              Your encrypted face template is stored in ROC (Rank One Computing) gallery. It will be
              deleted permanently when you delete your account.
            </Typography>
          </NeuBox>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          <Typography variant="caption" color="muted">
            RETENTION POLICY
          </Typography>
          <NeuBox
            variant="raised"
            depth={4}
            color={theme.colors.surface}
            style={{ paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[1] }}>
            {RETENTION.map((item, i) => (
              <View key={item.label}>
                {i > 0 ? <Divider /> : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: theme.spacing[3],
                    paddingVertical: theme.spacing[3],
                  }}>
                  <Typography variant="body-sm" color="secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body-sm" style={{ flexShrink: 1 }}>
                    {item.policy}
                  </Typography>
                </View>
              </View>
            ))}
          </NeuBox>
        </View>

        <View style={{ gap: theme.spacing[2] }}>
          <Typography variant="caption" color="muted">
            CONSENT
          </Typography>
          <NeuBox
            variant="raised"
            depth={4}
            color={theme.colors.surface}
            style={{ paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[1] }}>
            {actionRow(
              <Shield size={iconSize.md} color={theme.colors.actionPrimary} />,
              'Biometric Consent',
              'Granted · Jul 29, 2026',
              () => router.push('/security'),
            )}
          </NeuBox>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
