# Backend Consolidated Report — Contract Confirmations & Open Questions

**Date:** 18 September 2026
**From:** Frontend Team (Truepas customer app — React Native / Expo)
**To:** Backend Engineering Team
**Environment:** Dev — `https://api.dev.truepas.com/cb`
**Scope:** Auth, PIN, liveness, document verification, notifications — every item below was verified against the current frontend codebase. Evidence cites file and line.

**Supersedes / consolidates:** open questions previously scattered across `BACKEND_LOGIN_ISSUE_REPORT.md`, `BACKEND_ISSUES.md`, `BUG_REPORT_LIVENESS_EVIDENCE.md`, and inline code comments.

---

## How to read this report

- **CONFIRM ACTION REQUIRED** — the frontend is blocked or will misbehave until the backend answers/fixes this.
- **CONFIRMATION NEEDED** — the frontend works today under an assumption; a different backend behavior would break it.
- **FYI / VERIFIED** — frontend behavior documented so the backend knows the exact contract in use.

---

## A. Auth & Account

### A1. Identifier format inconsistency between register and login — CONFIRM ACTION REQUIRED (High)

Registration and login send the phone number in **different shapes**:

| Call | Payload | Evidence |
|---|---|---|
| `POST /auth/register` | `{ "phone": "9876543210", "countryCode": "+91" }` — two separate fields | `src/types/domain.ts:112-115`, `src/app/(auth)/register.tsx:32` |
| `POST /auth/login` | `{ "identifier": "+919876543210", "password": "…" }` — combined, E.164-style | `src/types/domain.ts:107-110`, `src/app/(auth)/login.tsx:58-84` |

**Request:** store/normalize the phone to **E.164 at registration** and do a format-normalized lookup at login. If registration stores `9876543210` and login queries `+919876543210` (or vice-versa), login will always 401. This is the standing suspicion in `BACKEND_LOGIN_ISSUE_REPORT.md` §5.4 — please confirm which format is stored and that login matches it.

### A2. `user.faceEnrolled` and `user.biometricConsentAt` must be present in login / `GET /user/me` — CONFIRM ACTION REQUIRED (High)

Post-login routing is entirely driven by these two fields:

```ts
// src/features/auth/slice.ts:28-32
state.faceEnrolled = action.payload.user.faceEnrolled;
state.biometricConsent = action.payload.user.biometricConsentAt !== null;
```

```ts
// src/app/index.tsx:70-75 and src/app/(tabs)/_layout.tsx:84-92
if (!faceEnrolled) return <Redirect href="/(onboarding)/consent" />;
```

**What breaks if the fields are missing:**
- `faceEnrolled` absent → `undefined` → falsy → every login forces the user back into face enrollment (re-enroll can hit `409` on `/face/enroll`).
- `biometricConsentAt` absent → `undefined !== null` → `true` → consent is treated as **already granted**, silently skipping the consent screen. Both directions are wrong — the fields must be present and accurate.

**Request:** confirm `AuthResponse.user` and `GET /user/me` always return `faceEnrolled: boolean` and `biometricConsentAt: string | null` (camelCase, per contract v1.1.0).

### A3. Password-reset flow — OTP reuse contract — CONFIRMATION NEEDED (High)

The implemented flow is **three steps**, matching contract §7:

1. `POST /auth/forgot-password { email }`
2. `POST /auth/verify-otp { email, otp, purpose: 'password_reset' }` — validates OTP first (`src/app/(auth)/forgot-password.tsx:81-98`; `purpose: 'password_reset'` is live code, not dead — it skips the registration token at `src/api/endpoints.ts:148`)
3. `POST /auth/reset-password { email, otp, newPassword }` — the **same OTP is sent again** (`src/app/(auth)/forgot-password.tsx:70`)

**Question:** does `verify-otp` consume/burn the OTP? If yes, step 3 will always fail with the already-verified OTP. Options: (a) OTP stays valid until `reset-password` succeeds (current assumption), or (b) `verify-otp` returns a short-lived reset token that `reset-password` accepts instead of the OTP — tell us which and we'll adapt. If the contract is actually single-call (`reset-password` does its own OTP check), we can drop the separate verify step.

### A4. Login has no OTP step — CONFIRMATION NEEDED (Low)

Login is password-only (`src/app/(auth)/login.tsx:54-101`, `LoginRequest` at `src/types/domain.ts:107-110`). No OTP/2FA screen exists for login. If the backend spec applies OTP/2FA to login as well, that screen is missing — otherwise this is N/A, please confirm.

