import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';

const SESSION_TTL_SECONDS = 15 * 60;

/** Profile mismatch session — 15-minute TTL, accept or retry (PRD). */
export default function MismatchScreen() {
  const router = useRouter();
  const { seconds } = useCountdown(SESSION_TTL_SECONDS);

  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Details Mismatch" />
      <View className="flex-1 px-6">
        <View className="items-center pb-5 pt-7">
          <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-surface">
            <Icon name="warning" size={28} />
          </View>
          <Text accessibilityRole="header" className="mb-1 mt-4 text-[18px] font-bold text-primary">
            Details Mismatch
          </Text>
          <Text className="text-[13px] text-muted">
            Extracted details don&apos;t match your profile
          </Text>
        </View>

        <View
          className="rounded-card border-[1.5px] border-[#f0f0f0] bg-white p-[18px] shadow-sm"
          style={{ borderLeftWidth: 3, borderLeftColor: Colors.primary, elevation: 2 }}>
          <View className="mb-3 flex-row justify-between">
            <Text className="text-[11px] tracking-[0.5px] text-faint">PROFILE</Text>
            <Text className="text-[11px] tracking-[0.5px] text-faint">DOCUMENT</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between border-b border-canvas pb-2">
            <Text className="text-[14px] font-semibold text-primary">Jane Doe</Text>
            <Text className="text-[14px] font-semibold text-primary">Jane D. Smith</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[14px] font-semibold text-primary">04/12/1994</Text>
            <Text className="text-[14px] font-semibold text-primary">04/12/1994</Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-[10px] rounded-btn border-[1.5px] border-primary-light bg-surface px-4 py-3">
          <Icon name="clock" size={16} />
          <Text accessibilityLiveRegion="polite" className="text-[13px] font-medium text-primary">
            Session expires in {formatCountdown(seconds)}
          </Text>
        </View>

        <View className="mt-3 flex-row items-start gap-[10px] rounded-btn bg-surface px-4 py-3">
          <Icon name="info" size={16} />
          <Text className="flex-1 text-[12px] leading-[18px] text-primary">
            If the session expires, you&apos;ll need to re-verify your document.
          </Text>
        </View>

        <Spacer />
        <View className="pb-6 pt-4">
          <Button label="Accept & Update Profile" onPress={() => router.replace('/document/verified')} />
          <View className="mt-[10px]">
            <Button
              label="Retry with Different Document"
              variant="outline"
              onPress={() => router.replace('/document/select-type')}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
