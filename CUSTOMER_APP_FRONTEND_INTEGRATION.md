# Truepas Customer App — Backend Integration Contract

**Contract version:** 1.1.0  
**Updated:** 2 September 2026  
**Audience:** React Native customer-app engineers, QA, backend engineers, product, and delivery managers  
**Public API owner:** `customer-app-bff`  
**Dev environment:** `https://api.dev.truepas.com`  

This is the source of truth for integrating the Truepas customer app with the microservices platform. The retired customer monolith is not part of this contract.

## 1. Delivery status

| Area | Status | Owner |
|---|---|---|
| Registration, phone/email OTP, login, refresh/logout, recovery | Implemented | customer-account-service |
| Profile, password, PIN, biometric consent, account deletion | Implemented | customer-account-service + customer-app-bff |
| Family members and under-18 enforcement | Implemented | customer-account-service |
| Documents, encrypted document number, verification sessions | Implemented | identity-proofing-service |
| Active liveness and one-time result consumption | Implemented | liveness-service |
| Face enrollment/update/removal | Implemented | face-service + customer-app-bff |
| Identity summary | Implemented composition | customer-app-bff |
| Notification inbox reads | Implemented | notification-service + customer-app-bff |
| Booking/history reads | Implemented projection | customer-account-service; requires upstream event producer |
| SMS/email delivery | Provider adapter implemented; provider URL/key required outside local |
| Document verification | Provider adapter implemented; provider URL/key and object upload pipeline required |
| Push delivery | Not implemented; inbox API is available |
| Full asynchronous deletion saga | Not complete; BFF synchronously removes face/document data before account tombstone |

Do not represent provider-backed OTP/document verification or push delivery as production-ready until the environment readiness checklist in section 16 is complete.

## 2. Architecture

```text
React Native app
      |
      | HTTPS /cb/*
      v
customer-app-bff :8015
      |-- customer-account-service :8017
      |-- identity-proofing-service :8014
      |-- liveness-service :8009
      |-- face-service :8008
      |-- notification-service :8013
      `-- checkin-consent-service :8012
