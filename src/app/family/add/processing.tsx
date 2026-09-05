import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button, Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAddDocument } from '@/features/documents/hooks';
import { useAddFamilyMember } from '@/features/family/hooks';
import { saveDocumentImages } from '@/services/documentImageStore';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import type { DocumentType } from '@/types/domain';

type ProcessingStatus = 'adding' | 'done' | 'error';

const DOC_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
  idCard: 'Identity Card',
};

/** Family document processing — runs AFTER document capture.
 *  Two modes:
 *  - personId present (existing member): adds the captured document to that
 *    member's profile, then returns to the member details screen.
 *  - no personId (new member): creates the family member, then:
 *    - 5-17: routes to face-capture (liveness + face enrollment) with personId
 *    - 0-4:  member created with document — back to family tab */
export default function FamilyProcessingScreen() {
  const router = useRouter();
  const { type, personId, name, dob, relationship, band } = useLocalSearchParams<{
    type?: string;
    personId?: string;
    name?: string;
    dob?: string;
    relationship?: string;
    band?: string;
  }>();
  const isExistingMember = !!personId;
  const docType = (type ?? 'idCard') as DocumentType;
  const isMinorWithFace = band !== '0-4';
  const [status, setStatus] = useState<ProcessingStatus>('adding');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const processRef = useRef<(() => Promise<void>) | null>(null);
  const addFamilyMember = useAddFamilyMember();
  const addDocument = useAddDocument();

  const process = async () => {
    try {
      setStatus('adding');

      if (isExistingMember) {
        // Existing member — attach the captured document to their profile
        const scanResult = getScanResult();
        if (!scanResult?.documentImageBase64) {
          throw new Error('No document image captured. Please scan again.');
        }
        console.log('[FamilyAdd] Adding document to member:', personId, docType);
        const doc = await addDocument.mutateAsync({
          type: docType,
          label: DOC_LABELS[docType],
          number: '****' + Math.floor(1000 + Math.random() * 9000),
          expiresAt: null,
          personId,
        });
        // Persist captured image locally so it can be shown in document detail
        try {
          await saveDocumentImages(doc.id, {
            front: scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
        console.log('[FamilyAdd] Document added for member:', personId);
        clearScanResult();
        setStatus('done');
        router.back();
        return;
      }

      if (!name || !dob || !relationship) {
        router.dismissTo('/(tabs)/family');
        return;
      }
      console.log('[FamilyAdd] Creating member:', JSON.stringify({ name, dob, relationship, band }));
      const member = await addFamilyMember.mutateAsync({ name, dateOfBirth: dob, relationship });
      console.log('[FamilyAdd] Member created:', member.id);
      clearScanResult();
      setStatus('done');
      if (isMinorWithFace) {
        router.replace({
          pathname: '/family/add/face-capture',
          params: { name: name.split(' ')[0], personId: member.id },
        });
      } else {
        router.dismissTo('/(tabs)/family');
      }
    } catch (err: any) {
      clearScanResult();
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not add family member';
      console.error('[FamilyAdd] Failed:', msg, JSON.stringify(err?.response?.data));
      setError(msg);
      // stay on screen with retry
    }
  };

  useEffect(() => {
    processRef.current = process;
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <View className="flex-1 items-center justify-center px-6">
        {status !== 'error' && <ActivityIndicator size={70} color={Colors.primary} />}
        {status === 'error' && (
          <View className="mb-3 h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
            <Icon name="warning" size={34} color={Colors.error} />
          </View>
        )}
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="mb-1 mt-5 text-[16px] font-bold"
          style={{ color: status === 'error' ? Colors.error : Colors.primary }}>
          {status === 'adding' && 'Adding family member…'}
          {status === 'done' && 'Added!'}
          {status === 'error' && 'Could not add family member'}
        </Text>
        <Text className="text-center text-[14px] text-muted">
          {status === 'adding' ? 'Creating profile…' : 'Please wait'}
        </Text>

        {error ? (
          <>
            <Text className="mt-3 text-center text-[13px]" style={{ color: Colors.error }}>
              {error}
            </Text>
            <View className="mt-6 w-full gap-3">
              <Button label="Retry" onPress={() => { setError(null); setStatus('adding'); processRef.current?.(); }} />
              <Button label="Back to Family" variant="outline" onPress={() => router.dismissTo('/(tabs)/family')} />
            </View>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
