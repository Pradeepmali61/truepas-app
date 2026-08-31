import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useDocument } from '@/features/documents/hooks';
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

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: identityDoc, isPending } = useDocument(id ?? '');
  const [issuedDoc, setIssuedDoc] = useState<IssuedDoc | null>(null);

  useEffect(() => {
    if (id) {
      api.getIssuedDocuments().then((docs) => {
        setIssuedDoc(docs.find((d) => d.id === id) ?? null);
      });
    }
  }, [id]);

  if (!issuedDoc && isPending) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenHeader title="Document" />
        <View className="gap-3 px-5 pt-5">
          <Skeleton height={100} radius={16} />
          <Skeleton height={120} radius={16} />
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
  const statusLabel = status === 'verified' || status === 'Active' ? 'Valid' : status === 'pending' ? 'Pending' : 'Failed';
  const statusColor = status === 'verified' || status === 'Active' ? '#059669' : status === 'pending' ? '#D97706' : '#EF4444';
  const statusBg = status === 'verified' || status === 'Active' ? '#ECFDF5' : status === 'pending' ? '#FFFBEB' : '#FEF2F2';

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
      {/* Zone 1: Header */}
      <ScreenHeader title={title} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {/* Zone 2: Identity */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#EEF2FF',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {iconName === 'drivingLicense' ? (
              <Image source={require('@/assets/images/car-3d-3.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
            ) : iconName === 'passport' ? (
              <Image source={require('@/assets/images/passport-3d.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
            ) : iconName === 'greenCard' ? (
              <Image source={require('@/assets/images/statue-of-liberty-3d.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
            ) : iconName === 'usVisa' ? (
              <Image source={require('@/assets/images/usa-flag-3d.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
            ) : iconName === 'birthCertificate' ? (
              <Image source={require('@/assets/images/baby-3d.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
            ) : (
              <Icon name={iconName as any} size={34} color="#4F46E5" />
            )}
          </View>
          <Text style={{ marginTop: 10, fontSize: 22, fontWeight: '700', color: Colors.ink }}>
            {title}
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            backgroundColor: statusBg,
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginTop: 5,
          }}>
            <Icon name="check" size={10} color={statusColor} />
            <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor }}>{statusLabel}</Text>
          </View>
        </View>

        {/* Zone 3: Details */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          paddingHorizontal: 24,
          paddingVertical: 4,
          ...Elevation.small,
        }}>
          {isIdentityDocument(doc) ? (
            <>
              <FieldRow label="Document number" value={doc.number} />
              <FieldRow label="Document type" value={doc.label} />
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '400', color: '#9CA3AF' }}>Verification status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={14} color={statusColor} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: statusColor }}>
                    {status === 'verified' ? 'Verified' : status === 'pending' ? 'Pending' : 'Failed'}
                  </Text>
                </View>
              </View>
              <FieldRow label="Identity match" value={doc.matchScore ? `${doc.matchScore}%` : '—'} />
              <FieldRow label="Added" value={formatDate(doc.addedAt)} />
              <FieldRow label="Expires" value={doc.expiresAt ? formatDate(doc.expiresAt) : '—'} last />
            </>
          ) : (
            <>
              <FieldRow label="Document number" value={doc.number} />
              <FieldRow label="Issued by" value={doc.issuer} />
              <FieldRow label="Issued on" value={formatDate(doc.issuedAt)} />
              <FieldRow label="Document type" value={doc.name} last />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function FieldRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#F1F5F9',
      }}>
      <Text style={{ fontSize: 15, fontWeight: '400', color: '#9CA3AF' }}>{label}</Text>
      <Text style={{ flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '600', color: '#111827', marginLeft: 12 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
