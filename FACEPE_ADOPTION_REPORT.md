# Facepe → Truepas Adoption Report (v2 — Re-assessed)

**Re-assessed:** 6 September 2026
**Facepe reference:** `C:\Users\Administrator\OneDrive\Desktop\Facepe3\facepe-user-frontend`
**Truepas app:** `C:\Users\Administrator\truepas-app-1`

> **ARCHITECTURE DECISION (updated since v1):**
> - **Document read → Regula Document Reader SDK** (adopted from Facepe). The v1 recommendation to stay on `expo-camera` is **overturned** — the manual crop approach was fragile and has been replaced.
> - **Liveness → NOT Regula.** Stays on `react-native-vision-camera` + ML Kit face detector with the server-side challenge protocol. Regula Face SDK is not used and should not be added.

---

## 1. What Changed Since v1

| Area | v1 state | Current state |
|---|---|---|
| Document capture | `expo-camera` + manual frame-crop math (fragile) | **Regula Document Reader native scanner** (`regulaScanner.ts`), manual camera kept as Expo Go fallback |
| Regula packages | None (recommended against) | `@regulaforensics/react-native-document-reader-api@^9.1.369` + `core-mrz@^9.1.1664` |
| Regula license | N/A | `assets/regula.license` embedded as base64 (`regulaLicense.ts`), copied to native assets via `plugins/withRegulaLicense.js` |
| Regula Maven repo | N/A | `plugins/withRegulaMaven.js` injects `maven.regulaforensics.com` into settings.gradle + build.gradle |
| Dev builds | EAS cloud builds only | `expo-dev-client` added; scripts now `expo run:android` / `expo run:ios` (local builds required for Regula native modules) |
| Flip card | Inlined in 2 screens (extraction recommended) | **Adopted** — document detail page + verified screen use flip card design (ref Facepe) |
| Image compression | Missing | **Done** — captured photos cropped + resized to ~1600px JPEG 0.8 before verify |
| Family document flow | User-only | Document scan integrated into family member add flow (doc type dropdown → scan → face capture → member created) |
| Liveness evidence | 422 (BFF drops body) | Frontend mitigations shipped (explicit Content-Type, fetch fallback, stale-closure fix); **backend bug still open** |
| Document verify | 503 (object storage) | **Backend blocker still open** — base64 rejected until signed-upload pipeline ships |

---

## 2. Patterns Already Adopted from Facepe

### 2.1 Regula Document Reader for document scanning ✅ (was §5.2 in v1 — now adopted)

**Facepe pattern** (`app/(tabs)/verify.tsx:434-514, 650-669, 741-775`):
- Native full-screen scanner UI with real-time edge detection, auto-capture, perspective correction.
- `DocReaderConfig` with embedded license + `delayedNNLoad`.
- `ProcessParams.returnUncroppedImage = true` to get the raw camera frame.
- Results via `NativeEventEmitter 'completion'`; image extracted with fallback chain (raw frame source=3 → GF_DOCUMENT_IMAGE 207 → front page 102 → any field 250).

**Truepas implementation** (`src/features/documents/regulaScanner.ts`):
- Mirrors Facepe 1:1, including the `MrzAndLocate` scenario and the same 4-step image fallback chain.
- Lazy native-module loading with `isRegulaAvailable()` guard so the JS bundle still runs in Expo Go.
- License embedded as base64 constant (`regulaLicense.ts`) — requiring the `.license` file as a Metro asset proved unreliable with the custom resolver.
- `scan.tsx` uses Regula for the front step, manual `expo-camera` for the selfie step and as user-selectable fallback ("Use manual camera instead").

**Status: DONE.** Do not revert to manual crop math.

### 2.2 Flip card document detail ✅ (was §1.10 in v1)

**Facepe pattern** (`src/components/FlippingCard.tsx`): 3D Y-axis flip card with `perspective: 800`.

**Truepas implementation:**
- `src/app/document/[id].tsx` — document detail page with flip card design (commit `0f4bf9d`).
- `src/app/document/verified.tsx` — verified screen flip card showing the captured scan (commit `1c526d9`).
- Captured document photo persisted locally via `documentImageStore.ts` and displayed on the detail screen (commit `b585a32`).

**Status: DONE** (still inlined in both screens rather than a shared component — see §4.2 for the remaining extraction task).

### 2.3 Square-cropped, compressed image input ✅ (was §1.5 in v1)

- Document images: cropped to the on-screen frame via cover-transform math (manual path) or natively by Regula, then resized to ~1600px, JPEG 0.8 (`expo-image-manipulator`) — commit `6c64088`.
- Selfie: 220×220 circular frame, same compression.

**Status: DONE for documents.** The 640×640 face-input normalization for liveness finalize is still open (§4.4).

### 2.4 Family-mode document scanning (Truepas extension of Facepe's verify flow)

