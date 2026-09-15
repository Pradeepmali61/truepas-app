/** @jsxImportSource react */
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
    Pressable,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/components/ui';
import { makeStyles, useThemeTokens } from '@/theme';

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
    image: require('@/assets/onboarding/1_1.png'),
  },
  {
    id: 'verified',
    title: 'Verified Once,\nTrusted Everywhere.',
    description:
      'Your face and document are matched and stored securely — no repeat KYC.',
    image: require('@/assets/onboarding/2_1.png'),
  },
  {
    id: 'family',
    title: 'Protect Your\nWhole Family.',
    description:
      'Add and verify identities for dependents — all managed from one account.',
    image: require('@/assets/onboarding/3_1.png'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const styles = useStyles();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const insets = useSafeAreaInsets();

  // Brand gradient — accent → primary → pressed (was Gradients.welcome)
  const cardGradient = [theme.colors.accent, theme.colors.actionPrimary, theme.colors.actionPrimaryPressed] as const;

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
          colors={cardGradient}
          locations={[0, 0.36, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bottomCard, { marginTop: -IMAGE_OVERLAP }]}>
          <Typography style={styles.title}>{item.title}</Typography>
          <Typography style={styles.description}>{item.description}</Typography>

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

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={
              activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'
            }>
            <Typography style={styles.ctaText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Typography>
          </Pressable>
        </LinearGradient>
      </View>
    ),
    [activeIndex, handleNext, cardGradient, styles],
  );

  return (
    <LinearGradient
      colors={[theme.colors.infoSubtle, theme.colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.skipWrapper, { top: insets.top + 8 }]}>
        <Pressable
          onPress={handleFinish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Typography style={styles.skipText}>Skip</Typography>
        </Pressable>
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

const useStyles = makeStyles((t) => ({
  container: { flex: 1 },
  skipWrapper: { position: 'absolute', right: t.spacing[5], zIndex: 30 },
  skipText: {
    color: t.colors.actionPrimary,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.bold,
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
    borderTopLeftRadius: t.radii['2xl'] + 8,
    borderTopRightRadius: t.radii['2xl'] + 8,
    paddingHorizontal: t.spacing[6],
    paddingTop: t.spacing[8],
    paddingBottom: t.spacing[6],
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: t.fontWeight.medium,
    textAlign: 'center',
    lineHeight: 50,
    marginBottom: t.spacing[3],
  },
  description: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: t.fontSize.lg,
    lineHeight: 23,
    textAlign: 'center',
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing[2],
    marginBottom: t.spacing[5],
  },
  dot: { height: 4, borderRadius: t.radii.full },
  dotActive: { width: 32, backgroundColor: '#FFFFFF' },
  dotInactive: { width: 22, backgroundColor: 'rgba(255, 255, 255, 0.35)' },
  ctaButton: {
    width: '100%',
    height: t.sizes.heightLg,
    borderRadius: t.radii.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...t.shadows.lg,
  },
  ctaText: {
    color: t.colors.actionPrimary,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.bold,
    letterSpacing: t.letterSpacing.wide,
  },
  bottomBar: { backgroundColor: t.colors.actionPrimaryPressed },
}));
