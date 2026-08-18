import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button, Icon } from '@/components/ui';
import { Elevation } from '@/constants/theme';

/** Document verified success — shows outcome, returns to Identity dashboard. */
export default function DocumentVerifiedScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #F8FBFF, #EAF4FF)' } as any]} />
      ) : (
        <LinearGradient
          colors={['#F8FBFF', '#EAF4FF']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScreenHeader title="Verified" />

      <View className="flex-1 items-center justify-center px-6">
        {/* Success icon */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#ECFDF5',
          alignItems: 'center',
          justifyContent: 'center',
          ...Elevation.small,
        }}>
          <Icon name="checkCircle" size={40} color="#059669" />
        </View>

        <Text
          accessibilityRole="header"
          className="mb-2 mt-5 text-[24px] font-bold text-ink">
          Identity verified
        </Text>

        <Text className="mb-4 text-center text-[15px] text-muted">
          Your document has been verified successfully
        </Text>

        {/* Verification details card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          paddingHorizontal: 24,
          paddingVertical: 4,
          width: '100%',
          marginTop: 16,
          ...Elevation.small,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}>
            <Text style={{ fontSize: 15, fontWeight: '400', color: '#9CA3AF' }}>Verification status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="check" size={14} color="#059669" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#059669' }}>Verified</Text>
            </View>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
          }}>
            <Text style={{ fontSize: 15, fontWeight: '400', color: '#9CA3AF' }}>Match score</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>98%</Text>
          </View>
        </View>
      </View>

      <Spacer />
      <View className="px-6 pb-6">
        <Button label="Go to Identity Dashboard" onPress={() => router.dismissTo('/(tabs)')} />
      </View>
    </ScreenContainer>
  );
}