Facepe has no family feature. Truepas extended the Facepe verify flow into a family member onboarding flow:
- Doc type dropdown → document scan → face capture → member created after capture (commits `e077586`, `f11ed35`, `26e90a0`).
- Birth certificates (ages 0–4) skip the selfie step — no portrait, no face match.

**Status: DONE** (Truepas-only; no Facepe equivalent to compare against).

---

## 3. Patterns Not Adopted (Confirmed Decisions)

### 3.1 Regula Face SDK for liveness — **NOT adopted (final decision)**

**Facepe** uses `@regulaforensics/face-sdk` `startLiveness()`.

**Truepas** uses `react-native-vision-camera@^5.2.3` + `react-native-vision-camera-face-detector` + `react-native-worklets` with:
- Server-side challenge protocol (`POST /liveness/v2/challenge` → per-step evidence → finalize).
- ML Kit auto-detection of blink (eyes <0.35 closed → >0.6 open) and turn (|yaw| > 12°) — no manual button press.
- Evidence carries **no image** (metadata only); only the finalize step sends a high-res photo.
- Face enroll uses `livenessSessionId` + `sessionToken` — the selfie is never uploaded by the app.

**Decision: keep Vision Camera.** Do not add Regula Face SDK. The stack is integrated, licensed-free, and matches the Truepas liveness backend contract. Recent fixes (stale closure in `runOnJS` wrapper, turn-direction sign swap, explicit Content-Type) have stabilized it.

### 3.2 Payment / card / AutoPay / Basis Theory — NOT adopted

No payment feature in Truepas. Do not copy `paymentService.ts`, `add-card.tsx`, `autopay.tsx`, `transaction-approval.tsx`, or `PaymentCard` / `SlideToAccept` components.

### 3.3 React Query persistence (MMKV/AsyncStorage adapter) — NOT adopted

Auth-gated app; cache persistence is a stale-data liability between accounts. Clearing on login/logout is the safer pattern.

### 3.4 SSE / push notifications — NOT adopted (yet)

No payment streams, no notification feature specced. Revisit only if async verification status updates are added.

---

## 4. Patterns Worth Adopting — Still Open

### 4.1 Resilient auth networking (from v1 §1.1 — still not implemented)

**Facepe pattern** (`src/services/authService.ts:32-75`, `src/network/axiosClient.ts:49-89,181-208`):
- Login retries 3× with exponential backoff on *network* errors only (never 401).
- Single-flight token-refresh queue.
- `SecureStore` read/write retry loops to survive iOS Keychain races.

**Truepas current state** (`src/api/client.ts`):
- Single-flight 401 refresh ✅, auth-endpoint refresh skip ✅ (added since v1).
- No network retry on login/register mutations.
- No `SecureStore` retry wrapper.

**Recommendation:** unchanged from v1 — add `withNetworkRetry` to auth mutations (3 attempts, 500ms/1s/2s, only on `retryable && (status >= 500 || code === 'NETWORK')`) and a 3-attempt retry loop in `secureStorage.ts`.

**Target files:** `src/features/auth/mutations.ts`, `src/services/secureStorage.ts`.

### 4.2 Extract shared `FlippingCard` (from v1 §1.10 — flip exists, extraction pending)

Both document screens carry their own `Animated.Value` + `rotateY` plumbing. Extract `src/components/ui/FlippingCard.tsx` accepting `front`, `back`, `flipped`, `onFlip` and migrate `document/[id].tsx` + `document/verified.tsx`.

### 4.3 Context-aware error formatting (from v1 §1.2 — still not implemented)

`src/api/userMessages.ts` with `getUserMessage(error, context)` does not exist yet. Screens still surface raw messages. Highest-value mappings:
- `'liveness'` context → the 422 field-list body becomes "We couldn't read the liveness data — hold the phone at arm's length and try again."
- `'document'` context → the 503 object-storage message becomes a clear "Document verification is temporarily unavailable" state.

### 4.4 Liveness finalize square-crop (from v1 §1.5 — partial)

Document images are normalized; the liveness **finalize** photo is still sent unprocessed. Add `expo-image-manipulator` center-crop to 640×640 JPEG 0.85 before finalize (confirm size with backend first).

### 4.5 In-app `ConfirmModal` replacing `Alert.alert` (from v1 §1.3 — still open)

Destructive confirmations (delete account, remove family member/document) still use native `Alert.alert`. Add `ConfirmModal` + `useConfirm()` context.

### 4.6 Shared `ProcessingOverlay` (from v1 §1.9 — still open)

`document/processing.tsx` and `family/add/processing.tsx` each have bespoke step-list UIs. Extract a shared component with `mode`, `steps`, `currentStep`, `error`, `onRetry`.

### 4.7 React Query cache clear on login (from v1 §1.8 — still open)

Cache is cleared on logout but not on login. Add `queryClient.clear()` in `useLogin`'s success path.

### 4.8 Liveness camera readiness guard (from v1 §1.4 — partially addressed)

