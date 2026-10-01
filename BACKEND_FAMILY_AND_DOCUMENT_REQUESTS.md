# Backend requests — Family members & document images

From: TruePas mobile app team · 2026-10-01
Base URL: `https://api.dev.truepas.com/cb`

The app already works around each of these, but the workarounds are partial. Items are ordered by priority.

---

## 1. Removed family member can't be added again (HIGH)

**What we see**
`POST /family` returns *"A family member with this name and date of birth already exists"*, but that member is **not** in `GET /family`. This happens after the user removes a member (`DELETE /family/{id}`) and adds the same person again.

**Our guess (please confirm)**
`DELETE` soft-deletes the member, but the duplicate check on `POST /family` still counts soft-deleted rows.

**Needed**
- A removed member must not block re-adding the same name + DOB. Either exclude deleted rows from the uniqueness check, or restore the old record on re-add.
- Please confirm: is `DELETE /family/{id}` a hard delete or a soft delete?

---

## 2. Duplicate error should be machine-readable (MEDIUM)

Today the app has to match the message text (`/already exists/`) to detect this case.

**Needed** — on `POST /family` duplicate:
```json
HTTP 409
{
  "code": "FAMILY_MEMBER_EXISTS",
  "message": "A family member with this name and date of birth already exists",
  "existingMemberId": "<id>"
}
```
With `existingMemberId`, the app can open that member directly instead of showing an error.

---

## 3. `GET /family` should return `dateOfBirth` (MEDIUM)

The app checks for duplicates before a new member is created. Without `dateOfBirth` in the list response, it has to compare by `age`. That check can miss real duplicates (case 1) or match two different people of the same age.

**Needed:** include `dateOfBirth` (`YYYY-MM-DD`) on each item of `GET /family` and `GET /family/{id}`.

---

## 4. Member `verification` never becomes `verified` (MEDIUM)

After a member's document is added and their face is enrolled (`POST /face/enroll` with `personId`), the member gets `faceEnrolled: true`, but `verification` never changes to `"verified"`.

The app now treats *document added + `faceEnrolled: true`* as "setup complete". That is a client-side guess.

**Needed:** define the `verification` values for a member and when each is set. At minimum, set it to `"verified"` once setup is complete, so the app and backend agree.

---

## 5. No way to fetch a captured document image (MEDIUM)

`GET /documents/{id}` doesn't return the scanned image. The app keeps the photo only on the phone, so it is lost on reinstall, a new phone, or cleared app data, and users see "Original scan not available".

**Needed:** an endpoint to fetch the captured image, e.g.
`GET /documents/{id}/images` → short-lived signed URLs for `front` (and `back` / `selfie` if stored).
Once this exists, the app no longer needs to store document photos on the device.
