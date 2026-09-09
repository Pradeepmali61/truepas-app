# BACKEND REPORT — Passport Verification Failing (Manual Review → UI "Failed")

**Date:** 2026-02-15
**Reported by:** Truepas Customer App team
**Priority:** High — blocks passport onboarding for real users
**Scope:** Customer BFF (`/cb`) → identity-proofing service document verification pipeline

---

## 1. Problem Summary

A real US Passport scan through the customer app returns a **non-approved outcome**
(UI shows "Verification Failed") even though:

- Regula OCR extracted **all fields correctly** (full name, document number, DOB,
  expiry, nationality)
- The **portrait was extracted** successfully from the document
- The document image quality was good (all data readable)

The user sees "Verification Failed" and cannot proceed, even though the document
is genuine and was scanned live.

---

## 2. Evidence

### 2.1 Failing case — US Passport (client device)

Verified screen showed **FAILED** with complete extracted data:

| Field | Extracted value |
|---|---|
| Full Name | MHATRE MANOJ VINOD |
| Document No | ••••6670 |
| Date of Birth | 06/08/1981 |
| Expiry | 02/27/2028 |
| Nationality | United States of America |
| Portrait | Extracted (photo visible in UI) |

**Observation:** OCR + portrait extraction succeeded. The failure happened in the
**decision stage**, not the reading stage.

### 2.2 What the app received

The verify response outcome was **not `approved`**. The app maps every non-approved
outcome (`review`, `manual_review`, `rejected`) to a single FAILED UI state, so the
exact backend `reasonCode` for this session is required to confirm which branch fired
(see §5 — logging request).

---

## 3. Evidence: Driving License PASSES With the Same Pipeline

Same app, same backend, same verify endpoints — Driver's License returns
`approved` and is stored as `verified`:

```json
{
  "type": "drivingLicense",
  "status": "verified",
  "matchScore": null,
  "portraitImageUrl": null,
  "extractedName": "PRADEEP MALI",
  "extractedDob": "1999-01-25",
  "issuingState": "Maharashtra"
}
```

Registered profile for the same user: `fullName: "Pradeep mali"`,
`dateOfBirth: 1999-01-25`.

**Key observation:** the DL was approved with `matchScore: null` and
`portraitImageUrl: null` — i.e. **no face match was performed** (or its result was
not recorded). Approval appears to be driven by OCR success + extracted
name/DOB matching the registered profile.

The failing passport **did** extract a portrait (photo visible in the app), which
implies a face-match step ran for the passport and did not produce a confident
pass — landing the session in `review`/`manual_review`.

**Hypothesis (needs backend confirmation):** the passport landed in
`manual_review` because either
1. extracted name/DOB did not match the registered profile exactly, or
2. the document-portrait vs selfie match score was below the auto-approve
   threshold, or
3. the selfie submitted with the verify call is not bound to any liveness
   session, so the backend cannot trust it as a live capture and defers to
   manual review.

---

## 3. Current Truepas Flow (as implemented in the app)

```
1. POST /cb/documents                        → create document record
2. POST /cb/documents/{id}/verification-sessions
3. POST /cb/document-verification-sessions/{sessionId}/verify
       body: { frontImageBase64, backImageBase64?, selfieImageBase64? }
4. GET  /cb/document-verification-sessions/{sessionId}   (recovery poll only)
```

Verify response contract the app consumes:

```json
{
  "id": "...", "status": "completed",
  "outcome": "approved | rejected | review",
  "reasonCode": "manual_review | ...",
  "documentId": "...",
  "matchScore": 0.0,
  "extractedName": "...", "extractedDob": "...",
  "extractedDocumentNumber": "...", "dateOfExpiry": "...",
  "nationality": "...", "issuingState": "...",
  "portraitImageUrl": "...", "documentImageUrl": "..."
}
```

### Known gaps in this flow

| # | Issue | Impact |
|---|---|---|
| A | **No liveness binding** — `selfieImageBase64` is a raw image with no proof it was captured live. The backend has no way to trust it, so face match against it can never justify auto-approval. | Passport → manual_review |
| **No enrolled-face reference** — the main user completes face enrollment during onboarding (liveness + enroll), but the document verify call does not reference the enrolled face. The backend has no trusted reference to match the document portrait against. | Same as above |
| **`review` outcome has no user-facing path** — the app maps every non-`approved` outcome to FAILED (binary UI per product decision). A `manual_review` result is therefore shown to the user as "Verification Failed", which is wrong messaging. | Client saw FAILED despite successful OCR |
| **No per-failure reason codes surfaced** — the app can render specific retry guidance (like Facepe does) only if the backend returns stable `reasonCode` values. | Generic failure UX |
| **Base64 JSON payload** — images travel as base64 inside JSON; large documents risk hitting BFF request-size limits. | Occasional 413s on high-res captures |

---

## 4. Working Reference — Facepe (same Regula backend stack)

Facepe's customer app verifies passports successfully against the same class of
backend. Its flow differs in three decisive ways:

### 4.1 Request cycle

```
Step 1  POST /cb/liveness/submit-selfie          (multipart: selfie_image)
        ← { session_id }                         (TTL 5 min)
        # selfie comes from an ON-DEVICE liveness run (FaceSDK startLiveness)

Step 2  POST /cb/documents/verify-and-store      (multipart/form-data)
        live_selfie          <file>
        document_image       <file>
        liveness_session_id  <from step 1>      ← binds selfie to liveness proof
        document_type        passport
        store_in_s3          true
        ← { success, document_id, verification_status,
            extracted_data { full_name, date_of_birth, nationality,
                             expiry_date, portrait_image_url,
                             security_checks_passed, overall_confidence },
            confidence_score, error }
```

### 4.2 Outcome handling — binary, with actionable error codes

