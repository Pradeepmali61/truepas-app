import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';

/** Update face — success. Enhanced design (ref: Facepe FaceSuccessModal):
 *  spring-in gradient success circle with pulsing checkmark, verified badge,
 *  feature chips, and a gradient Done button — in Truepas theme colors. */
export default function FaceUpdateSuccessScreen() {
  const router = useRouter();

  // Entrance: spring pop for the icon, fade for content
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      delay: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    // Gentle continuous pulse on the checkmark
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scaleAnim, fadeAnim, pulseAnim]);

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-1 items-center justify-center p-5">
        {/* Gradient success circle with pulsing checkmark */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            marginBottom: 24,
          }}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon name="check" size={44} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
          <Text accessibilityRole="header" className="mb-2 text-[22px] font-bold text-ink">
            Face Updated!
          </Text>
          <Text className="mb-5 px-4 text-center text-[14px] leading-[20px] text-muted">
            Your biometric profile is updated and ready for secure authentication.
          </Text>

          {/* Status badge */}
          <View
            className="mb-6 flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceAlt }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success, marginRight: 8 }} />
            <Text className="text-[10px] font-bold" style={{ color: Colors.primaryDark, letterSpacing: 1 }}>
              VERIFIED &amp; SECURE
            </Text>
          </View>

          {/* Feature chips */}
          <View className="w-full flex-row justify-center gap-3">
            <View
              className="flex-row items-center rounded-xl px-3 py-2"
              style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', gap: 8 }}>
              <View
                className="items-center justify-center rounded-lg bg-white"
                style={{ width: 24, height: 24 }}>
                <Icon name="shield" size={14} color={Colors.primary} />
              </View>
              <Text className="text-[11px] font-bold text-ink">Bank-grade Encryption</Text>
            </View>
            <View
              className="flex-row items-center rounded-xl px-3 py-2"
              style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkle" size={14} color={Colors.primary} />
              </View>
              <Text className="text-[11px] font-bold text-ink">Instant Auth Enabled</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Gradient Done button */}
      <View className="px-6 pb-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={() => router.dismissTo('/(tabs)')}
          className="overflow-hidden rounded-2xl active:opacity-85">
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="text-[16px] font-bold tracking-wide text-white">Done</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
