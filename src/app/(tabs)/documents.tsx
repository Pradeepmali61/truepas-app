import { useRouter } from 'expo-router';
import { CreditCard, FileText } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, ErrorState, ScreenHeader } from '@/components/composite';
import { Badge, CoreButton, Skeleton, Typography, type BadgeVariant } from '@/components/ui';
import { useDocuments } from '@/features/documents/hooks';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { DocumentType, IdentityDocument } from '@/types/domain';

const DOC_ICON: Record<DocumentType, { kind: 'file' | 'card'; tone: 'primary' | 'neutral' }> = {
  passport:         { kind: 'file', tone: 'primary' },
  drivingLicense:   { kind: 'card', tone: 'neutral' },
  idCard:           { kind: 'card', tone: 'neutral' },
  greenCard:        { kind: 'card', tone: 'neutral' },
  birthCertificate: { kind: 'file', tone: 'neutral' },
  usVisa:           { kind: 'file', tone: 'neutral' },
};

const STATUS_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending:  { variant: 'warning', label: 'Pending' },
  failed:   { variant: 'error',   label: 'Failed' },
  missing:  { variant: 'neutral', label: 'Missing' },
};

type RowIconTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

/** Small square icon chip used on list rows (ported from ui-native showcase). */
function RowIcon({ icon, tone = 'neutral' }: { icon: ReactNode; tone?: RowIconTone }) {
  const theme = useThemeTokens();
  const bg = {
    neutral: theme.colors.actionSecondary,
    primary: theme.colors.actionPrimarySubtle,
    success: theme.colors.successSubtle,
    warning: theme.colors.warningSubtle,
    error: theme.colors.errorSubtle,
    info: theme.colors.infoSubtle,
  }[tone];
  return (
    <View style={{ width: 40, height: 40, borderRadius: theme.radii.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      {icon}
    </View>
  );
}

const DocCard = memo(function DocCard({ doc, onPress }: { doc: IdentityDocument; onPress: () => void }) {
  const theme = useThemeTokens();
  const meta = DOC_ICON[doc.type] ?? { kind: 'file' as const, tone: 'neutral' as const };
  const status = STATUS_BADGE[doc.status] ?? { variant: 'neutral' as const, label: doc.status };
  const IconComp = meta.kind === 'card' ? CreditCard : FileText;
  const iconColor = meta.tone === 'primary' ? theme.colors.actionPrimary : theme.colors.textSecondary;
  // Numbers arrive masked from the BFF — render verbatim, never unmask.
  const expiry = doc.expiresAt ? doc.expiresAt.split('T')[0] : null;
  const subtitle = expiry ? `${doc.number} · exp ${expiry}` : doc.number;
  return (
    <Card onPress={onPress} style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <RowIcon tone={meta.tone} icon={<IconComp size={iconSize.md} color={iconColor} />} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Typography variant="body" numberOfLines={1}>{doc.label}</Typography>
          <Typography variant="body-sm" color="muted" numberOfLines={1} style={{ fontFamily: theme.fontFamily.mono.regular }}>
            {subtitle}
          </Typography>
        </View>
        <Badge variant={status.variant}>{status.label}</Badge>
      </View>
    </Card>
  );
});

function DocSkeleton() {
  const theme = useThemeTokens();
  return (
    <Card style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <Skeleton width={40} height={40} radius={theme.radii.lg} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton variant="text" width={140} height={16} />
          <Skeleton variant="text" width={200} height={12} />
        </View>
        <Skeleton width={64} height={24} radius={theme.radii.full} />
      </View>
    </Card>
  );
}

export default function DocumentsScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: documents, isPending, isError, isRefetching, refetch } = useDocuments();

  const isEmpty = !isPending && !isError && (documents?.length ?? 0) === 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title="Documents"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
      />
      <View style={{ flex: 1 }}>
        {isPending ? (
          <View style={{ padding: theme.spacing[4] }}>
            {[1, 2, 3].map((i) => <DocSkeleton key={i} />)}
          </View>
        ) : isError ? (
          <ErrorState
            title="Couldn't load documents"
            description="Please check your connection and try again."
            onRetry={refetch}
          />
        ) : isEmpty ? (
          <EmptyState
            title="No documents yet"
            description="Your issued documents will appear here once verified."
          />
        ) : (
          <FlatList
            data={documents ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: theme.spacing[4] }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DocCard doc={item} onPress={() => router.push(`/document/${item.id}` as never)} />
            )}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.actionPrimary} />
            }
          />
        )}
      </View>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          // Tab bar is absolute-positioned (64 + bottom inset) — lift the
          // footer above it.
          marginBottom: 64 + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
          gap: theme.spacing[2],
        }}>
        <CoreButton
          fullWidth
          variant="outline"
          accessibilityLabel="Add document"
          onPress={() => router.push('/document/select-type' as never)}>
          Add document
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
