import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

interface OtpRowProps {
  length: number;
  value: string;
}

/** OTP boxes matching `.otp-box` (44×52, radius 8, filled = primary border + surface bg).
 *  Shows a blinking cursor in the active (next-to-fill) box so the user
 *  knows the field is focused and ready for input. */
export function OtpRow({ length, value }: OtpRowProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Blink the cursor every 500ms while typing is in progress
    if (value.length < length) {
      intervalRef.current = setInterval(() => {
        setCursorVisible((v) => !v);
      }, 500);
    } else {
      setCursorVisible(false);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [value.length, length]);

  return (
    <View
      accessibilityLabel={`One time password, ${value.length} of ${length} digits entered`}
      className="my-4 flex-row justify-center gap-2">
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? '';
        const isActive = i === value.length;
        return (
          <View
            key={i}
            className={`h-[52px] w-[44px] items-center justify-center rounded-[8px] border-[1.5px] ${
              digit
                ? 'border-primary bg-surface'
                : isActive
                  ? 'border-primary bg-white'
                  : 'border-[#e0e0e0] bg-white'
            }`}>
            {digit ? (
              <Text allowFontScaling={false} className="text-[20px] font-bold text-ink">
                {digit}
              </Text>
            ) : isActive && cursorVisible ? (
              <View style={{ width: 2, height: 24, backgroundColor: '#2563eb' }} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
