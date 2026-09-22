/** @jsxImportSource react */
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoreButton, Spinner, Typography } from '@/components/ui';
import {
    RegulaScanCancelled,
    initializeRegula,
    isRegulaAvailable,
    scanDocument,
} from '@/features/documents/regulaScanner';
import { setScanResult } from '@/services/scanStore';
import { useThemeTokens } from '@/theme';

type ScanStep = 'front' | 'selfie' | 'done';

// Frame dimensions shown on the camera overlay (manual fallback path only —
// must match the JSX below). The Regula scanner crops natively and does not
// use these.
const FRONT_FRAME = { width: 280, height: 175 };
const SELFIE_FRAME = { width: 300, height: 300 };

// Camera chrome is intentionally dark — the viewfinder sits behind it.
const CAMERA_BG = '#111111';
const ON_DARK = '#FFFFFF';
const ON_DARK_MUTED = 'rgba(255,255,255,0.7)';

/** Document scan — captures front of document (+ selfie for portrait documents).
 *  Document capture uses the Regula Document Reader native scanner (edge
 *  detection, auto-capture, perspective-corrected cropping) when the native
 *  modules are present, falling back to the manual expo-camera flow in Expo Go.
 *  Selfie capture always uses expo-camera.
 *  Per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6:
 *  - Capture frontImageBase64 (required)
 *  - Capture selfieImageBase64 (for face match on portrait documents)
 *  - Images sent as base64 in the /verify call (NOT as object keys)
 *  - Regula runs server-side for OCR + authenticity + face match
 *  Family mode: when `family` param is set, routes to family/add/processing
 *  after capture instead of the user document processing screen. Birth
 *  certificates (0-4) skip the selfie step — no portrait, no face match. */
