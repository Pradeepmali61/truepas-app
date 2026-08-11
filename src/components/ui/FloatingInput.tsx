import { forwardRef, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
}

/** Floating-label input matching the mockup `.floating-input` (56px, radius 8). */
export const FloatingInput = forwardRef<TextInput, FloatingInputProps>(
  ({ label, error, rightSlot, onFocus, onBlur, ...inputProps }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderColor = error ? Colors.warning : focused ? Colors.primary : Colors.borderInput;
    const labelColor = error ? Colors.warning : focused ? Colors.primary : Colors.textFaint;

    return (
      <View className="mx-6 mb-6">
        <View
          className="h-[56px] flex-row items-center rounded-[8px] border bg-white px-4"
          style={{ borderColor }}>
          <View className="absolute -top-[10px] left-[12px] bg-white px-1">
            <Text allowFontScaling={false} className="text-[11px]" style={{ color: labelColor }}>
              {label}
            </Text>
          </View>
          <TextInput
            ref={ref}
            accessibilityLabel={label}
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
        </View>
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
