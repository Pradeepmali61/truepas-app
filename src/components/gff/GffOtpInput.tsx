import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GfColors, GfRadius, GfTypography } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

const OTP_LENGTH = 6;

interface GffOtpInputProps {
  value: string;
  onChange: (code: string) => void;
  error?: boolean;
}

/** 6-box OTP input — empty (gray fill) / focused (white + indigo border) /
 *  filled (indigo bg, white digit) / error (red border). A single hidden
 *  TextInput drives all boxes. */
export function GffOtpInput({ value, onChange, error = false }: GffOtpInputProps) {
  const [focused, setFocused] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (focused && value.length < OTP_LENGTH) {
      intervalRef.current = setInterval(() => setCursorVisible((v) => !v), 500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [focused, value.length]);

  // Cursor only shows while there is room to type — derived, no effect needed.
  const showCursor = focused && value.length < OTP_LENGTH && cursorVisible;

  return (
    <View
      accessible
      accessibilityLabel={`One time password, ${value.length} of ${OTP_LENGTH} digits entered`}
      style={styles.row}>
      {Array.from({ length: OTP_LENGTH }, (_, i) => {
        const digit = value[i] ?? '';
        const isActive = i === value.length;
        return (
          <View
            key={i}
            style={[
              styles.box,
              digit ? styles.boxFilled : isActive && focused ? styles.boxActive : null,
              error && styles.boxError,
            ]}>
            {digit ? (
              <Text allowFontScaling={false} style={styles.digitText}>
                {digit}
              </Text>
            ) : isActive && showCursor ? (
              <View style={styles.cursor} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        accessibilityLabel="One time password input"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={OTP_LENGTH}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
      />
    </View>
  );
}

/** Resend control — countdown text while cooling down, "Resend OTP" pill when
 *  available. */
export function GffResendControl({
  seconds,
  onResend,
  resending = false,
}: {
  seconds: number;
  onResend: () => void;
  resending?: boolean;
}) {
  if (seconds > 0) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return (
      <Text allowFontScaling={false} style={styles.countdown}>
        Resend OTP in <Text style={styles.countdownTime}>{mm}:{ss}</Text>
      </Text>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Resend OTP"
      onPress={onResend}
      disabled={resending}
      style={styles.resendPill}>
      <Text allowFontScaling={false} style={styles.resendLabel}>
        {resending ? 'Sending…' : 'Resend OTP'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(10, 8),
  },
  box: {
    width: scale(44, 40),
    height: scale(56, 52),
    borderRadius: GfRadius.otp,
    backgroundColor: GfColors.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: GfColors.primaryDeep,
  },
  boxFilled: {
    backgroundColor: GfColors.primaryDeep,
  },
  boxError: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: GfColors.danger,
  },
  digitText: {
    fontSize: fontScale(GfTypography.otpDigit.size),
    fontWeight: GfTypography.otpDigit.weight,
    color: GfColors.textOnPrimary,
  },
  cursor: {
    width: 2,
    height: scale(26, 22),
    borderRadius: 1,
    backgroundColor: GfColors.primaryDeep,
  },
  countdown: {
    fontSize: fontScale(16),
    fontWeight: '400',
    color: GfColors.textSecondary,
    textAlign: 'center',
  },
  countdownTime: {
    color: GfColors.primary,
    fontWeight: '500',
  },
  resendPill: {
    backgroundColor: GfColors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: scale(20),
    paddingVertical: scale(10, 8),
    alignSelf: 'center',
  },
  resendLabel: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: GfColors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
});
