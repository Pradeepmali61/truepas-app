import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, FileText, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Image, ScrollView, Text, useWindowDimensions, View } from 'react-native';
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
import { getDocumentImageUri } from '@/services/documentImageStore';
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
  const [scanImageUri, setScanImageUri] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(() => new Animated.Value(0));

  // The backend doesn't return the captured photo — it's persisted locally
  // (keyed by docId) at scan time; flip the hero card to reveal it.
  useEffect(() => {
    if (!id) return;
    let alive = true;
    getDocumentImageUri(id, 'front')
      .then((uri) => {
        if (alive) setScanImageUri(uri);
      })
      .catch(() => {
        if (alive) setScanImageUri(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const toggleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
    setIsFlipped(!isFlipped);
  };

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
                  <View style={{ alignItems: 'center', gap: theme.spacing[3] }}>
                    <ScanFrame
                      color={alpha(theme.colors.onActionPrimary, 0.7)}
                      radius={theme.radii.xl}
                      style={styles.heroFrame}>
                      {/* Flip card — front: TruePas credential card / back: captured scan
                       *  (same pattern as document/verified.tsx). */}
                      <View style={{ width: cardW }}>
                        <Animated.View
                          style={{
                            transform: [
                              { perspective: 1000 },
                              {
                                rotateY: flipAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '180deg'],
                                }),
                              },
                            ],
                            backfaceVisibility: 'hidden',
                            zIndex: isFlipped ? 0 : 1,
                          }}>
                          <DocumentIdCard doc={productDoc} style={{ width: cardW }} />
                        </Animated.View>
                        <Animated.View
                          style={[
                            styles.scanFace,
                            {
                              transform: [
                                { perspective: 1000 },
                                {
                                  rotateY: flipAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['180deg', '360deg'],
                                  }),
                                },
                              ],
                              backfaceVisibility: 'hidden',
                              zIndex: isFlipped ? 1 : 0,
                            },
                          ]}>
                          {scanImageUri ? (
                            <Image
                              source={{ uri: scanImageUri }}
                              style={styles.scanImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.scanPlaceholder}>
                              <FileText size={iconSize.xl} color={theme.colors.textMuted} />
                              <Text style={styles.scanHint}>Original scan not available</Text>
                            </View>
                          )}
                        </Animated.View>
                      </View>
                    </ScanFrame>
                    <CoreButton
                      size="sm"
                      onPress={toggleFlip}
                      accessibilityLabel={isFlipped ? 'View document info' : 'View document scan'}
                      iconLeft={
                        isFlipped ? (
                          <FileText size={iconSize.sm} color={theme.colors.onActionPrimary} />
                        ) : (
                          <Camera size={iconSize.sm} color={theme.colors.onActionPrimary} />
                        )
                      }>
                      {isFlipped ? 'View Info' : 'View Scan'}
                    </CoreButton>
                  </View>
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
  scanFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.colors.surfaceSunken,
    borderRadius: t.radii.xl,
    overflow: 'hidden',
  },
  scanImage: { width: '100%', height: '100%' },
  scanPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing[2],
  },
  scanHint: { color: t.colors.textMuted, fontSize: t.fontSize.sm },
  removeLabel: { color: t.colors.error },
}));
