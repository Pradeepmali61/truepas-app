# Bug Report: Document Verification fails — BFF requires object storage, base64 images not accepted

| Field | Value |
|---|---|
| **Severity** | High — blocks document verification → KYC onboarding flow |
| **Environment** | `https://api.dev.truepas.com` (dev) |
| **Service** | `customer-app-bff` → `identity-proofing-service` |
| **Reported by** | Customer App (React Native) team |
| **Date** | 2026-09 (dev testing) |

---

## 1. Summary

Document verification fails at the `/verify` step with `503 SERVICE_UNAVAILABLE`:

> **"Document images are required until object storage integration is complete"**

The app sends the document and selfie images as base64 in the verify request body (per the KYC integration guide §6.3, which documents this as the supported contract). The internal `identity-proofing-service` supports base64 (`frontImageBase64` required, `selfieImageBase64` for face match — verified in `identity-proofing-service/app/document_api.py` per the guide).

However, the BFF responds with a transitional error indicating it does **not** forward base64 image bodies, and instead requires the signed object-upload pipeline — which is not yet deployed.

---

## 2. Flow (what works and where it fails)

| Step | Endpoint | Status |
|---|---|---|
| 1. Add document | `POST /cb/documents` | ✅ `201` — documentId returned |
| 2. Create verification session | `POST /cb/documents/{documentId}/verification-sessions` | ✅ `201` — sessionId returned |
| 3. Verify with images | `POST /cb/document-verification-sessions/{sessionId}/verify` | ❌ `503` — "Document images are required" |

---

## 3. Request sent by the app (exact)

```http
POST /cb/document-verification-sessions/94895bd6-875f-49df-b201-b083df9cbd2f/verify
Content-Type: application/json
Authorization: Bearer <valid accessToken>
```

```json
{
  "frontImageBase64": "<JPEG base64, ~1600px wide, compressed 0.8>",
  "selfieImageBase64": "<JPEG base64, ~1600px wide, compressed 0.8>"
}
```

App-side log proof (logged immediately before dispatch):

```
LOG  [API] POST /document-verification-sessions/:id/verify
     {"sessionId":"94895bd6-875f-49df-b201-b083df9cbd2f","hasFrontImage":true,"hasSelfie":true}
```

Both images are present, compressed per the guide's recommendation (resize ~1600 px, JPEG quality 0.8), well under the documented ~14 MB per-field cap.

---

## 4. Response received (exact)

```json
{
  "code": "SERVICE_UNAVAILABLE",
  "message": "Document images are required until object storage integration is complete",
  "trace_id": "bfe68132-c58e-4139-a786-fa9979d11cf8"
}
```

---

## 5. Analysis

### Contract conflict between two documents

| Document | Says |
|---|---|
| `REACT_NATIVE_KYC_INTEGRATION_GUIDE.md` §6.3 | Verify body: `{ frontImageBase64, backImageBase64?, selfieImageBase64? }` — synchronous result. `frontImageBase64` required; omitting returns 503. Object keys (`frontObjectKey` etc.) are "NOT for base64 images... reserved for the future signed-upload pipeline... Leave them out until that pipeline ships." |
| `CUSTOMER_APP_FRONTEND_INTEGRATION.md` §10 | Verification session takes `frontObjectKey`/`backObjectKey`/`selfieObjectKey` (must start with `customers/{customerId}/`). "Provider deployment and the signed object-upload endpoint are required before enabling camera/file upload in production UI." |

The app implements the **KYC guide's base64 contract**. The BFF implements the **object-key contract** and rejects/ignores base64 bodies with the transitional 503 message.

### Root cause

The BFF's document-verification verify route currently does not accept base64 image payloads. It depends on the signed object-upload pipeline (object storage), which per the contract's own readiness checklist (§16) is **not yet deployed**:

> "Document provider and signed object-upload pipeline are deployed." — pending

---

## 6. Reproduction

```bash
# Step 1 — add document
curl -X POST "https://api.dev.truepas.com/cb/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"type":"passport","label":"Passport","number":"****1234","expiresAt":null}'
# → 201 { "id": "<documentId>", ... }

# Step 2 — create verification session
curl -X POST "https://api.dev.truepas.com/cb/documents/<documentId>/verification-sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"requestId":"req-1788598576585","frontObjectKey":""}'
# → 201 { "sessionId": "94895bd6-...", "status": "created", ... }

# Step 3 — verify with base64 images (FAILS)
curl -X POST "https://api.dev.truepas.com/cb/document-verification-sessions/<sessionId>/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"frontImageBase64":"<base64>","selfieImageBase64":"<base64>"}'
# → 503 { "code":"SERVICE_UNAVAILABLE", "message":"Document images are required until object storage integration is complete" }
```

---

## 7. What is needed from the backend team

**Option A (preferred per contract):** Deploy the signed object-upload pipeline + Regula document provider, and share the upload-endpoint contract so the app can integrate it.

**Option B (transitional / faster):** Enable base64 passthrough on `POST /cb/document-verification-sessions/{sessionId}/verify` — the internal `identity-proofing-service` already supports `frontImageBase64` / `selfieImageBase64` (per KYC guide §6.3, verified in `document_api.py`). The app is already sending this format.

Also confirm which contract is authoritative so the frontend and the integration docs can be aligned.

---

## 8. Trace IDs for lookup

```
bfe68132-c58e-4139-a786-fa9979d11cf8
0cefd0ed-2cfa-4f08-8f92-1ec37da2208c
```

---

## 9. Impact

- Document verification cannot complete → KYC onboarding blocked for all users
- Face enrollment (which depends on the KYC flow) is also blocked downstream
- App-side flow is fully implemented and verified on device up to the verify call
