# BUG REPORT: Backend Must Return Extracted Document Data

**Created:** 6 September 2026
**Severity:** High — blocks the document info card from showing real data
**Reference:** Facepe `facepe-user-frontend` verify.tsx + `src/schemas/api.ts`

---

## UPDATE (6 Sep 2026, evening): Partial fix verified — 3 fields still missing

Backend now returns `extractedName`, `extractedDob`, `issuingState`, and
`extractedDocumentNumber` in the verify response — **confirmed working** with a
real driving license scan. Thank you!

### Still missing (verified with live logs)

Verify request sent by the app:

```json
{"sessionId":"ab487e4b-…","hasFrontImage":true,"hasSelfie":true}
```

Verify response received:

```json
{
  "status": "completed",
  "outcome": "approved",
  "extractedName": "PRADEEP MALI",              // ✓ works
  "extractedDob": "1999-01-25",                 // ✓ works
  "issuingState": "Maharashtra",                // ✓ works
  "extractedDocumentNumber": "•••••••••••3439", // ✓ works
  "dateOfExpiry": null,                         // ✗ STILL NULL
  "matchScore": null,                           // ✗ STILL NULL
  "nationality": null,                          // ✗ STILL NULL
  "portraitImageUrl": null,
  "documentImageUrl": null
}
```

### 1. `dateOfExpiry` — always null (both passport AND driving license)

The document's validity/expiry field is visible and readable in the scanned
image, but the backend never returns it. Since `extractedDob` works, the Regula
OCR itself is running — most likely the expiry field is either not requested in
the Regula result or not mapped into the response. Please map the Regula
expiry field (e.g. `FIELD_EXPIRY` / document validity) to `dateOfExpiry`.

### 2. `matchScore` — null even when `selfieImageBase64` is provided

The app sent `selfieImageBase64` (`hasSelfie: true` in the request log), but the
response has `matchScore: null`. Per KYC guide §6.2, when a selfie is provided
the backend should pass it to Regula as `livePortrait` and return the face
match score (normalized 0..1). Either the selfie is not being forwarded to
Regula, or the match result is dropped silently. Note: `outcome: "approved"`
was returned WITHOUT any face match score — approving on a portrait document
without a face-match score weakens the approval quality.

### 3. `nationality` — null for driving license (may be N/A for DL)

Possibly expected for a DL (no nationality field), but it is also null for the
passport scan, where nationality IS printed. Same mapping issue as expiry.

### Frontend status

Frontend is complete and correct — it renders every field the backend returns
(`EXPIRES`, `MATCH SCORE`, `NATIONALITY` all display '—' only because the
values are null in the response). No frontend work is pending for these fields.

---


## Problem

The Truepas frontend captures the document image with Regula and uploads it to the backend for verification. The backend runs Regula server-side and does OCR, portrait extraction, authenticity checks, and face matching — **but the verify response does not include the extracted data**.

The frontend currently shows:
- Document number: **random placeholder** (`****4262`)
- Full name: **"—"**
- Date of birth: **"—"**
- Expiry date: **"—"**
- Nationality/State: **"—"**
- Portrait: **selfie fallback** (not the document portrait)
- Match score: **null**

In Facepe, the same flow returns full extracted data and the info card shows real values.

---

## Facepe Reference (working)

Facepe's backend returns `extracted_data` in the `verify-and-store` response:

```json
{
  "success": true,
  "extracted_data": {
    "full_name": "DOE JOHN",
    "first_name": "JOHN",
    "last_name": "DOE",
    "date_of_birth": "1990-01-15",
    "document_number": "D1234567",
    "expiry_date": "2028-01-14",
    "nationality": "USA",
    "issuing_country": "USA",
    "issuing_state": "CA",
    "issuing_state_name": "California",
    "portrait_image_url": "https://s3.amazonaws.com/.../portrait.jpg",
    "document_image_url": "https://s3.amazonaws.com/.../document.jpg",
    "overall_confidence": 0.95,
    "security_checks_passed": true
  },
  "confidence_score": 95
}
```

Facepe's frontend (`verify.tsx:1841-1901`) displays these fields in the flip card:
- Front face: portrait + full name + document number + DOB + expiry + state/nationality + verified date
- Back face: full document scan image

---

## Truepas Current Response (broken)

`POST /document-verification-sessions/{sessionId}/verify` returns:

```json
{
  "sessionId": "3c994723-...",
  "documentId": "e30014b9-...",
  "status": "completed",
  "outcome": "approved",
  "reasonCode": null,
  "document": {
    "id": "e30014b9-...",
    "type": "drivingLicense",
    "label": "Driver's License",
    "number": "••••4262",
    "status": "pending",
    "matchScore": null,
    "addedAt": "2026-09-06T08:29:44Z",
    "expiresAt": null
  }
}
```

