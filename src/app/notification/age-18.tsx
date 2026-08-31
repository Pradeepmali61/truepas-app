import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Icon } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';

/** Age-18 transition notification — dependent is eligible for own Truepas account. */
export default function Age18NotificationScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Notification" />
      <View className="flex-1 px-6">
        {/* Hero card */}
        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 20 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#e6f8ff',
            alignItems: 'center', justifyContent: 'center',
            ...Elevation.small,
          }}>
            <Icon name="cake" size={40} color="#08B6FC" />
          </View>
        </View>

        {/* Main message card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          paddingHorizontal: 22,
          paddingVertical: 24,
          ...Elevation.medium,
        }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.ink, textAlign: 'center' }}>
            You're eligible for a new Truepas account
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '400', color: Colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 21 }}>
            Max Kim has turned 18 and can now create an independent Truepas account to manage their own identity verification.
          </Text>

          {/* Info row */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#F0FDF4', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
            marginTop: 18,
          }}>
            <Icon name="check" size={16} color="#059669" />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#059669', flex: 1 }}>
              Eligible to create own account
            </Text>
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#FEF3C7', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
            marginTop: 8,
          }}>
            <Icon name="info" size={16} color="#D97706" />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#D97706', flex: 1 }}>
              Data retained for 30 days after removal
            </Text>
          </View>
        </View>

        <Spacer />

        {/* Redesigned buttons */}
        <View style={{ paddingBottom: 24, paddingTop: 8 }}>
          {/* Primary button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create their own account"
            onPress={() => router.dismissTo('/(tabs)/family')}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: '#08B6FC', borderRadius: 16, paddingVertical: 16,
              ...Elevation.medium,
            }}>
            <Icon name="plus" size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Create their account</Text>
          </Pressable>

          {/* Secondary outline button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remind later"
            onPress={() => router.back()}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: 'transparent', borderRadius: 16, paddingVertical: 16,
              borderWidth: 1.5, borderColor: '#cef0fe',
              marginTop: 10,
            }}>
            <Icon name="clock" size={18} color="#08B6FC" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#08B6FC' }}>Remind me later</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
