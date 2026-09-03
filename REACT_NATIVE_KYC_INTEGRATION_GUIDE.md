# React Native KYC Integration Guide — TruePas Customer App (BFF Microservices)

**Audience:** React Native customer-app engineers
**Backend:** `customer-app-bff` (the ONLY host the app calls) + `liveness-service`, `identity-proofing-service`, `face-service`, `customer-account-service` behind it
**Base URL:** `https://api.dev.truepas.com/cb` (local: `http://localhost:8015/cb`)
**Companion contract:** `docs/CUSTOMER_APP_FRONTEND_INTEGRATION.md` (source of truth for endpoints)

Every request/response shape below was verified against the actual service code
(`customer-app-bff/app/main.py`, `liveness-service/app/routes.py`,
`identity-proofing-service/app/document_api.py`), not just the contract doc.

---

## 1. Architecture rules

```text
React Native app
      |
      | HTTPS /cb/*   (Bearer JWT)
      v
customer-app-bff :8015
      |-- customer-account-service :8017   (auth, profile, family)
      |-- identity-proofing-service :8014  (documents + verification sessions + Regula)
      |-- liveness-service :8009           (challenge-response liveness)
      |-- face-service :8008               (face enrollment from liveness frame)
      |-- notification-service :8013
      `-- checkin-consent-service :8012