### A5. DOB format is sent in two different formats — CONFIRM ACTION REQUIRED (Medium)

| Screen | Format sent | Evidence |
|---|---|---|
| Registration (account-details) | `MM/DD/YYYY` (schema regex enforces it) | `src/app/(auth)/account-details.tsx:43-47`, `src/features/auth/schemas.ts:27-30` |
| Edit profile | ISO `YYYY-MM-DD` (DatePicker is ISO-native) | `src/components/composite/DatePicker.tsx:9-12`, `src/app/profile/edit.tsx:84-91` |

Edit profile normalizes a stored `MM/DD/YYYY` → ISO on load (`src/app/profile/edit.tsx:36-41`), so the first profile save **flips the stored format**. Document extraction returns `extractedDob` as ISO (`src/types/domain.ts:344-345`), and the mismatch screen renders profile DOB vs document DOB side-by-side (`src/app/document/mismatch.tsx:28-31, 91-96`) — two different formats will look like a mismatch to the user even when the date is identical.

**Request:** declare one canonical format (ISO `YYYY-MM-DD` preferred — it matches extracted document data). If backend normalizes on write, confirm; if it stores raw, we'll convert registration to ISO and drop MM/DD/YYYY entirely.

### A6. `address` field on User — CONFIRMATION NEEDED (Medium)

`User.address?: string` exists (`src/types/domain.ts:10`) and `PUT /user/me` sends `{ fullName?, dateOfBirth?, address? }` — omitted keys are not sent, so the frontend performs a **partial update**, not a full replace (`src/types/domain.ts:185-189`, `src/app/profile/edit.tsx:49-53`, `src/api/endpoints.ts:210-213`).

**Questions:**
1. Does `GET /user/me` (and the login response) return `address`? If not, the edit form can never prefill and the profile hub row never appears.
2. Is `PUT /user/me` a partial update on the backend too? If it is a full-replace, any field the app omits would be wiped — please confirm partial semantics or tell us to always send all three fields.

### A7. Password policy is inconsistent across screens — CONFIRMATION NEEDED (Medium)

| Screen | Rule enforced |
|---|---|
| Registration | 8–128 chars + upper + lower + digit + special (`src/features/auth/schemas.ts:38-45`) |
| Reset password | `length >= 8` only (`src/app/(auth)/forgot-password.tsx:66`) |
| Change password | `length >= 8` only (`src/app/security/change-password.tsx:55-66`) |

A user can reset/change to a password that registration would reject. **Request:** share the canonical server-side password policy; we'll align all three screens to it. Whatever it is, the backend must enforce it on `/auth/reset-password` and `/auth/change-password` too — client validation alone is not enough.

---

## B. PIN (`POST /auth/verify-pin`)

### B1. Failure response shape — CONFIRMATION NEEDED (High)

The frontend parses the failure body **defensively** because the real contract is unknown (`src/features/auth/usePinVerification.ts:11-35`):

- Attempts: `attemptsRemaining` | `attempts_remaining` | `remainingAttempts`
- Lock: `retryAfter` | `retry_after` | `retryAfterSeconds` (seconds) or `lockedUntil` | `locked_until` (epoch s/ms or ISO string)

If none of these arrive, the app falls back to a **local counter** (5 attempts, then a 15-minute lock — `usePinVerification.ts:7-9`). **Request:** tell us the exact field names in the verify-pin error response so we drive the counter from the server, and whether there is a `code` (e.g. `PIN_LOCKED`) we should switch on.

### B2. Lock status code — CONFIRMATION NEEDED (High)

Lock is triggered by **HTTP 423 or 429**, a parsed lock-duration field, or attempts hitting 0 (`usePinVerification.ts:92-94`). **Request:** confirm which status the backend returns on lockout (423? 429? 401 with a code?) and the body shape.

### B3. Attempt counter scope — CONFIRMATION NEEDED (Medium)

Two screens gate on verify-pin — `security/confirm-pin.tsx` (re-auth before change password/PIN/delete) and `face-update/pin.tsx` — each keeps its own local counter. Since both hit the same endpoint, **is the server-side attempt counter shared across them** (per-account, regardless of entry point)? If it is, the app should rely on `attemptsRemaining` from the response rather than its per-screen counter.

### B4. No PIN reset path — CONFIRM ACTION REQUIRED (Medium)

