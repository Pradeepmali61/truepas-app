import React from 'react';
import { Image, ImageSourcePropType, Text, View } from 'react-native';
import Svg from 'react-native-svg';

import * as IconPaths from './iconPaths';

const EMOJI_FALLBACKS: Record<string, string> = {
  identity: '🪪',
  documents: '🪪',
  family: '👨‍👩‍👧',
  history: '🕓',
  back: '‹',
  bell: '🔔',
  settings: '⚙️',
  camera: '📷',
  face: '🙂',
  shield: '🛡️',
  lock: '🔒',
  check: '✓',
  checkCircle: '✅',
  cross: '✕',
  warning: '⚠️',
  info: 'ℹ️',
  calendar: '📅',
  cake: '🎂',
  trash: '🗑️',
  clock: '⏰',
  search: '🔍',
  plus: '＋',
  chevron: '›',
  document: '📄',
  passport: '🛂',
  drivingLicense: '🚗',
  idCard: '🪪',
  selfie: '🤳',
  phone: '📱',
  email: '✉️',
  eye: '👁️',
  edit: '✏️',
  logout: '🚪',
  hotel: '🏨',
  invoice: '🧾',
  qr: '▦',
  sparkle: '✨',
  hourglass: '⏳',
  location: '📍',
  otpcode: '🔢',
  inbox: '📥',
};

/**
 * Central icon registry — SVG-based.
 * All SVGs use the `color` prop to control stroke color.
 */

export type IconName =
  | 'identity'
  | 'documents'
  | 'family'
  | 'history'
  | 'back'
  | 'bell'
  | 'settings'
  | 'camera'
  | 'face'
  | 'shield'
  | 'lock'
  | 'check'
  | 'checkCircle'
  | 'cross'
  | 'warning'
  | 'info'
  | 'calendar'
  | 'cake'
  | 'trash'
  | 'clock'
  | 'search'
  | 'plus'
  | 'chevron'
  | 'document'
  | 'passport'
  | 'drivingLicense'
  | 'idCard'
  | 'selfie'
  | 'phone'
  | 'email'
  | 'eye'
  | 'edit'
  | 'logout'
  | 'hotel'
  | 'invoice'
  | 'qr'
  | 'sparkle'
  | 'hourglass'
  | 'location'
  | 'otpcode'
  | 'inbox';

const IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  drivingLicense: require('../../../assets/images/DL.png'),
  passport: require('../../../assets/images/passporticon.png'),
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

export function Icon({ name, size = 22, color = '#000000', accessibilityLabel }: IconProps) {
  const imageSource = IMAGE_SOURCES[name];
  if (imageSource) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Image source={imageSource} style={{ width: size, height: size, resizeMode: 'contain' }} />
      </View>
    );
  }
  const path = (IconPaths as Record<string, (c: string) => React.ReactNode>)[name];
  if (path) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {path(color)}
        </Svg>
      </View>
    );
  }
  return (
    <Text
      style={{ fontSize: size * 0.85, color, lineHeight: size * 1.1 }}
      accessibilityLabel={accessibilityLabel ?? name}
      allowFontScaling={false}>
      {(EMOJI_FALLBACKS as Record<string, string>)[name] ?? '□'}
    </Text>
  );
}
