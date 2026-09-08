# Backend Blockers — Customer App Integration (Dev Environment)

| Field | Value |
|---|---|
| **Environment** | `https://api.dev.truepas.com` |
| **Reported by** | Customer App (React Native) team |
| **Impact** | Liveness + Document verification flows completely blocked |
| **App-side status** | All app-side issues fixed and verified — remaining failures are backend-side |

---

## Issue 1: BFF drops request body on Liveness Evidence endpoint

**Endpoint:** `POST /cb/liveness/v2/challenge/{sessionId}/evidence`

**Severity:** High — blocks liveness → face enrollment (onboarding gate)

### Symptom

App sends valid JSON body; liveness-service receives `null`. Every attempt returns:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    { "type": "missing", "loc": ["body", "challenge"],    "msg": "Field required", "input": null },
    { "type": "missing", "loc": ["body", "step_index"],   "msg": "Field required", "input": null },
    { "type": "missing", "loc": ["body", "client_ts_ms"], "msg": "Field required", "input": null },
    { "type": "missing", "loc": ["body", "duration_ms"],  "msg": "Field required", "input": null }
  ]
}
```

`"input": null` on **every** field = the FastAPI body model received no body at all.

### App-side proof

The app logs the exact body + headers immediately before dispatch:

```
[API] POST /liveness/v2/challenge/:id/evidence
data: {"challenge":"turn_right","step_index":0,"client_ts_ms":1788595836132,"duration_ms":5941}
contentType: application/json
```

Tested with **two different HTTP clients** (axios and raw `fetch`) — identical 422 both times.

### Likely root cause

The BFF liveness proxy consumes the request body (logging/validation/auth enrichment) and forwards to the liveness-service **without re-attaching the body** — a common proxy bug (`body-parser` consumes the stream; forwarded request has an empty body).

Supporting observation: `POST /cb/liveness/v2/challenge` (creation) works fine — only the `/evidence` sub-route drops the body.

### Expected vs actual

| | |
|---|---|
| **Expected** | `200` `{ "step_accepted": true, "next_challenge": "..." }` |
| **Actual** | `422` — all body fields missing, `input: null` |

---

## Issue 2: Document verification blocked — object storage pipeline not deployed

**Endpoint:** `POST /cb/document-verification-sessions/{sessionId}/verify`

**Backend response:**

```json
{
  "code": "SERVICE_UNAVAILABLE",
  "message": "Document images are required until object storage integration is complete",
  "trace_id": "bfe68132-c58e-4139-a786-fa9979d11cf8"
}
```

### What is happening

1. `POST /documents` → document created ✅
2. `POST /documents/{id}/verification-sessions` → session created, `sessionId` returned ✅
3. `POST /document-verification-sessions/{sessionId}/verify` with base64 images in body → **503**

The app sends `frontImageBase64` + `selfieImageBase64` (per KYC guide §6.3, which documents the identity-proofing-service contract: *"frontImageBase64 is required — omitting it returns 503"*, fields capped ~14 MB each). The app's payload is well under this cap (~0.5 MB per image after compression).

However, the BFF responds: **"Document images are required until object storage integration is complete"** — a transitional message indicating the BFF does not yet forward base64 image bodies to the identity-proofing-service, and instead requires the signed object-upload pipeline (which is not deployed).

This matches the contract's own readiness checklist (§16):

> "Document provider and signed object-upload pipeline are deployed." — **not yet done**

And §10: *"Provider deployment and the signed object-upload endpoint are required before enabling camera/file upload in production UI."*

### What the app team requests

1. **Deploy the signed object-upload pipeline + document provider (Regula)** — or
2. **Enable base64 passthrough** on `POST /cb/document-verification-sessions/{sessionId}/verify` as a transitional measure (the internal `identity-proofing-service` already supports `frontImageBase64` / `selfieImageBase64` per the KYC guide).
3. Confirm the exact verify body contract the BFF currently accepts.

---

## Trace IDs

| Issue | Trace IDs |
|---|---|
| Liveness evidence — body dropped (422) | `b3bae4c0-0f44-4b58-a4b0-31e22c9ecff1`, `fe00c8ab-1211-44f4-ac88-9ad6f98816b8` |
| Document verify — images required | `bfe68132-c58e-4139-a786-fa9979d11cf8`, `0cefd0ed-2cfa-4f08-8f92-1ec37da2208c` |

---

## What works end-to-end (app side, verified on device)

| Flow | Status |
|---|---|
| Login / registration / phone + email OTP | ✅ Working (after app fixes) |
| Camera preview + face detection (Vision Camera v5 + ML Kit) | ✅ |
| Liveness challenge creation | ✅ |
| Blink / turn-head detection (client-side) | ✅ |
| Liveness evidence submission | ❌ Blocked — BFF drops body (422) |
| Document add + verification session create | ✅ |
| Document verify (base64 images) | ❌ 503 — backend object storage not integrated |
| Face enrollment | ⛔ blocked by liveness |

## Asks

1. **Liveness evidence route:** fix body forwarding in the BFF liveness proxy (or confirm the intended contract).
2. **Document verification:** deploy the signed object-upload pipeline + Regula provider, or confirm base64 support on the BFF verify route.
3. Share corrected contracts if either endpoint's expected payload differs from the integration doc.
