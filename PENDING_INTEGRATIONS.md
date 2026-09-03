# Pending Integrations — TruePas App (Updated per KYC Guide)

## ✅ DONE — Aligned with REACT_NATIVE_KYC_INTEGRATION_GUIDE.md

### Regula SDK Removed (Client-Side)
Regula runs **server-side** — not in the app. Removed all client-side Regula packages and config plugins.

### Liveness — Server-Side Challenge-Response Flow ✅
`src/features/liveness/LivenessCamera.tsx` — restored to server-side challenge flow:
- `POST /liveness/v2/challenge` → server provides randomized challenge sequence
- Per step: capture frame → submit evidence (metadata only, no image)
- `POST .../finalize` with high-res frame → server runs anti-spoof check
- Face enroll uses `livenessSessionId` + `sessionToken` (NOT selfie base64)

### Face Enrollment ✅
`src/types/domain.ts` — `FaceEnrollRequest` / `FaceUpdateRequest` reverted to:
```typescript
{ livenessSessionId: string; sessionToken: string; personId?: string }
```
Selfie is NEVER uploaded by the app — server uses the finalize frame.

### Document Scanning ✅
`src/app/document/scan.tsx` — uses expo-camera to capture:
- Step 1: Front of document (`frontImageBase64`)
- Step 2: Selfie (`selfieImageBase64` for face match on portrait documents)
- Images stored in `scanStore` and sent as base64 in `/verify` call

### Document Verification — Synchronous ✅
`src/app/document/processing.tsx` — per guide §6.3:
1. `POST /documents` → documentId
2. `POST /documents/{id}/verification-sessions` → sessionId
3. `POST /document-verification-sessions/{sessionId}/verify` with `{ frontImageBase64, selfieImageBase64? }` → **SYNCHRONOUS result**
4. No polling — verify returns final outcome directly

### API Endpoints ✅
`src/api/endpoints.ts` — added `startVerificationWithImages()`:
- Sends `frontImageBase64` + `selfieImageBase64` in verify body
- 90-second timeout (Regula server-side processing)
- Returns `VerifyDocumentResponse` with `outcome` + `matchScore`

---

## ❌ PENDING — Build & Testing

### #1 — EAS Build (Prebuild + Rebuild)
Regula native modules removed, so prebuild needs to be re-run:
```
npx expo prebuild --clean
eas build --platform android --profile development
```

### #2 — iOS Build Not Tested
iOS build not tested. Bundle ID `com.truepas.truepasapp` is set in app.json.

### #3 — Liveness Camera Calibration
Per guide §4.5: ML Kit thresholds (blink 0.35/0.6, yaw 12°) need calibration on real devices. Current implementation uses expo-camera with manual capture — consider upgrading to `react-native-vision-camera` + `react-native-vision-camera-face-detector` for automatic ML Kit detection.

### #4 — Document Type Rules
Per guide §6.2, implement these rules:
- `birthCertificate`: NO selfie (no portrait to match)
- `drivingLicense`: NOT offered for minors
- All other types: always send selfie for face match

### #5 — Image Compression
Per guide §6.3: base64 fields capped at ~14 MB. Use `expo-image-manipulator` to resize to ~1600px, JPEG quality 0.8 before sending.

### #6 — Error Handling
Per guide §3.4: handle `413 PAYLOAD_TOO_LARGE` (recapture/compress), `429 RATE_LIMITED` (respect Retry-After), `503 SERVICE_UNAVAILABLE` (retry with backoff).

### #7 — Recovery Poll
Per guide §6.7: on app launch, if a scan was in flight, poll once — if `completed`, show stored outcome; if `created` past `expiresAt` (30 min), restart document flow.

---

## 📋 Summary

| # | Item | Status |
|---|------|--------|
| ✅ | Regula SDK removed (server-side) | DONE |
| ✅ | Liveness — server-side challenge flow | DONE |
| ✅ | Face enroll — livenessSessionId + sessionToken | DONE |
| ✅ | Document scan — expo-camera capture | DONE |
| ✅ | Document verify — synchronous, no polling | DONE |
| ✅ | API endpoints — startVerificationWithImages | DONE |
| ❌ | EAS build (prebuild + rebuild) | PENDING |
| ❌ | iOS build | PENDING |
| ❌ | Liveness camera calibration | PENDING |
| ❌ | Document type rules (birthCertificate, minors) | PENDING |
| ❌ | Image compression (expo-image-manipulator) | PENDING |
| ❌ | Error handling (413, 429, 503) | PENDING |
| ❌ | Recovery poll on app launch | PENDING |