```

- The app calls **only** the BFF. Never call `/internal/v1/*`, never send
  `X-Internal-Api-Key`, never use internal service hostnames.
- The BFF derives `customerId` / `personId` from the JWT and overrides anything
  you send — never trust client-supplied IDs for authorization.
- Every response carries `X-Request-ID` (echo of yours or server-generated).
  Include `X-Request-ID` on requests and quote it in bug reports.

---

## 2. Onboarding order (mandatory)

```text
register phone -> verify phone OTP -> account details (name, DOB, PIN, email, password)
  -> verify email OTP  ->  biometric consent  ->  liveness challenge
  -> face enrollment   ->  document scan + verification  ->  main tabs
```

Do not expose a skip path for liveness, face enrollment, or biometric consent.
Route gating after login: if `user.faceEnrolled === false` → consent → liveness → enroll.

---

## 3. Setup

### 3.1 Dependencies

```bash
npx expo install expo-secure-store expo-file-system expo-image-manipulator
npm install react-native-vision-camera react-native-vision-camera-face-detector
```

> The liveness flow is a **custom camera + ML Kit** implementation
> (`react-native-vision-camera` + `react-native-vision-camera-face-detector`),
> per `liveness-service/DESIGN.md`. It does **not** use the Regula Face SDK
> native liveness UI and does not need `FaceSDK.serviceUrl`. Regula runs
> server-side (document verification + face match).

### 3.2 Headers

| Header | When |
|---|---|
| `Authorization: Bearer <accessToken>` | every authenticated call |
| `Content-Type: application/json` | JSON calls |
| `X-Session-Token: <sessionToken>` | liveness evidence / finalize / status |
| `X-Request-ID` | optional, any UUID/opaque ≤ 64 chars |

### 3.3 Token rules

- Access token: 15 min, **memory only**.
- Refresh token: 30 days, **`expo-secure-store` only**, rotates on every use —
  replace it atomically. Reusing a rotated token revokes the whole family.
- Never run two refreshes concurrently (single-flight interceptor below).

### 3.4 Error contract

```json
{ "code": "VALIDATION_ERROR", "message": "Request validation failed", "trace_id": "…", "details": [] }
```

| HTTP | Code | App behavior |
|---:|---|---|
| 400 | `BAD_REQUEST` | show flow error, no auto-retry |
| 401 | `UNAUTHORIZED` | one refresh attempt, else logout |
| 403 | `FORBIDDEN` | permission error, no retry |
| 404 | `NOT_FOUND` | not-found state |
| 409 | `CONFLICT` | business conflict (e.g. reused request ID) |
| 413 | `PAYLOAD_TOO_LARGE` | recapture / compress image |
| 422 | `VALIDATION_ERROR` | bind `details` to fields |
| 429 | `RATE_LIMITED` | respect `Retry-After`, disable action |
| 503 | `SERVICE_UNAVAILABLE` | retry UI with bounded backoff |

### 3.5 `src/api/client.ts`

```ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.dev.truepas.com/cb",
  timeout: 30_000,
});

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Single-flight refresh: one refresh at a time, queued requests replay after.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
    );
    await SecureStore.setItemAsync("refreshToken", data.refreshToken);
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    await SecureStore.deleteItemAsync("refreshToken");
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
  if (error.response?.status !== 401 || original._retried) throw error;
  original._retried = true;
  refreshing ??= refreshAccessToken().finally(() => { refreshing = null; });
  const token = await refreshing;
  if (!token) throw error; // session expired -> route to login
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});

export function apiErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string; detail?: string } | undefined;
    return data?.message ?? data?.detail ?? "Network error. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
```

---

## 4. Liveness — challenge-response flow (v2)

### 4.1 How it works

```
App (Vision Camera + ML Kit)                     liveness-service (via BFF)
 │  POST /cb/liveness/v2/challenge               │
 │──────────────────────────────────────────────▶│  randomized sequence, TTL 300s
 │  ◀── session_id, session_token,               │  rate limit: 10 sessions/hour/user
 │      challenge_sequence, ui_copy,             │
 │      step_time_limits                         │
 │
 │  render sequence EXACTLY as returned, e.g. ["turn_left", "blink"]
 │  per step: POST .../evidence  (metadata only — NO image)
 │──────────────────────────────────────────────▶│  validates order + timing
 │  ◀── next_challenge / rejected                │
 │
 │  POST .../finalize  (multipart, high-res frame)
 │──────────────────────────────────────────────▶│  passive anti-spoof (MiniFASNet)
 │  ◀── status: passed | failed                  │  frame stored as verified_image
```

### 4.2 Hard rules

1. **Render the returned `challenge_sequence` in order. Never hard-code it.**
   Order is randomized server-side to defeat replay attacks.
2. **Session TTL is 300 s.** If the user stalls, restart from `/challenge`.
3. **`X-Session-Token` header** (from the create response) on evidence,
   finalize, and status calls. Not the JWT.
4. **Per-step timing:** `duration_ms` must be 300–10000 ms and `client_ts_ms`
   must be **strictly increasing** across steps. Violations fail the session.
5. **Evidence carries no image** — only step metadata. The only image sent is
   the final high-res frame at `finalize`.
6. A rejected step returns **HTTP 200** with `success:false, status:"failed"` —
   handle it in the 2xx path, not the axios error path.
7. **The session is single-use**: face enrollment consumes it. If enrollment
   fails afterwards, you must redo liveness.
8. 10 challenge sessions per user per hour → `429`. Back off, don't loop.

### 4.3 `src/api/liveness.ts`

```ts
import { api, apiErrorMessage } from "./client";

export type Challenge = "blink" | "turn_left" | "turn_right";

export interface LivenessChallenge {
  success: boolean;
  sessionId: string;
  sessionToken: string;
  challengeSequence: Challenge[];
  expiresIn: number;
  stepTimeLimits: { minMs: number; maxMs: number };
  uiCopy: Record<Challenge, string>;
}

export interface EvidenceResult {
  success: boolean;
  stepAccepted: boolean;
  nextChallenge: Challenge | null;
  nextInstruction: string | null;
  status: "in_progress" | "passed" | "failed";
  error?: string;
}

export interface FinalizeResult {
  success: boolean;
  status: "passed" | "failed";
  sessionId?: string;
  antispoofScore?: number | null;
  error?: string;      // e.g. "SPOOF_SUSPECTED"
  message?: string;
}

export async function createLivenessChallenge(personId?: string): Promise<LivenessChallenge> {
  try {
    const { data } = await api.post("/liveness/v2/challenge", null, {
      params: personId ? { personId } : undefined,
    });
    return {
      success: data.success,
      sessionId: data.session_id,
      sessionToken: data.session_token,
      challengeSequence: data.challenge_sequence,
      expiresIn: data.expires_in_seconds,
      stepTimeLimits: {
        minMs: data.step_time_limits.min_ms,
        maxMs: data.step_time_limits.max_ms,
      },
      uiCopy: data.ui_copy,
    };
  } catch (e) { throw new Error(apiErrorMessage(e)); }
}

export async function submitEvidence(params: {
  sessionId: string; sessionToken: string;
  challenge: Challenge; stepIndex: number;
  clientTsMs: number; durationMs: number;
}): Promise<EvidenceResult> {
  const form = new FormData();
  form.append("challenge", params.challenge);
  form.append("step_index", String(params.stepIndex));
  form.append("client_ts_ms", String(params.clientTsMs));
  form.append("duration_ms", String(params.durationMs));
  const { data } = await api.post(
    `/liveness/v2/challenge/${params.sessionId}/evidence`, form,
    { headers: { "X-Session-Token": params.sessionToken } }, // RN sets multipart boundary
  );
  return {
    success: data.success, stepAccepted: data.step_accepted,
    nextChallenge: data.next_challenge, nextInstruction: data.next_instruction,
    status: data.status, error: data.error,
  };
}

export async function finalizeLiveness(params: {
  sessionId: string; sessionToken: string; frameBase64: string;
}): Promise<FinalizeResult> {
  const fileUri = `${(await import("expo-file-system")).cacheDirectory}liveness-frame.jpg`;
  const FileSystem = await import("expo-file-system");
  await FileSystem.writeAsStringAsync(fileUri, params.frameBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const form = new FormData();
  form.append("frame", { uri: fileUri, name: "frame.jpg", type: "image/jpeg" } as unknown as Blob);
  try {
    const { data } = await api.post(
      `/liveness/v2/challenge/${params.sessionId}/finalize`, form,
      { headers: { "X-Session-Token": params.sessionToken } },
    );
    return {
      success: data.success, status: data.status, sessionId: data.session_id,
      antispoofScore: data.antispoof_score, error: data.error, message: data.message,
    };
  } catch (e) { throw new Error(apiErrorMessage(e)); }
}

export async function getLivenessStatus(sessionId: string, sessionToken: string) {
  const { data } = await api.get(`/liveness/v2/challenge/${sessionId}`, {
    headers: { "X-Session-Token": sessionToken },
  });
  return data; // { success, session_id, status, current_step, challenge_sequence, has_verified_image, antispoof_score }
}
```

### 4.4 `src/features/liveness/useLivenessChallenge.ts` — the state machine

```ts
import { useCallback, useRef, useState } from "react";
import {
  Challenge, LivenessChallenge, FinalizeResult,
  createLivenessChallenge, submitEvidence, finalizeLiveness,
} from "../../api/liveness";

export type LivenessPhase =
  | "idle" | "creating" | "performing" | "finalizing" | "passed" | "failed";

interface FaceSample {
  leftEyeOpen: number;   // 0..1, ML Kit probability
  rightEyeOpen: number;  // 0..1
  yaw: number;           // headEulerAngleY degrees
  ts: number;
}

export function useLivenessChallenge(personId?: string) {
  const [phase, setPhase] = useState<LivenessPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<LivenessChallenge | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const stepStartedAt = useRef<number>(0);
  const lastClientTs = useRef<number>(0);
  const eyesWereClosed = useRef(false);
  const yawPeak = useRef(0);

  const start = useCallback(async () => {
    setError(null); setPhase("creating");
    try {
      const c = await createLivenessChallenge(personId);
      setChallenge(c); setCurrentStep(0); setPhase("performing");
      beginStep();
    } catch (e) { setError((e as Error).message); setPhase("failed"); }
  }, [personId]);

  const beginStep = () => {
    stepStartedAt.current = Date.now();
    eyesWereClosed.current = false;
    yawPeak.current = 0;
  };

  /** Feed every camera frame here (throttled to ~10 Hz is enough). */
  const onFaceSample = useCallback(async (s: FaceSample) => {
    if (phase !== "performing" || !challenge) return;
    const action = challenge.challengeSequence[currentStep];
    if (!action) return;

    if (action === "blink") {
      // blink = eyes closed, then open again
      if (s.leftEyeOpen < 0.35 && s.rightEyeOpen < 0.35) eyesWereClosed.current = true;
      if (!eyesWereClosed.current || s.leftEyeOpen < 0.6 || s.rightEyeOpen < 0.6) return;
    } else {
      // turn = |yaw| must cross the threshold; sign picks the direction
      const threshold = 12; // calibrate on device
      if (action === "turn_left" && s.yaw > -threshold) return;
      if (action === "turn_right" && s.yaw < threshold) return;
      yawPeak.current = Math.max(yawPeak.current, Math.abs(s.yaw));
    }

    const durationMs = Date.now() - stepStartedAt.current;
    const { minMs, maxMs } = challenge.stepTimeLimits;
    if (durationMs < minMs) return;            // too fast — keep waiting
    if (durationMs > maxMs) {                  // too slow — step timed out
      setError("Too slow — the check timed out. Please try again.");
      setPhase("failed"); return;
    }

    const clientTsMs = Math.max(s.ts, lastClientTs.current + 1); // strictly increasing
    lastClientTs.current = clientTsMs;

    const result = await submitEvidence({
      sessionId: challenge.sessionId, sessionToken: challenge.sessionToken,
      challenge: action, stepIndex: currentStep,
      clientTsMs, durationMs,
    });

    if (!result.stepAccepted) {                // HTTP 200 rejection
      setError(result.error ?? "Step rejected. Please restart the check.");
      setPhase("failed"); return;
    }
    if (result.nextChallenge) { setCurrentStep((i) => i + 1); beginStep(); }
  }, [phase, challenge, currentStep]);

  /** Call once the last step is accepted — frame = high-res JPEG base64. */
  const complete = useCallback(async (frameBase64: string): Promise<FinalizeResult> => {
    if (!challenge) throw new Error("No active liveness session");
    setPhase("finalizing");
    try {
      const result = await finalizeLiveness({
        sessionId: challenge.sessionId, sessionToken: challenge.sessionToken, frameBase64,
      });
      setPhase(result.status === "passed" ? "passed" : "failed");
      if (result.status === "failed") {
        setError(result.error === "SPOOF_SUSPECTED"
          ? "We couldn't verify it's really you. Try again in good lighting."
          : result.message ?? "Liveness failed. Please try again.");
      }
      return result;
    } catch (e) { setError((e as Error).message); setPhase("failed"); throw e; }
  }, [challenge]);

  const reset = useCallback(() => {
    setPhase("idle"); setError(null); setChallenge(null); setCurrentStep(0);
  }, []);

  return { phase, error, challenge, currentStep, start, onFaceSample, complete, reset };
}
```

### 4.5 `LivenessScreen.tsx` — camera wiring

```tsx
import React, { useEffect } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { detectFaces, useFaceDetector } from "react-native-vision-camera-face-detector";
import { useLivenessChallenge } from "../features/liveness/useLivenessChallenge";

