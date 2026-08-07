import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, IconName, OtpRow, ProgressTrack } from '@/components/ui';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';

interface OtpVerificationProps {
  title: string;
  heading: string;
  sentTo: string;
  icon: IconName;
  progress: number;
  onVerified: () => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/** Shared OTP verification screen — matches the phone/email OTP mockups. */
export function OtpVerification({
  title,
  heading,
  sentTo,
  icon,
  progress,
  onVerified,
}: OtpVerificationProps) {
  const [code, setCode] = useState('');
  const { seconds, reset } = useCountdown(RESEND_SECONDS);

  const handleChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  return (
    <ScreenContainer scroll={false}>
      <TopBar title={title} />
      <ProgressTrack percent={progress} />
      <View className="flex-1 items-center justify-center p-5">
        <Icon name={icon} size={40} />
        <Text accessibilityRole="header" className="mb-[6px] mt-4 text-[18px] font-bold text-primary">
          {heading}
        </Text>
        <Text className="mb-[6px] text-[14px] text-muted">{sentTo}</Text>
        <Pressable accessibilityLabel="Enter one time password" className="w-full items-center">
          <OtpRow length={OTP_LENGTH} value={code} />
          <TextInput
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoFocus
            maxLength={OTP_LENGTH}
            className="absolute h-full w-full opacity-0"
            accessibilityLabel="One time password input"
          />
        </Pressable>
        {seconds > 0 ? (
          <Text className="text-[14px] font-medium text-primary underline">
            Resend code in {formatCountdown(seconds)}
          </Text>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Resend code" onPress={reset}>
            <Text className="text-[14px] font-medium text-primary underline">Resend code</Text>
          </Pressable>
        )}
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Verify" onPress={onVerified} disabled={code.length !== OTP_LENGTH} />
      </View>
    </ScreenContainer>
  );
}
