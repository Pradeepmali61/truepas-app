import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, AsyncBlock, ScreenHeader, Section, SectionTitle } from '@/components/composite';
import {
    DocumentDetailCard,
    DocumentIdCard,
    DocumentVerifyCard,
    type ProductDocument,
} from '@/components/truepas';
import { CoreButton, FadeUp, ScanFrame } from '@/components/ui';
import { useDocument, useRemoveDocument } from '@/features/documents/hooks';
import { useToast } from '@/hooks/useToast';
import { alpha, makeStyles, useThemeTokens, type Theme } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { IdentityDocument } from '@/types/domain';

/** Document detail — a single identity document. Kit ID-card hero inside a
 *  ScanFrame, verify card when a match score exists, detail card with
 *  selective disclosure, and verify/remove actions pinned in the footer.
 *  1:1 port of UI-design-repo screens/main/DocumentDetailScreen.tsx. */
export default function DocumentDetailScreen() {
  const styles = useStyles();
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const toast = useToast();
  const { width: winW } = useWindowDimensions();

  const docQuery = useDocument(id);
  const removeDocument = useRemoveDocument();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const status = docQuery.data?.status;
  const canVerify = status === 'pending' || status === 'failed';
  const cardW = Math.min(340, winW - theme.spacing[4] * 2);
  const removing = removeDocument.isPending;
  const doc = docQuery.data;

  // Re-verify re-captures via the scan flow (design pushes `docVerify`).
  const reverify = (d: IdentityDocument) =>
    router.push({
      pathname: '/document/scan',
      params: {
        type: d.type,
        label: d.label,
        number: d.number,
        expiresAt: d.expiresAt ?? undefined,
      },
    } as never);

  const doRemove = () => {
    if (!id) return;
    removeDocument.mutate(id, {
      onSuccess: () => {
        toast.show('success', 'Document removed');
        router.back();
      },
      onError: (e) =>
        toast.show('error', `Couldn't remove document${e instanceof Error ? `: ${e.message}` : ''}`),
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Document" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[6],
          paddingBottom: theme.spacing[8],
        }}>
        <AsyncBlock state={docQuery}>
          {(d) => {
            const productDoc: ProductDocument = {
              label: d.label,
              number: d.number,
              status: d.status,
              expiresAt: d.expiresAt ? d.expiresAt.split('T')[0] : null,
              matchScore: d.matchScore,
              type: d.type,
              addedAt: d.addedAt,
              source: d.source,
              extractedName: d.extractedName,
              extractedDob: d.extractedDob,
              nationality: d.nationality,
              issuingState: d.issuingState,
            };
            return (
              <>
                <FadeUp>
                  <ScanFrame
                    color={alpha(theme.colors.onActionPrimary, 0.7)}
                    radius={theme.radii.xl}
                    style={styles.heroFrame}>
                    <DocumentIdCard doc={productDoc} style={{ width: cardW }} />
                  </ScanFrame>
                </FadeUp>
                {d.matchScore != null && (
                  <FadeUp delay={80}>
                    <DocumentVerifyCard doc={productDoc} onReverify={() => reverify(d)} />
                  </FadeUp>
                )}
                <FadeUp delay={140}>
                  <Section>
                    <SectionTitle>Details</SectionTitle>
                    <DocumentDetailCard doc={productDoc} />
                  </Section>
                </FadeUp>
              </>
            );
          }}
        </AsyncBlock>
      </ScrollView>

      {doc != null && (
        <View
          style={{
            padding: theme.spacing[4],
            paddingTop: theme.spacing[3],
            paddingBottom: theme.spacing[4] + insets.bottom,
            gap: theme.spacing[2],
          }}>
          {canVerify && (
            <CoreButton fullWidth size="lg" onPress={() => reverify(doc)}>
              Verify now
            </CoreButton>
          )}
          <CoreButton
            fullWidth
            variant="outline"
            loading={removing}
            onPress={() => setConfirmRemove(true)}
            iconLeft={<Trash2 size={iconSize.sm} color={theme.colors.error} />}>
            <Text style={styles.removeLabel}>Remove</Text>
          </CoreButton>
        </View>
      )}

      <ActionSheet
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this document?"
        items={[
          {
            key: 'remove',
            label: 'Remove document',
            destructive: true,
            icon: <Trash2 size={iconSize.md} color={theme.colors.error} />,
            onSelect: doRemove,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t: Theme) => ({
  heroFrame: { alignSelf: 'center' },
  removeLabel: { color: t.colors.error },
}));
