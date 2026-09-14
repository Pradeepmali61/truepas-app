import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GffMenuCard, GffSectionHeader, GffTabBar } from '@/components/gff';
import { Icon } from '@/components/ui';
import { GfColors, GfGradients, GfSpacing } from '@/constants/gffTheme';
import { fontScale, scale } from '@/utils/responsive';

const DISCOVER = [
  { icon: 'calendar', label: 'Book a Meeting Table' },
  { icon: 'user', label: 'Speakers' },
  { icon: 'family', label: 'Partners' },
  { icon: 'hotel', label: 'Exhibitors' },
  { icon: 'smartphone', label: 'Live Videos' },
] as const;

const GETTING_AROUND = [
  { icon: 'qr', label: 'Expo Floor Plan' },
  { icon: 'location', label: 'Venue' },
] as const;

/** GFF reference screen — event home (Discover / Getting Around + tab bar). */
export default function DemoHomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient
        colors={[...GfGradients.page]}
        style={StyleSheet.absoluteFill}
      />
      <Header />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GffSectionHeader title="Discover GFF 2026" />
        {DISCOVER.map((item) => (
          <GffMenuCard key={item.label} icon={item.icon} label={item.label} />
        ))}

        <View style={styles.sectionGap} />
        <GffSectionHeader title="Getting Around" />
        {GETTING_AROUND.map((item) => (
          <GffMenuCard key={item.label} icon={item.icon} label={item.label} />
        ))}
      </ScrollView>
      <GffTabBar
        tabs={[
          { id: 'Home', label: 'Home', icon: 'identity' },
          { id: 'Network', icon: 'family', label: 'Network' },
          { id: 'Agenda', icon: 'calendar', label: 'Agenda' },
          { id: 'Message', icon: 'inbox', label: 'Message' },
          { id: 'More', icon: 'more', label: 'More' },
        ]}
        activeId="More"
        onChange={() => {}}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View>
        <Text allowFontScaling={false} style={styles.logoTop}>
          GLOBAL{'\n'}FINTECH{'\n'}FEST
        </Text>
        <Text allowFontScaling={false} style={styles.logoYear}>
          —2026
        </Text>
      </View>
      <View style={styles.headerActions}>
        <Icon name="search" size={scale(24, 22)} color={GfColors.textPrimary} />
        <View>
          <Icon name="bell" size={scale(24, 22)} color={GfColors.textPrimary} />
          <View style={styles.dot} />
        </View>
        <Icon name="user" size={scale(24, 22)} color={GfColors.textPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingTop: scale(12),
    paddingBottom: scale(16),
  },
  logoTop: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: GfColors.textPrimary,
    lineHeight: fontScale(19),
  },
  logoYear: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: GfColors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(20),
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GfColors.danger,
  },
  scroll: {
    paddingHorizontal: scale(24),
    paddingTop: scale(16),
    paddingBottom: scale(24),
  },
  sectionGap: {
    height: GfSpacing.sectionGap,
  },
});