export function LivenessScreen({ onPassed, personId }: {
  onPassed: (result: { sessionId: string; sessionToken: string; frameBase64: string }) => void;
  personId?: string;
}) {
  const device = useCameraDevice("front");
  const { phase, error, challenge, currentStep, start, onFaceSample, complete, reset } =
    useLivenessChallenge(personId);
  const faceDetector = useFaceDetector({ performanceMode: "fast", landmarkMode: "none" });

  useEffect(() => { Camera.requestCameraPermission(); }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const faces = faceDetector.detectFaces(frame);
    const face = faces[0];
    if (!face) return;
    // Throttle: forward ~10 samples/sec, not all 30/60 fps frames
    if (frame.timestamp * 1000 % 100 > 10) return;
    const sample = {
      leftEyeOpen: face.leftEyeOpenProbability ?? 1,
      rightEyeOpen: face.rightEyeOpenProbability ?? 1,
      yaw: face.headEulerAngleY ?? 0,
      ts: Date.now(),
    };
    runOnJS(onFaceSample)(sample);
  }, [onFaceSample, phase, currentStep]);

  if (phase === "passed") return <Text>Liveness passed</Text>;
  if (phase === "creating" || phase === "finalizing") return <ActivityIndicator />;
  if (!device) return <Button title="Start liveness" onPress={start} />;

  const action = challenge?.challengeSequence[currentStep];
  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} device={device} isActive photo frameProcessor={frameProcessor} />
      <Text>{action ? challenge?.uiCopy[action] : ""}</Text>
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      {phase === "failed"
        ? <Button title="Retry" onPress={() => { reset(); start(); }} />
        : null}
    </View>
  );
}
```

> **Calibrate on real devices:** ML Kit's `headEulerAngleY` sign/direction and
> eye-open probability ranges vary by device and lighting. Tune the blink
> threshold (0.35/0.6) and yaw threshold (12°) empirically before release, and
> always run the full flow against the dev backend.

---

## 5. Face enrollment

The selfie is **never uploaded by the app**. The frame captured at `finalize`
is stored server-side as the verified image; enrollment consumes it.

### 5.1 When the app must collect a face (and when it must not)

**Account owner (during registration):** face enrollment is a mandatory,
post-signup step — never skipped:

```text
email OTP verified → AuthResponse (faceEnrolled: false)
  → biometric consent   POST /cb/user/me/biometric-consent  { "accepted": true }
  → liveness challenge  POST /cb/liveness/v2/challenge        (no personId)
  → face enrollment     POST /cb/face/enroll                  (no personId)
  → main tabs
