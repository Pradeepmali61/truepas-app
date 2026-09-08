import { Text, TextProps } from 'react-native';

import { Typography } from '@/constants/theme';
import { fontScale } from '@/utils/responsive';

type Variant = keyof typeof Typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  /** Cap for OS font-size scaling (accessibility "Large text" setting).
   *  Default 1.15 — keeps layouts stable while still respecting accessibility
   *  better than a hard 1.0 cap (ref: facepe-user-frontend AppText.tsx).
   *  Pass 0 to disable capping entirely. */
  maxFontSizeMultiplier?: number;
}

const WEIGHT_MAP: Record<string, '400' | '500' | '600' | '700'> = {
  '400': '400',
  '500': '500',
  '600': '600',
  '700': '700',
};

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  maxFontSizeMultiplier = 1.15,
  ...rest
}: AppTextProps) {
  const config = Typography[variant];
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        { fontSize: fontScale(config.size), fontWeight: WEIGHT_MAP[config.weight] ?? '400' },
        color ? { color } : null,
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}
