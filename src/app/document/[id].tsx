import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Baby, BookUser, Camera, Car, Contact, FileText, Globe, Landmark, ScanFace } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Animated, Image, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, ErrorState, Modal, ScreenHeader } from '@/components/composite';
import { CoreButton, RowIcon, Skeleton, Typography, type BadgeVariant } from '@/components/ui';
import { useDocument, useRemoveDocument } from '@/features/documents/hooks';
import { useToast } from '@/hooks/useToast';
import { getDocumentImageUri } from '@/services/documentImageStore';
import { makeStyles, useThemeTokens, type Theme } from '@/theme';
import { iconSize } from '@/theme/tokens';

const DOC_ICONS: Record<string, ComponentType<{ size?: number; color?: string }>> = {
  passport: BookUser,
  drivingLicense: Car,
  idCard: Contact,
  greenCard: Landmark,
  usVisa: Globe,
  birthCertificate: Baby,
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'error', label: 'Failed' },
  missing: { variant: 'neutral', label: 'Missing' },
  Active: { variant: 'success', label: 'Active' },
  Expired: { variant: 'neutral', label: 'Expired' },
};

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View style={{ width: '50%', marginBottom: theme.spacing[2], minWidth: 0, paddingRight: theme.spacing[2] }}>
      <Typography
        variant="caption"
        color="muted"
        style={{ fontWeight: theme.fontWeight.bold, letterSpacing: theme.letterSpacing.caps, marginBottom: theme.spacing[0.5] }}>
        {label}
      </Typography>
      <Typography
        variant="body-sm"
        numberOfLines={2}
        style={{
          fontWeight: theme.fontWeight.bold,
          ...(mono ? { fontFamily: theme.fontFamily.mono.semibold } : null),
        }}>
        {value}
      </Typography>
    </View>
  );
}

/** Document detail — GET /cb/documents/{id} (or issued doc). Flip-card design:
 *  front face = portrait + extracted details, back face = captured scan.
 *  Same interaction as the post-verify screen (ref: facepe verify.tsx). */