```

Route by `user.faceEnrolled` after every login: `false` → force the
consent → liveness → enroll sequence before anything else.

**Face update (account owner):** requires a fresh liveness session **plus PIN
verification** — `POST /cb/auth/verify-pin` `{ "pin": "1234" }` first, then a
new challenge, then `PUT /cb/face`.

**Consent withdrawal:** `POST /cb/user/me/biometric-consent` with
`{ "accepted": false }` removes face templates server-side and sets
`faceEnrolled: false`. The app must fall back to the mandatory
consent/enrollment gating.

**Family members — ask for a photo ONLY in the 5–17 band** (enforced
server-side; the BFF returns `422` for any other `personId`):

| Age band | Add member | Document | Liveness + face photo | Notes |
|---|---|---|---|---|
| **0–4** | allowed | required (birth certificate) | **NO — do not ask** | no liveness endpoint call, no enroll; `checkin_frozen` until doc verified |
| **5–17** | allowed | required first (member starts `pending_document`) | **YES — after document is verified** | pass `personId` on challenge + enroll |
| **18+** | **rejected** (`422` "Family members must be under 18") | — | — | they must register their own account |

Sequence for a 5–17 member: add member (`POST /cb/family`) → document
verification (section 6, with `personId`) → once `verification: "verified"` →
liveness challenge with `?personId=` → `POST /cb/face/enroll` with `personId`.
For 0–4, stop after document verification — never render a camera step.

### 5.2 `POST /cb/face/enroll` (first enrollment) / `PUT /cb/face` (update)

```json
{ "livenessSessionId": "lx-session", "sessionToken": "<sessionToken>", "personId": "optional-family-person-id" }
```

- `personId` only for family members aged 5–17 (validated server-side; others → 422).
- Response: `{ "ok": true, "faceEnrolled": true, "faceId": "face-id" }`.
- The liveness image is **consumed once**. If enrollment fails after
  consumption (face-service hiccup, 4xx), **restart liveness** — do not retry
  enroll with the same session.

### 5.3 `src/api/face.ts`

```ts
import { api, apiErrorMessage } from "./client";

