# How Facepe Does Document Scanning vs Truepas

A comparison of the document capture and cropping approaches in the Facepe reference app vs the Truepas app, and why Truepas's manual crop approach is fundamentally fragile.

---

## 1. Facepe's Approach — Regula Document Reader SDK (Native)

Facepe does **not** build its own camera UI for document scanning. It delegates the entire capture + crop + OCR-extraction pipeline to the **Regula Document Reader SDK** (`@regulaforensics/react-native-document-reader-api`).

### The flow

```
User taps "Verify"
  → Regula DocumentReader.scan(ScannerConfig) opens NATIVE scanner UI
  → Regula handles: camera, frame detection, auto-capture, edge detection, cropping, perspective correction
  → Results come back via NativeEventEmitter 'completion' event
  → App extracts the raw camera frame (base64) from results
  → App writes base64 to a temp file
  → App sends file to backend via multipart upload
```

### Key code references

**Initialization** (`app/(tabs)/verify.tsx:434-514`):
```ts
const config = new DocReaderConfig();
config.license = licenseBase64;          // regula.license from app assets
config.delayedNNLoad = true;
DocumentReader.initializeReader(config, onSuccess, onError);

// On success — request uncropped raw image
const pp = new ProcessParams();
pp.returnUncroppedImage = true;          // ← KEY: gets the raw camera frame
DocumentReader.setProcessParams(pp, ...);
```

**Scanning** (`app/(tabs)/verify.tsx:650-669`):
```ts
const config = new ScannerConfig();
config.scenario = ScenarioIdentifier?.SCENARIO_MRZ_AND_LOCATE ?? 'MrzAndLocate';
DocumentReader.scan(config, successCb, errorCb);
// Results arrive via NativeEventEmitter, not the success callback
```

**Image extraction** (`app/(tabs)/verify.tsx:741-775`):
```ts
// PRIMARY: raw camera frame (source=3) — the original unprocessed photo
let imageBase64 = await results.graphicFieldImageByTypeSource(207, 3, ...);

// FALLBACK 1: processed document image (207 = GF_DOCUMENT_IMAGE)
if (!imageBase64) imageBase64 = await results.graphicFieldImageByType(207, ...);

// FALLBACK 2: front page image (102)
if (!imageBase64) imageBase64 = await results.graphicFieldImageByType(102, ...);

// FALLBACK 3: any other graphic field (250)
if (!imageBase64) imageBase64 = await results.graphicFieldImageByType(250, ...);
```

**Temp file write** (`app/(tabs)/verify.tsx:791-799`):
```ts
const tempPath = `${RNFS.CachesDirectoryPath}/doc_scan_${ts}.jpg`;
await RNFS.writeFile(tempPath, imageBase64, 'base64');
const docUri = Platform.OS === 'android' ? `file://${tempPath}` : tempPath;
```

**Backend upload** (`app/(tabs)/verify.tsx:1071-1099`):
```ts
const formData = new FormData();
formData.append('document_image', { uri: docUri, type: 'image/jpeg', name: 'document.jpg' });
formData.append('live_selfie', { uri: selfieTempPath, type: selfieMime, name: 'selfie.jpg' });
formData.append('store_in_s3', 'true');
formData.append('liveness_session_id', backendSessionId);
formData.append('document_type', docType);

