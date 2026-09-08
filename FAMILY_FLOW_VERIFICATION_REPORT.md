# Family Member (5–17) Flow — Document Verification Gap & Proposed Fix

**To:** Backend / BFF team
**From:** Truepas customer app team
**Subject:** Family add flow — document verification is currently skipped; need contract confirmation before we wire it in
**References:** `REACT_NATIVE_KYC_INTEGRATION_GUIDE (1).md` §5.1 (family sequence), §6 (document verification)

---

## 1. Summary

While reviewing the **5–17 family member add flow**, we found that the app currently
**never runs document verification** for family member documents. The document is
created (`POST /cb/documents`) but no verification session is opened and `/verify`
is never called. As a result:

- Family documents stay **`pending` forever** — they never reach `verified`.
- The guide's required sequence (§5.1) is violated:
  > *5–17: document first → once `verification: "verified"` → liveness challenge
  > with `?personId=` → `POST /cb/face/enroll` with `personId`.*

  In the app, liveness currently starts **without** the document being verified.
- The selfie captured during the scan step is stored **only on the device** — it is
  never sent to the backend, so no face match happens for family documents.

This report describes the current flow, the gap, the fix we plan to make, and the
contract points we need the backend team to confirm.

---

## 2. Current app flow (as implemented today)

```
1. Member details            → POST /cb/family                    (member created)
2. Document type select      → (UI only)
3. Scan                      → Regula document scan + selfie capture (device only)
4. "Capture Complete"        → Continue
5. Processing screen:
   a. POST /cb/documents     (type, label, number, personId)      → docId, status: pending
   b. ❌ VERIFICATION SKIPPED — no verification-sessions call, no /verify
6. Age band routing:
   - 5–17  → liveness challenge (?personId=) → face enroll (personId)
   - 0–4   → member detail (no camera — correct)
```

**Consequences today:**

| Issue | Impact |
|---|---|
| No `/verify` call | Family document status stays `pending` indefinitely |
| Selfie never uploaded | No face match for family member documents |
| Liveness before verification | Violates guide §5.1 sequence; member can enroll a face while their document is unverified |
| 0–4 `checkin_frozen` | Guide says 0–4 stays `checkin_frozen` **until doc verified** — since verification never runs, frozen state may never lift |

---

## 3. Planned fix (app side)

We will mirror the main-user document flow (guide §6.3) inside
`family/add/processing.tsx`, **after** member creation + `POST /documents`:

```
1. POST /cb/family                                       → member (5–17 starts pending_document)
2. POST /cb/documents            (with personId)         → documentId (pending)
3. POST /cb/documents/{documentId}/verification-sessions  → sessionId
4. POST /cb/document-verification-sessions/{sessionId}/verify
      - 5–17 portrait docs: { frontImageBase64, selfieImageBase64 }
      - 0–4 birthCertificate: { frontImageBase64 } only (no selfie — nothing to match)
   → synchronous outcome (approved / rejected / review)
5. Routing by outcome + age band:
   - 5–17 + approved  → liveness (?personId=) → face enroll (personId) → member detail
   - 5–17 + rejected  → mismatch/recapture screen; member stays pending_document
   - 5–17 + review    → member detail with document "pending" (no liveness yet)
   - 0–4  + approved  → member detail (document verified; no camera ever)
   - 0–4  + rejected  → recapture screen
```

The verify call is treated as **synchronous** (guide §6.3 — polling is only a
crash-recovery path).

---

## 4. What we need the backend team to confirm

### Q1 — Verification for person-scoped documents
The guide (§5.1) says: *"document verification (section 6, **with `personId`**)"*.
Please confirm the exact mechanics:

- [ ] Is `personId` carried implicitly via the document created with `personId`
      (i.e. `POST /documents { personId }` → session/verify inherit it)?
- [ ] Or must `personId` be passed explicitly on
      `POST /documents/{id}/verification-sessions` or on `/verify`?
- [ ] Does the BFF currently allow `verification-sessions` + `/verify` for
      documents that belong to a family member (non-null `personId`)? If not,
      is there a blocker on the identity-proofing side?

### Q2 — Face match for family documents
- [ ] Will `/verify` run the **selfie ↔ document portrait match** for family
      documents when `selfieImageBase64` is provided (same as main-user docs)?
- [ ] Will the response include `matchScore` / extracted fields
      (`extractedName`, `extractedDob`, `portraitImageUrl`, …) for family docs,
      same schema as the main-user verify response?

### Q3 — Member status transitions
- [ ] After a 5–17 member's document verify returns `approved`, does the member
      move `pending_document → verified` automatically? (Which endpoint reflects
      this — `GET /cb/family/{personId}`?)
- [ ] On `review` outcome, what status does the member hold, and is there a
      webhook/poll we should use to detect when manual review completes?
- [ ] For 0–4, after birth-certificate verify `approved`, is `checkin_frozen`
      lifted automatically?

### Q4 — 0–4 birth certificate specifics
- [ ] Confirm `/verify` with **only** `frontImageBase64` (no selfie) is valid for
      `birthCertificate`, and approval flips the member to verified.

### Q5 — Failure semantics
- [ ] If verify returns `rejected` for a family doc, does the member stay
      `pending_document` and simply allow a re-upload (new document + new session)?
- [ ] Any rate limits / idempotency rules on repeated verification sessions for
      the same member we should respect?

---

## 5. What will NOT change

- Regula Document Reader stays client-side for capture only; all OCR /
  authenticity / face-match processing remains server-side.
- Liveness remains our custom Vision Camera + ML Kit implementation
  (challenge → evidence → finalize), **not** Regula Face SDK.
- `?personId=` query param on liveness challenge creation (already working).
- Face enroll payload `{ livenessSessionId, sessionToken, personId }` (already working).
- 0–4 members never see a camera/liveness step.
- 18+ member creation is rejected server-side (422) — unchanged.

---

## 6. Acceptance checklist (after fix)

- [ ] 5–17: doc verify `approved` → document `status: verified` under the member
      → liveness starts only after that → enroll succeeds with `personId`.
- [ ] 5–17: verify `rejected` → member stays `pending_document`, recapture offered,
      no liveness call.
- [ ] 0–4: birth certificate verifies (no selfie) → member verified,
      `checkin_frozen` lifted, zero liveness/enroll calls.
- [ ] Family document detail shows backend-extracted OCR fields + match score.
- [ ] No duplicate documents when a member's document is re-uploaded
      (replace-on-success, same as the main-user flow).
