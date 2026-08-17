import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon, Pill } from '@/components/ui';
import { faceEnrollmentCompleted } from '@/features/auth/slice';
import { useAppDispatch } from '@/store';

/** Face enrolled success — leads straight to document verification (no skip, PRD v2.0). */
export default function FaceEnrolledScreen() {
  const dispatch = useAppDispatch();

  return (
    <ScreenContainer scroll={false}>
      <LinearGradient
        colors={['#ffffff', '#93c5fd']}
        style={StyleSheet.absoluteFill}
      />
      <TopBar title="" />
      <View className="flex-1 items-center justify-center p-5">
        <View className="h-[90px] w-[90px] items-center justify-center rounded-full bg-surface">
          <Icon name="checkCircle" size={40} />
        </View>
        <Text accessibilityRole="header" className="mb-1 mt-5 text-[20px] font-bold text-primary">
          Face Enrolled!
        </Text>
        <Text className="mb-[10px] text-[14px] text-muted">
          Now let&apos;s verify your identity document
        </Text>
        <Pill label="Step 1 of 2 Complete" variant="active" />
      </View>
      <Spacer />
      <View className="px-6 pb-6">
        <Button
          label="Continue to Document Verification"
          onPress={() => dispatch(faceEnrollmentCompleted())}
        />
      </View>
    </ScreenContainer>
  );
}
