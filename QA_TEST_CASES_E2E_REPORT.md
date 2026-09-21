# TruePas — End-to-End QA Test Case Report (FacePe / Customer App)

**Source:** `TruePas_QA_Handoff_FacePe_1.docx` (Backend QA Handoff v1.0, 15 Sep 2026)
**Scope:** Customer mobile app (React Native/Expo) + `/cb/*` public API (customer-app-bff)
**Env (dev):** `https://api.dev.truepas.com/cb` · Health: `GET /cb/health`
**App env:** `EXPO_PUBLIC_API_URL=https://api.dev.truepas.com/cb`, `EXPO_PUBLIC_USE_MOCK_API=false`, `EXPO_PUBLIC_FALLBACK_TO_MOCK=false`
**Test OTP:** `123456` (fixed dev code) · OTP TTL 10 min · max 5 attempts
**Seeded account (TD-ACCT-1):** `+919999999998` / `dev-smoke-test@truepas.dev` / `Smoke-Test-2026!` / PIN `1234`

> **Reporting rule:** On every failure capture `X-Request-ID` (response header) + `trace_id` (error body) + endpoint + account + app build number. No trace_id = untriagable defect.
>
> **Severity:** S1 Blocker (core flow impossible / data loss / security hole) · S2 Critical (major feature broken, no workaround) · S3 Major (degraded, workaround exists) · S4 Minor · S5 Trivial.
>
> **Device rule:** Liveness/face cases are only valid on physical devices. Everything else also runs on simulators.

---

## Coverage Summary

| Section | Cases | Focus |
|---|---|---|
| 1. Registration & Onboarding | REG-001…025 | F1/A1, funnel order, OTP, interruption |
| 2. Login & Lockout | LOG-001…014 | F2/A2/A6, generic 401, 15-min lock |
| 3. Token & Session Lifecycle | TOK-001…016 | F3/A3, rotation, tampering, multi-device |
| 4. Password Recovery & Change | PWD-001…012 | F4/F5/A5/A6, enumeration, revocation |
| 5. PIN | PIN-001…009 | verify/change, PIN-only lockout |
| 6. Profile | PROF-001…010 | F6/A7, mass assignment, masking |
| 7. Biometric Consent | CON-001…007 | F7/A8, withdrawal cascade |
| 8. Liveness Challenge | LIV-001…022 | F8/A9, anti-spoof, timing, session abuse |
| 9. Face Enrollment | FACE-001…012 | F9/A9, single-use session, under-5 path |
| 10. Family Management | FAM-001…018 | F10/A10/A11, all age-band boundaries |
| 11. Documents | DOC-001…016 | F11/A12, masking, key-scope, idempotency |
| 12. Identity Summary / Notifications / Bookings | READ-001…010 | F12/F13/F14/A13 |
| 13. Account Deletion | DEL-001…010 | F15/A14, tombstone, re-register |
| 14. Field Validation Boundaries | VAL-001…012 | §6.3 matrix, all edges |
| 15. Security / BOLA | SEC-001…020 | §8 checklist, ownership, header abuse |
| 16. Mid-Flow Kill & Interruption | KILL-001…012 | §7.3 + process death, airplane mode |
| 17. Idempotency & Concurrency | CONC-001…008 | double-tap, parallel refresh, races |
| 18. Payload / Content Edge | PAY-001…008 | 20 MB cap, malformed JSON, MIME |
| 19. Network Resilience | NET-001…008 | offline, 503, Retry-After, mock-mask check |
| 20. UI / Accessibility / Localization | A11Y-001…010 | §2.3, dynamic type, timezones |
| 21. Performance Sanity | PERF-001…005 | §10.5 budgets |
| 22. "Break the App" Adversarial | ADV-001…015 | deep links, permissions, clock skew, storage |

**Total: ~260 test cases.**

Case format: `Steps → Expected`. Anything marked **[record]** = actual behavior undocumented in spec — capture it, don't assume bug.

---

## 1. Registration & Onboarding (F1 / A1 / A4)

| ID | Pr | Steps → Expected |
|---|---|---|
| REG-001 | P0 | Full happy path: register new phone → OTP `123456` → account-details (name, DOB, PIN, email, password+confirm) → email OTP `123456` → consent accept → liveness → face enroll → lands on tabs → `GET /user/me` `faceEnrolled:true`, `GET /identity/summary` `face:"verified"`. |
| REG-002 | P0 | Register with already-registered phone (`+919999999998`) → `409 CONFLICT`. UI shows "account exists" path, not a crash. |
| REG-003 | P0 | Second account reusing an existing email → `409` at account-details. |
| REG-004 | P0 | OTP input accepts exactly 6 digits; paste of `123456` fills all boxes; non-digit input rejected by the field. |
| REG-005 | P0 | Wrong OTP ×5 → attempts exhausted (`400`). 6th attempt incl. correct code → still rejected (new session needed). |
| REG-006 | P0 | OTP older than 10 min → `400 OTP has expired`. Feasible: submit at 9:59 (pass) and 10:01 (fail) on separate registrations. |
| REG-007 | P1 | Re-call `register` with same phone mid-flow → new OTP issued, **old code rejected, new code works**, fresh 5-attempt budget (newest-wins). |
| REG-008 | P0 | Kill app after `register`, before OTP → relaunch, re-register same phone → works, no stuck state. |
| REG-009 | P0 | Kill app after phone OTP, before account-details → `registrationToken` is memory-only. Relaunch: user restarts or resumes per design → **[record actual UX]**. Token TTL 30 min: wait >30 min, submit account-details → `401`. |
| REG-010 | P0 | Token confusion: send `registrationToken` to `GET /user/me` → `401`; send a real access token to `/auth/account-details` → `401`. |
| REG-011 | P0 | Onboarding order is strict: no way to reach consent/liveness/face screens without completing prior steps. Try OS back button, deep-link `/(onboarding)/face-scan` directly, and swipe-back gestures → blocked/redirected. |
| REG-012 | P1 | Double-tap "Register" / "Verify" buttons → exactly one registration/session; no duplicate accounts (also see CONC). |
| REG-013 | P1 | Back-nav from email-OTP to account-details, edit email, resubmit → new OTP to new email; old email's OTP rejected. |
| REG-014 | P1 | Decline biometric consent during onboarding → **[record]**: either blocked from face features (by design) or routed to a dead state (defect if app proceeds to liveness without consent). |
| REG-015 | P1 | Airplane mode mid-account-details submit → clean retry state, no partial account; reconnect → completes once. |
| REG-016 | P1 | Phone field: `6` chars → 422; `7` → pass; `24` → pass; `25` → 422; letters/spaces stripped per server normalization → **[record normalization rules]**. |
| REG-017 | P1 | countryCode variants `+91`, `91`, `+1-242` → digits extracted; **[record]** which forms are accepted. |
| REG-018 | P1 | Email edge: `a@b.test`, `a@b.localhost` → 422 (reserved TLD); malformed (`a@`, `@b.com`, `a b@c.com`) → 422; valid real TLD (`*.dev`, `*.com`) → pass. |
| REG-019 | P1 | Wrong-purpose OTP: phone-verification code submitted with `purpose:"password_reset"` (API-level) → rejected. |
| REG-020 | P1 | OTP reuse: after successful verify, re-submit same code → rejected. |
| REG-021 | P2 | Very slow network (throttle to 3G): every step shows loading state, no duplicate submissions on retry. |
| REG-022 | P2 | Register, then change device time +1 hour mid-flow → OTP still judged by server TTL → **[record]** (client clock must not extend validity). |
| REG-023 | P2 | Onboarding under system "largest" font size: OTP digits, DOB picker, PIN pad remain usable, nothing truncated (see A11Y). |
| REG-024 | P1 | Register → abandon → same phone re-registers days later cleanly (orphaned session cleanup; leftovers are backend ops concern, but app must not choke). |
| REG-025 | P2 | SMS-OTP screen: no "resend" endpoint exists — verify app re-calls `register` for a new code rather than a nonexistent resend route → **[record]**. |

