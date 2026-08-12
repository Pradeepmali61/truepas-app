import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { Icon, IconName } from './Icon';

interface ErrorStateProps {
  icon?: IconName;
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  icon = 'warning',
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View
        className="mb-6 h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.errorBg }}>
        <Icon name={icon} size={40} color={Colors.error} />
      </View>
      <Text accessibilityRole="header" className="mb-2 text-[20px] font-bold text-ink">
        {title}
      </Text>
      <Text className="mb-8 max-w-[280px] text-center text-[14px] leading-[22px] text-muted">
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          className="w-full flex-row items-center justify-center rounded-btn bg-primary p-[14px] active:opacity-80">
          <Text className="text-[16px] font-bold text-white">{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
