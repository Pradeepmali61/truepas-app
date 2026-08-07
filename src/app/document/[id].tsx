import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Card, Icon, Pill, Skeleton } from '@/components/ui';
import { ISSUED_DOCS } from '@/constants/documents';
import { useDocument } from '@/features/documents/hooks';
import type { IdentityDocument } from '@/types/domain';

type CombinedDoc = (typeof ISSUED_DOCS)[number] | IdentityDocument;

function isIdentityDocument(doc: CombinedDoc): doc is IdentityDocument {
  return 'label' in doc;
}

function getIcon(doc: CombinedDoc): string {
  return isIdentityDocument(doc) ? doc.type : doc.icon;
}

function getTitle(doc: CombinedDoc): string {
  return isIdentityDocument(doc) ? doc.label : doc.name;
}

function getSubtitle(doc: CombinedDoc): string {
  return isIdentityDocument(doc) ? doc.number : doc.issuer;
}

function getPillVariant(status: string) {
  switch (status) {
    case 'verified':
    case 'Active':
      return 'active';
    case 'failed':
    case 'Expired':
      return 'fail';
    default:
      return 'warn';
  }
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const issuedDoc = ISSUED_DOCS.find((d) => d.id === id);
  const { data: identityDoc, isPending } = useDocument(id ?? '');

  if (!issuedDoc && isPending) {
    return (
      <ScreenContainer scroll={false}>
        <TopBar title="Document" />
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
        <TopBar title="Document" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Document not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const iconName = getIcon(doc);
  const title = getTitle(doc);
  const status = isIdentityDocument(doc) ? doc.status : doc.status;

  return (
    <ScreenContainer>
      <TopBar title={title} />
      <View className="items-center py-5">
        <View className="h-[100px] w-[100px] items-center justify-center rounded-[24px] bg-surface">
          <Icon name={iconName as any} size={80} />
        </View>
        <Text className="mt-[10px] text-[20px] font-bold text-primary">{title}</Text>
        <Text className="px-6 text-center text-[13px] text-muted">{getSubtitle(doc)}</Text>
        <View className="mt-2">
          <Pill label={status} variant={getPillVariant(status)} />
        </View>
      </View>

      {isIdentityDocument(doc) ? (
        <Card>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Document Number</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.number}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Document Type</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.label}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Status</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.status}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Match Score</Text>
            <Text className="text-[13px] font-bold text-primary">
              {doc.matchScore ? `${doc.matchScore}%` : '—'}
            </Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Added On</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.addedAt}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Expires On</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.expiresAt ?? '—'}</Text>
          </View>
        </Card>
      ) : (
        <Card>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Document Number</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.number}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Issued By</Text>
            <Text className="max-w-[180px] text-right text-[13px] font-bold text-primary">{doc.issuer}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Issued On</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.issuedAt}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Document Type</Text>
            <Text className="text-[13px] font-bold text-primary">{doc.name}</Text>
          </View>
        </Card>
      )}

      <Spacer />
      <View className="px-5 pb-6 pt-4">
        <Button label="Done" onPress={() => router.back()} />
      </View>
    </ScreenContainer>
  );
}