await fetch(fullUrl, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
```

### What Facepe does NOT do

- **No custom camera view** for document scanning — Regula provides its own native scanner UI with built-in edge detection, auto-capture, and perspective correction.
- **No manual crop math** — no `coverScale`, no `offsetX/offsetY`, no frame-to-photo coordinate mapping. Regula handles all of this natively.
- **No `expo-image-manipulator` for document images** — the raw frame from Regula is sent as-is to the backend.
- **No frame overlay** — Regula's native UI shows its own guide frame.

### Why this works perfectly

Regula's native scanner:
1. Detects the document edges in real-time using on-device ML
2. Auto-captures when the document is aligned, in focus, and well-lit
3. Crops and perspective-corrects the image to the document bounds
4. Returns a clean, rectangular document image

The app never has to map screen coordinates to photo coordinates — the SDK does it natively at the camera frame level.

---

## 2. Truepas's Approach — Manual Camera + Manual Crop

Truepas builds its own camera UI with `expo-camera` and manually crops the captured photo to match the on-screen frame.

### The flow

```
User taps "Scan"
  → expo-camera CameraView opens (custom React Native view)
  → App draws a dashed rectangle overlay (280×175 dp) on top
  → User manually aligns document and taps capture
  → takePictureAsync() returns a full-sensor photo (e.g. 4032×3024)
  → App computes crop coordinates by mapping the overlay frame
    from screen space to photo pixel space
  → expo-image-manipulator crops + resizes to 1600px wide
  → App sends base64 to backend
```

### The crop math (current, after fixes)

```ts
// Cover transform: photo is scaled to cover the view, centered
const coverScale = Math.max(viewWidth / photoWidth, viewHeight / photoHeight);
const offsetX = (viewWidth - photoWidth * coverScale) / 2;  // ≤ 0
const offsetY = (viewHeight - photoHeight * coverScale) / 2; // ≤ 0

// Frame position in view coordinates (centered)
const frameViewX = (viewWidth - frame.width) / 2;
const frameViewY = (viewHeight - frame.height) / 2;

// Inverse cover transform: view coords → photo coords
const cropX = (frameViewX - offsetX) / coverScale;
const cropY = (frameViewY - offsetY) / coverScale;
const cropW = frame.width / coverScale;
const cropH = frame.height / coverScale;
```

Plus an orientation swap for Android (where `takePictureAsync` returns landscape photos even in portrait mode).

### Why this is fragile

| Problem | Cause |
|---|---|
| **Cover scaling assumption** | The math assumes `expo-camera`'s preview uses exact CSS `cover` scaling. In reality, some Android Camera2/CameraX implementations have a slight FOV difference between the preview stream and the capture stream — the preview crops a slightly different region than the math predicts. |
| **Orientation mismatch** | Android's `takePictureAsync` can return photos in the sensor's native landscape orientation. The fix swaps w/h, but some devices return EXIF-rotated photos where the dimensions are already swapped but the pixel buffer is still landscape. |
| **No edge detection** | The user manually aligns the document. If the document is rotated, tilted, or partially outside the frame, the crop still cuts a fixed rectangle — no perspective correction. |
| **No auto-capture** | The user decides when to tap capture. Blurry, dark, or misaligned photos are captured anyway. |
| **Device-specific FOV** | Different phones have different camera FOVs. A frame that's 280dp wide on a 360dp-wide phone covers a different percentage of the sensor than on a 412dp-wide phone. The cover-scale math handles this *if* the preview-to-capture FOV ratio is exactly 1:1, which it isn't on all devices. |
| **No perspective correction** | A document held at an angle produces a trapezoidal image. Regula corrects this; Truepas just crops a rectangle. |

---

## 3. Facepe's Selfie Capture — Also Different

For face registration (not liveness — that uses Regula Face SDK), Facepe uses `expo-camera` with a **centered square crop**:

```ts
// face-registration.tsx:228-281
const targetSize = Math.min(photoWidth, photoHeight);
const crop = {
  originX: Math.floor((photoWidth - targetSize) / 2),
  originY: Math.floor((photoHeight - targetSize) / 2),
  width: targetSize,
  height: targetSize,
};
// Then resize to 640×640
```

This is simpler and more robust than Truepas's frame-mapping crop because:
- It doesn't depend on the camera view's layout dimensions
- It doesn't need a cover-scale transform
- It crops from the photo's own dimensions (always correct)
- A centered square is a safe assumption for a face photo

Facepe's liveness selfie is even simpler — Regula Face SDK's `startLiveness()` captures the selfie internally and returns it as base64. No crop math at all.

---

## 4. Side-by-Side Comparison

| Aspect | Facepe | Truepas |
|---|---|---|
| Document camera UI | Regula native scanner (built-in) | Custom `expo-camera` view |
| Edge detection | Regula ML (real-time, on-device) | None — user manually aligns |
| Auto-capture | Yes — captures when aligned + in focus | No — user taps a button |
| Cropping | Regula (native, perspective-corrected) | Manual math (cover-scale transform) |
| Perspective correction | Yes (Regula) | No |
| Orientation handling | Regula handles internally | Manual swap (added in fix) |
| Image sent to backend | Raw camera frame from Regula | Manually cropped + resized base64 |
| Upload format | Multipart form-data (file URI) | JSON base64 string |
| OCR | Backend Regula (server-side) | Backend (server-side) |
| Liveness | Regula Face SDK `startLiveness()` | Custom Vision Camera + worklets |
| Selfie capture | Regula Face SDK (liveness) or centered square crop (registration) | Manual frame-mapping crop |
| Failure modes | SDK init failure, license issues | Crop misalignment, orientation bugs, FOV mismatch |
| License cost | Regula license required | Free (expo-camera) |
| Build complexity | Native modules, Maven repo, license file | Managed Expo, no native SDK |

---

## 5. Why Truepas's Crop Is Still Failing

Even after the cover-scale + orientation-swap fix, the crop can still be wrong because:

1. **Preview vs capture FOV mismatch** — On some Android devices, the camera preview stream (used for the on-screen view) has a slightly different field of view than the capture stream (used by `takePictureAsync`). The preview might show a 70° FOV while the capture is 75°. The cover-scale math assumes they're identical, so the crop is off by the difference.

2. **EXIF rotation** — Some Android devices return a photo with dimensions already in portrait (e.g. 3024×4032) but the actual pixel buffer is landscape with an EXIF `Orientation: 6` tag. The orientation-swap fix doesn't trigger (because `photoWidth < photoHeight` → already "portrait"), but the pixels are actually rotated. `expo-image-manipulator` may or may not respect EXIF rotation depending on the version.

3. **Camera view includes safe area** — The `cameraLayout` measurement includes the full `flex: 1` view, but on devices with notches, the SafeAreaView padding shifts the camera preview's effective area. The frame overlay is centered in the same view, so this should cancel out — but only if both the camera and overlay use the same coordinate space.

---

## 6. Recommendations

### Option A — Adopt Regula Document Reader (like Facepe)

**Pros:**
- Eliminates all crop math — Regula handles capture, edge detection, cropping, and perspective correction natively
- Auto-capture when document is aligned
- Higher quality images for backend OCR
- Battle-tested across thousands of device models

**Cons:**
- Requires Regula license (cost, procurement)
- Adds native modules (`@regulaforensics/react-native-document-reader-api`, `@regulaforensics/face-core-basic`)
- Requires EAS development build (not Expo Go)
- Adds ~20-40 MB to app binary
- Maven repository configuration (`plugins/withRegulaMaven.js`)
- License file management (`regula.license` in assets)

**This is what Facepe does and it's the industry standard for KYC apps.**

### Option B — Keep expo-camera, Improve the Crop (Incremental)

If Regula is not an option right now, here's how to make the manual crop more robust:

1. **Use `photo.width`/`photo.height` from the actual capture, not assumptions** — already done.

2. **Read EXIF orientation and rotate before cropping** — use `expo-image-manipulator`'s `rotate` action to normalize orientation before the crop. Check if the photo has an EXIF orientation tag and rotate to 0° first.

3. **Make the frame size proportional to the view, not fixed dp** — instead of `280×175`, use `viewWidth * 0.75 × viewHeight * 0.4`. This ensures the frame covers the same percentage of the preview regardless of screen size, making the cover-scale mapping more predictable.

4. **Add a preview of the cropped image before sending** — show the user what was cropped so they can retake if it's wrong. This doesn't fix the crop but prevents bad images from being submitted.

5. **Send the full uncropped photo to the backend** — if the backend's Regula can do edge detection and cropping server-side (Facepe's backend does this), skip the frontend crop entirely and send the full photo. The backend will crop more accurately than any frontend math.

### Option C — Hybrid (Recommended)

1. **For now:** send the full uncropped photo to the backend (skip frontend crop). The backend's Regula/OCR pipeline can handle edge detection and cropping server-side, just like Facepe's backend does.

2. **Remove the frame overlay** or keep it as a visual guide only — don't use it for crop math.

3. **Long-term:** evaluate Regula Document Reader SDK if frontend-side capture quality becomes a bottleneck.

---

## 7. The Key Insight

**Facepe never does manual crop math for documents.** The entire crop/edge-detection/perspective-correction pipeline is delegated to Regula's native SDK. The app is just a transport layer — it receives the already-cropped image from Regula and forwards it to the backend.

Truepas is trying to replicate this with `expo-camera` + manual coordinate math, which is fundamentally fragile because:
- Camera preview FOV ≠ capture FOV on all devices
- EXIF orientation varies by device
- No edge detection or perspective correction
- No auto-capture quality gate

The most reliable fix is to **stop cropping on the frontend** and let the backend handle it, or **adopt Regula Document Reader** like Facepe does.
