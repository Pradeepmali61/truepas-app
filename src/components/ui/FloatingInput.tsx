import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
  gradient?: boolean;
}

/** Floating-label input matching the mockup `.floating-input` (56px, radius 8). */
export const FloatingInput = forwardRef<TextInput, FloatingInputProps>(
  ({ label, error, rightSlot, gradient, onFocus, onBlur, ...inputProps }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderColor = error ? Colors.warning : focused ? Colors.primary : Colors.borderInput;
    const labelColor = error ? Colors.warning : focused ? Colors.primary : Colors.textFaint;

    const labelText = label;

    const labelNode = (
      <Text allowFontScaling={false} className="text-[11px]" style={{ color: labelColor }}>
        {labelText}
      </Text>
    );

    const inputBody = (
      <>
        <TextInput
          ref={ref}
          accessibilityLabel={labelText}
          placeholderTextColor={Colors.textFaint}
          className="flex-1 text-[16px] font-medium text-ink"
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
      <View className="mx-6 mb-6">
        {gradient ? (
          <>
            <View className="mb-1">
              {labelNode}
            </View>
            <View
              className="h-[56px] flex-row items-center rounded-[8px] border bg-transparent px-4"
              style={{ borderColor }}>
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
          <View
            className="h-[56px] flex-row items-center rounded-[8px] border bg-white px-4"
            style={{ borderColor }}>
            <View className="absolute -top-[10px] left-[12px] bg-white px-1">
              {labelNode}
            </View>
            {inputBody}
          </View>
        )}
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            className="mt-1 px-1 text-[11px]"
            style={{ color: Colors.warning }}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';
