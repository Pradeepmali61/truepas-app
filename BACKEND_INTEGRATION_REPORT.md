# Truepas Customer App — Backend Integration Report

**Date:** 2 September 2026  
**Contract version:** 1.1.0  
**Frontend commit:** `117f193`  
**Prepared for:** Backend Engineering Team  
**Prepared by:** Frontend Engineering Team

---

## 1. Executive Summary

The Truepas customer app frontend has been fully integrated with the backend contract defined in `CUSTOMER_APP_FRONTEND_INTEGRATION.md` v1.1.0. All API types, endpoints, screens, and flows are wired and code is pushed to the repository. The BFF (`customer-app-bff`) is healthy and responding, but downstream `customer-account-service` is returning **503** in the dev environment, blocking end-to-end testing of auth flows.

**Integration completion: ~90%**  
**Blocking issue: `customer-account-service` down in dev (503)**

---

## 2. What's Working (Verified)

| Check | Status | Details |
|---|---|---|
| BFF health check | ✅ Working | `GET /cb/health` returns `{"status":"healthy","service":"truepass-customer-app-bff","version":"1.0.0"}` |
| BFF routing (protected endpoints) | ✅ Working | `GET /cb/user/me` and `GET /cb/documents` return **401** without token — routing and auth middleware functional |
| Error contract format | ✅ Working | 503 response returns proper `{"code":"CUSTOMER_SERVICE_UNAVAILABLE","message":"...","trace_id":"..."}` format |
| Mock fallback | ✅ Working | App automatically falls back to mock data on 503/network errors (`FALLBACK_TO_MOCK=true`) |

---

## 3. What's Not Working (Blocking)

| Endpoint | HTTP Status | Issue |
|---|---|---|
| `POST /cb/auth/register` | **503** | `CUSTOMER_SERVICE_UNAVAILABLE` — downstream `customer-account-service :8017` is down |
| `POST /cb/auth/login` | **503** | Same — downstream service unavailable |

**Root cause:** `customer-account-service` is not running/started in the dev environment. The BFF correctly proxies the request but the downstream service returns no response.

**Action needed from backend:** Start `customer-account-service` in dev environment.

---

## 4. Frontend Integration — Completed Items

### 4.1 Registration Flow (Reordered per Contract Section 6)

```
register → verify-phone → account-details → verify-email → consent → liveness → face enroll → tabs
```

| Step | Endpoint | Frontend Status |
|---|---|---|
| 1. Register phone | `POST /cb/auth/register` | ✅ Wired — sends `{phone, countryCode}`, expects `RegisterResponse` with `registrationId` + `nextStep` |
| 2. Verify phone OTP | `POST /cb/auth/verify-otp` | ✅ Wired — sends `{phone, countryCode, otp, purpose:"phone"}`, stores `registrationToken` in memory |
| 3. Account details | `POST /cb/auth/account-details` | ✅ Wired — sends `{fullName, dateOfBirth, pin, email, password, confirmPassword}` with `registrationToken` as Bearer, expects `AccountDetailsResponse` with `nextStep:"verifyEmail"` |
| 4. Verify email OTP | `POST /cb/auth/verify-otp` | ✅ Wired — sends `{email, otp, purpose:"email"}`, expects `AuthResponse` (user + tokens), dispatches `sessionStarted`, navigates to consent |
| 5. Biometric consent | `POST /cb/user/me/biometric-consent` | ✅ Wired — sends `{accepted: true}`, decline option removed (mandatory) |
| 6. Liveness challenge | `POST /cb/liveness/v2/challenge` | ✅ Wired — creates challenge, renders server-provided `challenge_sequence` |
| 7. Liveness evidence | `POST /cb/liveness/v2/challenge/{sessionId}/evidence` | ✅ Wired — submits multipart frame per step with `X-Session-Token` header |
| 8. Liveness finalize | `POST /cb/liveness/v2/challenge/{sessionId}/finalize` | ✅ Wired — submits high-res JPEG frame, expects `LivenessFinalizeResponse` |
| 9. Face enroll | `POST /cb/face/enroll` | ✅ Wired — sends `{livenessSessionId, sessionToken}`, expects `FaceResponse` |

### 4.2 Login & Recovery

