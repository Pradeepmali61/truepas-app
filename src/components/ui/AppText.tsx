import { Text, TextProps } from 'react-native';

import { Typography } from '@/constants/theme';

type Variant = keyof typeof Typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

const WEIGHT_MAP: Record<string, '400' | '500' | '600' | '700'> = {
  '400': '400',
  '500': '500',
  '600': '600',
  '700': '700',
};

export function AppText({ variant = 'body', color, style, children, ...rest }: AppTextProps) {
  const config = Typography[variant];
  return (
    <Text
      style={[{ fontSize: config.size, fontWeight: WEIGHT_MAP[config.weight] ?? '400' }, color ? { color } : null, style]}
      {...rest}>
      {children}
    </Text>
  );
}
