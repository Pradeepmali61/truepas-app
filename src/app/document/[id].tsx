import { useLocalSearchParams, useRouter } from 'expo-router';
import { Baby, BookUser, Car, Contact, FileText, Globe, Landmark } from 'lucide-react-native';
import { useEffect, useState, type ComponentType } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { Accordion, Alert, Card, CardContent, ErrorState, Modal, ScreenHeader } from '@/components/composite';
import { Badge, CoreButton, Divider, RowIcon, Skeleton, Typography, type BadgeVariant } from '@/components/ui';
import { useDocument, useRemoveDocument } from '@/features/documents/hooks';
import { useToast } from '@/hooks/useToast';
import { getDocumentImageUri } from '@/services/documentImageStore';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { IdentityDocument, IssuedDoc } from '@/types/domain';

type CombinedDoc = IssuedDoc | IdentityDocument;

function isIdentityDocument(doc: CombinedDoc): doc is IdentityDocument {
  return 'label' in doc;
}

const DOC_ICONS: Record<string, ComponentType<{ size?: number; color?: string }>> = {
  passport: BookUser,
  drivingLicense: Car,
  idCard: Contact,
  greenCard: Landmark,
  usVisa: Globe,
  birthCertificate: Baby,
};

function docIcon(doc: CombinedDoc, color: string) {
  const type = isIdentityDocument(doc) ? doc.type : doc.icon;
  const IconCmp = DOC_ICONS[type] ?? FileText;
  return <RowIcon tone="primary" icon={<IconCmp size={iconSize.lg} color={color} />} />;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function KV({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
      <Typography variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="body"
        numberOfLines={2}
        style={mono ? { fontFamily: theme.fontFamily.mono.semibold } : undefined}>
        {value}
      </Typography>
    </View>
  );
}

const STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'error', label: 'Failed' },
  missing: { variant: 'neutral', label: 'Missing' },
  Active: { variant: 'success', label: 'Active' },
  Expired: { variant: 'neutral', label: 'Expired' },
};

/** Document detail — GET /cb/documents/{id} (or issued doc). Native card +
 *  extracted-data accordion; document numbers render masked only. */
