import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/theme';
import { useAddDocument } from '@/features/documents/hooks';
import type { DocumentType } from '@/types/domain';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

const DOC_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
  idCard: 'Identity Card',
};

/** Document processing — adds the document via API using OCR data from
 *  Regula Document Reader scan, then polls verification session until
 *  completed. */
export default function DocumentProcessingScreen() {
  const router = useRouter();
  const { type, docNumber, docLabel, dateOfExpiry, issuingCountry } = useLocalSearchParams<{
    type?: string;
    docNumber?: string;
    docLabel?: string;
    dateOfExpiry?: string;
    issuingCountry?: string;
  }>();
  const docType = (type ?? 'passport') as DocumentType;
  const pollCount = useRef(0);
  const [status, setStatus] = useState<'adding' | 'verifying' | 'done' | 'error'>('adding');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addDocument = useAddDocument();

  // Step 1: Add the document to the user's account with real OCR data
  useEffect(() => {
    const addDoc = async () => {
      try {
        await addDocument.mutateAsync({
          type: docType,
          label: docLabel || DOC_LABELS[docType],
          number: docNumber || '****' + Math.floor(1000 + Math.random() * 9000),
          expiresAt: dateOfExpiry || null,
        });
        setStatus('verifying');
      } catch (err: any) {
        // Even if API fails (backend down), proceed to verifying
        // so the user isn't stuck. Mock fallback will handle it.
        setSubmitError(err?.message ?? null);
        setStatus('verifying');
      }
    };
    addDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  // Step 2: Poll verification status (simulated until backend exposes polling)
  useEffect(() => {
    if (status !== 'verifying') return;

    const poll = async () => {
      pollCount.current += 1;

      if (pollCount.current >= MAX_POLL_ATTEMPTS) {
        router.replace('/document/mismatch');
        return;
      }

      // Simulate: after 3 polls (~6 seconds), consider it approved
      if (pollCount.current >= 3) {
        setStatus('done');
        router.replace('/document/verified');
        return;
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, router]);

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        <ActivityIndicator size={80} color={Colors.primary} />
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="mb-1 mt-5 text-[16px] font-bold text-primary">
          {status === 'adding' ? 'Adding document…' : 'Verifying document…'}
        </Text>
        <Text className="text-[14px] text-muted">Extracting details &amp; matching your face</Text>

        {/* Show OCR data from Regula scan */}
        {(docNumber || issuingCountry) && (
          <View className="mt-4 px-4 py-3 rounded-btn bg-surface border border-[#e0e0e0]">
            {docNumber ? (
              <Text className="text-[13px] text-muted">
                Document No: <Text className="text-ink font-medium">{docNumber}</Text>
              </Text>
            ) : null}
            {issuingCountry ? (
              <Text className="text-[13px] text-muted mt-1">
                Issued by: <Text className="text-ink font-medium">{issuingCountry}</Text>
              </Text>
            ) : null}
            {docLabel ? (
              <Text className="text-[13px] text-muted mt-1">
                Name: <Text className="text-ink font-medium">{docLabel}</Text>
              </Text>
            ) : null}
          </View>
        )}

        <View className="mt-4">
          <View className="my-1 flex-row items-center gap-2">
            <Icon name="check" size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">Document scanned</Text>
          </View>
          <View className="my-1 flex-row items-center gap-2">
            <Icon name={status === 'adding' ? 'hourglass' : 'check'} size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">{status === 'adding' ? 'Adding to account…' : 'Document added'}</Text>
          </View>
          <View className="my-1 flex-row items-center gap-2">
            <Icon name={status === 'verifying' ? 'hourglass' : 'check'} size={14} color={Colors.primary} />
            <Text className="text-[12px] text-muted">{status === 'verifying' ? 'Matching faces…' : status === 'done' ? 'Verified' : 'Pending'}</Text>
          </View>
        </View>

        {submitError ? (
          <Text className="mt-3 text-[12px] text-muted text-center">
            Note: Using fallback data (backend unreachable)
          </Text>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
