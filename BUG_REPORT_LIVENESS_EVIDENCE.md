# Bug Report: BFF drops request body on Liveness Evidence endpoint

| Field | Value |
|---|---|
| **Severity** | High — blocks entire liveness/face-enrollment flow |
| **Environment** | `https://api.dev.truepas.com` (dev) |
| **Service** | `customer-app-bff` (BFF) → `liveness-service` |
| **Reported by** | Customer App (React Native) team |
| **Date** | 2026-09 (dev testing) |

---

## 1. Summary

The customer app sends a valid JSON body to `POST /cb/liveness/v2/challenge/{sessionId}/evidence`, but the liveness-service receives an **empty/null body**. Every request fails with `422 VALIDATION_ERROR` reporting all four required fields as missing.

The request leaves the app correctly formed (verified via request logs — see §5). The body is being dropped somewhere in the BFF proxy layer.

---

## 2. Endpoint

```http
POST /cb/liveness/v2/challenge/{sessionId}/evidence
Content-Type: application/json
X-Session-Token: <sessionToken from challenge creation>
Authorization: Bearer <accessToken>
```

Per integration contract §4.2 (KYC guide): evidence carries **no image** — only step metadata as JSON.

---

## 3. Request sent by the app (exact)

```json
{
  "challenge": "turn_right",
  "step_index": 0,
  "client_ts_ms": 1788595836132,
  "duration_ms": 5941
}
```

Headers sent:

```http
Content-Type: application/json
X-Session-Token: mgbKZkV-l1TBigJIBcNPiavhgTUX0aAIwD3vALGBeZo
Authorization: Bearer <valid accessToken>
```

---

## 4. Response received (exact)

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "trace_id": "b3bae4c0-0f44-4b58-a4b0-31e22c9ecff1",
  "details": [
    { "type": "missing", "loc": ["body", "challenge"],    "msg": "Field required", "input": null },
    { "type": "missing", "loc": ["body", "step_index"],   "msg": "Field required", "input": null },
    { "type": "missing", "loc": ["body", "client_ts_ms"], "msg": "Field required", "input": null },
    { "type": "missing", "loc": ["body", "duration_ms"],  "msg": "Field required", "input": null }
  ]
}
```

Key detail: **`"input": null`** on every field — the FastAPI body model received `null`, i.e. the request body bytes never arrived (or arrived empty). If only field *names* were wrong, `input` would contain the parsed body object instead.

---

## 5. Evidence — app-side request log

```
LOG  [Liveness] Turn detected: yaw=-16.8° crossed threshold 12°
LOG  [Liveness] Action detected: duration=5941ms (limits: 300-10000ms)
LOG  [Liveness] Submitting evidence for step 0: turn_right
LOG  [API] POST /liveness/v2/challenge/:id/evidence
     {"challenge":"turn_right","step_index":0,"client_ts_ms":1788595836132,"duration_ms":5941}
ERR  [API] /liveness/v2/challenge/:id/evidence fetch failed: 422
     {"code":"VALIDATION_ERROR", ... "input":null ...}
```

The app logs the exact body and Content-Type immediately before dispatch. The failure is therefore not client-side serialization.

---

## 6. Reproduction

### Step 1 — create a challenge (this works)

```bash
curl -X POST "https://api.dev.truepas.com/cb/liveness/v2/challenge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Response `200`:

```json
{
  "success": true,
  "session_id": "wQmadAyxfhmpChWh-FUvKd63kplney0TXn99CeOy_KY",
  "session_token": "mgbKZkV-l1TBigJIBcNPiavhgTUX0aAIwD3vALGBeZo",
  "challenge_sequence": ["turn_right", "turn_left"],
  "expires_in_seconds": 300,
  "step_time_limits": { "min_ms": 300, "max_ms": 10000 },
  "ui_copy": { "...": "..." }
}
```

### Step 2 — submit evidence (fails)

```bash
curl -X POST "https://api.dev.truepas.com/cb/liveness/v2/challenge/<SESSION_ID>/evidence" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: <SESSION_TOKEN>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"challenge":"turn_right","step_index":0,"client_ts_ms":1788595836132,"duration_ms":5941}'
```

**Expected:** `200` with `{ "step_accepted": true, "next_challenge": "..." }`
**Actual:** `422` — all body fields reported missing, `input: null`

---

## 7. What the app team has verified / ruled out

| Check | Result |
|---|---|
| Body is valid JSON with all 4 required fields | ✅ Verified in logs before dispatch |
| `Content-Type: application/json` header present | ✅ Set explicitly (both axios and raw `fetch` tested) |
| `X-Session-Token` header matches challenge response | ✅ |
| `Authorization: Bearer <accessToken>` present | ✅ (challenge creation succeeds with same auth) |
| Tested with two different HTTP clients (axios + fetch) | ✅ Same 422 both times |
| Field names match contract (`challenge`, `step_index`, `client_ts_ms`, `duration_ms`) | ✅ |

**Conclusion:** the failure is server-side, between the BFF ingress and the liveness-service.

---

## 8. Likely root cause (BFF side)

The BFF's liveness proxy route appears to consume the request body (e.g., for logging, validation, or auth enrichment) and then forwards the request to the liveness-service **without re-attaching the body**. This is a common proxy bug pattern (`body-parser` consumes the stream; the forwarded request has an empty body).

Supporting observation: `POST /cb/liveness/v2/challenge` (challenge creation) works correctly — only the `/evidence` sub-route drops the body.

---

## 9. What is needed from the backend team

1. Confirm the evidence route contract — exact expected body schema for `POST /cb/liveness/v2/challenge/{id}/evidence`.
2. Investigate the BFF liveness proxy for body forwarding on this route.
3. If the contract differs from the guide (e.g., multipart expected, different field names, token in body), share the corrected contract so the app can be updated.

---

## 10. Trace IDs for lookup

```
b3bae4c0-0f44-4b58-a4b0-31e22c9ecff1
fe00c8ab-1211-44f4-ac88-9ad6f98816b8
```

---

## 11. Impact

- Liveness challenge cannot be completed → face enrollment/update blocked
- Onboarding flow (mandatory face scan gate) blocked for all new users
- Face update flow from Security settings blocked
