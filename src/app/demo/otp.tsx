import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GffButton, GffOtpInput, GffResendControl } from '@/components/gff';
import { GfColors } from '@/constants/gffTheme';
import { useCountdown } from '@/hooks/useCountdown';
import { fontScale, scale } from '@/utils/responsive';

const RESEND_SECONDS = 30;

/** GFF reference screen — OTP verification.
 *  Covers both screenshot states: empty/focused boxes (disabled Verify) and
 *  filled boxes (indigo) with the "Resend OTP" pill + enabled Verify. */
export default function DemoOtpScreen() {
  const [code, setCode] = useState('');
  const { seconds, reset } = useCountdown(RESEND_SECONDS);
  const complete = code.length === 6;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
              <Text allowFontScaling={false} style={styles.back}>←</Text>
            </Pressable>
            <Text allowFontScaling={false} style={styles.helpText}>
              Need Help?
            </Text>
          </View>

          <Text allowFontScaling={false} style={styles.title}>
            Let’s Verify
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Enter the 6-digit code we texted you on{'\n'}
            <Text style={styles.phone}>8454014032</Text>
          </Text>

          <View style={styles.otpArea}>
            <GffOtpInput value={code} onChange={setCode} />
            <View style={{ marginTop: scale(24) }}>
              <GffResendControl seconds={seconds} onResend={reset} />
            </View>
          </View>

          <View style={styles.footer}>
            <GffButton label="Verify OTP" disabled={!complete} onPress={() => {}} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingBottom: scale(24),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(8),
  },
  back: {
    fontSize: fontScale(26),
    color: GfColors.textPrimary,
    paddingHorizontal: scale(8),
  },
  helpText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: GfColors.textPrimary,
    backgroundColor: '#F2F3F7',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: scale(16),
    paddingVertical: scale(11, 9),
  },
  title: {
    marginTop: scale(24),
    fontSize: fontScale(32),
    fontWeight: '800',
    color: GfColors.textPrimary,
    textAlign: 'center',
    lineHeight: fontScale(40),
  },
  subtitle: {
    marginTop: scale(14),
    fontSize: fontScale(15),
    color: GfColors.textSecondary,
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
  phone: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: GfColors.textPrimary,
  },
  otpArea: {
    marginTop: scale(32),
  },
  footer: {
    marginTop: 'auto',
    paddingTop: scale(24),
  },
});