"Forgot PIN?" signs the user out and routes to **email password reset** (`src/app/security/confirm-pin.tsx:34-52`). There is no `forgot-pin`/`reset-pin` endpoint (`src/api/endpoints.ts`). After a password reset the **old PIN survives** — the user signs back in and is still asked for a PIN they don't remember. **Request:** provide a PIN-reset endpoint (e.g. `POST /auth/reset-pin` accepting the email-reset session, or make `reset-password` also clear the PIN), or confirm PIN recovery is intentionally out of scope.

---

## C. Liveness (`/cb/liveness/v2/*`)

### C1. Challenge action enum — CONFIRMATION NEEDED (Medium)

`challenge_sequence` is typed as a **closed** union `'blink' | 'turn_left' | 'turn_right'` (`src/types/domain.ts:236`). Unknown actions fail safe: the app refuses to submit evidence it didn't detect and fails the session locally (`src/features/liveness/LivenessCamera.tsx:256-279`). **Request:** confirm the enum is closed, or give advance notice/versioning if new actions (`smile`, `nod`, `close_up`, …) are planned — the app will need an update before they ship.

### C2. Step timeout semantics — CONFIRMATION NEEDED (Medium)

When `step_time_limits.max_ms` is exceeded the app **fails the whole session locally**; the retry UI then creates a brand-new challenge (`LivenessCamera.tsx:282-299`, reset at `:652`). **Request:** can the backend accept a **step-level retry** within the same session instead? If yes, we'll retry the step in place instead of resetting the session — better UX and cleaner attempt accounting.

### C3. Evidence endpoint is sent as form-urlencoded — CONFIRM ACTION REQUIRED (Medium)

