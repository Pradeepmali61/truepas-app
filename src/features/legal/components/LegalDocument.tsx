import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';

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
  return (
    <ScreenContainer>
      <TopBar title={title} />
      <View className="px-6 py-4">
        <Text className="mb-3 text-[12px] text-muted">{updated}</Text>
        {sections.map((section) => (
          <View key={section.heading}>
            <Text accessibilityRole="header" className="mb-[6px] mt-4 text-[14px] font-bold text-ink">
              {section.heading}
            </Text>
            <Text className="mb-3 text-[14px] leading-[22px] text-muted">{section.body}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
