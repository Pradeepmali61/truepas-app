import { Text, View } from 'react-native';

interface OtpRowProps {
  length: number;
  value: string;
}

/** OTP boxes matching `.otp-box` (44×52, radius 8, filled = primary border + surface bg). */
export function OtpRow({ length, value }: OtpRowProps) {
  return (
    <View
      accessibilityLabel={`One time password, ${value.length} of ${length} digits entered`}
      className="my-4 flex-row justify-center gap-2">
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? '';
        return (
          <View
            key={i}
            className={`h-[52px] w-[44px] items-center justify-center rounded-[8px] border-[1.5px] ${
              digit ? 'border-primary bg-surface' : 'border-[#e0e0e0] bg-white'
            }`}>
            <Text allowFontScaling={false} className="text-[20px] font-bold text-ink">
              {digit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
