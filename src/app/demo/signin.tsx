import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GffAuthSegment, GffButton, GffPhoneInput } from '@/components/gff';
import { GfColors, GfSpacing, GfTypography } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

/** GFF reference screen — Sign in (WhatsApp/Email).
 *  Covers both screenshot states: empty number (disabled CTA) and filled. */
export default function DemoSignInScreen() {
  const [method, setMethod] = useState<'email' | 'whatsapp'>('whatsapp');
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);

  const canSubmit = phone.trim().length >= 10;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.helpRow}>
            <Text allowFontScaling={false} style={styles.helpText}>
              Need Help?
            </Text>
          </View>

          <Text allowFontScaling={false} style={styles.title}>
            Sign in{'\n'}to your account
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Please enter the mobile number linked to your pass
          </Text>

          <View style={styles.form}>
            <GffAuthSegment value={method} onChange={setMethod} />
            <View style={{ marginTop: scale(16) }}>
              <GffPhoneInput
                countryCode="+91"
                flag="🇮🇳"
                value={phone}
                onChangeText={setPhone}
                focused={focused}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            <Text allowFontScaling={false} style={styles.helper}>
              The OTP will be sent to your registered {method === 'whatsapp' ? 'WhatsApp number' : 'email'}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text allowFontScaling={false} style={styles.terms}>
              By continuing you agree to our <Text style={styles.link}>Terms of use</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
            <GffButton label="Get OTP" disabled={!canSubmit} onPress={() => {}} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GfColors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: scale(GfSpacing.screenX),
    paddingBottom: scale(24),
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: scale(8),
    marginBottom: scale(24),
  },
  helpText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: GfColors.textPrimary,
    backgroundColor: '#F2F3F7',
    borderRadius: 999,
    paddingHorizontal: scale(16),
    paddingVertical: scale(11, 9),
  },
  title: {
    fontSize: fontScale(32),
    fontWeight: '800',
    color: GfColors.textPrimary,
    textAlign: 'center',
    lineHeight: fontScale(38),
  },
  subtitle: {
    marginTop: scale(20),
    fontSize: fontScale(15),
    color: GfColors.textSecondary,
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
  form: {
    marginTop: scale(24),
  },
  helper: {
    marginTop: scale(14),
    fontSize: fontScale(14),
    color: GfColors.textSecondary,
    textAlign: 'center',
    lineHeight: fontScale(21),
  },
  footer: {
    marginTop: 'auto',
    paddingTop: scale(24),
  },
  terms: {
    fontSize: fontScale(GfTypography.terms.size),
    color: GfColors.textPrimary,
    textAlign: 'center',
    lineHeight: fontScale(21),
    marginBottom: scale(16),
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
