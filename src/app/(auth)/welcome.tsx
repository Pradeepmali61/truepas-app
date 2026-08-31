import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageSourcePropType,
    ListRenderItemInfo,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Gradients } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.42;
const IMAGE_OVERLAP = 74;

type Slide = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
};

const SLIDES: Slide[] = [
  {
    id: 'identity',
    title: 'Your Face is\nYour Identity.',
    description:
      'Enroll once with your face and government ID — securely verified, always trusted.',
    image: require('@/assets/onboarding/1.png'),
  },
  {
    id: 'verified',
    title: 'Verified Once,\nTrusted Everywhere.',
    description:
      'Your face and document are matched and stored securely — no repeat KYC.',
    image: require('@/assets/onboarding/2.png'),
  },
  {
    id: 'family',
    title: 'Protect Your\nWhole Family.',
    description:
      'Add and verify identities for dependents — all managed from one account.',
    image: require('@/assets/onboarding/3.png'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const handleFinish = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  const handleNext = useCallback(() => {
    if (activeIndex === SLIDES.length - 1) {
      handleFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }, [activeIndex, handleFinish]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Slide>) => (
      <View style={styles.slide}>
        <View
          style={[
            styles.imageArea,
            { height: SCREEN_HEIGHT - CARD_HEIGHT + IMAGE_OVERLAP },
          ]}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        </View>

        <LinearGradient
          colors={Gradients.welcome}
          locations={[0, 0.36, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bottomCard, { marginTop: -IMAGE_OVERLAP }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.dotsRow}>
            {SLIDES.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.88}
            style={styles.ctaButton}
            accessibilityRole="button"
            accessibilityLabel={
              activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'
            }>
            <Text style={styles.ctaText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    ),
    [activeIndex, handleNext],
  );

  return (
    <LinearGradient
      colors={['#e6f8ff', '#cef0fe']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.skipWrapper, { top: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={0.7}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction">
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.flatList}
      />

      <View
        style={[
          styles.bottomBar,
          { height: insets.bottom > 0 ? insets.bottom : 20 },
        ]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipWrapper: { position: 'absolute', right: 20, zIndex: 30 },
  skipText: {
    color: 'rgba(8, 182, 252, 0.85)',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  flatList: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageArea: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  image: { width: '100%', height: '100%' },
  bottomCard: {
    height: CARD_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 50,
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    textAlign: 'center',
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: { height: 4, borderRadius: 99 },
  dotActive: { width: 32, backgroundColor: '#FFFFFF' },
  dotInactive: { width: 22, backgroundColor: 'rgba(255, 255, 255, 0.35)' },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ctaText: {
    color: '#08B6FC',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomBar: { backgroundColor: Colors.primaryDark },
});
