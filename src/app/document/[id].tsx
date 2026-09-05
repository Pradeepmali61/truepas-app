import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, Skeleton } from '@/components/ui';
import { useDocument } from '@/features/documents/hooks';
import { getDocumentImageUri } from '@/services/documentImageStore';
import type { IdentityDocument, IssuedDoc } from '@/types/domain';

type CombinedDoc = IssuedDoc | IdentityDocument;

function isIdentityDocument(doc: CombinedDoc): doc is IdentityDocument {
  return 'label' in doc;
}

function getIcon(doc: CombinedDoc): string {
  return isIdentityDocument(doc) ? doc.type : doc.icon;
}

function getTitle(doc: CombinedDoc): string {
  return isIdentityDocument(doc) ? doc.label : doc.name;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Document detail — flip card design (ref: facepe-user-frontend verify.tsx).
 *  Front face: gradient header + status badge + doc icon + details grid.
 *  Back face: the captured document scan image.
 *  Flip button toggles between "View Scan" and "View Info". */
export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: identityDoc, isPending } = useDocument(id ?? '');
  const [issuedDoc, setIssuedDoc] = useState<IssuedDoc | null>(null);
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [selfieImageUri, setSelfieImageUri] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) {
      api.getIssuedDocuments().then((docs) => {
        setIssuedDoc(docs.find((d) => d.id === id) ?? null);
      });
      // Load locally persisted captured images
      getDocumentImageUri(id, 'front').then(setFrontImageUri).catch(() => setFrontImageUri(null));
      getDocumentImageUri(id, 'selfie').then(setSelfieImageUri).catch(() => setSelfieImageUri(null));
    }
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

  if (!issuedDoc && isPending) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenHeader title="Document" />
        <View className="gap-3 px-5 pt-5">
          <Skeleton height={260} radius={24} />
        </View>
      </ScreenContainer>
    );
  }

  const doc: CombinedDoc | null | undefined = issuedDoc ?? identityDoc;
  if (!doc) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenHeader title="Document" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Document not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const iconName = getIcon(doc);
  const title = getTitle(doc);
  const status = isIdentityDocument(doc) ? doc.status : doc.status;
  const isVerified = status === 'verified' || status === 'Active';
  const isPending = status === 'pending';
  const statusLabel = isVerified ? 'VERIFIED' : isPending ? 'PENDING' : 'FAILED';
  const statusColor = isVerified ? '#34D399' : isPending ? '#FBBF24' : '#F87171';

  return (
    <ScreenContainer>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScreenHeader title={title} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 }}>

        {/* Flip card */}
        <View style={styles.cardWrapper}>
          {/* Front face — document info */}
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
              <Text style={styles.cardTitle}>{title}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </LinearGradient>

            <View style={styles.docMainInfo}>
              {/* Portrait / selfie */}
              <View style={styles.docAvatarContainer}>
                {selfieImageUri ? (
                  <Image
                    source={{ uri: selfieImageUri }}
                    style={styles.docAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.docAvatarPlaceholder}>
                    {iconName === 'drivingLicense' ? (
                      <Image source={require('@/assets/images/car-3d-3.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    ) : iconName === 'passport' ? (
                      <Image source={require('@/assets/images/passport-3d.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    ) : iconName === 'greenCard' ? (
                      <Image source={require('@/assets/images/statue-of-liberty-3d.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    ) : iconName === 'usVisa' ? (
                      <Image source={require('@/assets/images/usa-flag-3d.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    ) : iconName === 'birthCertificate' ? (
                      <Image source={require('@/assets/images/baby-3d.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
                    ) : (
                      <Icon name={iconName as any} size={36} color="#A0A0A0" />
                    )}
                  </View>
                )}
              </View>

              {/* Details grid */}
              <View style={styles.docDetailsGrid}>
                {isIdentityDocument(doc) ? (
                  <>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>DOCUMENT NO</Text>
                      <Text style={styles.docDetailValue} numberOfLines={1}>{doc.number || '—'}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>DOCUMENT TYPE</Text>
                      <Text style={styles.docDetailValue} numberOfLines={1}>{doc.label}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>STATUS</Text>
                      <Text style={[styles.docDetailValue, { color: isVerified ? '#059669' : isPending ? '#D97706' : '#EF4444' }]}>
                        {isVerified ? 'Verified' : isPending ? 'Pending' : 'Failed'}
                      </Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>MATCH SCORE</Text>
                      <Text style={styles.docDetailValue}>{doc.matchScore ? `${doc.matchScore}%` : '—'}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>ADDED</Text>
                      <Text style={styles.docDetailValue}>{formatDate(doc.addedAt)}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>EXPIRES</Text>
                      <Text style={styles.docDetailValue}>{doc.expiresAt ? formatDate(doc.expiresAt) : '—'}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>DOCUMENT NO</Text>
                      <Text style={styles.docDetailValue} numberOfLines={1}>{doc.number}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>ISSUED BY</Text>
                      <Text style={styles.docDetailValue} numberOfLines={1}>{doc.issuer}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>ISSUED ON</Text>
                      <Text style={styles.docDetailValue}>{formatDate(doc.issuedAt)}</Text>
                    </View>
                    <View style={styles.docDetailItem}>
                      <Text style={styles.docDetailLabel}>TYPE</Text>
                      <Text style={styles.docDetailValue} numberOfLines={1}>{doc.name}</Text>
                    </View>
                  </>
                )}
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
              <Text style={styles.cardTitle}>DOCUMENT SCAN</Text>
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

        {/* Flip action button */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    height: 280,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  statusBadge: {
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
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
    marginBottom: 14,
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