export async function enrollFace(params: {
  livenessSessionId: string; sessionToken: string; personId?: string; update?: boolean;
}): Promise<{ ok: boolean; faceEnrolled: boolean; faceId: string | null }> {
  const { livenessSessionId, sessionToken, personId, update } = params;
  try {
    const { data } = await (update ? api.put("/face", { livenessSessionId, sessionToken, personId })
                                   : api.post("/face/enroll", { livenessSessionId, sessionToken, personId }));
    return data;
  } catch (e) { throw new Error(apiErrorMessage(e)); }
}
```

Wire-up after liveness passes:

```ts
const enrollment = await enrollFace({
  livenessSessionId: livenessResult.sessionId,
  sessionToken: sessionTokenFromChallenge,
});
if (!enrollment.faceEnrolled) { /* restart liveness */ }
```

---

## 6. Documents — scan, verification session, verify, poll

### 6.1 Document types (exact public values)

```typescript
type DocumentType =
  | 'passport' | 'drivingLicense' | 'idCard'
  | 'greenCard' | 'birthCertificate' | 'usVisa';
```

Send only these values — the BFF maps them to internal codes. Internal
snake-case values (`drivers_license`, `id_card`, …) are rejected with 422.

### 6.2 Which documents need a face match (selfie vs document photo)

Face match happens **only when the app sends `selfieImageBase64`** in the
verify call — the backend passes it to Regula as `livePortrait`
(`identity-proofing-service/app/regula_provider.py`). Rules per type
(from `DEFAULT_DOCUMENT_TYPES`):

| Document (`type`) | Has portrait → face match? | Authenticity gate | Who can use |
|---|---|---|---|
| `passport` | **Yes — always send selfie** | enforced | adults + minors |
| `drivingLicense` | **Yes — always send selfie** | enforced | adults only (`allowed_for_minors: false`) |
| `idCard` | **Yes — always send selfie** | enforced | adults + minors |
| `greenCard` | **Yes — always send selfie** | enforced | adults + minors |
| `usVisa` | **Yes — always send selfie** | enforced | adults + minors |
| `birthCertificate` | **No — no portrait, do not send selfie** | **skipped** (`skip_authenticity_gate: true`) | **minors only** (`allowed_for_adults: false`) |

Practical frontend rules:

- For every document **with a portrait**, always include
  `selfieImageBase64` (the frame from the liveness `finalize` step) —
  otherwise `faceMatchScore` is missing and approval quality drops.
- For `birthCertificate` (0–4 band), send **only** `frontImageBase64` —
  there is nothing to match a face against, and no liveness is required.
- `drivingLicense` must not be offered for minors.
- `aadhaar` / `pan` exist in internal policy (`verification_flow: "india"`,
  authenticity gate skipped) but are **not reachable through the customer
  BFF** today — do not render them in the app until the public enum expands.

### 6.3 The flow

```
1. POST /cb/documents                                  → documentId (metadata, status pending)
2. POST /cb/documents/{documentId}/verification-sessions → sessionId (status "created")
3. POST /cb/document-verification-sessions/{sessionId}/verify
      body: { frontImageBase64, backImageBase64?, selfieImageBase64? }
   → SYNCHRONOUS result: completed session + outcome + document
