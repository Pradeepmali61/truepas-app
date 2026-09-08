import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { fontScale, scale } from '@/utils/responsive';

interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
  gradient?: boolean;
  /** Remove the built-in mx-6 — use when the parent already provides horizontal padding. */
  noMargin?: boolean;
}

/** Floating-label input matching the mockup `.floating-input` (56px, radius 8). */
export const FloatingInput = forwardRef<TextInput, FloatingInputProps>(
  ({ label, error, rightSlot, gradient, noMargin, onFocus, onBlur, value, ...inputProps }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderColor = error ? Colors.warning : focused ? Colors.primary : Colors.borderInput;
    const labelColor = error ? Colors.warning : focused ? Colors.primary : Colors.textFaint;

    const hasValue = value !== undefined && value !== '';

    const inputBody = (
      <>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={Colors.textFaint}
          className="flex-1 font-medium text-ink"
          style={{ fontSize: fontScale(16), fontWeight: '500' }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {rightSlot}
      </>
    );

    return (
      <View className={noMargin ? 'mb-6' : 'mx-6 mb-6'}>
        {gradient ? (
          <>
            <View className="mb-1">
              <Text allowFontScaling={false} style={{ fontSize: fontScale(11), color: labelColor }}>
                {label}
              </Text>
            </View>
            <View
              className="flex-row items-center rounded-[8px] border bg-transparent px-4"
              style={{ borderColor, height: scale(56, 52) }}>
              <LinearGradient
                colors={['#ffffff', '#f0f6ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
              />
              {inputBody}
            </View>
          </>
        ) : (
          <View style={{ marginBottom: 6 }}>
            <Text allowFontScaling={false} style={{ fontSize: fontScale(12), marginBottom: 6, color: labelColor, fontWeight: '500' }}>
              {label}
            </Text>
            <View
              className="flex-row items-center rounded-[12px] border bg-white px-4"
              style={{ borderColor, height: scale(56, 52) }}>
              {inputBody}
            </View>
          </View>
        )}
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            className="mt-1 px-1"
            style={{ fontSize: fontScale(11), color: Colors.warning }}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';