## 2. Login & Lockout (F2 / A2 / A6)

| ID | Pr | Steps → Expected |
|---|---|---|
| LOG-001 | P0 | Login with email + password → `200` AuthResponse `{user, accessToken, refreshToken}`; lands on tabs. |
| LOG-002 | P0 | Login with full international phone `+919999999998` + password → `200`. |
| LOG-003 | P0 | Wrong password on existing account → generic `401`; message must NOT distinguish "user not found" vs "wrong password". |
| LOG-004 | P0 | Non-existent identifier + any password → byte-identical `401` body as LOG-003; compare response timing → no enumeration via body or timing. |
| LOG-005 | P0 | Wrong password ×5 → `429 Account is temporarily locked` (+`Retry-After`); correct password during lock → still rejected; after 15 min → login succeeds. |
| LOG-006 | P1 | 4 wrong → 1 correct → success; then immediately check whether the failure counter reset → **[record]**. |
| LOG-007 | P1 | Identifier bounds: 2 chars → 422; 3 → pass-through to auth check; 254 → ok; 255 → 422. |
| LOG-008 | P1 | Identifier with leading/trailing spaces, uppercase email → normalization behavior **[record]**; phone entered without `+` → **[record]**. |
| LOG-009 | P1 | Login response fields: `faceEnrolled`, `biometricConsentAt` present; app routes incomplete-onboarding accounts correctly → **[record]** (account created but onboarding abandoned — where does login land?). |
| LOG-010 | P1 | Paste into password field works; password never echoed in plaintext after toggle-off; no password in logs/analytics events. |
| LOG-011 | P2 | Login while offline → error state, not a hang; retry on reconnect works. |
| LOG-012 | P1 | Rapid double-tap Login → single session created (no duplicate session rows). |
| LOG-013 | P2 | Login on device B while device A active → both sessions coexist (see TOK-012 for logout isolation). |
| LOG-014 | P1 | After account lock via password, PIN-based ops (`verify-pin`) state → per spec locks are separate; verify password-login still possible is N/A — confirm PIN ops not impacted and vice versa (PIN-005). |

## 3. Token & Session Lifecycle (F3 / A3)

| ID | Pr | Steps → Expected |
|---|---|---|
| TOK-001 | P0 | Idle ~15 min → next request triggers exactly ONE silent refresh; app stays logged in; queued requests replay once (no double POST). |
| TOK-002 | P0 | Two parallel `POST /auth/refresh` with same refresh token → exactly one `200`; loser gets clean `401` (no crash, no double session). |
| TOK-003 | P0 | Reuse rotated (old) refresh token after a successful refresh → `401` AND entire session family revoked — even the NEW refresh token then fails. |
| TOK-004 | P0 | Kill & reopen app → still logged in via stored refresh token. |
| TOK-005 | P0 | 401 → one automatic refresh attempt; if it fails → session cleared (Redux, in-memory token, React Query cache, secure storage) → routed to login. |
| TOK-006 | P0 | Logout → `{ok:true}`; replay the same refresh token → `401`. Confirm local state cleared even when logout call itself fails: logout in airplane mode → local wipe still happens → **[record/verify]**. |
| TOK-007 | P0 | Tampered JWTs → all `401`, no data leak: (a) edited payload, (b) wrong signature, (c) `alg:"none"`, (d) expired, (e) malformed/truncated. |
| TOK-008 | P0 | Missing `Authorization` header on every protected route (spot-check each table §3) → `401`. `change-password`, `change-pin`, `verify-pin` specifically reject missing tokens (A16). |
| TOK-009 | P1 | `refreshToken` field bounds: garbage <32 chars → `422` (not `401`); >512 → 422. |
| TOK-010 | P1 | Access token of a deleted account → `401`; refresh token too → `401`. |
| TOK-011 | P1 | After `reset-password`: all prior refresh tokens → `401`. After `change-password`: current access token dies (stale version) → forced re-login. |
| TOK-012 | P1 | Multi-device (TD-ACCT-6): logout on device A → device B session unaffected → **[record actual]**. |
| TOK-013 | P1 | Token in secure storage: after logout, inspect device keychain/keystore (or behavioral: kill+reopen → login screen, no stale auto-login). |
| TOK-014 | P2 | Device clock skewed ±2h → token validity judged server-side; app doesn't prematurely treat tokens as expired or leak refresh loops → **[record]**. |
| TOK-015 | P1 | Refresh request issued while a refresh is already in flight → requests queue and replay once; UI doesn't double-submit mutations (e.g. two identical PUT /user/me). |
| TOK-016 | P2 | Access token with >64-char `X-Request-ID` or control chars → request handled safely (400 or sanitized) — also SEC. |