4. GET /cb/document-verification-sessions/{sessionId}   → recovery poll only
```

Key facts (verified in `identity-proofing-service/app/document_api.py`):

- **Step 3 is synchronous.** The Regula DocReader runs server-side and the
  verify response already contains the final `outcome`. Polling (step 4) is a
  **recovery mechanism** (app killed mid-request), not a required wait loop.
- `frontImageBase64` is **required** — omitting it returns `503`.
- Each base64 field is capped at ~14 MB — compress via `expo-image-manipulator`
  (resize to ~1600 px, JPEG quality 0.8) before sending.
- `selfieImageBase64`: pass the **same final liveness frame** so the face-match
  score is computed. Without it, `faceMatchScore` may be missing.
- Sessions expire after **30 minutes** (`expiresAt` in the response).
- `requestId` is an idempotency key: reusing it returns the existing session;
  reusing it with a **different** document returns `409`.
- `frontObjectKey`/`backObjectKey`/`selfieObjectKey` are **NOT for base64
  images**. They are reserved for the future signed-upload pipeline and must
  start with `customers/{customerId}/` or the BFF rejects with 400. Leave them
  out until that pipeline ships.
- Retrying `/verify` on a completed session is safe — it returns the existing
  result without reprocessing.

### 6.4 Outcomes and reason codes

| `outcome` | `reasonCode` | Meaning | UI |
|---|---|---|---|
| `approved` | `null` | Document authentic, security checks passed | success |
| `rejected` | `authenticity_failed` | security/ authenticity check failed | reject, allow recapture |
| `rejected` | `document_processing_error` | image unreadable / Regula error | ask for a better photo |
| `review` | `manual_review` | needs manual review | "under review" pending state |

The verify response also carries `document` with the updated `status`
(`verified` | `failed` | `pending`) and `matchScore`.

### 6.5 `src/api/documents.ts`

```ts
import { api, apiErrorMessage } from "./client";

export type DocumentType = 'passport' | 'drivingLicense' | 'idCard'
  | 'greenCard' | 'birthCertificate' | 'usVisa';

