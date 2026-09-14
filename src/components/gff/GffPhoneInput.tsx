import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { GfColors, GfLayout, GfRadius } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

interface GffPhoneInputProps {
  countryCode: string;
  flag: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  focused?: boolean;
  error?: boolean;
  placeholder?: string;
}

/** Country-code selector + phone number field — two bordered boxes in a row.
 *  States: empty (placeholder) / focused (darker border) / filled / error. */
export function GffPhoneInput({
  countryCode,
  flag,
  value,
  onChangeText,
  onFocus,
  onBlur,
  focused = false,
  error = false,
  placeholder = 'Enter mobile number',
}: GffPhoneInputProps) {
  const borderColor = error ? GfColors.danger : focused ? '#C7C9D1' : GfColors.border;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select country code"
        style={[styles.countryBox, { borderColor }]}>
        <Text allowFontScaling={false} style={styles.flag}>
          {flag}
        </Text>
        <Text allowFontScaling={false} style={styles.code}>
          {countryCode}
        </Text>
        <Icon name="chevronDown" size={scale(16, 14)} color={GfColors.textSecondary} />
      </Pressable>
      <View style={[styles.inputBox, { borderColor }]}>
        <Icon name="phone" size={scale(20, 18)} color={GfColors.textSecondary} />
        <TextInput
          accessibilityLabel="Mobile number"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          placeholder={placeholder}
          placeholderTextColor={GfColors.placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  countryBox: {
    width: scale(GfLayout.countryCodeWidth, 88),
    height: scale(56, 52),
    borderRadius: GfRadius.input,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  flag: {
    fontSize: fontScale(22),
  },
  code: {
    fontSize: fontScale(15),
    fontWeight: '500',
    color: GfColors.textPrimary,
  },
  inputBox: {
    flex: 1,
    height: scale(56, 52),
    borderRadius: GfRadius.input,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: fontScale(17),
    fontWeight: '600',
    color: GfColors.textPrimary,
    padding: 0,
  },
});
