import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/ui/Icon';
import { Gradients } from '@/constants/theme';

interface Slide {
  icon: IconName;
  title: string;
  desc: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'idCard',
    title: 'Your Face is\nYour Identity.',
    desc: 'Enroll once with your face and government ID — securely verified, always trusted.',
    cta: 'Next',
  },
  {
    icon: 'lock',
    title: 'Verified Once,\nTrusted Everywhere.',
    desc: 'Your face and document are matched and stored securely — no repeat KYC.',
    cta: 'Next',
  },
  {
    icon: 'family',
    title: 'Protect Your\nWhole Family.',
    desc: 'Add and verify identities for dependents — all managed from one account.',
    cta: 'Get Started',
  },
];

/** Welcome carousel — pixel-match of the mockup welcome slides 1–3. */
export default function WelcomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const advance = () => {
    if (isLast) {
      router.push('/(auth)/login');
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="absolute right-5 top-14 z-30">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          onPress={() => router.push('/(auth)/login')}>
          <Text className="text-[15px] font-bold underline" style={{ color: 'rgba(39,39,214,0.75)' }}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center bg-white">
        <Icon name={slide.icon} size={80} />
      </View>

      <LinearGradient
        colors={Gradients.welcome}
        locations={[0, 0.36, 1]}
        className="z-10 -mt-8"
        style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24 }}>
        <Text
          accessibilityRole="header"
          className="mb-3 text-center text-[38px] font-medium leading-[50px] text-white">
          {slide.title}
        </Text>
        <Text className="mb-5 text-center text-[18px] leading-[23px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          {slide.desc}
        </Text>
        <View className="mb-5 flex-row items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className="h-1 rounded-full"
              style={{
                width: i === index ? 32 : 22,
                backgroundColor: i === index ? '#ffffff' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={slide.cta}
          onPress={advance}
          className="h-[58px] w-full items-center justify-center rounded-btn bg-white shadow-lg active:opacity-90">
          <Text allowFontScaling={false} className="text-[17px] font-extrabold tracking-[0.2px] text-primary">
            {slide.cta}
          </Text>
        </Pressable>
      </LinearGradient>
      <View className="h-5 bg-primary-dark" />
    </SafeAreaView>
  );
}