export interface IdentityDocument {
  id: string; type: DocumentType; label: string;
  number: string;            // masked, e.g. "•••••6789"
  status: "pending" | "verified" | "failed" | "removed";
  matchScore: number | null;
  addedAt: string; expiresAt: string | null;
  source: "uploaded" | "issued";
  personId: string;
}

export interface VerificationSession {
  sessionId: string; documentId: string;
  status: "created" | "completed";
  outcome: "approved" | "rejected" | "review" | null;
  reasonCode: string | null;
  providerReference: string | null;
  expiresAt: string;
  decisionId?: string;
  document?: IdentityDocument;
}

export async function addDocument(body: {
  type: DocumentType; label: string; number: string;
  expiresAt?: string; personId?: string;
}): Promise<IdentityDocument> {
  try {
    const { data } = await api.post("/documents", body);
    return data;
  } catch (e) { throw new Error(apiErrorMessage(e)); }
}

export async function createVerificationSession(documentId: string, requestId: string) {
  try {
    const { data } = await api.post(`/documents/${documentId}/verification-sessions`, { requestId });
    return data as VerificationSession; // { sessionId, documentId, status: "created", outcome, expiresAt }
  } catch (e) { throw new Error(apiErrorMessage(e)); }
}

export async function verifyDocumentSession(params: {
  sessionId: string;
  frontImageBase64: string;
  backImageBase64?: string;
  selfieImageBase64?: string;
}): Promise<VerificationSession & { decisionId?: string; document?: IdentityDocument }> {
  try {
    const { data } = await api.post(
      `/document-verification-sessions/${params.sessionId}/verify`,
      {
        frontImageBase64: params.frontImageBase64,
        backImageBase64: params.backImageBase64,
        selfieImageBase64: params.selfieImageBase64,
      },
      { timeout: 90_000 }, // Regula processing can take a while
    );
    return data;
  } catch (e) { throw new Error(apiErrorMessage(e)); }
}

export async function pollVerificationSession(sessionId: string): Promise<VerificationSession> {
  const { data } = await api.get(`/document-verification-sessions/${sessionId}`);
  return data; // { sessionId, documentId, status, outcome, reasonCode, providerReference, expiresAt }
}
```

### 6.6 `src/features/documents/useDocumentVerification.ts`

```ts
import { useCallback, useState } from "react";
import {
  VerificationSession, addDocument, createVerificationSession,
  pollVerificationSession, verifyDocumentSession,
} from "../../api/documents";

export type DocPhase = "idle" | "scanning" | "creating" | "verifying" | "done" | "failed";