The stale-closure and detection fixes (commits `577f3a3`, `411c57b`) resolved the acute bugs, but there is still no explicit `waitForCameraReady()` guard with a 20s timeout routing to a "Camera unavailable" state.

---

## 5. Backend Blockers (Unchanged — Escalate, Not Frontend Work)

### 5.1 Liveness evidence 422 — BFF drops request body

Full details: `BUG_REPORT_LIVENESS_EVIDENCE.md`.
- App sends valid JSON `{ challenge, step_index, client_ts_ms, duration_ms }` with `Content-Type: application/json` + `X-Session-Token`.
- Liveness service receives **null body** (`"input": null` on every field) → 422.
- Frontend mitigations shipped: explicit Content-Type (`4a0f32b`), fetch fallback (`81d0cd9`). Neither fixes it — the body is dropped in the BFF proxy layer.
- **Required:** BFF team must fix body forwarding on `POST /cb/liveness/v2/challenge/{sessionId}/evidence`.

### 5.2 Document verify 503 — object storage not integrated

Full details: `BUG_REPORT_DOCUMENT_VERIFY.md`.
- App sends `{ frontImageBase64, selfieImageBase64 }` per KYC guide §6.3; BFF replies `503 "Document images are required until object storage integration is complete"`.
- Two backend documents conflict: KYC guide says base64 inline; `CUSTOMER_APP_FRONTEND_INTEGRATION.md` §10 says signed object-upload keys (`customers/{customerId}/...`).
- **Required:** backend must ship the signed object-upload pipeline or enable base64 forwarding, and reconcile the two contract documents.

### 5.3 Login 401 for existing account

Full details: `BACKEND_LOGIN_ISSUE_REPORT.md`.
- `POST /cb/auth/login` returns 401 for `+19076433740` despite registration returning 409 (account exists).
- Frontend mitigations shipped (auth-endpoint refresh skip, identifier normalization, token-missing guard).
- **Required:** backend must check account existence format (E.164 normalization), password hash, and account state; return specific error codes instead of bare 401.

---

## 6. Updated Implementation Plan

### Phase 1 — Quick wins (frontend-only, no backend dependency)

| # | Task | Target files | Effort |
|---|---|---|---|
| 1 | `queryClient.clear()` on login | `src/features/auth/mutations.ts` | XS |
| 2 | Network retry wrapper for auth mutations | `src/features/auth/mutations.ts` | S |
| 3 | `SecureStore` retry loop | `src/services/secureStorage.ts` | S |
| 4 | `getUserMessage(error, context)` formatter | `src/api/userMessages.ts` (new) | S |
| 5 | Liveness finalize 640×640 square-crop | `src/features/liveness/LivenessCamera.tsx` | S |

### Phase 2 — UX consistency (frontend-only)

| # | Task | Target files | Effort |
|---|---|---|---|
| 6 | Extract shared `FlippingCard` | `src/components/ui/FlippingCard.tsx` (new), `document/[id].tsx`, `verified.tsx` | M |
| 7 | Extract shared `ProcessingOverlay` | `src/components/ui/ProcessingOverlay.tsx` (new), both processing screens | M |
| 8 | `ConfirmModal` + `useConfirm()` | `src/components/ui/ConfirmModal.tsx` (new), destructive screens | M |
| 9 | Liveness camera readiness guard + 20s timeout | `src/features/liveness/useLivenessSession.ts` | M |

### Phase 3 — Backend-blocked (escalate; do not build frontend halves)

| # | Task | Blocker |
|---|---|---|
| 10 | Document verify end-to-end | Object storage pipeline / base64 forwarding + contract reconciliation |
| 11 | Liveness evidence end-to-end | BFF body-dropping fix on evidence endpoint |
| 12 | Login for existing accounts | Account lookup normalization + specific error codes |

---

## 7. Summary

**Adopted from Facepe (done):**
- Regula Document Reader native scanner for document read — full adoption including license embedding, Maven plugin, fallback chain, and Expo Go fallback path.
- Flip card document detail/verified screens.
- Image compression pipeline (1600px JPEG 0.8).

**Deliberately NOT adopted (final):**
- **Regula Face SDK for liveness** — Vision Camera + ML Kit stays. This is now a firm architectural decision, not a pending evaluation.
- Payment/card/AutoPay/Basis Theory.
- React Query persistence.
- SSE / push notifications.

**Still worth adopting (open):**
- Resilient auth networking (network retry + SecureStore retry).
- Context-aware error messages (`getUserMessage`).
- Shared `FlippingCard` / `ProcessingOverlay` / `ConfirmModal` components.
- Liveness finalize square-crop and camera readiness guard.
- React Query cache clear on login.

**Backend blockers (escalate):**
- Liveness evidence 422 (BFF drops body).
- Document verify 503 (object storage).
- Login 401 (account lookup/normalization).

---

**Generated with [Devin](https://devin.ai)**
