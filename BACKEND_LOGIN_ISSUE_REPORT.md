# Backend Issue Report — Login Flow (`/cb/auth/login`)

**Reported:** 6 September 2026  
**Frontend:** Truepas customer app (React Native / Expo)  
**Environment:** Dev — `https://api.dev.truepas.com/cb`  
**Endpoint:** `POST /cb/auth/login`  
**Affected user:** `9076433740` / `+19076433740`  

---

## 1. Summary

Login with a valid-looking phone number and password returns **HTTP 401 Unauthorized**. The response body does not contain a usable error message for the user, and the frontend's 401 refresh interceptor was trying to refresh on login failure, which produced a misleading `NO_REFRESH_TOKEN` error.

Frontend has now been fixed to **not** attempt token refresh on `/auth/login` 401. However, the **underlying backend issue remains**: the login endpoint is rejecting valid credentials (or credentials that the user believes are correct).

---

## 2. Evidence

### 2.1 Metro terminal log (frontend)

```
WARN  [DEBUG] /auth/login REQUEST: {"identifier": "9076433740", "password": "25Jan1999@"}
WARN  [DEBUG] 401 for /auth/login — trying refresh
WARN  [DEBUG] refreshAccessToken: no stored refresh token
```

After the frontend fix, the same request now surfaces as a plain 401. The `NO_REFRESH_TOKEN` was a side effect, not the root cause.

### 2.2 Health check (backend is up)

```bash
curl https://api.dev.truepas.com/cb/health
```

Response:

```json
{ "status": "healthy", "service": "truepass-customer-app-bff", "version": "1.0.0" }
```

So the BFF is reachable. The 401 is coming from the auth service or BFF auth logic, not a connectivity issue.

### 2.3 Invalid-credential test

```bash
curl -X POST https://api.dev.truepas.com/cb/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"nonexistent","password":"wrong"}'
```

This would help distinguish between:
- "user does not exist" (404 / 401 with specific code)
- "user exists but password wrong" (401)
- "user exists but account state prevents login" (403 / 409)

**This test was not run by the frontend team because the user's actual password is unknown.**

---

## 3. What the frontend sends

### Request

```http
POST /cb/auth/login
Content-Type: application/json
```

```json
{
  "identifier": "+19076433740",
  "password": "25Jan1999@"
}
```

Frontend now normalizes a bare 10-digit US number to `+1...` before sending. It leaves emails and already-prefixed international numbers untouched.

### Expected response (contract v1.1.0 — `AuthResponse`)

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "phone": "+19076433740",
    "faceEnrolled": false,
    "biometricConsentAt": null,
    ...
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

All fields **must be camelCase** per contract. If the backend returns `access_token` / `refresh_token`, the frontend has a fallback, but the contract specifies camelCase.

---

## 4. What the backend should not do

- **Do not return 401 without a clear reason.** The frontend currently maps any 401 to "Invalid credentials". If the real reason is "account locked", "email not verified", "phone not verified", or "registration incomplete", please return a distinct code so the UI can guide the user.
- **Do not return 200 with missing tokens.** If login is a multi-step flow and the user needs to verify a device or complete registration, return a structured response such as:
  ```json
  { "nextStep": "verifyDevice", "message": "..." }
  ```
  with an appropriate status (e.g., 202 Accepted), not 200 with empty tokens.

---

## 5. Possible root causes to investigate

### 5.1 Account `9076433740` / `+19076433740` does not exist
The user previously received **409 CONFLICT** on registration, which means an account with this identifier exists. However, the account may have been created in a different format:
- `9076433740` (no country code)
- `+19076433740`
- `19076433740`

Please check the database for all three variants. The registration API accepted `{ "phone": "9076433740", "countryCode": "+1" }`, so the stored value could be either `+19076433740` or `9076433740` depending on backend logic.

### 5.2 Password mismatch
The user claims the password is `25Jan1999@`. Please verify the stored hash for this account. If the account was created before password requirements were finalized, the stored password may differ.

### 5.3 Account state prevents login
The account may be in a state that allows registration to succeed but blocks login, e.g.:
- Phone OTP verified, but account details (email + password) never submitted.
- Email OTP pending.
- Biometric consent or KYC step pending.
- Account disabled / locked.

If this is the case, the backend should return a **specific error code**, not 401.

### 5.4 Identifier mismatch in login logic
Login may be querying the user table by `phone` while the registration API stored the number under `phone` in a different format (e.g., with spaces, parentheses, or without `+1`).

**Recommendation:** normalize all phone numbers to E.164 (`+19076433740`) on both registration and login, and perform a case-insensitive / format-normalized lookup.

### 5.5 `customer-account-service` still returning 503 wrapped as 401
The `BACKEND_ISSUES.md` report (2 September 2026) stated that `POST /cb/auth/login` was returning **503** because `customer-account-service` was down. If the service is now partially up but still unhealthy, it may be returning 401 instead of 503. Please check the BFF logs for the actual downstream error.

---

## 6. Action items for backend team

| # | Action | Priority |
|---|--------|----------|
| 1 | Confirm whether account `+19076433740` / `9076433740` exists in `customer-account-service` | High |
| 2 | Verify the stored password hash for this account | High |
| 3 | Check account state (phone verified, email verified, account details submitted, active/locked) | High |
| 4 | Return specific error codes for non-credential failures (`ACCOUNT_LOCKED`, `EMAIL_NOT_VERIFIED`, `REGISTRATION_INCOMPLETE`, etc.) | Medium |
| 5 | Normalize phone identifier lookup in login (E.164, strip non-digits, handle `+1` prefix) | Medium |
| 6 | Ensure `/cb/auth/login` returns `AuthResponse` with `accessToken` and `refreshToken` on success | High |
| 7 | Confirm all token field names are camelCase (`accessToken`, `refreshToken`) per contract | Medium |

---

## 7. How to test from backend side

```bash
# 1. Health
curl https://api.dev.truepas.com/cb/health

# 2. Login with the user's exact payload
curl -X POST https://api.dev.truepas.com/cb/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"+19076433740","password":"25Jan1999@"}'

# 3. Also test without +1
curl -X POST https://api.dev.truepas.com/cb/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"9076433740","password":"25Jan1999@"}'

# 4. Check registration status for the number
curl -X POST https://api.dev.truepas.com/cb/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"9076433740","countryCode":"+1"}'
```

---

## 8. Frontend changes already applied

- 401 refresh interceptor now skips auth endpoints (`/auth/login`, `/auth/register`, `/auth/verify-otp`, `/auth/forgot-password`, `/auth/reset-password`).
- Login normalizes a bare 10-digit US number to `+1...`.
- Login shows clear errors for missing tokens or 401 responses.
- Mock API and fallback disabled; app is using real backend only.

---

## 9. Contact

Frontend team can reproduce this on demand. Please share the backend logs for the `trace_id` associated with the failing login attempts, or the exact response body returned by `customer-account-service` to the BFF.

**Generated with [Devin](https://devin.ai)**  
**Co-Authored-By:** Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