**Missing fields:** `extractedName`, `extractedDob`, `extractedDocumentNumber`, `dateOfExpiry`, `nationality`, `issuingState`, `portraitImageUrl`, `documentImageUrl`, `matchScore`

---

## Required Backend Changes

### 1. `POST /document-verification-sessions/{sessionId}/verify` response

Add these fields to the verify response (top-level, alongside `outcome`):

| Field | Type | Source | Example |
|---|---|---|---|
| `extractedName` | string\|null | Regula OCR | `"DOE JOHN"` |
| `extractedDob` | string\|null | Regula OCR (ISO yyyy-mm-dd) | `"1990-01-15"` |
| `extractedDocumentNumber` | string\|null | Regula OCR | `"D1234567"` |
| `dateOfExpiry` | string\|null | Regula OCR (ISO yyyy-mm-dd) | `"2028-01-14"` |
| `nationality` | string\|null | Regula OCR | `"USA"` |
| `issuingState` | string\|null | Regula OCR | `"California"` |
| `portraitImageUrl` | string\|null | Regula portrait extraction → object storage | `"https://s3.../portrait.jpg"` |
| `documentImageUrl` | string\|null | Document image → object storage | `"https://s3.../document.jpg"` |
| `matchScore` | number\|null | Face match result | `95` |

### 2. `GET /documents` and `GET /documents/{id}` response

Add the same extracted fields to the `IdentityDocument` object so the document detail screen can display them later:

```json
{
  "id": "e30014b9-...",
  "type": "drivingLicense",
  "label": "Driver's License",
  "number": "••••4567",
  "status": "verified",
  "matchScore": 95,
  "addedAt": "2026-09-06T08:29:44Z",
  "expiresAt": "2028-01-14",
  "extractedName": "DOE JOHN",
  "extractedDob": "1990-01-15",
  "nationality": "USA",
  "issuingState": "California",
  "portraitImageUrl": "https://s3.../portrait.jpg",
  "documentImageUrl": "https://s3.../document.jpg"
}
```

### 3. Document number

The backend should set the document `number` field to the **real extracted number** (masked) instead of the random placeholder the frontend currently sends. Either:
- **Option A:** Backend overwrites the `number` field with the extracted value after Regula processing
- **Option B:** Backend returns `extractedDocumentNumber` separately and the frontend uses it

Option A is preferred (matches Facepe).

### 4. Portrait image

The backend should:
1. Extract the portrait from the document using Regula server-side
2. Upload it to object storage (S3)
3. Return the signed URL as `portraitImageUrl`

This replaces the on-device portrait extraction that was previously attempted (and reverted because Regula is third-party — all Regula processing should be server-side).

---

## Frontend Changes Already Made

The frontend has been updated to:
1. **Revert all on-device OCR/portrait extraction** — Regula is only used for document capture, not processing
2. **Types updated** — `VerifyDocumentResponse` and `IdentityDocument` now include all extracted fields
3. **Verified screen** — displays `extractedName`, `extractedDob`, `dateOfExpiry`, `nationality`/`issuingState`, `portraitImageUrl`, `matchScore` from the backend response
4. **Document detail screen** — displays the same fields from `GET /documents/{id}`
5. **Portrait display** — uses `portraitImageUrl` from backend, falls back to selfie, then icon placeholder

The frontend is **ready** — it will display real data as soon as the backend returns these fields.

---

## Architecture (Facepe-aligned)

```
Mobile app (capture only)          Backend (all Regula processing)
┌──────────────────────┐          ┌──────────────────────────────┐
│ Regula scanner       │          │ Regula server-side:          │
│ → document image     │  upload  │   → OCR (name, DOB, number)  │
│ → selfie (expo-cam)  │ ──────→  │   → portrait extraction      │
│                      │          │   → authenticity checks      │
│ NO on-device OCR     │          │   → face matching            │
│ NO on-device portrait│          │   → upload to S3             │
└──────────────────────┘          └──────────────────────────────┘
         ↑                                    │
         │  display extracted data            │
         └────────────────────────────────────┘
```

---

## Related Blockers

- `BUG_REPORT_DOCUMENT_VERIFY.md` — 503 object storage (needed for `portraitImageUrl` / `documentImageUrl`)
- This bug report is a superset — even without object storage, the OCR fields (`extractedName`, `extractedDob`, etc.) can be returned immediately since they don't require storage.

---

**Generated with [Devin](https://devin.ai)**
