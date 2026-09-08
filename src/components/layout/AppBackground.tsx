import { Image, StyleProp, View, ViewStyle } from 'react-native';

interface AppBackgroundProps {
  /** Opacity of the decorative watermark (default 0.12, same as tabs). */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

/** Decorative app background — the light "small objects" pattern image shown
 *  on the Home/Documents/Family/History tabs. Reuse on any screen so the
 *  whole app shares the same branded backdrop. Positions itself absolutely
 *  with pointerEvents off; render it before the screen content. */
export function AppBackground({ opacity = 0.12, style }: AppBackgroundProps) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Image
        source={require('../../../assets/images/background2.png')}
        style={{ width: '100%', height: '100%', opacity }}
        resizeMode="cover"
      />
    </View>
  );
}