## 4. Password Recovery & Change (F4/F5 / A5/A6)

| ID | Pr | Steps → Expected |
|---|---|---|
| PWD-001 | P0 | `forgot-password` existing email → `202`; non-existing email → **byte-identical** `202` (save both bodies, diff them). UI always shows "if the account exists…" copy. |
| PWD-002 | P0 | Full reset flow: forgot → OTP `123456` → `reset-password {email, otp, newPassword}` → `{ok:true}` → login with new password `200`; old password → `401`. |
| PWD-003 | P0 | Reset revokes ALL sessions: token obtained before reset → `401` afterwards. |
| PWD-004 | P0 | Reset OTP: wrong ×5 → exhausted; >10 min → expired `400`; reuse after success → rejected. |
| PWD-005 | P1 | `reset-password` newPassword bounds: 7 → 422; 8 → ok; 128 → ok; 129 → 422. No complexity rule — verify & note **[record]**. |
| PWD-006 | P0 | `change-password` correct current → success → all sessions revoked → app forces re-login (flow ends at login screen). |
| PWD-007 | P0 | `change-password` wrong current → `401`; ×5 → `429` 15-min lock; after expiry → works. |
| PWD-008 | P1 | `change-password` newPassword == currentPassword → accepted or rejected? **[record]**. |
| PWD-009 | P1 | Change-password while offline → local state intact; no partial logout. |
| PWD-010 | P1 | `forgot-password` malformed email / reserved TLD → 422 or identical 202? **[record]** (spec: always-202 applies to existing-vs-not; malformed input may 422 — confirm no enumeration). |
| PWD-011 | P2 | Rapid repeat `forgot-password` calls → new OTP supersedes (newest wins); no send-side limit locally — SMS provider may surface 503/429 → app handles gracefully. |
| PWD-012 | P1 | After reset, app on OTHER logged-in device → its next request → 401 → refresh fails → lands on login (session revoked everywhere). |

## 5. PIN (F5 / A6)

| ID | Pr | Steps → Expected |
|---|---|---|
| PIN-001 | P0 | `verify-pin {pin:"1234"}` → `200`; wrong PIN → `401`. |
| PIN-002 | P0 | Wrong PIN ×5 → `429 PIN is temporarily locked` (15 min); locks PIN ops only — password login unaffected (verify both directions). |
| PIN-003 | P0 | `change-pin {currentPin:"1234", newPin:"5678"}` → success; old PIN verify → `401`; new → `200`; restore to `1234` after. |
| PIN-004 | P1 | PIN format: `123`, `12345`, `12a4`, `abcd`, empty → all `422`. |
| PIN-005 | P1 | Correct PIN during PIN-lock → still rejected; after 15 min → accepted. |
| PIN-006 | P1 | `change-pin` with wrong `currentPin` → `401` and counts toward the 5-fail lock. |
| PIN-007 | P1 | PIN entry UI: masked digits, no PIN in plain text, paste handling, backspace; PIN never logged. |
| PIN-008 | P1 | `change-pin` newPin == currentPin → **[record]**. |
| PIN-009 | P2 | `face-update/pin` gate: re-enroll requires PIN verify first — try skipping to `face-update/camera` directly → blocked/redirected. |

## 6. Profile (F6 / A7)

| ID | Pr | Steps → Expected |
|---|---|---|
| PROF-001 | P0 | `GET /user/me` → User object incl. `faceEnrolled`, `biometricConsentAt`; renders correctly. |
| PROF-002 | P0 | `PUT /user/me` `{fullName, dateOfBirth, address}` → updates persist; re-GET confirms. |
| PROF-003 | P0 | `PUT /user/me` containing `email` or `phone` → `409`; UI renders email/phone read-only (no edit affordance). |
| PROF-004 | P0 | Mass assignment: `PUT /user/me` with extra fields `role:"admin"`, `customerId:<other>`, `status`, `faceEnrolled:true` → ignored or rejected; stored profile unchanged (verify via GET). |
| PROF-005 | P1 | DOB accepts both `MM/DD/YYYY` and `YYYY-MM-DD`; invalid (`15/01/1990`, `1990-13-45`, free text) → 422. |
| PROF-006 | P1 | `address` at 1000 chars → ok; 1001 → 422; whitespace-only → 422 **[record]**; unicode/emoji → handled. |
| PROF-007 | P1 | `fullName`: 1 char → 422; 2 → pass; 100 → pass; 101 → 422; whitespace-only → 422; emoji/unicode → **[record]**. |
| PROF-008 | P1 | Long name (100 chars) + long address (1000 chars) do not break profile, family list, or detail layouts (visual check). |
| PROF-009 | P2 | Profile update reflected in `AuthResponse.user` on next login — no stale name. |
| PROF-010 | P2 | Concurrent profile edits from two devices → last-write-wins or conflict? **[record]**. |

## 7. Biometric Consent (F7 / A8)

| ID | Pr | Steps → Expected |
|---|---|---|
| CON-001 | P0 | Grant consent `{accepted:true}` → `biometricConsentAt` set; face features unlocked. |
| CON-002 | P0 | Withdraw `{accepted:false}` → `faceEnrolled:false`, face template deleted, `identity/summary.face:"missing"`; re-enroll path still available. |
| CON-003 | P0 | Withdraw consent when NO face enrolled → succeeds cleanly (no 500). |
| CON-004 | P1 | Rapid toggle accept/withdraw ×3 → consistent final state, no orphan face template (verify via `faceEnrolled`). |
| CON-005 | P1 | After withdrawal, attempt `PUT /face` re-enroll → must require fresh liveness (old session data invalid). |
| CON-006 | P1 | Consent toggle UI reflects server truth: toggle shows current state on screen entry (not stale optimistic state). |
| CON-007 | P2 | Withdraw consent → family members' faces unaffected (spec deletes only the primary's template — verify family `faceEnrolled` unchanged) → **[record]**. |

## 8. Liveness Challenge (F8 / A9) — physical device only

