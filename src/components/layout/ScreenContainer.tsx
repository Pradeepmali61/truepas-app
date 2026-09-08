import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from './AppBackground';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  /** Show the decorative app background watermark (default true).
   *  Set false when the screen renders its own backdrop and wants to place
   *  <AppBackground /> manually (e.g. above a gradient). */
  background?: boolean;
}

/** Safe-area screen wrapper matching `.phone-screen` (white bg, column). */
export function ScreenContainer({ children, scroll = true, className = '', background = true }: ScreenContainerProps) {
  if (!scroll) {
    return (
      <SafeAreaView className={`flex-1 bg-white ${className}`} edges={['top', 'bottom']}>
        {background && <AppBackground />}
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {background && <AppBackground />}
      <ScrollView
        className={`flex-1 ${className}`}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Flexible spacer pushing following content to the bottom. */
export function Spacer() {
  return <View className="flex-1" />;
}
