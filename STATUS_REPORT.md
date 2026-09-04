# Truepas App — Status Report

**Date:** Sep 4, 2026
**Branch:** `main` (latest: `adfc2b1`)
**Backend:** `https://api.dev.truepas.com/cb` (customer-app-bff)
**Mock API:** Disabled — app runs 100% on real backend (`EXPO_PUBLIC_USE_MOCK_API=false`, `EXPO_PUBLIC_FALLBACK_TO_MOCK=false`)

---

## 1. WHAT IS WORKING ✅

### Build & Infrastructure
| Item | Status | Notes |
|---|---|---|
| EAS Android build | ✅ FIXED | Build `3208d5da` succeeded. Fixes: `.npmrc` (legacy-peer-deps), lock file sync, `react-native-nitro-image` peer dep added |
| npm ci on EAS | ✅ WORKING | `.npmrc` with `legacy-peer-deps=true` — EAS install phase passes |
| Metro bundler | ✅ WORKING | App bundles (2342 modules), no resolution errors |
| Native modules | ✅ FIXED | `react-native-worklets@0.10.4`, `react-native-nitro-modules@0.37.1`, `react-native-nitro-image@0.15.2`, `react-native-vision-camera-worklets` all compiled into the build |
| TypeScript | ✅ CLEAN | No errors in changed files (pre-existing errors in `(tabs)/_layout.tsx`, `documents.tsx`, `family.tsx` remain — see Issues) |

### Auth Flow
| Item | Status | Notes |
|---|---|---|
| Registration flow | ✅ WORKING | register → verify-phone (registrationId) → account-details → verify-email → session started |
| OTP verification | ✅ WORKING | Uses `registrationId`; handles camelCase + snake_case token fields |
| Login screen | ✅ IMPROVED | Country code selector (default +1), phone auto-normalization |
| 401 refresh loop | ✅ FIXED | Auth endpoints (login/register/verify-otp) no longer trigger token refresh on 401 |
| Redux state | ✅ WORKING | No persistence — clean state on app restart |

### API Layer
| Item | Status | Notes |
|---|---|---|
| All BFF routes exist | ✅ VERIFIED | Tested with curl — every endpoint returns 401 (auth required), NOT 404: `/documents`, `/documents/{id}/verification-sessions`, `/document-verification-sessions/{id}/verify`, `/liveness/v2/challenge`, `/liveness/v2/challenge/{id}/evidence`, `/liveness/v2/challenge/{id}/finalize`, `/face/enroll`, `/identity/summary` |
| Mock removal | ✅ DONE | No mock fallback; real API only |
| Error logging | ✅ ADDED | Dev-only `[API]` logging in `toApiError()` — shows method, URL, status, response body in Metro logs |

---

## 2. WHAT IS NOT WORKING ❌

### 2.1 Login (BLOCKER — backend issue)
- **Status:** Login returns 401 with valid credentials
- **Detail:** Full report in `BACKEND_LOGIN_ISSUE_REPORT.md` (commit `1d9c1e4`)
- **Workaround:** None — waiting on backend team
- **App-side mitigations already done:** phone normalization, country code, no refresh-loop on auth 401s

### 2.2 Face Scan — FaceDetector crash (FIX APPLIED, NEEDS TESTING)
- **Status:** Was crashing every frame: `Only JPEG and YUV_420_888 are supported now`
- **Root cause:** `useFrameOutput` gives RGBA buffers; ML Kit needs YUV_420_888/JPEG
- **Fix (commit `adfc2b1`):** Switched to `createFaceDetectorOutput()` — dedicated CameraOutput with library-managed YUV stream
- **Next:** Test on device — JS-only change, Metro reload suffices

### 2.3 404 After Document Scan + Face Scan (NEEDS DIAGNOSIS)
- **Status:** API 404 error message shown on screen after both scans
- **Diagnosis blocked:** Exact endpoint unknown — user reported face scan crashed, so flow never completed normally
- **Next:** Re-test after FaceDetector fix; the new `[API]` logging will show the exact failing URL + response body

### 2.4 Face Update Flow — Product Decision Pending
- **Current behavior:** Full liveness challenge (blink/turn) + PIN → `PUT /cb/face`
- **Requested behavior:** Photo capture only, NO liveness
- **Conflict:** Backend contract (`KYC guide §5.2`) requires `livenessSessionId` + `sessionToken` — face image comes from the liveness finalize frame (anti-spoof scored server-side). Photo-only update is NOT supported by the current backend.
- **Options:**
  1. Backend adds photo acceptance to `PUT /cb/face` (contract change)
  2. Silent liveness (auto-session + auto-finalize) — likely fails backend evidence validation
  3. Keep liveness but reduce to 1 quick step
- **Decision needed from:** user + backend team

---

## 3. OPEN ISSUES 📋

| # | Issue | Severity | Owner | Status |
|---|---|---|---|---|
| 1 | Login 401 with valid credentials | 🔴 BLOCKER | Backend | Reported (`BACKEND_LOGIN_ISSUE_REPORT.md`) |
| 2 | 404 after document+face scan | 🔴 HIGH | App+Backend | Awaiting re-test with new logging |
| 3 | FaceDetector frame format crash | 🟠 HIGH | App | Fix applied (`adfc2b1`), needs device test |
| 4 | Face update: liveness vs photo-only | 🟡 MEDIUM | Product+Backend | Decision pending |
| 5 | Mismatch screen shows "—" for document name | 🟡 MEDIUM | Backend | Backend must return `extractedName`/`extractedDob` in verify response (app ready — commit `6348358`) |
| 6 | Pre-existing TS errors in `(tabs)/_layout.tsx`, `documents.tsx`, `family.tsx` | 🟢 LOW | App | Not blocking; cleanup task |
| 7 | EAS build overage charges ($22+, 70 builds) | 🟢 INFO | Billing | Pay-as-you-go; consider local builds or `EAS_SKIP_AUTO_FINGERPRINT=1` |
| 8 | `cli.appVersionSource` not set in `eas.json` | 🟢 LOW | App | Warning only; set `"appVersionSource": "remote"` to silence |

---

## 4. WHAT CHANGED THIS SESSION (commits)

| Commit | Change |
|---|---|
| `5daf1d4` | Added `react-native-vision-camera-worklets`, removed `react-native-worklets-core` |
| `a0bcaf2` | Bumped `react-native-worklets` to 0.10.4 (reanimated 4.5.1 compat) |
| `d13dfdd` | Migrated LivenessCamera imports (`Worklets.createRunOnJS` → `runOnJS`) |
| `d4a6905` | Added `react-native-nitro-modules` |
| `3257f5f` | Synced lock file + `.npmrc` (fixed EAS `npm ci` failures) |
| `03d3fa8` | Added `react-native-nitro-image` (missing peer dep — was causing Gradle failure) |
| `6348358` | Mismatch screen shows real profile vs document data (was hardcoded "Jane Doe") |
| `adfc2b1` | FaceDetectorOutput migration (fixes frame format crash) + API error logging |

---

## 5. RECOMMENDED NEXT STEPS

1. **Test face scan on device** (Metro reload only — no new build needed) → verifies FaceDetector fix
2. **Reproduce the 404** → share the `[API]` log line from Metro (has exact URL + body)
3. **Backend team:** login 401 fix + `extractedName`/`extractedDob` in verify response
4. **Decide face-update contract** (photo-only vs liveness) before implementing
5. **Optional:** set `cli.appVersionSource: "remote"` in `eas.json` to silence the warning
