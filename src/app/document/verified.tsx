import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Icon } from '@/components/ui';
import { Elevation } from '@/constants/theme';
import { getDocumentImageUri } from '@/services/documentImageStore';

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
  const router = useRouter();
  const {
    docId,
    docLabel,
    docNumber,
    extractedName,
    extractedDob,
    matchScore,
    outcome,
  } = useLocalSearchParams<{
    docId?: string;
    docLabel?: string;
    docNumber?: string;
    extractedName?: string;
    extractedDob?: string;
    matchScore?: string;
    outcome?: string;
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

  const isReview = outcome === 'review';
  const title = docLabel ?? 'Document';

  return (
    <ScreenContainer scroll={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScreenHeader title="Verified" />

      <View className="flex-1 items-center px-6 pt-2">
        {/* Success icon */}
        <View style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: '#ECFDF5',
          alignItems: 'center',
          justifyContent: 'center',
          ...Elevation.small,
        }}>
          <Icon name="checkCircle" size={36} color="#059669" />
        </View>

        <Text
          accessibilityRole="header"
          className="mb-1 mt-4 text-[22px] font-bold text-ink">
          {isReview ? 'Document under review' : 'Document Verified'}
        </Text>

        <Text className="mb-4 text-center text-[14px] text-muted">
          {isReview
            ? 'Your document has been received and is being reviewed'
            : 'Your document has been verified successfully'}
        </Text>

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
              <Text style={styles.countryName}>{title}</Text>
              <View style={styles.idCardStatusBadge}>
                <View style={styles.idCardStatusDot} />
                <Text style={styles.idCardStatusText}>
                  {isReview ? 'REVIEW' : 'VERIFIED'}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.docMainInfo}>
              <View style={styles.docAvatarContainer}>
                {selfieImageUri ? (
                  <Image
                    source={{ uri: selfieImageUri }}
                    style={styles.docAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.docAvatarPlaceholder}>
                    <Icon name="scanFace" size={36} color="#A0A0A0" />
                  </View>
                )}
              </View>

              <View style={styles.docDetailsGrid}>
                <View style={styles.docDetailItem}>
                  <Text style={styles.docDetailLabel}>FULL NAME</Text>
                  <Text style={styles.docDetailValue} numberOfLines={2}>
                    {extractedName || '—'}
                  </Text>
                </View>
                <View style={styles.docDetailItem}>
                  <Text style={styles.docDetailLabel}>DOCUMENT NO</Text>
                  <Text style={styles.docDetailValue}>{docNumber || '—'}</Text>
                </View>
                <View style={styles.docDetailItem}>
                  <Text style={styles.docDetailLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.docDetailValue}>{formatUSDate(extractedDob)}</Text>
                </View>
                <View style={styles.docDetailItem}>
                  <Text style={styles.docDetailLabel}>MATCH SCORE</Text>
                  <Text style={styles.docDetailValue}>
                    {matchScore ? `${matchScore}%` : '—'}
                  </Text>
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
              <Text style={styles.countryName}>DOCUMENT SCAN</Text>
            </LinearGradient>
            <View style={styles.docImageContainer}>
              {frontImageUri ? (
                <Image
                  source={{ uri: frontImageUri }}
                  style={styles.docFullImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.docAvatarPlaceholder}>
                  <Icon name="documents" size={44} color="#A0A0A0" />
                  <Text style={{ marginTop: 10, color: '#A0A0A0', fontSize: 12 }}>
                    Original scan not available
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Flip action */}
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <Pressable
            onPress={toggleFlip}
            accessibilityRole="button"
            accessibilityLabel={isFlipped ? 'View document info' : 'View document scan'}
            style={styles.flipActionBtn}>
            <Icon name={isFlipped ? 'documents' : 'camera'} size={16} color="#FFFFFF" />
            <Text style={styles.flipActionText}>
              {isFlipped ? 'View Info' : 'View Scan'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Go to Identity Dashboard" onPress={() => router.dismissTo('/(tabs)')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 4,
  },
  docCardBackFace: {
    backgroundColor: '#F9FAFB',
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  idCardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    minWidth: 80,
    flexShrink: 0,
    marginLeft: 8,
  },
  idCardStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  idCardStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  docMainInfo: {
    padding: 20,
    flexDirection: 'row',
  },
  docAvatarContainer: {
    width: 80,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  docAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  docAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImageContainer: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docFullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  docDetailsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  docDetailItem: {
    width: '50%',
    marginBottom: 16,
  },
  docDetailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  docDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  flipActionBtn: {
    flexDirection: 'row',
    backgroundColor: '#08B6FC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#08B6FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  flipActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