`POST /liveness/v2/challenge/{id}/evidence` is sent as `application/x-www-form-urlencoded` because the BFF drops JSON bodies on this route (JSON → all fields arrive `null` → 422; documented in `BUG_REPORT_LIVENESS_EVIDENCE.md`). Workaround at `src/api/endpoints.ts:299-327`. **Request:** either fix the BFF and tell us (we'll switch back to JSON), or bless form-urlencoded in the official contract.

### C4. Rate-limit response shape — CONFIRMATION NEEDED (Low)

429s are handled globally: `Retry-After` header plus `retry_after`/`retryAfter` body fields are parsed (`src/api/errors.ts:28-38, 163-176`). On liveness failures the app currently uses a **fixed 10s cooldown** on 429 rather than the parsed value (`LivenessCamera.tsx:201-205`). **Request:** confirm which signal is authoritative on liveness endpoints (header vs body field name) — we'll wire the countdown UI to it.

### C5. Finalize image format — CONFIRMATION NEEDED (Low)

`POST /liveness/v2/challenge/{id}/finalize` sends `multipart/form-data` with field `frame` = `{ uri: file://…, type: 'image/jpeg', name: 'finalize.jpg' }` (`src/api/endpoints.ts:328-350`). **Request:** confirm expected constraints — field name `frame`, JPEG only, max size, min resolution — so the capture pipeline stays compliant.

### C6. `antispoof_score` semantics — CONFIRMATION NEEDED (Low)

`LivenessFinalizeResponse.antispoof_score` (0–1) is rendered as a **"Verification confidence" percentage** (`src/types/domain.ts:265-271`, `LivenessCamera.tsx:721-758`). **Request:** confirm higher = better and that exposing it to the user is acceptable, or tell us to hide it.

---

## D. Document verification

### D1. Document numbers are always pre-masked — CONFIRMATION NEEDED (Medium)

The app renders `doc.number` verbatim from both `GET /documents` and the verify response — it never masks or unmasks client-side (`src/app/(tabs)/documents.tsx:18`, `src/components/truepas/documents.tsx:76`). **Request:** confirm `number` is always server-masked (`••••9338`) in **every** response — including `POST /documents` create and the post-verify document — so a full PAN/passport number never reaches the client.

### D2. `"PENDING"` placeholder must be overwritten post-verify — CONFIRM ACTION REQUIRED (Medium)

`POST /documents` requires `number` (min 2 chars) but the real number only exists after server-side OCR. The app sends `"PENDING"` and the code comment states the backend overwrites it during `/verify` (`src/app/document/processing.tsx:60, 106-117`; same pattern in `src/app/family/add/processing.tsx`). **Request:** confirm the verify pipeline actually writes the extracted number back to the document — otherwise documents keep a literal `PENDING` number forever. Alternatively, relax `number` to be optional on create.

### D3. `review` outcome renders as "Verification Failed" — CONFIRMATION NEEDED (Low)

`VerificationOutcome = 'approved' | 'rejected' | 'review'` (`src/types/domain.ts:311`). The processing screen routes `approved` **and** `review` to the result screen, which renders binary: anything ≠ `approved` shows "Verification Failed" (`src/app/document/processing.tsx:160`, `src/app/document/verified.tsx:81-83, 125-127`). **Request:** confirm `review` should be shown to the user as a failure, or if it means "manual review pending" we should add a third UI state instead.

---

## E. Notifications

### E1. No mark-read endpoint — CONFIRM ACTION REQUIRED (Medium)

There is no `POST /notifications/{id}/read` (or bulk equivalent) in the API layer — tapping a row only flips `read` in the local React Query cache, and a refetch restores server truth (`src/app/notification/index.tsx:28-43`, `src/components/app/AppChrome.tsx:51-58`). **Request:** expose a mark-read endpoint (single + mark-all) and we'll persist reads; until then read state never survives a refresh.

### E2. `unread_count` — CONFIRMATION NEEDED (Low)

The badge counts unread across **locally loaded pages only** (`src/app/notification/index.tsx:45-46`, `src/components/complex/NotificationCenter.tsx:38`) — undercounted if unread items are beyond the loaded window. **Request:** include `unread_count` in the `/notifications` response envelope (or a `GET /notifications/unread-count`) and we'll drive the badge from it.

### E3. Notification `type` + deep-link payload — CONFIRM ACTION REQUIRED (Medium)

`type` is normalized from `notification_type`/`type` (`src/api/endpoints.ts:117`) but **never used for routing** — taps only mark the row read, and bell-icon taps just open `/notification` (`src/app/notification/index.tsx:92-94`, `src/components/app/AppChrome.tsx:47-49`). **Request:** publish the `type` enum and a payload contract (e.g. `{ type: 'booking', bookingId }`, `{ type: 'document', documentId }`) so taps can deep-link to the booking/document/detail screens.

---

## F. Verified frontend behavior (FYI — no backend action)

- **Identity dashboard refresh:** document add/verify and face enroll/update all invalidate the `['identity']` query prefix, which covers `['identity','summary']` — the dashboard reflects post-verify/post-enroll state (`src/features/documents/hooks.ts:42-43`, `src/app/document/processing.tsx:83-86`, `src/features/auth/mutations.ts:147-162`).
- **Liveness challenge `personId`** is sent as a query param, not body, per KYC guide §4.3 (`src/api/endpoints.ts:286-298`).
- **Face-update and confirm-PIN gates** share the same verify-pin logic but keep independent local counters (see B3).
- **Login** normalizes phone to `+<cc><digits>` before sending; 401 on auth endpoints no longer triggers a token-refresh loop.

---

## Priority summary for the backend team

| # | Item | Priority | Type |
|---|---|---|---|
| A1 | E.164 normalization at registration + login lookup | High | Fix |
| A2 | `faceEnrolled` + `biometricConsentAt` always in `user` payloads | High | Fix/Confirm |
| A3 | OTP survival across `verify-otp` → `reset-password` | High | Confirm |
| B1/B2 | `verify-pin` failure fields + lock status code | High | Confirm |
| B4 | PIN reset endpoint (Forgot PIN dead-ends today) | Medium | New endpoint |
| A5 | Canonical DOB format | Medium | Confirm |
| A6 | `address` in `GET /user/me` + PUT partial semantics | Medium | Confirm |
| A7 | Server-side password policy on reset/change | Medium | Confirm |
| B3 | Shared verify-pin attempt counter | Medium | Confirm |
| C1 | Liveness challenge enum closed/versioned | Medium | Confirm |
| C2 | Step-level retry vs session reset | Medium | Confirm |
| C3 | Evidence form-urlencoded: fix BFF or bless it | Medium | Fix/Confirm |
| D1 | `number` always masked in all document responses | Medium | Confirm |
| D2 | `"PENDING"` overwritten post-verify | Medium | Confirm |
| E1 | Mark-read endpoint | Medium | New endpoint |
| E3 | Notification type enum + deep-link payload | Medium | Contract |
| A4 | Login 2FA applicability | Low | Confirm |
| C4 | Liveness 429 authoritative field | Low | Confirm |
| C5 | Finalize frame constraints | Low | Confirm |
| C6 | `antispoof_score` semantics/display | Low | Confirm |
| D3 | `review` outcome UX semantics | Low | Confirm |
| E2 | `unread_count` field | Low | Confirm |

---

**Generated with [Devin](https://devin.ai)**
