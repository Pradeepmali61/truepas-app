import { Camera } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer, Spacer } from '@/components/layout/ScreenContainer';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';
import RegulaDocService, { isRegulaDocAvailable } from '@/services/RegulaDocService';

/** Document scan — uses Regula Document Reader SDK for native scanning,
 *  OCR, MRZ parsing, and document/portrait image extraction.
 *  Requires a development build (not Expo Go). */
export default function DocumentScanScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [initializing, setInitializing] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(true);

  // Initialize Regula Document Reader on mount
  useEffect(() => {
    if (!isRegulaDocAvailable()) {
      setNativeAvailable(false);
      setInitializing(false);
      return;
    }

    (async () => {
      try {
        await RegulaDocService.initialize();
      } catch (err: any) {
        Alert.alert('Initialization Failed', err?.message ?? 'Failed to initialize document scanner');
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const handleScan = async () => {
    // Check camera permission first
    const { status } = await Camera.getCameraPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan documents.');
        return;
      }
    }

    setScanning(true);
    try {
      const scenario = 'MrzAndLocate'; // Auto-capture + MRZ extraction
      const data = await RegulaDocService.scanDocument(scenario);

      // Navigate to processing with scanned data
      // Pass OCR fields via params (images are too large for params —
      // processing screen will use the document type to create the record)
      router.push({
        pathname: '/document/processing',
        params: {
          type: type ?? 'passport',
          docNumber: data.documentNumber ?? '',
          docLabel: data.fullName ?? '',
          dateOfExpiry: data.dateOfExpiry ?? '',
          issuingCountry: data.issuingCountry ?? '',
        },
      });
    } catch (error: any) {
      if (error?.message !== 'USER_CANCELLED') {
        Alert.alert('Scan Error', error?.message ?? 'Failed to scan document');
      }
    } finally {
      setScanning(false);
    }
  };

  // Initializing state
  if (initializing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-[14px] text-white">Initializing document scanner...</Text>
      </SafeAreaView>
    );
  }

  // Native module not available (Expo Go)
  if (!nativeAvailable) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]" edges={['top', 'bottom']}>
        <View className="px-6 items-center">
          <Icon name="warning" size={40} color={Colors.primary} />
          <Text className="mt-4 text-center text-[16px] font-bold text-white">
            Development Build Required
          </Text>
          <Text className="mt-2 text-center text-[14px] text-white/70">
            Regula Document Reader requires a development build.{"\n"}
            Run: npx expo run:android
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Ready to scan
  return (
    <ScreenContainer scroll={false}>
      <TopBar title="Verify Document" />
      <View className="flex-1 items-center justify-center px-6">
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#F5F3FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
          <Icon name="passport" size={48} color={Colors.primary} />
        </View>

        <Text accessibilityRole="header" className="mb-2 text-[22px] font-bold text-ink text-center">
          Scan Your Document
        </Text>
        <Text className="mb-8 text-center text-[15px] text-muted">
          Position your document within the camera frame.{"\n"}
          The scanner will auto-capture when the document is sharp and clear.
        </Text>

        <View className="w-full gap-3">
          <View className="flex-row items-center gap-2">
            <Icon name="check" size={16} color={Colors.primary} />
            <Text className="text-[14px] text-muted">Passport, Driver's License, or ID Card</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Icon name="check" size={16} color={Colors.primary} />
            <Text className="text-[14px] text-muted">Auto-capture with edge detection</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Icon name="check" size={16} color={Colors.primary} />
            <Text className="text-[14px] text-muted">OCR text + portrait extraction</Text>
          </View>
        </View>
      </View>

      <Spacer />
      <View className="px-6 pb-6">
        <Button
          label={scanning ? 'Scanning...' : 'Start Scanning'}
          onPress={handleScan}
          loading={scanning}
          disabled={scanning}
        />
      </View>
    </ScreenContainer>
  );
}
