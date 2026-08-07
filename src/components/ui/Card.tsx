import { View, ViewProps } from 'react-native';

/** Card matching `.card` (radius 16, padding 16, subtle shadow). */
export function Card({ children, className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`mx-5 my-[10px] rounded-card border-[0.5px] border-canvas bg-white p-4 shadow-md ${className}`}
      style={{ elevation: 3 }}
      {...rest}>
      {children}
    </View>
  );
}