export default function DocumentDetailScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doc, isPending, isError, refetch } = useDocument(id);
  const removeDocument = useRemoveDocument();
  const toast = useToast();
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [selfieImageUri, setSelfieImageUri] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    // Captured images were persisted locally (keyed by docId) at scan time
    getDocumentImageUri(id, 'front').then(setFrontImageUri).catch(() => setFrontImageUri(null));
    getDocumentImageUri(id, 'selfie').then(setSelfieImageUri).catch(() => setSelfieImageUri(null));
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

  const handleRemove = () => {
    if (!id) return;
    setConfirmRemove(true);
  };

  const confirmRemoveDoc = () => {
    if (!id) return;
    removeDocument.mutate(id, {
      onSuccess: () => router.back(),
      onError: (err: any) => {
        toast.show(
          'error',
          err?.response?.data?.message ?? err?.message ?? 'Could not remove the document. Please try again.',
        );
      },
    });
  };

  if (isPending) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Document" onBack={() => router.back()} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <Skeleton height={260} radius={theme.radii['2xl']} />
          <Skeleton height={40} radius={theme.radii.full} />
        </View>
      </SafeAreaView>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Document" onBack={() => router.back()} />
        <ErrorState
          title={isError ? "Couldn't load document" : 'Document not found'}
          description={isError ? 'Please check your connection and try again.' : 'It may have been removed.'}
          onRetry={isError ? refetch : undefined}
        />
      </SafeAreaView>
    );
  }

  const title = doc.label;
  const status = STATUS[doc.status] ?? { variant: 'neutral' as const, label: doc.status };
  const failed = doc.status === 'failed';
  const isLicense = doc.type.toLowerCase().includes('license');
  const portraitUri = doc.portraitImageUrl ?? selfieImageUri;
  const scanUri = doc.documentImageUrl ?? frontImageUri;
  const IconCmp = DOC_ICONS[doc.type] ?? FileText;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}>
        {failed && (
          <Alert variant="error" title="Verification failed">
            The document could not be verified. Recapture it in better light and try again.
          </Alert>
        )}

        {/* Flip card — front: info / back: captured scan */}
        <View style={styles.cardWrapper}>
          {/* Front face */}
          <Animated.View
            style={[
              styles.docInfoCard,
              {
                transform: [
                  { perspective: 1000 },
                  { rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
                ],
                backfaceVisibility: 'hidden',
                zIndex: isFlipped ? 0 : 1,
              },
            ]}>
            <LinearGradient
              colors={['#08B6FC', '#034965']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.docCardHeader}>
              <Typography variant="body-sm" style={styles.cardTitle}>
                {title}
              </Typography>
              <View style={styles.idCardStatusBadge}>
                <View
                  style={[
                    styles.idCardStatusDot,
                    { backgroundColor: failed ? theme.colors.error : theme.colors.success },
                  ]}
                />
                <Typography variant="caption" style={styles.idCardStatusText}>
                  {status.label.toUpperCase()}
                </Typography>
              </View>
            </LinearGradient>

            <View style={styles.docMainInfo}>
              <View style={styles.docAvatarContainer}>
                {portraitUri ? (
                  <Image source={{ uri: portraitUri }} style={styles.docAvatar} resizeMode="cover" />
                ) : (
                  <View style={styles.docAvatarPlaceholder}>
                    <ScanFace size={iconSize.lg} color={theme.colors.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.docDetailsGrid}>
                <DetailItem label="Full name" value={doc.extractedName || '—'} />
                <DetailItem label="Document no" value={doc.number || '—'} mono />
                <DetailItem label="Date of birth" value={formatDate(doc.extractedDob)} />
                <DetailItem label="Expires" value={formatDate(doc.expiresAt)} />
                <DetailItem
                  label={isLicense ? 'State' : 'Nationality'}
                  value={(isLicense ? doc.issuingState : doc.nationality) || '—'}
                />
                <DetailItem
                  label="Match score"
                  value={doc.matchScore != null ? `${Math.round(doc.matchScore * 100)}%` : '—'}
                  mono
                />
              </View>
            </View>
          </Animated.View>

          {/* Back face — captured document scan */}
          <Animated.View
            style={[
              styles.docInfoCard,
              styles.docCardBackFace,
              {
                transform: [
                  { perspective: 1000 },
                  { rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) },
                ],
                backfaceVisibility: 'hidden',
                zIndex: isFlipped ? 1 : 0,
              },
            ]}>
            <LinearGradient
              colors={['#08B6FC', '#034965']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.docCardHeader}>
              <Typography variant="body-sm" style={styles.cardTitle}>
                Document Scan
              </Typography>
            </LinearGradient>
            <View style={styles.docImageContainer}>
              {scanUri ? (
                <Image source={{ uri: scanUri }} style={styles.docFullImage} resizeMode="contain" />
              ) : (
                <View style={styles.docAvatarPlaceholder}>
                  <IconCmp size={iconSize.xl} color={theme.colors.textMuted} />
                  <Typography variant="body-sm" color="muted" style={{ marginTop: theme.spacing[2] }}>
                    Original scan not available
                  </Typography>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Flip action */}
        <View style={{ alignItems: 'center' }}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <RowIcon
              tone="neutral"
              icon={<FileText size={iconSize.sm} color={theme.colors.textSecondary} />}
            />
            <Typography variant="body-sm" color="secondary" style={{ flex: 1 }}>
              Added {formatDate(doc.addedAt)}
            </Typography>
        </View>
      </ScrollView>

      <View
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[2],
            paddingBottom: insets.bottom + theme.spacing[3],
          }}>
          <CoreButton
            variant="ghost"
            fullWidth
            loading={removeDocument.isPending}
            accessibilityLabel="Remove document"
            onPress={handleRemove}>
            <Typography variant="body" style={{ color: theme.colors.error }}>
              Remove document
            </Typography>
          </CoreButton>
      </View>

      <Modal
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove document?"
        footer={
          <>
            <CoreButton variant="ghost" onPress={() => setConfirmRemove(false)}>
              Cancel
            </CoreButton>
            <CoreButton
              variant="destructive"
              loading={removeDocument.isPending}
              onPress={() => {
                setConfirmRemove(false);
                confirmRemoveDoc();
              }}>
              Remove
            </CoreButton>
          </>
        }>
        <Typography variant="body" color="secondary">
          Are you sure you want to remove this document? This action cannot be undone.
        </Typography>
      </Modal>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t: Theme) => ({
  cardWrapper: {
    width: '100%',
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: t.colors.surfaceRaised,
    borderRadius: t.radii['2xl'],
    overflow: 'hidden',
    ...t.shadows.xl,
  },
  docCardBackFace: {
    backgroundColor: t.colors.surfaceSunken,
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: t.spacing[5],
    paddingVertical: t.spacing[4],
  },
  cardTitle: {
    fontWeight: t.fontWeight.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: t.letterSpacing.caps,
    flex: 1,
  },
  idCardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[1],
    borderRadius: t.radii.md,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    minWidth: 80,
    flexShrink: 0,
    marginLeft: t.spacing[2],
  },
  idCardStatusDot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    marginRight: t.spacing[2],
  },
  idCardStatusText: {
    fontWeight: t.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: t.letterSpacing.caps,
  },
  docMainInfo: {
    padding: t.spacing[5],
    flexDirection: 'row',
  },
  docAvatarContainer: {
    width: 88,
    height: 88,
    borderRadius: t.radii.lg,
    overflow: 'hidden',
    backgroundColor: t.colors.surfaceSunken,
    marginRight: t.spacing[4],
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
  },
  docAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: t.radii.lg,
  },
  docAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImageContainer: {
    flex: 1,
    padding: t.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  docFullImage: {
    width: '100%',
    height: '100%',
    borderRadius: t.radii.sm,
  },
  docDetailsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
}));