- `success: true` → VERIFIED (no intermediate state)
- Failure returns a **specific error code**, each mapped to clear user guidance:
  - `SELFIE_MISMATCH` — selfie vs registered face
  - `DOCUMENT_FACE_MISMATCH` — document portrait vs registered face
  - `NO_PORTRAIT_IN_DOCUMENT` — no face found on document
  - `DOCUMENT_TYPE_MISMATCH` — scanned type ≠ selected type
  - `DOCUMENT_VERIFICATION_FAILED` — authenticity/OCR failure
  - `PROFILE_MISMATCH` — extracted data vs profile conflict
  - `FACE_SERVICE_ERROR` — upstream face service unavailable

### 4.3 Why Facepe passports auto-approve

1. The selfie is **liveness-proven** (session-bound), so the backend trusts it as
   a reference.
2. Face enrollment happens **before** document verification, so the document
   portrait is matched against an enrolled face — a trusted reference.
3. The approval policy is effectively: OCR + authenticity + face-vs-enrolled-face
   → binary decision. There is no `manual_review` path in the happy flow.

---

## 5. Root Cause (most likely)

For Truepas, the document verify call arrives with **no trusted face reference**:

- The selfie is an unverified base64 image (no liveness session attached).
- At document-verification time the user's enrolled face exists (onboarding
  enrolls first), but the verify request does not reference it.
- The backend therefore cannot confidently auto-approve when the document
  portrait match is borderline → returns `review` / `manual_review`.
- The app's binary UI then shows this as FAILED.

The DL "passes" because its approval path appears to rely on
**OCR + extracted-data-vs-profile match** (name + DOB matched exactly) and does
not perform a face match (`matchScore: null`, `portraitImageUrl: null` in stored
documents). The passport path extracts a portrait, runs a face match against an
untrusted selfie, and does not reach the auto-approve bar.

---

## 6. Requested Backend Changes (in priority order)

### R1 — Auto-approve policy for live-scanned documents (primary ask)

When ALL of the following hold, return `outcome: "approved"` directly:

- Regula OCR extracted the required fields (name, DOB, document number)
- Regula authenticity checks passed (MRZ checksum, template, security features)
- Document portrait matched the **enrolled/liveness-verified** face above the
  configured threshold

Reserve `manual_review` for genuinely ambiguous cases (e.g. authenticity
warnings only), not as a default landing state for good scans.

### R2 — Accept a liveness/enrollment reference on verify

Extend the verify contract so the app can bind the selfie to a trusted capture:

- Option A: accept `livenessSessionId` in `POST
  /documents/{id}/verification-sessions` (field already exists in
  `VerificationSessionRequest`) and validate the selfie against that session.
- Option B: match the document portrait against the user's **enrolled face**
  (from onboarding enrollment) instead of the raw selfie.

Frontend will start sending `livenessSessionId` as soon as the field is honored.

### R3 — Return actionable `reasonCode` values

Return stable machine-readable codes on non-approved outcomes so the app can
show precise guidance, e.g.:

- `PROFILE_MISMATCH` — extracted name/DOB ≠ registered profile
- `DOCUMENT_FACE_MISMATCH` — portrait vs selfie below threshold
- `NO_PORTRAIT_IN_DOCUMENT`
- `DOCUMENT_TYPE_MISMATCH`
- `AUTHENTICITY_FAILED` (+ which check)
- `MANUAL_REVIEW_QUEUED` — explicitly distinguish "pending human review" from "rejected"

### R4 — Decide the product behavior for `review`

Either:

- auto-approve per R1 so `review` becomes rare, **or**
- keep manual review but expose session status so the app can show
  "Under Review — we'll notify you" instead of FAILED.

The current behavior (review stored, UI shows FAILED) is the worst of both.

### R5 — Fix extracted document number encoding

Stored driving-license records show corrupted numbers:

```
"extractedDocumentNumber": "\ufffd?...\ufffd3439"
```

Non-ASCII glyphs from Regula are being persisted with broken encoding. Please
normalize to ASCII/UTF-8 before persisting (or store the raw + sanitized value).

### R6 — Duplicate same-type documents

`GET /cb/documents` for the test account returned **5 verified driving
licenses**. The app now deletes old same-type documents after a successful
re-verification, but historical duplicates remain server-side. Please:

- confirm whether a uniqueness constraint per (user, docType) can be enforced,
  or
- provide a cleanup path for existing duplicates.

### R7 — (Optional, parity with Facepe) Multipart upload

Accept `multipart/form-data` with file parts on the verify endpoint so the app
can stop embedding base64 in JSON (removes payload-size failures).

---

## 7. What the Frontend Will Do (once backend confirms)

1. Send `livenessSessionId` with verification-session creation (field already
   modeled in `VerificationSessionRequest`).
2. Render `review` as an explicit "Under Review" state instead of FAILED (or
   remove the state entirely if R1 makes it unreachable).
3. Map the new `reasonCode` values to specific, actionable user messages.
4. Migrate the verify call to multipart upload if R7 is implemented.
5. Fetch supported document types dynamically if the
   `/cb/documents/types/supported` endpoint is exposed.

---

## 8. Questions for the Backend Team

1. What exact `reasonCode`(s) did the failing passport session return?
   (Session/document ID can be provided on request.)
2. Is the approval threshold for face match configurable per document type?
3. Is `livenessSessionId` on the verification session already implemented
   server-side, and if not, what is the timeline?
4. Is there a per-user, per-document-type uniqueness rule planned (replaces the
   app-side duplicate cleanup)?
5. For passports specifically: which authenticity checks currently gate
   auto-approval, and can the policy be: OCR pass + authenticity pass +
   face-vs-enrolled pass ⇒ approved?