export default function DocumentDetailScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: identityDoc, isPending, isError, refetch } = useDocument(id);
  const removeDocument = useRemoveDocument();
  const toast = useToast();
  const [issuedDoc, setIssuedDoc] = useState<IssuedDoc | null>(null);
  const [issuedLoaded, setIssuedLoaded] = useState(false);
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getIssuedDocuments()
      .then((docs) => setIssuedDoc(docs.find((d) => d.id === id) ?? null))
      .finally(() => setIssuedLoaded(true));
    getDocumentImageUri(id, 'front').then(setFrontImageUri).catch(() => setFrontImageUri(null));
  }, [id]);

  const handleRemove = () => {
    if (!id) return;
    setConfirmRemove(true);
  };

  const confirmRemoveDoc = () => {
    if (!id) return;
    removeDocument.mutate(id, {
      onSuccess: () => router.back(),
      onError: (err: any) => {
        toast.show(
          'error',
          err?.response?.data?.message ?? err?.message ?? 'Could not remove the document. Please try again.',
        );
      },
    });
  };

  const doc: CombinedDoc | null | undefined = issuedDoc ?? identityDoc;
  const loading = isPending || !issuedLoaded;

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Document" onBack={() => router.back()} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <Skeleton height={88} radius={theme.radii.xl} />
          <Skeleton height={160} radius={theme.radii.xl} />
          <Skeleton height={56} radius={theme.radii.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title="Document" onBack={() => router.back()} />
        <ErrorState
          title={isError ? "Couldn't load document" : 'Document not found'}
          description={isError ? 'Please check your connection and try again.' : 'It may have been removed.'}
          onRetry={isError ? refetch : undefined}
        />
      </SafeAreaView>
    );
  }

  const title = isIdentityDocument(doc) ? doc.label : doc.name;
  const type = isIdentityDocument(doc) ? doc.type : doc.icon;
  const status = STATUS[doc.status] ?? { variant: 'neutral' as const, label: doc.status };
  const failed = doc.status === 'failed';
  const isIdentity = isIdentityDocument(doc);
  const isLicense = type.toLowerCase().includes('license');
  const portraitUri = isIdentity ? doc.portraitImageUrl ?? frontImageUri : null;
  const scanUri = (isIdentity ? doc.documentImageUrl : null) ?? frontImageUri;

  const extractedFields: { label: string; value: string; mono?: boolean }[] = isIdentity
    ? [
        { label: 'Extracted name', value: doc.extractedName || '—', mono: true },
        { label: 'Date of birth', value: doc.extractedDob ? formatDate(doc.extractedDob) : '—', mono: true },
        { label: 'Nationality', value: doc.nationality || '—' },
        { label: 'Issuing state', value: doc.issuingState || '—' },
        {
          label: 'Match score',
          value: doc.matchScore != null ? `${Math.round(doc.matchScore * 100)}%` : '—',
          mono: true,
        },
      ]
    : [];

  const accordionItems = [
    ...(extractedFields.length > 0
      ? [
          {
            value: 'extracted',
            title: 'Extracted data',
            content: (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing[4] }}>
                {extractedFields.map((f) => (
                  <View key={f.label} style={{ width: '50%', paddingRight: theme.spacing[3] }}>
                    <KV label={f.label} value={f.value} mono={f.mono} />
                  </View>
                ))}
              </View>
            ),
          },
        ]
      : []),
    ...(scanUri
      ? [
          {
            value: 'scan',
            title: 'Document scan',
            content: (
              <Image
                source={{ uri: scanUri }}
                style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: theme.radii.md }}
                resizeMode="contain"
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[4],
          paddingBottom: theme.spacing[8] + insets.bottom + (isIdentity ? theme.sizes.heightLg : 0),
        }}
        showsVerticalScrollIndicator={false}>
        {failed && (
          <Alert variant="error" title="Verification failed">
            The document could not be verified. Recapture it in better light and try again.
          </Alert>
        )}

        <Card>
          <CardContent>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              {portraitUri ? (
                <Image
                  source={{ uri: portraitUri }}
                  style={{ width: 56, height: 56, borderRadius: theme.radii.md }}
                  resizeMode="cover"
                />
              ) : (
                docIcon(doc, theme.colors.actionPrimary)
              )}
              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Typography variant="h4" numberOfLines={1}>{title}</Typography>
                <Typography variant="body-sm" color="secondary" numberOfLines={1}>
                  {isIdentity ? (doc.extractedName || 'Identity document') : doc.issuer}
                </Typography>
              </View>
              <Badge variant={status.variant}>{status.label}</Badge>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ gap: theme.spacing[3] }}>
            {isIdentity ? (
              <>
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  <KV label="Type" value={doc.label} />
                  <KV label="Number" value={doc.number || '—'} mono />
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  <KV label="Status" value={status.label} />
                  <KV label="Added" value={formatDate(doc.addedAt)} />
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  <KV label="Expires" value={formatDate(doc.expiresAt)} />
                  <KV label={isLicense ? 'State' : 'Nationality'} value={(isLicense ? doc.issuingState : doc.nationality) || '—'} />
                </View>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  <KV label="Number" value={doc.number} mono />
                  <KV label="Issued by" value={doc.issuer} />
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  <KV label="Issued on" value={formatDate(doc.issuedAt)} />
                  <KV label="Type" value={doc.name} />
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {accordionItems.length > 0 && <Accordion items={accordionItems} multiple />}
      </ScrollView>

      {isIdentity && (
        <View
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[2],
            paddingBottom: insets.bottom + theme.spacing[3],
          }}>
          <CoreButton
            variant="ghost"
            fullWidth
            loading={removeDocument.isPending}
            accessibilityLabel="Remove document"
            onPress={handleRemove}>
            <Typography variant="body" style={{ color: theme.colors.error }}>
              Remove document
            </Typography>
          </CoreButton>
        </View>
      )}

      <Modal
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove document?"
        footer={
          <>
            <CoreButton variant="ghost" onPress={() => setConfirmRemove(false)}>
              Cancel
            </CoreButton>
            <CoreButton
              variant="destructive"
              loading={removeDocument.isPending}
              onPress={() => {
                setConfirmRemove(false);
                confirmRemoveDoc();
              }}>
              Remove
            </CoreButton>
          </>
        }>
        <Typography variant="body" color="secondary">
          Are you sure you want to remove this document? This action cannot be undone.
        </Typography>
      </Modal>
    </SafeAreaView>
  );
}
