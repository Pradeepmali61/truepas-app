import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera as CameraIcon, ScanFace } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
    type CameraRef,
} from 'react-native-vision-camera';

import { toApiError } from '@/api/errors';
import { Alert, ScreenHeader } from '@/components/composite';
import { CoreButton, LoadingState, Pulse, ScanLine, Typography } from '@/components/ui';
import { useEnrollFace } from '@/features/auth/mutations';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

/** Add family — photo enrollment for under-5 members (POST /cb/face/enroll).
 *  Under-5 members can't run liveness — one clear photo is sent as
 *  { selfieBase64, personId } instead of liveness session credentials. */
export default function FamilyPhotoCaptureScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, age, personId } = useLocalSearchParams<{ name?: string; age?: string; personId?: string }>();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput();
  const cameraRef = useRef<CameraRef>(null);
  const enrollFace = useEnrollFace();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const goToMemberDetail = () => {
    if (personId) {
      router.replace({ pathname: '/family/[id]', params: { id: personId } });
    } else {
      router.dismissTo('/(tabs)/family');
    }
  };

  const capture = async () => {
    if (capturing) return;
    if (!personId) {
      setError('Missing family member reference. Please go back and try again.');
      return;
    }
    setCapturing(true);
    setError(null);
    try {
      const photoFile = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
      if (!photoFile) throw new Error('Failed to capture photo');
      const { File } = await import('expo-file-system');
      const filePath = photoFile.filePath.startsWith('file://') ? photoFile.filePath : `file://${photoFile.filePath}`;
      const selfieBase64 = await new File(filePath).base64();
      await enrollFace.mutateAsync({ selfieBase64, personId });
      goToMemberDetail();
    } catch (err) {
      setError(toApiError(err).message || 'Could not enroll the photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (!hasPermission) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title={`Add ${name ?? 'child'}'s photo`} onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing[6], gap: theme.spacing[3] }}>
          <Typography variant="body" center>
            Camera permission is required to take the enrollment photo.
          </Typography>
          <CoreButton onPress={requestPermission} accessibilityLabel="Grant camera permission">
            Grant permission
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title={`Add ${name ?? 'child'}'s photo`} onBack={() => router.back()} />
        <LoadingState fullPage label="Loading camera…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title={`Add ${name ?? 'child'}'s photo`}
        subtitle={age ? `Age ${age} · photo enrollment` : 'Photo enrollment'}
        onBack={() => router.back()}
      />
      <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[3] }}>
        <View
          style={{
            aspectRatio: 3 / 4,
            borderRadius: theme.radii.xl,
            backgroundColor: theme.colors.textPrimary,
            overflow: 'hidden',
          }}>
          <Camera
            ref={cameraRef}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            device={device}
            isActive
            outputs={[photoOutput]}
            mirrorMode="auto"
          />
          <ScanLine color={theme.colors.accent} ms={2400} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[8] }}>
            <Pulse to={1.03} ms={1200}>
              <View
                style={{
                  width: 168,
                  height: 208,
                  borderRadius: 104,
                  borderWidth: 3,
                  borderColor: theme.colors.actionPrimary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ScanFace size={56} color={theme.colors.onActionPrimary} />
              </View>
            </Pulse>
            <View
              style={{
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[2],
                borderRadius: theme.radii.full,
                backgroundColor: theme.colors.actionPrimary,
                maxWidth: '88%',
              }}>
              <Text style={{ color: theme.colors.onActionPrimary, fontFamily: theme.fontFamily.sans.semibold, fontSize: theme.fontSize.base }}>
                Hold still — one clear photo
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[2],
            alignSelf: 'center',
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[1],
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.surfaceSunken,
          }}>
          <CameraIcon size={iconSize.sm} color={theme.colors.textSecondary} />
          <Typography variant="body-sm" color="secondary">
            Front or back camera allowed
          </Typography>
        </View>
        {error ? (
          <Alert variant="error" title="Photo enrollment failed">
            {error}
          </Alert>
        ) : null}
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
        <CoreButton fullWidth size="lg" loading={capturing} accessibilityLabel="Capture photo" onPress={capture}>
          Capture photo
        </CoreButton>
      </View>
    </SafeAreaView>
  );
}
