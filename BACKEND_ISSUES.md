# Truepas Customer App — Backend Issues (Action Required)

**Date:** 2 September 2026
**From:** Frontend Team
**To:** Backend Engineering Team

---

## Issues

1. **OTP not received on phone** — `POST /cb/auth/register` returns **503** (`CUSTOMER_SERVICE_UNAVAILABLE`). Downstream `customer-account-service :8017` is down in dev. No OTP is generated or sent. Please start the service.

2. **No refresh token at login** — `POST /cb/auth/login` returns **503** (same service down). Once the service is up, please verify the `AuthResponse` JSON includes a `refreshToken` field (not `refresh_token` or `refresh-token`). Frontend expects camelCase per contract v1.1.0.

3. **Email OTP not sent** — `POST /cb/auth/account-details` returns **503**. Backend should accept account details and send an email OTP (response `202` with `nextStep: "verifyEmail"`). Currently no email is delivered because the service is down.

4. **Dev test OTP code** — Please confirm `OTP_TEST_CODE = 123456` is active in dev environment for both phone and email verification (contract section 6.4). Without this, we cannot test the registration flow even after the service is up.

5. **Signed object-upload endpoint** — Document verification UI is ready but needs the signed upload pipeline. Please expose the endpoint for uploading front/back/selfie images to object storage and return the object keys for `POST /cb/documents/{documentId}/verification-sessions`.

6. **Liveness & face services** — Please confirm `/cb/liveness/v2/challenge`, `/cb/liveness/v2/challenge/{sessionId}/evidence`, `/cb/liveness/v2/challenge/{sessionId}/finalize`, and `/cb/face/enroll` are deployed and reachable through the BFF in dev.

7. **Biometric consent endpoint** — Please confirm `POST /cb/user/me/biometric-consent` with body `{ accepted: boolean }` is deployed and returns `200` with `{ ok: true, consentAt: string }`.

8. **Duplicate phone not rejected at register** — `POST /cb/auth/register` must return `409 CONFLICT` when the phone already belongs to a completed account (contract v1.1.0 §6.1 / QA handoff §3.1: "409 if account exists"). Verified 17 Sep 2026: the seeded smoke account `+919999999998` gets `202` + `registrationId`, so the app only learns about the duplicate at the final email-OTP step — the user completes the whole funnel before being told the account exists. Re-registering the same phone while a registration is still in progress must still return `202` — only completed accounts should conflict.

---

## Environment

```
BFF URL: https://api.dev.truepas.com/cb
BFF health: ✅ healthy (verified)
Auth endpoints: ❌ 503 (customer-account-service down)
Protected endpoints: ✅ 401 without token (routing works)
```

## What We Need From Backend

- Start `customer-account-service` in dev
- Confirm all response field names are camelCase (per contract)
- Confirm dev test OTP `123456` is active
- Deploy signed object-upload endpoint for document verification
- Confirm liveness, face, and biometric-consent endpoints are live in dev
- Return `409` from `POST /cb/auth/register` when the phone already has a completed account