| Feature | Endpoint | Frontend Status |
|---|---|---|
| Login | `POST /cb/auth/login` | ✅ Wired — sends `{identifier, password}`, persists `refreshToken` to secure storage |
| Forgot password | `POST /cb/auth/forgot-password` | ✅ Wired — sends `{email}` |
| Verify reset OTP | `POST /cb/auth/verify-otp` | ✅ Wired — sends `{email, otp, purpose:"password_reset"}` |
| Reset password | `POST /cb/auth/reset-password` | ✅ Wired — sends `{email, otp, newPassword}` |
| Logout | `POST /cb/auth/logout` | ✅ Wired — sends `{refreshToken}`, clears Redux + secure storage + React Query caches |
| Token refresh | `POST /cb/auth/refresh` | ✅ Wired — single-flight interceptor, atomically replaces refresh token |

### 4.3 Profile & Security

| Feature | Endpoint | Frontend Status |
|---|---|---|
| Get profile | `GET /cb/user/me` | ✅ Wired |
| Update profile | `PUT /cb/user/me` | ✅ Wired — sends `{fullName, dateOfBirth, address}` (email/phone read-only per contract) |
| Change password | `POST /cb/auth/change-password` | ✅ Wired — on success, clears session and redirects to login (token version stale) |
| Verify PIN | `POST /cb/auth/verify-pin` | ✅ Wired — sends `{pin}` |
| Change PIN | `POST /cb/auth/change-pin` | ✅ Wired — sends `{currentPin, newPin}` |
| Delete account | `DELETE /cb/user/me` | ✅ Wired — sends `{confirmation:"DELETE", pin}` body |

### 4.4 Family

| Feature | Endpoint | Frontend Status |
|---|---|---|
| List family | `GET /cb/family` | ✅ Wired |
| Get family member | `GET /cb/family/{personId}` | ✅ Wired |
| Add family member | `POST /cb/family` | ✅ Wired — sends `{name, dateOfBirth, relationship}` |
| Remove family member | `DELETE /cb/family/{personId}` | ✅ Wired |
| Family activity | `GET /cb/family/{personId}/activity` | ✅ Wired |
| Family face enroll | `POST /cb/face/enroll` with `personId` | ✅ Wired — liveness challenge with `personId` query param, enroll with `personId` |

### 4.5 Documents

| Feature | Endpoint | Frontend Status |
|---|---|---|
| List documents | `GET /cb/documents` | ✅ Wired — supports optional `?personId=` query |
| Get document | `GET /cb/documents/{documentId}` | ✅ Wired |
| Add document | `POST /cb/documents` | ✅ Wired — sends `{type, label, number, expiresAt, personId?}` |
| Remove document | `DELETE /cb/documents/{documentId}` | ✅ Wired |
| Issued documents | `GET /cb/documents/issued` | ✅ Wired |
| Create verification session | `POST /cb/documents/{documentId}/verification-sessions` | ✅ Endpoint ready — UI pending signed upload pipeline |
| Start verification | `POST /cb/document-verification-sessions/{sessionId}/verify` | ✅ Endpoint ready |
| Poll verification | `GET /cb/document-verification-sessions/{sessionId}` | ✅ Endpoint ready |

### 4.6 Other

| Feature | Endpoint | Frontend Status |
|---|---|---|
| Identity summary | `GET /cb/identity/summary` | ✅ Wired |
| Bookings | `GET /cb/bookings` | ✅ Wired |
| Booking detail | `GET /cb/bookings/{bookingId}` | ✅ Wired |
| Notifications | `GET /cb/notifications?limit=50&offset=0&unread_only=false` | ✅ Wired |

---

## 5. Architecture Decisions (Frontend)

1. **Single BFF client** — All API calls go through `apiClient` (BFF at `/cb/*`). The separate `livenessClient` has been removed. Liveness and face services are accessed via BFF `/cb/liveness/*` and `/cb/face/*` only.

2. **Registration token** — Held in-memory only (not secure storage). Set after phone OTP verification, used as Bearer for the account-details call, cleared immediately after.

3. **Refresh token rotation** — Atomically replaced in `expo-secure-store` on every refresh. Single-flight interceptor prevents concurrent refresh requests.

4. **Mock fallback** — When `EXPO_PUBLIC_FALLBACK_TO_MOCK=true`, any 503 or network error automatically retries against mock data. This allows frontend development to continue while backend services are down.

