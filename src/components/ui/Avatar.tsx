import { Text, View } from 'react-native';

interface AvatarProps {
  initials: string;
  size?: number;
}

/** Avatar matching `.avatar` (48px, radius 8, gray bg). */
export function Avatar({ initials, size = 48 }: AvatarProps) {
  return (
    <View
      accessibilityLabel={`Avatar ${initials}`}
      className="items-center justify-center rounded-[8px] bg-faint"
      style={{ width: size, height: size }}>
      <Text
        allowFontScaling={false}
        className="font-bold text-white"
        style={{ fontSize: size / 3 }}>
        {initials}
      </Text>
    </View>
  );
}
