import { Text, View } from 'react-native';

import { Icon, IconName } from '@/components/ui/Icon';

type BannerVariant = 'info' | 'warn' | 'danger';

const CONTAINER: Record<BannerVariant, string> = {
  info: 'bg-surface',
  warn: 'bg-[#fff9e6]',
  danger: 'bg-[#fef2f2]',
};

const TEXT: Record<BannerVariant, string> = {
  info: 'text-primary',
  warn: 'text-[#b45309]',
  danger: 'text-primary',
};

const ICON_COLOR: Record<BannerVariant, string> = {
  info: '#2727d6',
  warn: '#b45309',
  danger: '#2727d6',
};

interface InfoBannerProps {
  children: string;
  variant?: BannerVariant;
  leading?: IconName;
}

/** Info banner matching `.info-banner` (radius 12). */
export function InfoBanner({ children, variant = 'info', leading }: InfoBannerProps) {
  return (
    <View
      accessibilityRole="alert"
      className={`mx-6 my-[10px] flex-row items-start gap-2 rounded-btn px-[14px] py-3 ${CONTAINER[variant]}`}>
      {leading ? <Icon name={leading} size={16} color={ICON_COLOR[variant]} /> : null}
      <Text className={`flex-1 text-[12px] leading-[18px] ${TEXT[variant]}`}>{children}</Text>
    </View>
  );
}