export function useDocumentVerification() {
  const [phase, setPhase] = useState<DocPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (input: {
    documentId: string;
    frontBase64: string;
    backBase64?: string;
    selfieBase64?: string;   // pass the liveness final frame
  }) => {
    setError(null);
    try {
      setPhase("scanning");
      // 1. create session (requestId = idempotency; safe to retry step 2+3)
      const session = await createVerificationSession(params.documentId, uuid());
      // 2. verify — SYNCHRONOUS result
      const result = await verifyDocumentSession({
        sessionId: session.sessionId,
        frontImageBase64: params.frontBase64,
        backImageBase64: params.backBase64,
        selfieImageBase64: params.selfieBase64,
      });
      setPhase("verifying");
      if (result.status === "completed") { setPhase("done"); return result; }
      // 3. rare: response lost / app killed — recover via poll
      const polled = await pollVerificationSession(result.sessionId);
      setPhase(polled.status === "completed" ? "completed" : "pending");
      return polled;
    } catch (e) { setError(apiErrorMessage(e)); setPhase("error"); throw e; }
  }, []);
}
```

(Adapt names to your codebase — the important part is: **verify returns the
final outcome; poll only to recover, with a small retry budget**.)

### 6.7 Recovery poll semantics

`GET /cb/document-verification-sessions/{sessionId}`:

```json
{
  "sessionId": "…", "documentId": "…",
  "status": "created" | "completed",
  "outcome": "approved" | "rejected" | "review" | null,
  "reasonCode": "authenticity_failed | document_processing_error | manual_review | null",
  "providerReference": "…", "expiresAt": "2026-09-03T12:00:00Z"
}
```

On app launch, if a scan was in flight: poll once — if `completed`, show the
stored outcome; if `created` past `expiresAt`, restart the document flow.

---

## 7. Identity summary & gating

```http
GET /cb/identity/summary
```

```json
{ "status": "incomplete", "face": "verified", "document": "missing", "selfieMatch": "missing", "activity": [] }
```

- `status` is `verified` only when **both** face enrollment and document
  proofing are verified.
- Invalidate `['identity','summary']`, `['documents']` after document
  verification, face enrollment/update, or consent withdrawal.
- On logout / account deletion, clear all customer-scoped React Query caches.

---

## 8. ⚠️ Corrections to the current pending-integrations plan

The pending-integrations notes propose contracts that **do not exist** on the
BFF. Align the app with the implemented backend instead:

| Pending item | Reality on the BFF | What the app should do |
|---|---|---|
| #2 — `POST /face/enroll` with `{ selfieBase64, livenessPassed, personId }` | Not implemented, and **should not be**: the selfie comes from the server-side liveness finalize frame (anti-spoof scored), not from client-claimed fields | Send only `{ livenessSessionId, sessionToken, personId? }`. Drop `selfieBase64`/`livenessPassed` |
| #3b — polling: "backend doesn't set `completed`" | It does — `/verify` returns the completed session synchronously; `GET …/{id}` returns `created`/`completed` + `outcome` | Remove the simulated 3-poll fallback. Treat `/verify` as the result; poll only for crash recovery |
| #5 — base64 images in `frontObjectKey`/`selfieObjectKey` | Object keys must start with `customers/{customerId}/` (BFF 400s otherwise); base64 belongs in the `/verify` body | Send images as `frontImageBase64`/`backImageBase64`/`selfieImageBase64` in the verify call; omit object keys until the signed-upload pipeline exists |
| #10 — "server-side liveness unused, delete it" | The v2 challenge flow **is** the server-side liveness for this platform | Do not delete; it is the required path for enrollment + document proofing |

---

## 9. Testing checklist

Auth
- [ ] Register → phone OTP → account details → email OTP → consent → liveness → enroll → tabs.
- [ ] Refresh rotation: kill app mid-flow, refresh token still valid; replayed request succeeds.
- [ ] Reused (rotated) refresh token → whole family revoked → login screen.

Liveness
- [ ] Challenge sequence differs between sessions (randomized).
- [ ] Blink and head-turn both detected on low-end Android + iOS.
- [ ] Step faster than 300 ms is not submitted; slower than 10 s fails gracefully.
- [ ] Session left open > 5 min → restart works, no stale-token 403.
- [ ] 11th session within an hour → 429 handled with cooldown UI.
- [ ] `SPOOF_SUSPECTED` (photo of a photo) → friendly retry message.
- [ ] Cancel camera mid-flow → no crash, retry starts a fresh session.

Face enrollment
- [ ] Enroll succeeds right after finalize; `faceId` returned.
- [ ] Enroll with a consumed/expired session → clear error → restart liveness.
- [ ] Family member 5–17 with `personId` enrolls; 18+ → 422 at creation; 0–4 has no camera/enroll UI at all.
- [ ] 0–4 member: birth certificate verifies → member `verification: "verified"`; no liveness call ever made.
- [ ] 5–17 member: document first → then liveness `?personId=` → enroll with `personId`.
- [ ] Selfie included in `/verify` for portrait documents; omitted for `birthCertificate`.
- [ ] `drivingLicense` not offered for minors; `aadhaar`/`pan` not rendered.

Documents
- [ ] All six public `DocumentType` values accepted; internal codes rejected with 422.
- [ ] Verify without `frontImageBase64` → 503 handled with guidance.
- [ ] Approved → document `status: verified`, `matchScore` present, identity summary flips to `verified`.
- [ ] Rejected (`authenticity_failed`) → reason shown, recapture allowed.
- [ ] `review` → pending state, no dead end.
- [ ] App killed after session create → poll recovers state; after 30 min → session expired path.
- [ ] Image > 14 MB → 413 → compress + retry.

Platform
- [ ] Only `https://api.dev.truepas.com/cb` is called; no `/internal/v1/*`, no `X-Internal-Api-Key`.
- [ ] `X-Request-ID` echoed by server is attached to bug reports.
