import { Text, View } from 'react-native';

interface AvatarProps {
  initials: string;
  size?: number;
}

/** Avatar — rounded square with initials, gray background. */
export function Avatar({ initials, size = 48 }: AvatarProps) {
  return (
    <View
      accessibilityLabel={`Avatar ${initials}`}
      className="items-center justify-center bg-faint"
      style={{ width: size, height: size, borderRadius: 16 }}>
      <Text
        allowFontScaling={false}
        className="text-white"
        style={{ fontSize: 28, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}
