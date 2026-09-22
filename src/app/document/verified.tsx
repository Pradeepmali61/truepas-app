import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Camera, FileText, ScanFace, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Image, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/composite';
import { ConfidenceRing, DocumentIdCard } from '@/components/truepas';
import { CoreButton, NeuBox, PopIn, RowIcon, Typography } from '@/components/ui';
import { getDocumentImageUri } from '@/services/documentImageStore';
import { flowGuards } from '@/services/flowGuards';
import { makeStyles, useThemeTokens, type Theme } from '@/theme';
import { iconSize } from '@/theme/tokens';

function formatUSDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

/** Document verified success — flip card design (ref: facepe-user-frontend verify.tsx).
 *  Front face: gradient header + portrait + extracted details grid.
 *  Back face: the captured document scan image.
 *  Flip button toggles between "View Scan" and "View Info". */
export default function DocumentVerifiedScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const router = useRouter();
  const {
    docId,
    docLabel,
    docType,
    docNumber,
    extractedName,
    extractedDob,
    matchScore,
    outcome,
    issuingState,
    nationality,
    dateOfExpiry,
    portraitImageUrl,
  } = useLocalSearchParams<{
    docId?: string;
    docLabel?: string;
    docType?: string;
    docNumber?: string;
    extractedName?: string;
    extractedDob?: string;
    matchScore?: string;
    outcome?: string;
    issuingState?: string;
    nationality?: string;
    dateOfExpiry?: string;
    portraitImageUrl?: string;
  }>();

  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [selfieImageUri, setSelfieImageUri] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  // Result screen — a deep link with no real verification behind it must not
  // render a fake "verified" card (ADV-001).
  const [allowed] = useState(() => flowGuards.has('document:verified'));

  useEffect(() => {
    if (allowed) flowGuards.consume('document:verified');
  }, [allowed]);
  const [flipAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Captured images were persisted locally (keyed by docId) before verification
    if (docId) {
      getDocumentImageUri(docId, 'front').then(setFrontImageUri).catch(() => setFrontImageUri(null));
      getDocumentImageUri(docId, 'selfie').then(setSelfieImageUri).catch(() => setSelfieImageUri(null));
    }
  }, [docId]);

  const toggleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
    setIsFlipped(!isFlipped);
  };

  // Binary outcome (like DL): approved → VERIFIED, everything else (review,
  // manual_review, rejected) → FAILED. No intermediate "review" state in UI.
  const isFailed = outcome !== 'approved';
  const title = docLabel ?? 'Document';
  // Prefer the real doc type (passed from processing); fall back to the label
  // heuristic for direct navigation without the param.
  const isLicense = (docType ?? docLabel ?? '').toLowerCase().includes('license');
  // matchScore arrives 0–1 from the BFF; ConfidenceRing renders a percentage.
  const confidencePct =
    matchScore && !isFailed
      ? (() => {
          const n = parseFloat(matchScore);
          if (Number.isNaN(n)) return null;
          return Math.round(n <= 1 ? n * 100 : n);
        })()
      : null;

  if (!allowed) return <Redirect href="/document/select-type" />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={isFailed ? 'Verification failed' : 'Verified'} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: theme.spacing[6],
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[4],
        }}
        showsVerticalScrollIndicator={false}>
        {/* Result icon */}
        <PopIn>
          <RowIcon
            tone={isFailed ? 'error' : 'success'}
            icon={
              isFailed ? (
                <TriangleAlert size={iconSize.lg} color={theme.colors.onErrorSubtle} />
              ) : (
                <BadgeCheck size={iconSize.lg} color={theme.colors.onSuccessSubtle} />
              )
            }
          />
        </PopIn>

        <Typography variant="h3" style={{ marginTop: theme.spacing[4] }}>
          {isFailed ? 'Verification Failed' : 'Document Verified'}
        </Typography>

        <Typography variant="body-sm" color="secondary" center style={{ marginTop: theme.spacing[1], marginBottom: theme.spacing[4] }}>
          {isFailed
            ? 'We could not verify this document. Please scan it again.'
            : 'Your document has been verified successfully'}
        </Typography>

        {/* Flip card — front: TruePas credential card / back: captured scan */}
        <View style={styles.cardWrapper}>
          {/* Front face — the physical-card presentation (truepas DocumentIdCard). */}
          <Animated.View
            style={[
              styles.docInfoCardFront,
              {
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
              },
            ]}>
            <DocumentIdCard
              doc={{
                label: title,
                number: docNumber || '—',
                status: isFailed ? 'failed' : 'verified',
                expiresAt: dateOfExpiry ? dateOfExpiry.split('T')[0] : null,
                extractedName: extractedName || null,
                type: docType || (isLicense ? 'drivingLicense' : 'passport'),
              }}
              style={styles.idCardFace}
            />
          </Animated.View>

          {/* Back face — captured document scan */}
          <Animated.View
            style={[
              styles.docInfoCard,
              styles.docCardBackFace,
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
            <View style={styles.docImageContainer}>
              {frontImageUri ? (
                <Image source={{ uri: frontImageUri }} style={styles.docFullImage} resizeMode="cover" />
              ) : (
                <View style={styles.docAvatarPlaceholder}>
                  <FileText size={iconSize.xl} color={theme.colors.textMuted} />
                  <Typography variant="body-sm" color="muted" style={{ marginTop: theme.spacing[2] }}>
                    Original scan not available
                  </Typography>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Flip action */}
        <View style={{ flexDirection: 'row', marginTop: theme.spacing[5] }}>
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

        {/* Extracted fields — portrait + captured data, off the credential card */}
        <NeuBox
          variant="raised"
          depth={4}
          color={theme.colors.surface}
          style={{ alignSelf: 'stretch', marginTop: theme.spacing[5], padding: theme.spacing[4] }}>
          <View style={{ flexDirection: 'row' }}>
            {/* Portrait — from backend (portraitImageUrl, extracted by server-side Regula)
             *  → selfie fallback → icon placeholder */}
            <View style={styles.docAvatarContainer}>
              {portraitImageUrl ? (
                <Image source={{ uri: portraitImageUrl }} style={styles.docAvatar} resizeMode="cover" />
              ) : selfieImageUri ? (
                <Image source={{ uri: selfieImageUri }} style={styles.docAvatar} resizeMode="cover" />
              ) : (
                <View style={styles.docAvatarPlaceholder}>
                  <ScanFace size={iconSize.lg} color={theme.colors.textMuted} />
                </View>
              )}
            </View>

            <View style={styles.docDetailsGrid}>
              <View style={styles.docDetailItem}>
                <Typography variant="caption" color="muted" style={styles.docDetailLabel}>
                  FULL NAME
                </Typography>
                <Typography variant="body-sm" numberOfLines={2} style={styles.docDetailValue}>
                  {extractedName || '—'}
                </Typography>
              </View>
              <View style={styles.docDetailItem}>
                <Typography variant="caption" color="muted" style={styles.docDetailLabel}>
                  DOCUMENT NO
                </Typography>
                <Typography variant="body-sm" style={styles.docDetailValue}>
                  {docNumber || '—'}
                </Typography>
              </View>
              <View style={styles.docDetailItem}>
                <Typography variant="caption" color="muted" style={styles.docDetailLabel}>
                  DATE OF BIRTH
                </Typography>
                <Typography variant="body-sm" style={styles.docDetailValue}>
                  {formatUSDate(extractedDob)}
                </Typography>
              </View>
              {isLicense && !dateOfExpiry ? null : (
                <View style={styles.docDetailItem}>
                  <Typography variant="caption" color="muted" style={styles.docDetailLabel}>
                    EXPIRES
                  </Typography>
                  <Typography variant="body-sm" style={styles.docDetailValue}>
                    {formatUSDate(dateOfExpiry)}
                  </Typography>
                </View>
              )}
              <View style={styles.docDetailItem}>
                <Typography variant="caption" color="muted" style={styles.docDetailLabel}>
                  {isLicense ? 'STATE' : 'NATIONALITY'}
                </Typography>
                <Typography variant="body-sm" style={styles.docDetailValue}>
                  {isLicense ? issuingState || '—' : nationality || '—'}
                </Typography>
              </View>
            </View>
          </View>
        </NeuBox>

        {confidencePct != null && (
          <ConfidenceRing value={confidencePct} style={{ marginTop: theme.spacing[5] }} />
        )}
      </ScrollView>

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
          accessibilityLabel="Go to identity dashboard"
          onPress={() => router.dismissTo('/identity' as never)}>
          Go to Identity Dashboard
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t: Theme) => ({
  cardWrapper: {
    width: '100%',
    height: 260,
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
  docInfoCardFront: {
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
  idCardFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    borderRadius: t.radii['2xl'],
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  docFullImage: {
    width: '100%',
    height: '100%',
  },
  docDetailsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  docDetailItem: {
    width: '50%',
    marginBottom: t.spacing[2],
    paddingRight: t.spacing[2],
  },
  docDetailLabel: {
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing[0.5],
    letterSpacing: t.letterSpacing.caps,
  },
  docDetailValue: {
    fontWeight: t.fontWeight.bold,
  },
}));
