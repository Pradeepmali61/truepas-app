import { Redirect, useRouter } from 'expo-router';
import { CircleCheck, ScanFace } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardContent } from '@/components/composite';
import { Badge, CoreButton, FadeUp, PopIn, RowIcon, Typography } from '@/components/ui';
import { faceEnrollmentCompleted } from '@/features/auth/slice';
import { flowGuards } from '@/services/flowGuards';
import { useAppDispatch } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Face enrolled success (POST /cb/face/enroll) — the enroll call already
 *  completed in LivenessCamera; this confirms and leads into the app.
 *  Deep-linking here is bounced back to face-scan: only a real enrollment
 *  may flip faceEnrolled. */
export default function FaceEnrolledScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [allowed] = useState(() => flowGuards.has('onboarding:face-enrolled'));

  useEffect(() => {
    if (allowed) flowGuards.consume('onboarding:face-enrolled');
  }, [allowed]);

  if (!allowed) return <Redirect href="/(onboarding)/face-scan" />;

  const handleContinue = () => {
    dispatch(faceEnrollmentCompleted());
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[4] }}>
        <View style={{ alignItems: 'center', gap: theme.spacing[2], marginTop: theme.spacing[8] }}>
          <PopIn>
            <RowIcon tone="success" icon={<ScanFace size={iconSize.xl} color={theme.colors.onSuccessSubtle} />} />
          </PopIn>
          <Typography variant="h2" center>
            You&apos;re all set
          </Typography>
          <Typography variant="body" color="secondary" center>
            Your face is enrolled. Check in at venues with a glance — no documents needed.
          </Typography>
        </View>
        <FadeUp delay={140}>
          <Card>
            <CardContent>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                <RowIcon tone="success" icon={<CircleCheck size={iconSize.md} color={theme.colors.onSuccessSubtle} />} />
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Typography variant="body">Face ID</Typography>
                  <Typography variant="body-sm" color="secondary">Enrolled</Typography>
                </View>
                <Badge variant="success">Active</Badge>
              </View>
            </CardContent>
          </Card>
        </FadeUp>
      </View>
      <View
        style={{
          padding: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[4] + insets.bottom,
          borderTopWidth: theme.sizes.fieldBorderWidth,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface,
        }}>
        <CoreButton fullWidth size="lg" accessibilityLabel="Continue to Truepas" onPress={handleContinue}>
          Continue to Truepas
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
