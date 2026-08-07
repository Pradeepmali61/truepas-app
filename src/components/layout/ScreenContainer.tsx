import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
}

/** Safe-area screen wrapper matching `.phone-screen` (white bg, column). */
export function ScreenContainer({ children, scroll = true, className = '' }: ScreenContainerProps) {
  if (!scroll) {
    return (
      <SafeAreaView className={`flex-1 bg-white ${className}`} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
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