5. **Liveness camera** — Uses `expo-camera` `CameraView` with front camera. Server-provided `challenge_sequence` is rendered in order (not hardcoded). Each step captures a frame and submits as multipart. Finalize captures a high-res JPEG.

6. **Biometric consent** — Decline option removed. Consent is mandatory; user cannot proceed without checking the checkbox and tapping "Agree & Continue".

---

## 6. Pending from Backend Side

| Item | Priority | Details |
|---|---|---|
| **Start `customer-account-service` in dev** | 🔴 Critical | All auth flows (register, login, OTP, password reset) are blocked by 503 |
| **Signed object-upload endpoint** | 🟡 High | Document verification UI needs the signed upload pipeline to upload front/back/selfie images. Endpoint: `customers/{customerId}/documents/*.jpg` |
| **Document verification provider** | 🟡 High | Provider URL/key and object upload pipeline must be deployed before document verification can work end-to-end |
| **Booking/check-in event producer** | 🟢 Medium | History tab will show empty until the event producer populates the read model |
| **Push notification delivery** | 🟢 Low | Inbox API is available; push delivery is not yet a public contract |
| **OTP provider in dev** | 🟡 High | `OTP_TEST_CODE` (123456) should work in dev; production requires SMS/email provider URL and key |

---

## 7. Environment Configuration

### Current `.env` (dev)

```env
EXPO_PUBLIC_API_URL=https://api.dev.truepas.com/cb
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_FALLBACK_TO_MOCK=true
```

### Production (when ready)

```env
EXPO_PUBLIC_API_URL=<production BFF URL>/cb
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_FALLBACK_TO_MOCK=false
```

---

## 8. Testing Checklist (Once Backend is Up)

- [ ] Register flow: phone → OTP → account details → email OTP → consent → liveness → face enroll
- [ ] Login with email and password
- [ ] Login with phone number
- [ ] Forgot password: email → OTP → reset → login with new password
- [ ] Change password → auto-logout → login with new password
- [ ] Change PIN
- [ ] Biometric consent → liveness challenge → face enrollment
- [ ] Face update: PIN verify → liveness → face update
- [ ] Add family member (age 5-17): details → document → liveness → face enroll
- [ ] Add family member (age 0-4): details → document only
- [ ] Add document → verification session → poll → verified
- [ ] Delete account with confirmation + PIN
- [ ] Logout → session cleared → redirect to login
- [ ] Token refresh after 15 minutes (automatic)
- [ ] 401 → auto-refresh → request replay

---

## 9. Files Changed in This Integration

**33 files changed, 1356 insertions, 262 deletions**

| Category | Files |
|---|---|
| API layer | `domain.ts`, `endpoints.ts`, `client.ts`, `mock.ts`, `health.ts`, `index.ts` |
| Auth | `mutations.ts`, `schemas.ts`, `slice.ts`, `OtpVerification.tsx` |
| Registration screens | `register.tsx`, `verify-phone.tsx`, `account-details.tsx`, `verify-email.tsx` |
| Auth screens | `login.tsx`, `forgot-password.tsx` |
| Onboarding | `consent.tsx`, `face-scan.tsx`, `face-enrolled.tsx` |
| Face update | `camera.tsx`, `error.tsx`, `pin.tsx` |
| Family | `add/document.tsx`, `add/face-capture.tsx` |
| Documents | `scan.tsx`, `processing.tsx` |
| Profile & security | `profile/index.tsx`, `security/change-password.tsx` |
| Account | `delete/confirm.tsx`, `delete/success.tsx` |
| Liveness (new) | `features/liveness/useLivenessSession.ts`, `features/liveness/LivenessCamera.tsx` |
| Config | `.env`, `.env.example` |
| Dev tools | `dev.tsx` |

---

## 10. Contact

For any questions about the frontend integration, please refer to:
- **Contract document:** `CUSTOMER_APP_FRONTEND_INTEGRATION.md`
- **Repository:** `https://github.com/Pradeepmali61/truepas-app.git`
- **Latest commit:** `117f193` on `main` branch

---

*This report was generated on 2 September 2026. Please address the critical item (customer-account-service startup) to unblock end-to-end testing.*
