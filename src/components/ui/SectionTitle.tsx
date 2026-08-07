import { Text } from 'react-native';

/** Uppercase section title matching `.section-title`. */
export function SectionTitle({ children, centered }: { children: string; centered?: boolean }) {
  return (
    <Text
      accessibilityRole="header"
      className={`mx-5 mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted ${
        centered ? 'text-center' : ''
      }`}>
      {children}
    </Text>
  );
}
