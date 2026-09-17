import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { Alert, StagedFlow } from '@/components/composite';
import { CoreButton, RowIcon, Spinner, Typography } from '@/components/ui';
import { useAddDocument } from '@/features/documents/hooks';
import { ageFromDob, useAddFamilyMember } from '@/features/family/hooks';
import { clearDocumentImages, saveDocumentImages } from '@/services/documentImageStore';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { DocumentType, FamilyMember, IdentityDocument } from '@/types/domain';

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
  const docType = (type ?? 'passport') as DocumentType;
  const isMinorWithFace = band !== '0-4';
  const [status, setStatus] = useState<ProcessingStatus>('adding');
  const [error, setError] = useState<string | null>(null);
  // Staged flow — index advances at each real await boundary inside process().
  const [stepIndex, setStepIndex] = useState(0);
  const STEP_LABELS = isExistingMember
    ? ['Document captured', 'Adding document', 'Verifying document']
    : ['Creating member profile', 'Adding document', 'Verifying document'];
  const processRef = useRef<(() => Promise<void>) | null>(null);
  const addFamilyMember = useAddFamilyMember();
  const addDocument = useAddDocument();
  // Retry-safe: created entities are reused so a retry after a verify
  // failure doesn't mint duplicate members/documents.
  const createdMemberRef = useRef<FamilyMember | null>(null);
  const createdDocRef = useRef<IdentityDocument | null>(null);

  /** Verify a member document — same pipeline as self-docs (session +
   *  front-image verify, no selfie: the member's face is captured later).
   *  Best-effort: the backend verification service may be unavailable or
   *  may not verify member docs — a captured doc still counts as added
   *  (family/[id] treats any non-failed doc as done). */
  const verifyMemberDoc = async (docId: string, frontImageBase64: string) => {
    try {
      const session = await api.createVerificationSession(docId, {
        requestId: `req-${Date.now()}`,
      });
      const result = await api.startVerificationWithImages(
        session.id,
        { frontImageBase64 },
        { timeout: 90_000 },
      );
      console.log('[FamilyAdd] Member doc verify outcome:', result.outcome, result.reasonCode ?? '');
    } catch (e: any) {
      console.warn('[FamilyAdd] Member doc verification unavailable — continuing:', e?.message);
    }
  };

  const process = async () => {
    try {
      setStatus('adding');
      setStepIndex(0);

      if (isExistingMember) {
        // Existing member — attach the captured document to their profile
        const scanResult = getScanResult();
        if (!scanResult?.documentImageBase64) {
          throw new Error('No document image captured. Please scan again.');
        }
        console.log('[FamilyAdd] Adding document to member:', personId, docType);
        let doc = createdDocRef.current;
        if (!doc) {
          setStepIndex(1);
          doc = await addDocument.mutateAsync({
            type: docType,
            label: DOC_LABELS[docType],
            number: 'PENDING',
            expiresAt: null,
            personId,
          });
          createdDocRef.current = doc;
        }
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
            front: scanResult.documentPreviewBase64 ?? scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
        console.log('[FamilyAdd] Document added for member:', personId, '| doc.personId=', doc.personId);
        setStepIndex(2);
        await verifyMemberDoc(doc.id, scanResult.documentImageBase64);
        clearScanResult();
        setStatus('done');
        // Route back to the member detail page (not just router.back()
        // which would land on the select-type page).
        router.replace({ pathname: '/family/[id]', params: { id: personId } });
        return;
      }

      if (!name || !dob || !relationship) {
        router.dismissTo('/(tabs)');
        return;
      }
      console.log('[FamilyAdd] Creating member:', JSON.stringify({ name, dob, relationship, band }));
      let member = createdMemberRef.current;
      if (!member) {
        member = await addFamilyMember.mutateAsync({ name, dateOfBirth: dob, relationship });
        createdMemberRef.current = member;
      }
      console.log('[FamilyAdd] Member created:', member.id);

      // Attach the captured document to the newly created member
      const scanResult = getScanResult();
      let doc = createdDocRef.current;
      if (scanResult?.documentImageBase64 && !doc) {
        setStepIndex(1);
        console.log('[FamilyAdd] Adding document to new member:', member.id, docType);
        doc = await addDocument.mutateAsync({
          type: docType,
          label: DOC_LABELS[docType],
          number: 'PENDING',
          expiresAt: null,
          personId: member.id,
        });
        createdDocRef.current = doc;
        console.log('[FamilyAdd] Document created:', JSON.stringify({ id: doc.id, personId: doc.personId, type: doc.type }));
        try {
          await saveDocumentImages(doc.id, {
            front: scanResult.documentPreviewBase64 ?? scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
      }

      if (doc && scanResult?.documentImageBase64) {
        setStepIndex(2);
        await verifyMemberDoc(doc.id, scanResult.documentImageBase64);
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
      // Keep scanResult on failure — Retry re-runs the verify step and
      // still needs the captured image. It's cleared on success or
      // overwritten by the next capture.
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not add family member';
      console.error('[FamilyAdd] Failed:', msg, JSON.stringify(err?.response?.data));
      setError(msg);
      setStatus('error');
      // stay on screen with retry
    }
  };

  useEffect(() => {
    processRef.current = process;
    // Defer to a microtask — process() updates state synchronously, which is
    // not allowed directly inside an effect (react-hooks/set-state-in-effect).
    queueMicrotask(process);
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

        <View style={{ alignSelf: 'stretch', paddingHorizontal: theme.spacing[6] }}>
          <StagedFlow
            steps={STEP_LABELS}
            index={status === 'done' ? STEP_LABELS.length : stepIndex}
            status={status === 'error' ? 'failed' : 'active'}
          />
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
                onPress={() => router.dismissTo('/(tabs)')}>
                Back to Family
              </CoreButton>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