export default function DocumentScanScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const { type, label, number, expiresAt, family, personId, name, dob, relationship, band } = useLocalSearchParams<{
    type?: string;
    label?: string;
    number?: string;
    expiresAt?: string;
    family?: string;
    personId?: string;
    name?: string;
    dob?: string;
    relationship?: string;
    band?: string;
  }>();
  const isFamilyMode = family === '1';
  const isDocOnly = type === 'birthCertificate' || band === '0-4';
  // Family flow: the selfie step is skipped — face capture happens later via
  // the liveness flow (family/add/face-capture), so a separate selfie here is
  // redundant (it is never sent to the backend in family mode).
  const skipSelfie = isFamilyMode || isDocOnly;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [step, setStep] = useState<ScanStep>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  // Regula-cropped document image for display (raw frame goes to backend).
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });

  // ── Regula native scanner state ──────────────────────────────────────────
  const regulaAvailable = useMemo(() => isRegulaAvailable(), []);
  const [useRegula, setUseRegula] = useState(regulaAvailable);
  const [regulaReady, setRegulaReady] = useState(false);
  const [regulaBusy, setRegulaBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Request permission on mount if not yet determined
  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Initialize Regula on mount (native builds only)
  useEffect(() => {
    if (!regulaAvailable) return;
    initializeRegula()
      .then(() => setRegulaReady(true))
      .catch((e: any) => {
        console.error('[Scan] Regula init failed:', e?.message);
        setScanError(e?.message ?? 'Document scanner failed to initialize');
      });
  }, [regulaAvailable]);

  // ── Regula scan (native scanner UI) ──────────────────────────────────────
  const handleRegulaScan = async () => {
    if (regulaBusy || !regulaReady) return;
    setRegulaBusy(true);
    setScanError(null);
    try {
      const result = await scanDocument();
      setFrontImage(result.imageBase64);
      setFrontPreview(result.previewBase64);
      // Doc-only + family mode: no separate selfie — face capture via liveness
      setStep(skipSelfie ? 'done' : 'selfie');
    } catch (e: any) {
      if (e instanceof RegulaScanCancelled) return; // user closed the scanner
      console.error('[Scan] Regula scan failed:', e?.message);
      setScanError(e?.message ?? 'Scan failed. Please try again.');
    } finally {
      setRegulaBusy(false);
    }
  };

  // ── Manual expo-camera capture (fallback path) ───────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (!photo?.uri) return;

      // The camera preview fills the view with "cover" scaling (center-crop):
      // the preview shows only the middle portion of the full sensor photo.
      // To crop exactly what's inside the on-screen frame, map the frame's
      // view coordinates into photo coordinates via the cover transform.
      //
      // IMPORTANT: On Android, takePictureAsync often returns the photo in the
      // sensor's native landscape orientation (e.g. 4032×3024) even when the
      // phone is held in portrait and the preview shows portrait. We must
      // swap width/height so the photo's orientation matches the view's.
      let photoWidth = photo.width ?? 0;
      let photoHeight = photo.height ?? 0;
      const viewWidth = cameraLayout.width || photoWidth;
      const viewHeight = cameraLayout.height || photoHeight;

      // Detect orientation mismatch: photo is landscape but view is portrait (or vice versa)
      const photoIsLandscape = photoWidth > photoHeight;
      const viewIsLandscape = viewWidth > viewHeight;
      if (photoIsLandscape !== viewIsLandscape && photoWidth > 0 && photoHeight > 0) {
        console.log('[Scan] Photo orientation mismatch — swapping w/h. Original:', photoWidth, 'x', photoHeight);
        [photoWidth, photoHeight] = [photoHeight, photoWidth];
      }

      const frame = step === 'front' ? FRONT_FRAME : SELFIE_FRAME;

      // Cover transform: scale the photo so it covers the view, centered.
      const coverScale = Math.max(viewWidth / photoWidth, viewHeight / photoHeight);
      const offsetX = (viewWidth - photoWidth * coverScale) / 2; // ≤ 0
      const offsetY = (viewHeight - photoHeight * coverScale) / 2; // ≤ 0

      // Frame is centered in the camera view
      const frameViewX = (viewWidth - frame.width) / 2;
      const frameViewY = (viewHeight - frame.height) / 2;

      // View coords → photo coords (inverse of the cover transform)
      const cropX = (frameViewX - offsetX) / coverScale;
      const cropY = (frameViewY - offsetY) / coverScale;
      const cropW = frame.width / coverScale;
      const cropH = frame.height / coverScale;

      console.log('[Scan] crop mapping:', JSON.stringify({
        step,
        photo: { w: photoWidth, h: photoHeight },
        view: { w: viewWidth, h: viewHeight },
        coverScale: Number(coverScale.toFixed(3)),
        offset: { x: Number(offsetX.toFixed(1)), y: Number(offsetY.toFixed(1)) },
        crop: { x: Math.round(cropX), y: Math.round(cropY), w: Math.round(cropW), h: Math.round(cropH) },
      }));

      // Clamp the crop rect to the photo bounds and round to integers
      const clampedX = Math.max(0, Math.min(cropX, photoWidth));
      const clampedY = Math.max(0, Math.min(cropY, photoHeight));
      const crop = {
        originX: Math.round(clampedX),
        originY: Math.round(clampedY),
        width: Math.round(Math.max(0, Math.min(cropW, photoWidth - clampedX))),
        height: Math.round(Math.max(0, Math.min(cropH, photoHeight - clampedY))),
      };

      // Build actions: crop first, then resize to ~1600px wide
      const actions: ImageManipulator.Action[] = [];
      if (crop.width > 0 && crop.height > 0) {
        actions.push({ crop });
      }
      actions.push({ resize: { width: 1600 } });

      // Per KYC guide §6.3: resize to ~1600px + JPEG 0.8 before sending.
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        actions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      const base64 = manipulated.base64 ?? '';
      if (!base64) return;

      if (step === 'front') {
        setFrontImage(base64);
        // Manual capture is already cropped to the on-screen frame.
        setFrontPreview(base64);
        // Doc-only + family mode: no separate selfie — face capture via liveness
        setStep(skipSelfie ? 'done' : 'selfie');
      } else if (step === 'selfie') {
        setSelfieImage(base64);
        setStep('done');
      }
    } catch {
      // Ignore capture errors — let user retry
    } finally {
      setCapturing(false);
    }
  };

  const handleContinue = () => {
    // Store captured images for processing screen
    setScanResult({
      documentImageBase64: frontImage ?? undefined,
      documentPreviewBase64: frontPreview ?? undefined,
      selfieBase64: selfieImage ?? undefined,
    });

    if (isFamilyMode) {
      // Family flow — member is created (or document added) AFTER document capture
      router.replace({
        pathname: '/family/add/processing',
        params: {
          type: type ?? 'passport',
          personId: personId ?? '',
          name: name ?? '',
          dob: dob ?? '',
          relationship: relationship ?? '',
          band: band ?? '',
        },
      });
      return;
    }

    router.push({
      pathname: '/document/processing',
      params: {
        type: type ?? 'passport',
        label: label ?? '',
        number: number ?? '',
        expiresAt: expiresAt ?? '',
      },
    });
  };

  const handleRetake = () => {
    if (step === 'selfie') {
      setFrontImage(null);
      setFrontPreview(null);
      setStep('front');
    } else if (step === 'done') {
      if (skipSelfie) {
        // No selfie step in this flow — retake the document itself
        setFrontImage(null);
        setFrontPreview(null);
        setStep('front');
      } else {
        setSelfieImage(null);
        setStep('selfie');
      }
    }
  };

  const centered = {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: CAMERA_BG,
    paddingHorizontal: theme.spacing[8],
  };

  // Permission not yet determined — show loading
  if (permission === null) {
    return (
      <SafeAreaView style={centered} edges={['top', 'bottom']}>
        <Spinner size="lg" label="Requesting camera permission" />
        <Typography variant="body-sm" style={{ color: ON_DARK, marginTop: theme.spacing[4] }}>
          Requesting camera permission...
        </Typography>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={centered} edges={['top', 'bottom']}>
        <Typography variant="body" style={{ color: ON_DARK, marginBottom: theme.spacing[4] }} center>
          Camera permission is required for document scanning.
        </Typography>
        <CoreButton onPress={requestPermission} accessibilityLabel="Grant camera permission">
          Grant Permission
        </CoreButton>
      </SafeAreaView>
    );
  }

  // Done — show review and continue
  if (step === 'done') {
    const previewUri = frontPreview ?? frontImage;
    return (
      <SafeAreaView style={centered} edges={['top', 'bottom']}>
        <Typography variant="h3" style={{ color: ON_DARK, marginBottom: theme.spacing[2] }}>
          Capture Complete!
        </Typography>
        <Typography
          variant="body-sm"
          center
          style={{ color: ON_DARK_MUTED, marginBottom: theme.spacing[6] }}>
          {skipSelfie
            ? 'Document captured successfully.'
            : 'Document and selfie captured successfully.'}
          {"\n"}
          Tap continue to proceed.
        </Typography>

        {/* Captured previews — document crop + selfie */}
        <View style={{ flexDirection: 'row', gap: theme.spacing[4], marginBottom: theme.spacing[8] }}>
          {previewUri ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${previewUri}` }}
              accessibilityLabel="Captured document"
              style={{
                width: 150,
                height: 96,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              resizeMode="cover"
            />
          ) : null}
          {!skipSelfie && selfieImage ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${selfieImage}` }}
              accessibilityLabel="Captured selfie"
              style={{
                width: 96,
                height: 96,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              resizeMode="cover"
            />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing[3], alignItems: 'center' }}>
          {/* Outline variant uses light-surface colors — invisible on the dark
              camera chrome, so this is a dark-safe bordered button. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={skipSelfie ? 'Retake document' : 'Retake selfie'}
            onPress={handleRetake}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.65)',
              borderRadius: theme.radii.full,
              paddingHorizontal: theme.spacing[5],
              paddingVertical: theme.spacing[3],
              opacity: pressed ? 0.7 : 1,
            })}>
            <Typography variant="body" style={{ color: ON_DARK, fontWeight: theme.fontWeight.semibold }}>
              {skipSelfie ? 'Retake Document' : 'Retake Selfie'}
            </Typography>
          </Pressable>
          <CoreButton accessibilityLabel="Continue" onPress={handleContinue}>
            Continue
          </CoreButton>
        </View>
      </SafeAreaView>
    );
  }

  const isFront = step === 'front';
  // Regula handles the front step with its own native scanner UI; the manual
  // camera view is used for the selfie step and as the fallback.
  const showRegulaUI = isFront && useRegula;
  const facing = isFront ? 'back' : 'front';

  // ── Regula native scanner UI (front step) ────────────────────────────────
  if (showRegulaUI) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CAMERA_BG }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing[8] }}>
          <Typography variant="h3" style={{ color: ON_DARK, marginBottom: theme.spacing[2] }}>
            Scan Front of Document
          </Typography>
          <Typography
            variant="body-sm"
            center
            style={{ color: ON_DARK_MUTED, marginBottom: theme.spacing[10] }}>
            The scanner will detect the document edges automatically and capture
            when it is aligned and in focus.
          </Typography>

          {regulaBusy ? (
            <View style={{ alignItems: 'center', gap: theme.spacing[4] }}>
              <Spinner size="lg" label="Scanner active" />
              <Typography variant="body-sm" style={{ color: ON_DARK_MUTED }}>
                Scanner open — align the document…
              </Typography>
            </View>
          ) : (
            <CoreButton
              size="lg"
              accessibilityLabel="Open document scanner"
              onPress={handleRegulaScan}
              disabled={!regulaReady}>
              {regulaReady ? 'Scan Document' : 'Preparing Scanner…'}
            </CoreButton>
          )}

          {scanError ? (
            <Typography
              variant="body-sm"
              center
              style={{ color: theme.colors.error, marginTop: theme.spacing[6] }}>
              {scanError}
            </Typography>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ── Manual expo-camera UI (selfie step + front fallback) ─────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CAMERA_BG }} edges={['top', 'bottom']}>
      <View
        style={{ flex: 1 }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}>
        <CameraView
          ref={cameraRef}
          facing={facing}
          active={true}
          style={{ flex: 1 }}
          mirror={!isFront}
        />

        {/* Frame overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none">
          {isFront ? (
            <View
              style={{
                height: FRONT_FRAME.height,
                width: FRONT_FRAME.width,
                borderRadius: theme.radii.lg,
                borderWidth: 3,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.7)',
              }}
            />
          ) : (
            <View
              style={{
                height: SELFIE_FRAME.height,
                width: SELFIE_FRAME.width,
                borderRadius: theme.radii.full,
                borderWidth: 4,
                borderColor: 'rgba(255,255,255,0.6)',
              }}
            />
          )}
        </View>

        {/* Instruction */}
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            alignItems: 'center',
            paddingHorizontal: theme.spacing[6],
          }}>
          <View
            style={{
              borderRadius: theme.radii.md,
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
            }}>
            <Typography variant="body" center style={{ color: ON_DARK, fontWeight: theme.fontWeight.semibold }}>
              {isFront ? 'Scan Front of Document' : 'Capture Your Selfie'}
            </Typography>
          </View>
          <Typography variant="body-sm" style={{ color: ON_DARK_MUTED, marginTop: theme.spacing[2] }}>
            {isFront ? 'Align document within the frame' : 'Look at the camera and hold still'}
          </Typography>
        </View>

        {/* Step indicator */}
        <View
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}>
          <Typography variant="body-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isDocOnly ? 'Document photo' : `Step ${isFront ? '1' : '2'} of 2`}
          </Typography>
        </View>
      </View>

      {/* Capture button */}
      <View style={{ alignItems: 'center', paddingBottom: theme.spacing[8] }}>
        {capturing ? (
          <Spinner size="lg" label="Capturing" />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFront ? 'Capture document' : 'Capture selfie'}
            onPress={handleCapture}
            style={{
              height: 64,
              width: 64,
              borderRadius: theme.radii.full,
              borderWidth: 4,
              borderColor: theme.colors.actionPrimary,
              backgroundColor: ON_DARK,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
