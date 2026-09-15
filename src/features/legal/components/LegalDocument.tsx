import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/composite';
import { Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';

export interface LegalSection {
  heading: string;
  body: string;
}

interface LegalDocumentProps {
  title: string;
  updated: string;
  sections: LegalSection[];
}

/** Shared legal document renderer — plain text only, no HTML rendering (OWASP A03/XSS-safe). */
export function LegalDocument({ title, updated, sections }: LegalDocumentProps) {
  const theme = useThemeTokens();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={title} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}>
        <Typography variant="caption" color="muted">
          {updated}
        </Typography>
        {sections.map((section) => (
          <View key={section.heading} style={{ marginTop: theme.spacing[4], gap: theme.spacing[1] }}>
            <Typography variant="h4">{section.heading}</Typography>
            <Typography variant="body-sm" color="secondary">
              {section.body}
            </Typography>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
