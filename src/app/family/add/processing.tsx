import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { Alert } from '@/components/composite';
import { CoreButton, RowIcon, Spinner, Typography } from '@/components/ui';
import { useAddDocument } from '@/features/documents/hooks';
import { ageFromDob, useAddFamilyMember } from '@/features/family/hooks';
import { clearDocumentImages, saveDocumentImages } from '@/services/documentImageStore';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
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
 *    member's profile, then routes to the member detail page.
 *  - no personId (new member): creates the family member, then:
 *    - 5-17: routes to face-capture (liveness + face enrollment), which
 *      then routes to the member detail page on completion.
 *    - 0-4:  routes to photo-capture (photo enrollment, no liveness), which
 *      then routes to the member detail page on completion. */
export default function FamilyProcessingScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
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
          number: 'PENDING',
          expiresAt: null,
          personId,
        });
        console.log('[FamilyAdd] Document created:', JSON.stringify({ id: doc.id, personId: doc.personId, type: doc.type, label: doc.label }));
        // Facepe-style REPLACE: the member's previous document of this type
        // is superseded by the new capture — remove the old one so duplicate
        // scans don't pile up in the member's document list.
        try {
          const existing = await api.getDocuments(personId);
          const duplicates = (existing ?? []).filter(
            (d) => d.type === docType && d.id !== doc.id,
          );
          for (const dup of duplicates) {
            try {
              await api.removeDocument(dup.id);
              await clearDocumentImages(dup.id);
              console.log('[FamilyAdd] Replaced existing member document:', dup.id, dup.type);
            } catch (e) {
              console.warn('[FamilyAdd] Failed to remove duplicate:', dup.id, e);
            }
          }
        } catch (e) {
          console.warn('[FamilyAdd] Replace lookup failed — keeping existing documents:', e);
        }
        // Persist captured image locally so it can be shown in document detail
        try {
          await saveDocumentImages(doc.id, {
            front: scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
        console.log('[FamilyAdd] Document added for member:', personId, '| doc.personId=', doc.personId);
        clearScanResult();
        setStatus('done');
        // Route back to the member detail page (not just router.back()
        // which would land on the select-type page).
        router.replace({ pathname: '/family/[id]', params: { id: personId } });
        return;
      }

      if (!name || !dob || !relationship) {
        router.dismissTo('/(tabs)/family');
        return;
      }
      console.log('[FamilyAdd] Creating member:', JSON.stringify({ name, dob, relationship, band }));
      const member = await addFamilyMember.mutateAsync({ name, dateOfBirth: dob, relationship });
      console.log('[FamilyAdd] Member created:', member.id);

      // Attach the captured document to the newly created member
      const scanResult = getScanResult();
      if (scanResult?.documentImageBase64) {
        console.log('[FamilyAdd] Adding document to new member:', member.id, docType);
        const doc = await addDocument.mutateAsync({
          type: docType,
          label: DOC_LABELS[docType],
          number: 'PENDING',
          expiresAt: null,
          personId: member.id,
        });
        console.log('[FamilyAdd] Document created:', JSON.stringify({ id: doc.id, personId: doc.personId, type: doc.type }));
        try {
          await saveDocumentImages(doc.id, {
            front: scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
      }

      clearScanResult();
      setStatus('done');
      if (isMinorWithFace) {
        // 5-17: face capture first, then route to member detail page
        router.replace({
          pathname: '/family/add/face-capture',
          params: { name: name.split(' ')[0], personId: member.id },
        });
      } else {
        // 0-4: can't run liveness — photo enrollment captures one photo
        // (selfieBase64 + personId), then routes to the member detail page.
        router.replace({
          pathname: '/family/add/photo-capture',
          params: { name: name.split(' ')[0], age: String(ageFromDob(dob)), personId: member.id },
        });
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
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing[6],
          paddingBottom: insets.bottom,
          gap: theme.spacing[4],
        }}>
        {status !== 'error' ? (
          <Spinner size="lg" label="Adding family member" />
        ) : (
          <RowIcon
            tone="error"
            icon={<TriangleAlert size={iconSize.lg} color={theme.colors.onErrorSubtle} />}
          />
        )}
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography
            variant="h4"
            accessibilityLiveRegion="polite"
            style={{ color: status === 'error' ? theme.colors.error : theme.colors.textPrimary }}>
            {status === 'adding' && 'Adding family member…'}
            {status === 'done' && 'Added!'}
            {status === 'error' && 'Could not add family member'}
          </Typography>
          <Typography variant="body-sm" color="secondary" center>
            {status === 'adding' ? 'Creating profile…' : 'Please wait'}
          </Typography>
        </View>

        {error ? (
          <>
            <Alert variant="error">{error}</Alert>
            <View style={{ alignSelf: 'stretch', gap: theme.spacing[3], marginTop: theme.spacing[2] }}>
              <CoreButton
                fullWidth
                accessibilityLabel="Retry"
                onPress={() => {
                  setError(null);
                  setStatus('adding');
                  processRef.current?.();
                }}>
                Retry
              </CoreButton>
              <CoreButton
                fullWidth
                variant="outline"
                accessibilityLabel="Back to family"
                onPress={() => router.dismissTo('/(tabs)/family')}>
                Back to Family
              </CoreButton>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
