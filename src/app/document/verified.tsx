import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Camera, FileText, ScanFace, TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/composite';
import { CoreButton, PopIn, RowIcon, Typography } from '@/components/ui';
import { getDocumentImageUri } from '@/services/documentImageStore';
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
    docNumber,
    extractedName,
    extractedDob,
    outcome,
    issuingState,
    nationality,
    dateOfExpiry,
    portraitImageUrl,
  } = useLocalSearchParams<{
    docId?: string;
    docLabel?: string;
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
  const flipAnim = useRef(new Animated.Value(0)).current;

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
  const isLicense = (docLabel || '').toLowerCase().includes('license');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={isFailed ? 'Verification failed' : 'Verified'} />

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[2] }}>
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

        {/* Flip card — front: info / back: captured scan */}
        <View style={styles.cardWrapper}>
          {/* Front face */}
          <Animated.View
            style={[
              styles.docInfoCard,
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
            <LinearGradient
              colors={['#08B6FC', '#034965']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.docCardHeader}>
              <Typography variant="body-sm" style={styles.countryName}>
                {title}
              </Typography>
              <View style={styles.idCardStatusBadge}>
                <View
                  style={[
                    styles.idCardStatusDot,
                    { backgroundColor: isFailed ? theme.colors.error : theme.colors.success },
                  ]}
                />
                <Typography variant="caption" style={styles.idCardStatusText}>
                  {isFailed ? 'FAILED' : 'VERIFIED'}
                </Typography>
              </View>
            </LinearGradient>

            <View style={styles.docMainInfo}>
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
            <LinearGradient
              colors={['#08B6FC', '#034965']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.docCardHeader}>
              <Typography variant="body-sm" style={styles.countryName}>
                DOCUMENT SCAN
              </Typography>
            </LinearGradient>
            <View style={styles.docImageContainer}>
              {frontImageUri ? (
                <Image source={{ uri: frontImageUri }} style={styles.docFullImage} resizeMode="contain" />
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
      </View>

      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton
          fullWidth
          size="lg"
          accessibilityLabel="Go to identity dashboard"
          onPress={() => router.dismissTo('/(tabs)')}>
          Go to Identity Dashboard
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t: Theme) => ({
  cardWrapper: {
    width: '100%',
    height: 300,
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
  countryName: {
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