| ID | Pr | Steps → Expected |
|---|---|---|
| LIV-001 | P0 | `POST /liveness/v2/challenge` → `{session_id, session_token, challenge_sequence[], expires_in_seconds:300, step_time_limits:{min_ms:300,max_ms:10000}, ui_copy{}}`; 2 actions from {blink, turn_left, turn_right}. |
| LIV-002 | P0 | UI renders challenge steps in **returned order** — never hard-coded; `ui_copy` text shown per step. Repeat challenge multiple times → sequence randomizes **[record variance]**. |
| LIV-003 | P0 | Each evidence step duration within 300 ms–10 s → accepted; finalize → `{status:"passed", antispoof_score}`. |
| LIV-004 | P0 | `duration_ms < 300` or `> 10000` → step rejected. |
| LIV-005 | P0 | Non-monotonic `client_ts_ms` (equal or decreasing) → rejected. |
| LIV-006 | P0 | Submit steps out of order / wrong action → `200 {success:false, status:"failed"}` → must restart the WHOLE challenge (app restarts, doesn't resubmit). |
| LIV-007 | P0 | Let session age >300 s then submit evidence → failure; app detects expiry and re-issues challenge. |
| LIV-008 | P0 | Missing `X-Session-Token` on evidence/finalize → `401`/`400`. |
| LIV-009 | P0 | User A's `session_token` on user B's `sessionId` → rejected. |
| LIV-010 | P0 | `?personId=` mismatch: challenge created for member X used to submit/enroll for member Y → rejected. |
| LIV-011 | P0 | Anti-spoof: replay recorded video of a face / hold up a photo / screen replay → `status:"failed"`. Try printed photo, phone screen, tablet screen. |
| LIV-012 | P0 | `step_index` abuse: negative, duplicate, skipping (0→2), out-of-range → rejected. |
| LIV-013 | P1 | Evidence submitted to an already-finalized session → rejected **[record code]**. |
| LIV-014 | P1 | Two challenges created back-to-back → does the second supersede the first? Submit evidence to the stale one → **[record]**. |
| LIV-015 | P1 | Multipart missing a required field (`challenge`, `step_index`, `client_ts_ms`, `duration_ms`) → `400`/`422`, not `500`. |
| LIV-016 | P1 | Wrong MIME/extension on evidence/finalize (PNG/GIF/HEIC where JPEG expected) → rejected. |
| LIV-017 | P1 | `GET /liveness/v2/challenge/{sessionId}` polling returns sane status at each stage (created → evidence partial → finalized). |
| LIV-018 | P0 | Finalize does NOT enroll a face — after passed liveness but before `/face/enroll`, `faceEnrolled` still false. |
| LIV-019 | P1 | Kill app mid-challenge (between steps, after finalize before enroll) → session single-use; app restarts liveness cleanly. |
| LIV-020 | P1 | Evidence upload on 4G/throttled: per-step p95 < 3 s target; UI shows progress, retry on timeout doesn't corrupt session. |
| LIV-021 | P2 | Challenge for `?personId=` of a 0–4 member → `422` (photo path only). |
| LIV-022 | P2 | `ui_copy` missing/blank for a returned action → UI defect (must render every value). |

## 9. Face Enrollment (F9 / A9)

| ID | Pr | Steps → Expected |
|---|---|---|
| FACE-001 | P0 | `POST /face/enroll {livenessSessionId, sessionToken}` after passed liveness → `{ok, faceEnrolled:true, faceId}`; `GET /user/me` confirms. |
| FACE-002 | P0 | Second `/face/enroll` with the SAME consumed session → fails (single-use); app requires new liveness. |
| FACE-003 | P0 | `/face/enroll` missing `livenessSessionId`/`sessionToken` → `400`. |
| FACE-004 | P0 | Under-5 member: `{personId, selfieBase64}` → success; same member with liveness fields → rejected. |
| FACE-005 | P0 | `selfieBase64`: invalid base64, empty string, base64-of-text, base64-of-PDF → `400`. |
| FACE-006 | P0 | `PUT /face` re-enroll: PIN verification first → new liveness → update; verify new template replaces old (subsequent kiosk/identify semantics aside, `faceEnrolled` stays true). |
| FACE-007 | P1 | Failed enroll (valid session, server reject) → session consumed anyway → user must redo liveness (document UX: does app say "start over"?). |
| FACE-008 | P1 | Enroll for family member via `+personId` → ownership-checked; another user's personId → `403`/`404` (SEC/BOLA). |
| FACE-009 | P1 | Enroll with consent withdrawn → rejected or re-prompts consent → **[record]**. |
| FACE-010 | P2 | **Duplicate-face enrollment**: enroll the same physical face on a second account → currently ACCEPTED (no 1:N dedupe — verified in backend code). **[record]** — product decision, not auto-bug. |
| FACE-011 | P1 | `face-update/success` and `face-update/error` screens reachable only with real outcome — deep-link directly → handled. |
| FACE-012 | P2 | Enroll while offline / dropped connection during call → clean retry; session state consistent on reconnect. |

## 10. Family Management (F10 / A10 / A11)

Age-band matrix (today = Sep 2026) — create a member per row and verify `ageBand`, `faceCaptureMode`, `allowedCameras`, `verification`, `turning18Soon`:

| ID | Pr | DOB / Case → Expected |
|---|---|---|
| FAM-001 | P0 | Add member `{name, dateOfBirth, relationship}` → `201`; appears in `GET /family` with all fields. |
| FAM-002 | P0 | Age 3 (`2023-06-01`) → `faceCaptureMode:"photo"`; `POST /liveness/v2/challenge?personId=` → `422`; enroll via `selfieBase64` → succeeds. |
| FAM-003 | P0 | Exactly 5 (`2021-09-15`) → first liveness band; `allowedCameras` includes `back`. |
| FAM-004 | P0 | Age 9 (`2017-01-01`) → liveness; front or back camera. |
| FAM-005 | P0 | Exactly 10 (`2016-09-15`) → `allowedCameras:["front"]` only. |
| FAM-006 | P1 | Age 17 (`2009-01-01`) → front only; `turning18Soon` reflects proximity **[record exact window]**. |
| FAM-007 | P1 | Exactly 18 (`2008-09-15`) → adult band; still liveness + front. |
| FAM-008 | P1 | DOB today / age 0 (`2026-09-15`) → accepted as 0–4 or rejected → **[record]**. |
| FAM-009 | P1 | Future DOB (`2027-01-01`) → expect `422`/`400` → **[record]**. |
| FAM-010 | P0 | `DELETE /family/{personId}` → member gone: `GET /family/{id}` → `404`, absent from list, member's documents → `404`, member's face removed; re-add same person works. |
| FAM-011 | P1 | `GET /family/{id}/activity` → `[]` renders empty state, not an error (not a bug — known gap). |
| FAM-012 | P1 | `relationship` free text 1–50 chars — app picker constrains to (Child/Parent/Spouse/Guardian…); raw API accepts arbitrary (`"x"`, `"🚀"`, 51 chars → 422) → **[record]**; file as finding if product intended enum. |
| FAM-013 | P1 | Member name bounds: 1 → 422; 2 → ok; 100 → ok; 101 → 422; emoji/unicode → **[record]**. |
| FAM-014 | P1 | BOLA: `GET/DELETE /family/{otherUser's personId}` with own token → `403`/`404`, never `200` with foreign data. |
| FAM-015 | P1 | Liveness for member 5–9 using back camera completes; for 10+ member back-camera evidence → rejected or UI never offers it. |
| FAM-016 | P1 | Add member while offline → queued/failed cleanly; no ghost member in list after reconnect. |
| FAM-017 | P2 | Duplicate member (same name+DOB) → allowed or 409 → **[record]**. |
| FAM-018 | P2 | Member turning 18 boundary: create at 17y11m → `turning18Soon` true; app shows `notification/age-18` surface correctly → **[record]**. |

## 11. Documents (F11 / A12)

| ID | Pr | Steps → Expected |
|---|---|---|
| DOC-001 | P0 | `POST /documents {type,label,number,expiresAt}` for each valid type: `passport, drivingLicense, idCard, greenCard, birthCertificate, usVisa` → `201` pending each. |
| DOC-002 | P0 | Unsupported type (`aadhaar`, `voterId`, `"passport "`, `PASSPORT`) → `422` **[record which variants pass]**. |
| DOC-003 | P0 | `GET /documents` → `number` AND `extractedDocumentNumber` masked (`•••••6789` style); `matchScore` 0–1; `portraitImageUrl`/`documentImageUrl` → `null` → UI placeholder (pipeline not deployed — known gap). |
| DOC-004 | P0 | `POST /documents/{id}/verification-sessions` with `frontObjectKey` outside `customers/{customerId}/` → `400`; `"../"`, `customers/<other-id>/` → `400`. |
| DOC-005 | P0 | `POST /document-verification-sessions/{id}/verify` without `frontImageBase64` → `503` currently (Regula/pipeline not deployed — record; expected gap). With valid base64 → `{outcome, reasonCode, extracted*, matchScore, document}` when provider live. |
| DOC-006 | P0 | `GET /document-verification-sessions/{id}` polling: statuses `created`/`completed`; app polls without tight loop. |
| DOC-007 | P1 | Idempotency: resend `verification-sessions` with same `requestId` → returns existing session or `409`; must NOT create duplicates → **[record]**. |
| DOC-008 | P0 | `DELETE /documents/{id}` → `404` on re-GET; absent from list; `/documents/issued` unaffected unless issued. |
| DOC-009 | P1 | `GET /documents/issued` → `[]` or seeded `IssuedDoc[] {id,name,issuer,issuedAt,icon,number,status:Active|Expired}`; empty renders cleanly. |
| DOC-010 | P1 | Family-scoped docs: `POST /documents` with `personId`; `GET /documents?personId=` filters correctly; deleting the member removes their docs (FAM-010). |
| DOC-011 | P1 | BOLA: `GET/DELETE /documents/{otherUser's docId}` → `403`/`404`; `?personId=` of foreign member → filtered/denied. |
| DOC-012 | P1 | `expiresAt` in the past → accepted (Expired) or rejected → **[record]**; renders in device-local time (see A11Y-008). |
| DOC-013 | P1 | `number` field: max-length, special chars, unicode → **[record limits]**; stored encrypted, returned masked — verify list AND detail both masked (S3 if either leaks raw). |
| DOC-014 | P2 | `document/scan`, `document/processing`, `document/mismatch`, `document/verified` screens: deep-link directly without a session → handled; verification capture UI stays behind release flag until pipeline ships. |
| DOC-015 | P2 | `label` bounds/unicode; `expiresAt` invalid format (`32/13/2026`, free text) → 422. |
| DOC-016 | P1 | Create doc → kill app mid-submit → no partial row OR clean `pending` state in list **[record]**. |

## 12. Identity Summary / Notifications / Bookings (F12/F13/F14 / A13)

| ID | Pr | Steps → Expected |
|---|---|---|
| READ-001 | P0 | `GET /identity/summary` → `{status, face, document, selfieMatch, activity[]}`; `status:"verified"` iff face AND document both verified; partial states render per-signal (verified/pending/missing/failed). |
| READ-002 | P1 | Dashboard after consent-withdrawal: `face:"missing"`; after doc delete: `document` downgrades — status recomputed, not cached stale. |
| READ-003 | P1 | `GET /notifications` → `[]` empty state when unseeded (known gap: no public producer). Params: `limit` 0 → 422? `1..100` ok; `101` → 422 **[record]**; `offset`, `unread_only` → filtered correctly. |
| READ-004 | P1 | **Schema trap:** response uses `is_read` (bool) NOT `read` — verify app parses correctly and doesn't show everything unread. |
| READ-005 | P1 | No public mark-read/read-all route exists — UI must not offer a dead "mark all read" action → **[record/defect if present and broken]**. |
| READ-006 | P1 | `GET /bookings` → `[]`; `GET /bookings/{fake-id}` → `404` handled with "not found" UI, not crash. `booking/[id]` deep-link with garbage ID → handled. |
| READ-007 | P1 | `GET /family/{id}/activity` → `[]` empty-state (not error). |
| READ-008 | P2 | If backend seeds a notification (needs title, message, notification_type): renders with local-time `created_at`, `data` payload handled, `notification_type` unknown value → graceful fallback. |
| READ-009 | P2 | `GET /health` and `/cb/health` → `200`; app start-up health check doesn't block UI on failure → **[record]**. |
| READ-010 | P2 | `ANY /cb/internal/*` (GET/POST/PUT/DELETE) → always `404` (A15/F16). |

## 13. Account Deletion (F15 / A14)

| ID | Pr | Steps → Expected |
|---|---|---|
| DEL-001 | P0 | `DELETE /user/me {confirmation:"DELETE", pin:<correct>}` → success → login `401`; old access+refresh tokens `401`; family data unreachable; docs gone. |
| DEL-002 | P0 | `confirmation` variants: `"delete"`, `"Delete"`, `"DELETE "` (trailing space), missing field, `"DELET"` → all rejected; correct PIN but wrong confirmation → rejected. |
| DEL-003 | P0 | Wrong PIN → rejected (counts toward PIN lock? **[record]**); 5 wrong → PIN lock applies. |
| DEL-004 | P0 | Re-register the deleted phone number → allowed (409 check ignores tombstones — confirmed) → full funnel works as NEW account (no zombie data). |
| DEL-005 | P1 | Deletion removes family face+docs synchronously: `GET /family/{id}` → `404` for every member; `GET /documents?personId=` → `404`/`[]`. |
| DEL-006 | P1 | App-side: delete in airplane mode → local wipe still happens (Redux, token, RQ cache, secure storage) → lands on auth. |
| DEL-007 | P1 | Double-tap confirm on `account/delete` → single deletion, no error loop; `account/delete/processing` screen can't be re-entered via back button. |
| DEL-008 | P1 | Delete while a liveness session is in-flight → subsequent evidence/enroll calls → rejected. |
| DEL-009 | P2 | After deletion, device B logged-in session → next request → 401 → routed to login (sessions revoked server-side). |
| DEL-010 | P2 | `account/delete/success` deep-link without completing deletion → handled. |

## 14. Field-Validation Boundaries (§6.3 — test EVERY edge)

| ID | Pr | Field → Cases |
|---|---|---|
| VAL-001 | P0 | `fullName` / family name (2–100): `""`, 1, 2, 100, 101, whitespace-only, `"  John  "` (trimming?), emoji-only, CJK/Arabic unicode, newline inside. |
| VAL-002 | P0 | `password`/`newPassword` (8–128): 7 → 422; 8 → ok; 128 → ok; 129 → 422; all-spaces; emoji; no-complexity rule → verify & **[record]**. |
| VAL-003 | P0 | `confirmPassword`: mismatch → 422; exact match including trailing-space difference → 422. |
| VAL-004 | P0 | `pin`/`currentPin`/`newPin` (`^\d{4}$`): `123`, `12345`, `12a4`, `""`, ` 1234`, `1234 ` → 422. |
| VAL-005 | P1 | `phone` (7–24): 6 → 422; 25 → 422; `+91 99999 99998` (spaces) → normalization **[record]**; `(+91)9999999998`; letters mixed. |
| VAL-006 | P1 | `countryCode` (1–8, digits extracted): `+91`, `91`, `+1-242`, `++91`, `+`, empty → **[record normalization]**. |
| VAL-007 | P1 | `identifier` login (3–254): 2 → 422; 255 → 422; email-as-identifier; phone-as-identifier; unicode. |
| VAL-008 | P1 | `refreshToken` (32–512): `<32` garbage → 422 (not 401); `>512` → 422; valid length but unknown → 401. |
| VAL-009 | P1 | `address` (≤1000): 1000 → ok; 1001 → 422; newlines; emoji; HTML/`<script>` → stored but never rendered as markup (XSS check on display). |
| VAL-010 | P0 | `email`: `a@b.test`, `a@b.localhost`, `a@b.c`, malformed variants → 422; `user+tag@domain.com` → **[record]**; case-insensitive duplicate (`A@x.com` vs `a@x.com`) → 409? **[record]**. |
| VAL-011 | P0 | `dateOfBirth`: `MM/DD/YYYY` ok; `YYYY-MM-DD` ok; `15/01/1990`, `1990-13-45`, `02/30/2000`, free text, `2099-01-01` future → 422 where expected **[record each]**. |
| VAL-012 | P1 | `X-Request-ID`: 64 chars → echoed; 65 → 400/sanitized; control chars/newline → safely handled (header-injection attempt). |

## 15. Security & BOLA (§8 / F16 / A15–A16)

| ID | Pr | Steps → Expected |
|---|---|---|
| SEC-001 | P0 | **BOLA sweep** (two accounts A & B): A's token on B's `documents/{id}`, `family/{personId}`, `document-verification-sessions/{id}`, `bookings/{id}` → `403`/`404`, never `200` with foreign data. Try ID in URL, body, and `?personId=`. |
| SEC-002 | P0 | `customer_id`/`personId` derived from JWT — passing another customer's ID in body/query → no leak; ownership-checked everywhere. |
| SEC-003 | P0 | Caller-supplied `X-Internal-Api-Key` header on `/cb/*` → stripped; no privilege change; `/cb/internal/*` → `404` regardless of the header. |
| SEC-004 | P0 | Error envelope: every error = `{code,message,trace_id}`; no stack traces, hostnames, SQL, or internal service names in `message`. |
| SEC-005 | P0 | PII leak check: responses never contain full document numbers, PINs, password hashes, face templates, other users' data. Masking on EVERY read path (list + detail + summary). |
| SEC-006 | P0 | Token-type confusion both directions (see REG-010); also: refresh token used as access token → `401`. |
| SEC-007 | P0 | OTP reuse after success → rejected; cross-purpose OTP → rejected (REG-019/020). |
| SEC-008 | P0 | User enumeration: `forgot-password` byte-identical (PWD-001); login generic 401 (LOG-003/004); register 409 does disclose existence — note as **[accepted-by-design, record]**. |
| SEC-009 | P0 | HTTPS enforced on dev; plain HTTP (if reachable) → redirect or refuse. |
| SEC-010 | P0 | `X-Request-ID` echoed on every response ≤64 chars; oversized/control-char → safe handling (VAL-012). |
| SEC-011 | P1 | Body >20 MB → `413 PAYLOAD_TOO_LARGE` at BFF cap. |
| SEC-012 | P1 | Malformed JSON → `400 BAD_REQUEST` (never `500`); truncated JSON, wrong types (string for int), `null` required fields → 400/422. |
| SEC-013 | P1 | Logout invalidates refresh token server-side → replay → `401` (TOK-006). |
| SEC-014 | P1 | Deletion revokes sessions (DEL-001/009); password reset revokes (PWD-003); change-password kills current token (TOK-011). |
| SEC-015 | P1 | Duplicate-face enrollment on 2nd account → accepted per code → **[record]** (product decision; kiosk 1:N would match both). |
| SEC-016 | P1 | JWT claims: tokens contain no PII beyond IDs (decode payload); `kid`/`alg` confusion attempts → 401. |
| SEC-017 | P1 | CORS (web surface only, `localhost:3000`): preflight from foreign origin → denied; credentials not sent cross-origin. |
| SEC-018 | P1 | Stored XSS: name/address/relationship/label fields containing `<script>`, `"><img onerror>` → stored safely, never executed on render (app + any web surface). |
| SEC-019 | P2 | SQL/NoSQL injection strings in every input (`' OR 1=1--`, `{$gt:""}`) → 422/400, never data dump. |
| SEC-020 | P2 | Sensitive-data-at-rest: app must not persist `registrationToken` (memory-only), PIN, password, or OTP in AsyncStorage/logs — inspect device storage/logs on both platforms. |

## 16. Mid-Flow Kill & Interruption (§7.3)

| ID | Pr | Kill point → Expected on relaunch |
|---|---|---|
| KILL-001 | P0 | After `register`, before OTP → re-register same phone works; no stuck state. |
| KILL-002 | P0 | After phone OTP, before account-details → `registrationToken` memory-only → restart/resume per design **[record]**. |
| KILL-003 | P0 | Between liveness finalize and `/face/enroll` → session single-use → re-enroll fails; app restarts liveness. |
| KILL-004 | P0 | During document upload/submit → no partial row OR clean `pending` state. |
| KILL-005 | P1 | During OTP wait → OTP still valid on return (server TTL); countdown doesn't reset validity. |
| KILL-006 | P1 | Mid-camera during liveness step → app resumes safely (camera re-init); no frozen preview. |
| KILL-007 | P1 | During account-deletion processing → state consistent; can't double-delete or land on broken screen. |
| KILL-008 | P1 | During `face-update` PIN screen → returns to gate, face unchanged. |
| KILL-009 | P1 | During family add → member created once or not at all; no half-record (name w/o DOB). |
| KILL-010 | P1 | Incoming phone call / app backgrounded mid-liveness → challenge timeout handled; app offers restart. |
| KILL-011 | P1 | OS kills app under memory pressure during onboarding → deterministic re-entry point (no corrupted nav stack). |
| KILL-012 | P2 | Force-stop immediately after a mutation (PUT /user/me) but before response → on relaunch, state fetched fresh from server (no phantom local-only write). |

## 17. Idempotency & Concurrency (§7.6)

| ID | Pr | Steps → Expected |
|---|---|---|
| CONC-001 | P0 | Rapid double-tap on Register / Login / Verify-OTP / Submit buttons → single request effect; no duplicate accounts or sessions. |
| CONC-002 | P0 | Parallel `POST /auth/refresh` (TOK-002) → exactly one succeeds. |
| CONC-003 | P1 | Same `requestId` resent on `verification-sessions` → existing session or 409; no duplicates (DOC-007). |
| CONC-004 | P1 | Double-submit OTP verify concurrently → one succeeds, other fails cleanly (no double registrationToken). |
| CONC-005 | P1 | Two devices add family members simultaneously → both land or one conflicts → consistent list after refresh **[record]**. |
| CONC-006 | P1 | Pull-to-refresh spam on lists → no duplicate rows, no flicker-loop; debounced. |
| CONC-007 | P1 | Delete family member while another device views member detail → detail handles `404` gracefully on next fetch. |
| CONC-008 | P2 | Concurrent DELETE of same resource twice → second `404`, no 500. |

## 18. Payload & Content Edge (§7.5)

| ID | Pr | Steps → Expected |
|---|---|---|
| PAY-001 | P0 | Request body >20 MB → `413`. |
| PAY-002 | P0 | Malformed JSON body → `400`, not `500`. |
| PAY-003 | P1 | Multipart missing required field → `400`/`422`. |
| PAY-004 | P1 | Wrong MIME on face/liveness uploads (PNG/HEIC vs JPEG) → rejected. |
| PAY-005 | P1 | Mass assignment on `PUT /user/me` (PROF-004) → ignored/rejected. |
| PAY-006 | P0 | Object-key traversal: `frontObjectKey` = `customers/<other>/…`, `../`, absolute URL → `400`. |
| PAY-007 | P1 | Empty body on endpoints requiring fields → `422`/`400`; `Content-Type: text/plain` with JSON payload → `400`/415 **[record]**. |
| PAY-008 | P2 | Extremely large base64 selfie just under 20 MB → processed or clean `413`; over → `413`. |

## 19. Network Resilience

| ID | Pr | Steps → Expected |
|---|---|---|
| NET-001 | P0 | `503 SERVICE_UNAVAILABLE` → UI shows retry state (not infinite spinner); retry recovers. |
| NET-002 | P0 | `429 RATE_LIMITED` → app respects `Retry-After` (BFF maps → `Retry-After: 2`); does NOT hammer retries. |
| NET-003 | P0 | Airplane mode on each main screen → cached/empty states, no crash; mutations fail with retry option. |
| NET-004 | P1 | `FALLBACK_TO_MOCK` check: with `EXPO_PUBLIC_FALLBACK_TO_MOCK=false`, force a backend failure → real error surfaces, NOT silently-swapped mock data (mock masking = invalid QA). |
| NET-005 | P1 | Request timeout (server hangs >30 s) → app times out gracefully, retry available. |
| NET-006 | P1 | Flaky network (50% loss) during registration funnel → resumable; no duplicate side-effects. |
| NET-007 | P1 | Switch Wi-Fi↔cellular mid-liveness upload → step retries or clean failure; session not corrupted. |
| NET-008 | P2 | Server 500 (if ever seen) → captured with `trace_id`; app shows generic error, no raw body displayed. |

## 20. UI / Accessibility / Localization (§2.2–2.3)

| ID | Pr | Steps → Expected |
|---|---|---|
| A11Y-001 | P0 | VoiceOver (iOS) / TalkBack (Android): OTP inputs, camera instructions, destructive confirmations (delete account) are reachable & labeled. |
| A11Y-002 | P0 | Dynamic type / largest font: OTP digits, masked document numbers (`•••••6789`), `ui_copy` strings — no truncation/clipping. |
| A11Y-003 | P1 | 100-char names / 1000-char addresses don't break list or detail layouts. |
| A11Y-004 | P0 | Every `ui_copy` value returned by liveness challenge renders; blank/missing instruction = defect. |
| A11Y-005 | P1 | Timestamps (`addedAt`, `expiresAt`, `issuedAt`) render in **device-local** time from UTC; test across-midnight → off-by-one date = real defect. |
| A11Y-006 | P1 | Dark + light schemes: all screens legible; brand preset doesn't break contrast on OTP/camera overlays. |
| A11Y-007 | P1 | Delete-account confirmation requires typing `DELETE` + PIN — screen reader can complete it; no accidental one-tap delete. |
| A11Y-008 | P1 | Device timezone change mid-session → timestamps re-render correctly. |
| A11Y-009 | P2 | English only this cycle — no RTL testing required; but RTL device locale shouldn't break layout → **[record]**. |
| A11Y-010 | P1 | Validation errors bind to fields (`VALIDATION_ERROR` details → per-field messages); toast/banner for non-field errors. |

## 21. Performance Sanity (§10.5 — proposed budgets)

| ID | Pr | Check |
|---|---|---|
| PERF-001 | P1 | `GET /cb/health`, `GET /user/me` → p95 < 500 ms. |
| PERF-002 | P1 | Login / register / verify-otp → p95 < 2 s. |
| PERF-003 | P1 | Liveness evidence upload per step → p95 < 3 s on 4G. |
| PERF-004 | P2 | Document `/verify` → p95 < 15 s (provider-bound). |
| PERF-005 | P2 | ~50 concurrent sessions sustained → no elevated 5xx — **only with explicit backend sign-off** (shared dev env). |

## 22. "Break the App" Adversarial (E2E)

| ID | Pr | Steps → Expected |
|---|---|---|
| ADV-001 | P1 | Deep-link every standalone route without state: `/document/verified`, `/document/mismatch`, `/face-update/success`, `/face-update/error`, `/family/9999`, `/booking/abc`, `/account/delete/success` → guarded/redirected, no white screen. |
| ADV-002 | P1 | Camera permission denied → liveness/face screens show permission prompt/fallback, not crash; revoke permission mid-session → handled. |
| ADV-003 | P1 | Camera in use by another app → graceful failure with retry. |
| ADV-004 | P1 | Low device storage during evidence capture/upload → clean error, no corrupted session state. |
| ADV-005 | P1 | Screen rotation / split-screen during OTP and liveness → layout holds; challenge state preserved. |
| ADV-006 | P1 | Device clock set +1 day → token refresh path still correct; clock -1 day → no premature expiry loops **[record]**. |
| ADV-007 | P1 | OS-level back button at every onboarding step → deterministic nav (no skipping ahead, no dead-end). |
| ADV-008 | P1 | Accessibility: "Bold Text" + max font + dark mode simultaneously on OTP/liveness → usable. |
| ADV-009 | P2 | 200+ family members added via API → list scroll/pagination perf **[record limits]**; member detail loads. |
| ADV-010 | P1 | Session expiry while typing on a form → form data not lost after re-login → **[record UX]**. |
| ADV-011 | P1 | Two devices: device A deletes account while B is mid-liveness → B's next call `401` → lands on login, no zombie UI. |
| ADV-012 | P2 | Paste 10,000-char string into every text field → client validation blocks or server 422; no freeze. |
| ADV-013 | P1 | Notification payload with unknown `notification_type`/huge `data` object (seeded) → inbox doesn't crash. |
| ADV-014 | P2 | Timezone +12/-12 while viewing `expiresAt`/`issuedAt` → correct local render (A11Y-005). |
| ADV-015 | P1 | Registration then immediate account deletion (no face/docs) → succeeds; re-register works (DEL-004). |

---

## Known Gaps — DO NOT File as Bugs (§1.4)

| Item | Expected |
|---|---|
| `portraitImageUrl`/`documentImageUrl` always `null` | Placeholder render; upload pipeline not deployed |
| `GET /bookings` → `[]`; `GET /bookings/{id}` → `404` | Empty until producer live |
| `GET /family/{id}/activity` → `[]` | Projection not connected |
| No push notifications | Inbox list only |
| No public mark-read route | `is_read` read-only for now |
| `/verify` without `frontImageBase64` → `503` | Regula/upload pipeline not deployed |
| `relationship` free-text (no enum) | Record as finding only if product intended enum |
| Duplicate face across accounts accepted | Record — product decision, not auto-bug |
| Register `409` reveals account existence | Accepted by design (note in report) |
| Kiosk check-in | Out of scope (kiosk-bff) |
| `./local/scripts/seed` | Stub — create all data via real APIs |

## Environment Rules

- Dev env is **shared** — re-run §5.5 smoke order after every deploy; retest any defect whose `trace_id` predates a deploy.
- 24-h build freeze before sign-off — request explicitly.
- Never use TD-ACCT-1 (seeded) for destructive tests — use TD-ACCT-4 (lockout) / TD-ACCT-5 (delete→re-register).
- No data-reset endpoint: cleanup = `DELETE /user/me` on that account. No direct DB access.
- Load test only with backend sign-off.

## Bug Report Template

```
Endpoint:        POST /cb/auth/login
Request-ID:      <X-Request-ID response header>
trace_id:        <from error body>
Env:             dev | local
Account:         <phone/email of test account>
Build:           <app build/version + platform + device>
Steps / Expected / Actual / Screenshots:
```

## Exit Criteria (per §10.2)

- All A1–A16 executed; **no open S1/S2**.
- Every failure carries `trace_id` + `X-Request-ID`.
- Known gaps re-verified as still-gaps.
- Full regression order (§5.5) completed once clean:
  login → kill/reopen refresh → fresh full-funnel registration → change password/PIN → profile update → family (0–4, 5–9, 18+) → documents CRUD → consent withdrawal → account deletion → logout state-clear.
