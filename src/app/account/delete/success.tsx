import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { Check, CircleCheck, Database, Image as ImageIcon, ScanFace } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoreButton, Divider, NeuBox, PopIn, RowIcon, Typography } from '@/components/ui';
import { sessionEnded } from '@/features/auth/slice';
import { clearAllDocumentImages } from '@/services/documentImageStore';
import { flowGuards } from '@/services/flowGuards';
import { clearAllProfileImages } from '@/services/profileImageStore';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Delete account — success with all-3-systems verification (PRD). */
export default function DeleteSuccessScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Reaching this screen directly must not wipe the session — the flag only
  // exists after DELETE /user/me returned success.
  const [allowed] = useState(() => flowGuards.has('account:deleted'));

  // End the session as soon as the deletion is confirmed — the backend has
  // already revoked tokens, so keeping Redux/query state alive until the
  // "Close App" tap would let the user back into authenticated screens.
  useEffect(() => {
    if (!allowed) return;
    flowGuards.consume('account:deleted');
    queryClient.clear();
    void clearAllDocumentImages();
    void clearAllProfileImages();
    dispatch(sessionEnded());
  }, [queryClient, dispatch, allowed]);

  if (!allowed) return <Redirect href="/" />;

  const systems: { icon: ReactNode; label: string }[] = [
    { icon: <Database size={iconSize.sm} color={theme.colors.actionPrimary} />, label: 'PostgreSQL' },
    { icon: <ImageIcon size={iconSize.sm} color={theme.colors.actionPrimary} />, label: 'S3 Images' },
    { icon: <ScanFace size={iconSize.sm} color={theme.colors.actionPrimary} />, label: 'ROC Gallery' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[5],
          gap: theme.spacing[3],
        }}>
        <PopIn>
          <RowIcon
            tone="success"
            icon={<CircleCheck size={iconSize.xl} color={theme.colors.onSuccessSubtle} />}
          />
        </PopIn>
        <Typography variant="h3">Account Deleted</Typography>
        <Typography variant="body-sm" color="secondary" center>
          All your data has been permanently removed
        </Typography>
        <View style={{ alignSelf: 'stretch', marginTop: theme.spacing[2] }}>
          <NeuBox
            variant="raised"
            depth={4}
            color={theme.colors.surface}
            style={{ paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], gap: theme.spacing[1] }}>
            <Typography variant="caption" color="muted">
              DELETION VERIFIED
            </Typography>
            {systems.map((system, i) => (
              <View key={system.label}>
                {i > 0 ? <Divider /> : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: theme.spacing[2],
                    paddingVertical: theme.spacing[3],
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                    {system.icon}
                    <Typography variant="body-sm">{system.label}</Typography>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                    <Check size={iconSize.xs} color={theme.colors.success} />
                    <Typography variant="body-sm" style={{ color: theme.colors.success, fontWeight: theme.fontWeight.semibold }}>
                      Deleted
                    </Typography>
                  </View>
                </View>
              </View>
            ))}
          </NeuBox>
        </View>
      </View>
      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4] + insets.bottom,
          gap: theme.spacing[2],
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel="Close app"
          onPress={() => {
            // Session already ended on mount — just navigate out; the entry
            // gate won't re-render so go to login explicitly.
            router.dismissTo('/(auth)/login' as never);
          }}>
          Close App
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