```

The app calls only the BFF. It must never call `/internal/v1/*`, send `X-Internal-Api-Key`, or use internal service hostnames. The BFF derives `customer_id` and `person_id` from the signed access token and overrides caller-supplied actor IDs.

## 3. Base URL and headers

Hosted dev environment:

| Service | Type | Base URL | Health check |
|---|---|---|---|
| **customer-app-bff** | BFF — **the customer app calls only this** | `https://api.dev.truepas.com/cb` | `https://api.dev.truepas.com/cb/health` |
| liveness-service | Edge service — reference only; reach liveness through `/cb/liveness/*` | `https://api.dev.truepas.com/ls` | `https://api.dev.truepas.com/ls/health` |
| merchant-dashboard-bff | BFF — merchant app only, not for the customer app | `https://api.dev.truepas.com/mb` | `https://api.dev.truepas.com/mb/health` |
| kiosk-bff | BFF — kiosk devices only, not for the customer app | `https://api.dev.truepas.com/kb` | `https://api.dev.truepas.com/kb/health` |

Customer-app base URL:

```text
https://api.dev.truepas.com/cb
```

Local development alternative: `http://localhost:8015/cb`. Production uses the customer API hostname supplied by platform operations, with `/cb` retained as the path prefix.

Authenticated request:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
X-Request-ID: <optional UUID or opaque value up to 64 characters>
```

Liveness evidence/finalization also sends:

```http
X-Session-Token: <sessionToken returned by challenge creation>
```

The server returns `X-Request-ID` on every response. Include it in support and defect reports.

## 4. Common error contract

All BFF-generated and normalized upstream errors use:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "trace_id": "2d5a4d8f-6e52-4dbb-8c79-2a145f7002d2",
  "details": []
}
```

`details` is present only for structured validation failures.

| HTTP | Code | App behavior |
|---:|---|---|
| 400 | `BAD_REQUEST` | Show field/flow error; do not retry automatically |
| 401 | `UNAUTHORIZED` | Attempt one refresh; otherwise clear session and show login |
| 403 | `FORBIDDEN` | Show permission error; do not retry |
| 404 | `NOT_FOUND` | Return to list or show not-found state |
| 409 | `CONFLICT` | Show business conflict, such as reused request ID |
| 413 | `PAYLOAD_TOO_LARGE` | Ask user to recapture/reduce upload |
| 422 | `VALIDATION_ERROR` | Bind details to fields where possible |
| 429 | `RATE_LIMITED` | Respect `Retry-After` when present; disable action temporarily |
| 503 | `SERVICE_UNAVAILABLE` | Show retry UI; use bounded backoff |

Axios normalization should prefer `response.data.message`, then `response.data.detail`, then a network fallback.

## 5. Authentication and token rules

`AuthResponse`:

```json
{
  "user": {
    "id": "7fc63db0-62ad-4ca3-89c6-c903dbafe309",
    "fullName": "Ada Example",
    "email": "ada@example.com",
    "phone": "+14155550123",
    "faceEnrolled": false,
    "biometricConsentAt": null
  },
  "accessToken": "<JWT>",
  "refreshToken": "<opaque token>"
}
```

- Access token lifetime: 15 minutes by default.
- Refresh token lifetime: 30 days by default.
- Access token stays in memory only.
- Refresh token stays in `expo-secure-store` only.
- Refresh tokens rotate on every use. Replace the stored token atomically.
- Reusing an already-rotated refresh token revokes the whole token family.
- Never send two refresh requests concurrently. Keep the existing Axios single-flight interceptor.
- Passwords are hashed with scrypt; PINs are separately hashed.
- Repeated password/PIN failures trigger a temporary lock.

### Refresh

```http
POST /cb/auth/refresh
```

```json
{ "refreshToken": "<current refresh token>" }
```

Response: a complete new `AuthResponse`. Store the new refresh token before replaying queued requests.

### Logout

```http
POST /cb/auth/logout
```

```json
{ "refreshToken": "<current refresh token>" }
```

Response:

```json
{ "ok": true }
```

Clear Redux, in-memory access token, React Query caches containing customer data, and secure storage even if logout returns a network error.

## 6. Correct registration flow

The original frontend flow was internally inconsistent: it attempted email verification before collecting an email and used password login without setting a password. The approved corrected order is:

```text
register phone
  -> verify phone OTP
  -> account details (name, DOB, PIN, email, password)
  -> verify email OTP
  -> biometric consent
  -> liveness challenge
  -> face enrollment
  -> main tabs
```

### 6.1 Start registration

```http
POST /cb/auth/register
```

```json
{
  "phone": "4155550123",
  "countryCode": "+1"
}
```

Response `202`:

```json
{
  "ok": true,
  "message": "Verification code sent",
  "registrationId": "ef050f40-255c-4b89-8d04-81e112968b12",
  "nextStep": "verifyPhone"
}
```

### 6.2 Verify phone

```http
POST /cb/auth/verify-otp
```

```json
{
  "phone": "4155550123",
  "countryCode": "+1",
  "otp": "123456",
  "purpose": "phone"
}
```

Response:

```json
{
  "ok": true,
  "message": "Phone verified",
  "registrationToken": "<short-lived JWT>",
  "nextStep": "accountDetails"
}
```

Keep `registrationToken` in memory and send it as a Bearer token only to account-details. Do not put it in secure storage.

### 6.3 Submit account details

```http
POST /cb/auth/account-details
Authorization: Bearer <registrationToken>
```

```json
{
  "fullName": "Ada Example",
  "dateOfBirth": "01/02/1990",
  "pin": "1234",
  "email": "ada@example.com",
  "password": "StrongPassword1!",
  "confirmPassword": "StrongPassword1!"
}
```

`dateOfBirth` accepts `MM/DD/YYYY` and ISO `YYYY-MM-DD`. Response `202`:

```json
{
  "ok": true,
  "message": "Email verification code sent",
  "nextStep": "verifyEmail"
}
```

### 6.4 Verify email and create session

```http
POST /cb/auth/verify-otp
```

```json
{
  "email": "ada@example.com",
  "otp": "123456",
  "purpose": "email"
}
```

Response: `AuthResponse`. Dispatch `sessionStarted`, but route to biometric consent because `faceEnrolled` is false.

Local-only OTP is `123456` by default. Production startup rejects a configured test OTP and requires the delivery provider.

## 7. Login and recovery

### Login

```http
POST /cb/auth/login
```

```json
{
  "identifier": "ada@example.com",
  "password": "StrongPassword1!"
}
```

`identifier` accepts normalized email or a complete international phone number. Response: `AuthResponse`.

### Forgot password

```http
POST /cb/auth/forgot-password
```

```json
{ "email": "ada@example.com" }
```

Always returns `202` with the same body, whether the account exists or not:

```json
{
  "ok": true,
  "message": "If the account exists, a verification code was sent"
}
```

### Verify reset OTP

```json
{
  "email": "ada@example.com",
  "otp": "123456",
  "purpose": "password_reset"
}
```

Send to `POST /cb/auth/verify-otp`.

### Reset password

```http
POST /cb/auth/reset-password
```

```json
{
  "email": "ada@example.com",
  "otp": "123456",
  "newPassword": "UpdatedPassword1!"
}
```

A successful reset revokes all existing sessions.

## 8. Profile and security

### Get profile

```http
GET /cb/user/me
```

Response: `User` from `AuthResponse.user`.

### Update profile

```http
PUT /cb/user/me
```

Supported fields:

```json
{
  "fullName": "Ada Example",
  "dateOfBirth": "1990-01-02",
  "address": "1 Example Street, Orlando, FL"
}
```

Email and phone changes are rejected with `409` until a destination-verification state machine is added. Keep those fields read-only in the current frontend.

### Change password

```http
POST /cb/auth/change-password
```

```json
{
  "currentPassword": "StrongPassword1!",
  "newPassword": "UpdatedPassword1!"
}
```

Success revokes refresh sessions. The current access token will also stop working because its token version is stale; send the user to login.

### Verify PIN

```http
POST /cb/auth/verify-pin
```

```json
{ "pin": "1234" }
```

### Change PIN

```http
POST /cb/auth/change-pin
```

```json
{ "currentPin": "1234", "newPin": "5678" }
```

### Biometric consent

Grant:

```http
POST /cb/user/me/biometric-consent
```

```json
{ "accepted": true }
```

Withdraw using `{ "accepted": false }`. Withdrawal removes face templates before setting `faceEnrolled=false`. The app must return to mandatory consent/enrollment gating if the customer later wants to use face features.

### Delete account

```http
DELETE /cb/user/me
```

```json
{ "confirmation": "DELETE", "pin": "1234" }
```

The BFF removes face and document data for the account and family before tombstoning the account and revoking sessions. On success, clear all local customer state and route to welcome.

## 9. Mandatory liveness and face enrollment

Do not expose a skip path.

### 9.1 Create challenge

```http
POST /cb/liveness/v2/challenge
POST /cb/liveness/v2/challenge?personId=<family-person-id>
```

Use `personId` for a family member aged 5–17. The resulting session is bound to that person and cannot be used to enroll someone else.

Response:

```json
{
  "success": true,
  "session_id": "lx-session",
  "session_token": "<opaque token>",
  "challenge_sequence": ["turn_left", "blink"],
  "expires_in_seconds": 300,
  "step_time_limits": { "min_ms": 300, "max_ms": 10000 },
  "ui_copy": {
    "blink": "Blink your eyes",
    "turn_left": "Turn your head slowly to the left",
    "turn_right": "Turn your head slowly to the right"
  }
}
```

Render exactly the returned sequence. Do not hard-code challenge order.

### 9.2 Submit each evidence step

```http
POST /cb/liveness/v2/challenge/{sessionId}/evidence
X-Session-Token: <sessionToken>
Content-Type: multipart/form-data
```

Fields:

| Field | Type |
|---|---|
| `challenge` | `blink`, `turn_left`, or `turn_right` |
| `step_index` | zero-based integer |
| `client_ts_ms` | strictly increasing client timestamp |
| `duration_ms` | 300–10000 by default |

Success:

```json
{
  "success": true,
  "step_accepted": true,
  "next_challenge": "blink",
  "next_instruction": "Blink your eyes",
  "status": "in_progress"
}
```

A rejected step returns HTTP 200 with `success:false`, `status:"failed"`, and an error code. Restart with a new challenge.

### 9.3 Finalize

```http
POST /cb/liveness/v2/challenge/{sessionId}/finalize
X-Session-Token: <sessionToken>
Content-Type: multipart/form-data
```

Field `frame`: high-resolution JPEG captured at successful completion.

Success:

```json
{
  "success": true,
  "status": "passed",
  "session_id": "lx-session",
  "antispoof_score": 0.87,
  "message": "Liveness verified."
}
```

### 9.4 Enroll face

```http
POST /cb/face/enroll
```

```json
{
  "livenessSessionId": "lx-session",
  "sessionToken": "<sessionToken>"
}
```

Family member age 5–17 adds `personId`. Age 0–4 must not enroll a face.

Response:

```json
{ "ok": true, "faceEnrolled": true, "faceId": "face-id" }
```

The passed liveness image is consumed once. If enrollment fails after consumption, restart liveness.

### Update face

After successful PIN verification, run a new liveness session and send the same body to:

```http
PUT /cb/face
```

## 10. Documents

Public document type values remain exactly:

```typescript
type DocumentType =
  | 'passport'
  | 'drivingLicense'
  | 'idCard'
  | 'greenCard'
  | 'birthCertificate'
  | 'usVisa';
```

The BFF maps these to internal policy codes. Never send internal snake-case values from the app.

### List

```http
GET /cb/documents
GET /cb/documents?personId=<family-person-id>
```

Response: `IdentityDocument[]`.

```json
[
  {
    "id": "document-id",
    "type": "passport",
    "label": "US Passport",
    "number": "•••••6789",
    "status": "verified",
    "matchScore": 0.95,
    "addedAt": "2026-09-02T08:00:00Z",
    "expiresAt": "2030-01-01",
    "source": "uploaded",
    "personId": "person-id"
  }
]
```

Document numbers are encrypted at rest and masked on reads.

### Get

```http
GET /cb/documents/{documentId}
```

Response: one `IdentityDocument`.

### Add metadata

```http
POST /cb/documents
```

```json
{
  "type": "passport",
  "label": "US Passport",
  "number": "123456789",
  "expiresAt": "2030-01-01",
  "personId": "optional-family-person-id"
}
```

Response `201`: pending `IdentityDocument`.

### Remove

```http
DELETE /cb/documents/{documentId}
```

```json
{ "ok": true }
```

### Issued documents

```http
GET /cb/documents/issued
```

Response: `IssuedDoc[]` with `id`, `name`, `issuer`, `issuedAt`, `icon`, `number`, and `status` (`Active` or `Expired`).

### Create verification session

Upload object keys must be issued by the approved customer upload pipeline and start with `customers/{customerId}/`.

```http
POST /cb/documents/{documentId}/verification-sessions
```

```json
{
  "requestId": "optional-idempotency-id",
  "frontObjectKey": "customers/<customerId>/documents/front.jpg",
  "backObjectKey": "customers/<customerId>/documents/back.jpg",
  "selfieObjectKey": "customers/<customerId>/documents/selfie.jpg",
  "livenessSessionId": "optional-passed-session"
}
```

### Start verification

```http
POST /cb/document-verification-sessions/{sessionId}/verify
```

### Poll verification

```http
GET /cb/document-verification-sessions/{sessionId}
```

Possible session statuses: `created`, `completed`; outcomes: `approved`, `rejected`, `review`.

Provider deployment and the signed upload-object endpoint are required before enabling camera/file upload in production UI.

## 11. Family

### List/get

```http
GET /cb/family
GET /cb/family/{personId}
```

Response item:

```json
{
  "id": "child-person-id",
  "name": "Child Example",
  "relationship": "Child",
  "age": 10,
  "ageBand": "5-17",
  "verification": "pending_document",
  "turning18Soon": false,
  "faceEnrolled": false
}
```

Age is calculated from DOB on every read.

### Add

```http
POST /cb/family
```

```json
{
  "name": "Child Example",
  "dateOfBirth": "2016-01-01",
  "relationship": "Child"
}
```

Age 18+ returns `422`. Flow rules:

| Age | Required |
|---|---|
| 0–4 | Document; no face enrollment |
| 5–17 | Document, then liveness + face enrollment |
| 18+ | Reject |

### Remove

```http
DELETE /cb/family/{personId}
```

The BFF validates ownership, removes face/document data, and tombstones the family member.

### Activity

```http
GET /cb/family/{personId}/activity
```

Currently returns an empty array until the customer activity event projection is connected. Do not fabricate activity in production UI.

## 12. Identity dashboard

```http
GET /cb/identity/summary
```

```json
{
  "status": "incomplete",
  "face": "verified",
  "document": "missing",
  "selfieMatch": "missing",
  "activity": []
}
```

`status` becomes `verified` only when both face enrollment and document proofing are verified. Verification values are `verified`, `pending`, `missing`, or `failed`.

## 13. Bookings/history

```http
GET /cb/bookings
GET /cb/bookings/{bookingId}
```

Response item preserves the frontend `Booking` type:

```json
{
  "id": "booking-id",
  "venue": "Example Hotel",
  "location": "Orlando, FL",
  "type": "hotel",
  "image": null,
  "checkIn": "2026-09-01",
  "checkOut": "2026-09-03",
  "status": "completed",
  "guests": 2,
  "amount": 499.0,
  "checkedInMembers": ["person-id"]
}
```

The read model is implemented, but a booking/check-in event producer must populate it. Empty history is valid until that integration is active.

## 14. Notifications

```http
GET /cb/notifications?limit=50&offset=0&unread_only=false
```

Returns the customer inbox array. Push delivery, device-token registration, notification preferences, and realtime fan-out are not yet public customer contracts.

## 15. React Query and cache behavior

Recommended keys remain:

| Data | Key |
|---|---|
| User | `['user']` |
| Identity | `['identity', 'summary']` |
| Documents | `['documents']`, `['documents', id]`, `['documents', 'issued']` |
| Family | `['family']`, `['family', id]`, `['family', id, 'activity']` |
| History | `['bookings']`, `['bookings', id]` |
| Notifications | `['notifications', filters]` |

Invalidate identity and related lists after document verification, face enrollment/update, consent withdrawal, or family verification changes. Clear all customer-scoped queries on logout/delete.

## 16. Environment readiness checklist

Before a production frontend points at this API, backend/platform owners must verify:

- TLS/WAF/public ingress routes only to `customer-app-bff`.
- Explicit production CORS origins; no wildcard.
- Dedicated, rotated customer JWT secret is identical in account, BFF, and liveness services.
- Distinct account encryption, lookup, OTP, refresh-token, document-encryption, face-service, and internal-service secrets.
- `OTP_TEST_CODE` is empty; SMS/email provider URL and key are configured and abuse-tested.
- Anti-spoof is enabled, fail-closed, and threshold-tested on representative devices/users.
- Face-service internal authentication is enabled; direct public ingress is denied.
- Document provider and signed object-upload pipeline are deployed.
- PostgreSQL migrations `customer-account 0005` and `identity-proofing 0003` are applied by release jobs.
- Booking/check-in event producer populates customer history.
- Push/device-token work is either complete or hidden in the app.
- Deletion reconciliation verifies face, document, account, consent, notification, and object-store cleanup.
- Contract, integration, upload-security, BOLA, OTP/PIN abuse, refresh-reuse, provider-outage, and physical-device liveness tests pass.

## 17. Frontend changes from the supplied document

Required changes:

1. Add `email`, `password`, and `confirmPassword` to account details.
2. Move email verification after account-details submission.
3. Hold and send `registrationToken` between phone verification and account details.
4. Add `purpose` and the appropriate identifier to OTP requests.
5. Configure the Axios base URL to `https://api.dev.truepas.com/cb` (local dev: `http://localhost:8015/cb`).
6. Persist the rotated refresh token atomically.
7. Implement active liveness using the server-provided challenge sequence.
8. Call `/face/enroll` after liveness; finalizing liveness alone does not enroll a face.
9. Use masked document numbers returned by the API.
10. Keep push, camera upload, and activity/history claims behind release flags until their backend dependencies pass readiness.

No screen should call an internal service directly or trust a customer/person ID from local state for authorization.
