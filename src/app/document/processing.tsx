import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { api } from '@/api';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';
import { documentKeys, useAddDocument } from '@/features/documents/hooks';
import { clearDocumentImages, saveDocumentImages } from '@/services/documentImageStore';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import { useAppSelector } from '@/store';
import type { DocumentType, IdentityDocument } from '@/types/domain';

const DOC_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
  idCard: 'Identity Card',
};

type ProcessingStatus = 'adding' | 'creating_session' | 'verifying' | 'done' | 'error';

/** Extract a readable message from any thrown error. */
const msg0 = (err: any): string =>
  err?.response?.data?.message ?? err?.message ?? 'Verification failed';

/** Document processing — per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6:
 *  1. POST /documents → documentId
 *  2. POST /documents/{id}/verification-sessions → sessionId
 *  3. POST /document-verification-sessions/{sessionId}/verify
 *     with { frontImageBase64, selfieImageBase64? } → SYNCHRONOUS result
 *  4. No polling needed — verify returns final outcome directly */
export default function DocumentProcessingScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const docType = (type ?? 'passport') as DocumentType;
  const [status, setStatus] = useState<ProcessingStatus>('adding');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const processRef = useRef<(() => Promise<void>) | null>(null);
  // Document created by the current attempt — reused on Retry so a failed
  // session/API error doesn't pile up duplicate documents.
  const createdDocRef = useRef<IdentityDocument | null>(null);
  const addDocument = useAddDocument();
  const queryClient = useQueryClient();
  const profileName = useAppSelector((state) => state.auth.user?.fullName ?? 'User');
  const profileDob = useAppSelector((state) => state.auth.user?.dateOfBirth ?? '');

  // Refresh document lists + identity summary AFTER verification completes —
  // the addDocument invalidation fires while the doc is still `pending`, so
  // without this the list shows a stale pre-verify status (e.g. "Failed").
  const refreshDocumentCaches = () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.all });
    queryClient.invalidateQueries({ queryKey: ['identity'] });
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const process = async () => {
      const scanResult = getScanResult();
      const frontImage = scanResult?.documentImageBase64 ?? '';
      const selfieImage = scanResult?.selfieBase64;

      if (!frontImage) {
        setError('No document image captured. Please scan again.');
        setStatus('error');
        clearScanResult();
        return;
      }

      try {
        // Step 1: Add document (metadata only — backend will fill in extracted data).
        // On Retry, reuse the document created by the previous attempt.
        // NOTE: `number` is a required backend field (min 2 chars) but the real
        // number comes from server-side OCR during /verify — never fabricate a
        // random one here. "PENDING" is overwritten by the backend after verify.
        let doc = createdDocRef.current;
        if (!doc) {
          setStatus('adding');
          doc = await addDocument.mutateAsync({
            type: docType,
            label: DOC_LABELS[docType],
            number: 'PENDING',
            expiresAt: null,
          });
          createdDocRef.current = doc;

          // Persist captured images locally so the document detail screen
          // can show the originally captured photo later.
          try {
            await saveDocumentImages(doc.id, {
              front: frontImage,
              selfie: selfieImage,
            });
          } catch (e) {
            console.warn('[DocProcessing] Failed to save document images locally:', e);
          }
        }

        // Step 2: Create verification session (requestId = idempotency key)
        // Per guide §6.3: omit frontObjectKey/backObjectKey/selfieObjectKey —
        // they are reserved for the future signed-upload pipeline and the BFF
        // rejects keys not starting with customers/{customerId}/.
        setStatus('creating_session');
        const session = await api.createVerificationSession(doc.id, {
          requestId: `req-${Date.now()}`,
        });

        // Step 3: Verify — SYNCHRONOUS result with images as base64
        // Per guide §6.3: frontImageBase64 is required, selfieImageBase64 for face match
        setStatus('verifying');
        const result = await api.startVerificationWithImages(
          session.id,
          {
            frontImageBase64: frontImage,
            selfieImageBase64: selfieImage,
          },
          { timeout: 90_000 } // Regula processing can take a while
        );

        clearScanResult();

        // Step 4: Handle outcome — verify is synchronous, no polling
        if (result.outcome === 'approved' || result.outcome === 'review') {
          // Facepe-style REPLACE: the new document is verified, so remove any
          // previous document of the same type for the main user (self docs
          // have no personId). This also cleans up historical duplicates.
          try {
            const existing = await api.getDocuments();
            const duplicates = (existing ?? []).filter(
              (d) => d.type === docType && d.id !== doc.id && !d.personId,
            );
            for (const dup of duplicates) {
              try {
                await api.removeDocument(dup.id);
                await clearDocumentImages(dup.id);
                console.log('[DocProcessing] Replaced existing document:', dup.id, dup.type);
              } catch (e) {
                console.warn('[DocProcessing] Failed to remove duplicate:', dup.id, e);
              }
            }
          } catch (e) {
            console.warn('[DocProcessing] Replace lookup failed — keeping existing documents:', e);
          }

          refreshDocumentCaches();
          setStatus('done');
          // Pass backend-returned extracted data to the verified screen.
          // docNumber comes from the POST-VERIFY document (real masked number),
          // not the pre-verify placeholder.
          router.replace({
            pathname: '/document/verified',
            params: {
              docId: doc.id,
              docLabel: DOC_LABELS[docType],
              docNumber: result.document?.number ?? doc.number ?? '',
              extractedName: result.extractedName ?? '',
              extractedDob: result.extractedDob ?? '',
              matchScore: result.matchScore != null ? String(result.matchScore) : '',
              outcome: result.outcome,
              issuingState: result.issuingState ?? '',
              nationality: result.nationality ?? '',
              dateOfExpiry: result.dateOfExpiry ?? '',
              portraitImageUrl: result.portraitImageUrl ?? '',
            },
          });
        } else {
          setStatus('error');
          setError(result.reasonCode ?? 'Document verification failed');

          // Verification rejected — if the user already has a document of this
          // type, discard the failed attempt so the old document survives
          // (Facepe-style replace never leaves a failed duplicate behind).
          try {
            const existing = await api.getDocuments();
            const hasExisting = (existing ?? []).some(
              (d) => d.type === docType && d.id !== doc.id && !d.personId,
            );
            if (hasExisting) {
              await api.removeDocument(doc.id);
              await clearDocumentImages(doc.id);
              createdDocRef.current = null;
              console.log('[DocProcessing] Discarded failed re-upload, existing document kept');
            }
          } catch (e) {
            console.warn('[DocProcessing] Failed-attempt cleanup error:', e);
          }

          refreshDocumentCaches();
          router.replace({
            pathname: '/document/mismatch',
            params: {
              profileName,
              profileDob,
              docName: result.extractedName ?? '',
              docDob: result.extractedDob ?? '',
              reason: result.reasonCode ?? '',
            },
          });
        }
      } catch (err: any) {
        clearScanResult();
        const msg = err?.response?.data?.message ?? err?.message ?? 'Verification failed';
        console.error('[DocProcessing] Failed at step:', status, '|', msg, JSON.stringify(err?.response?.data));
        setError(msg);
        setStatus('error');
        // Stay on this screen with a Retry button — do NOT route to mismatch.
        // Mismatch is only for real verification outcomes (rejected/mismatch),
        // not for HTTP/API errors like 404 or 5xx.
      }
    };

    processRef.current = process;
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        {status !== 'error' && <ActivityIndicator size={80} color={Colors.primary} />}
        {status === 'error' && (
          <View className="mb-3 h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: Colors.errorBg }}>
            <Icon name="warning" size={36} color={Colors.error} />
          </View>
        )}
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="mb-1 mt-5 text-[16px] font-bold"
          style={{ color: status === 'error' ? Colors.error : Colors.primary }}>
          {status === 'adding' && 'Adding document…'}
          {status === 'creating_session' && 'Creating verification session…'}
          {status === 'verifying' && 'Verifying document…'}
          {status === 'done' && 'Verified!'}
          {status === 'error' && 'Verification failed'}
        </Text>
        <Text className="text-[14px] text-muted">
          {status === 'verifying' ? 'Regula processing — this may take a moment' : 'Extracting details & matching your face'}
        </Text>

        <View className="mt-4">
          <View className="my-1 flex-row items-center gap-2">
            <Icon name="check" size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">Document scanned</Text>
          </View>
          <View className="my-1 flex-row items-center gap-2">
            <Icon name={status === 'adding' ? 'hourglass' : 'check'} size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">
              {status === 'adding' ? 'Adding to account…' : 'Document added'}
            </Text>
          </View>
          <View className="my-1 flex-row items-center gap-2">
            <Icon
              name={status === 'verifying' || status === 'creating_session' ? 'hourglass' : 'check'}
              size={14}
              color={Colors.primary}
            />
            <Text className="text-[12px] text-muted">
              {status === 'creating_session' ? 'Creating session…' :
               status === 'verifying' ? 'Matching faces…' :
               status === 'done' ? 'Verified' :
               status === 'error' ? 'Failed' : 'Pending'}
            </Text>
          </View>
        </View>

        {error ? (
          <Text className="mt-3 text-[13px] text-center" style={{ color: Colors.error }}>
            {error}
          </Text>
        ) : null}

        {status === 'error' && (
          <View className="mt-6 w-full gap-3 px-2">
            <Button
              label="Retry Verification"
              onPress={() => {
                hasStarted.current = false;
                setError(null);
                setStatus('adding');
                processRef.current?.();
              }}
            />
            <Button
              label="Back to Documents"
              variant="outline"
              onPress={() => {
                // Discard the unverified document created by this attempt so
                // no pending duplicate is left in My Documents.
                const doc = createdDocRef.current;
                if (doc) {
                  api.removeDocument(doc.id).catch(() => {});
                  clearDocumentImages(doc.id).catch(() => {});
                  createdDocRef.current = null;
                }
                router.back();
              }}
            />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
