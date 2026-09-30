# BUG018: Completed check-ins missing from Check-In History

| | |
|---|---|
| **Bug ID** | BUG018 |
| **Module** | Truepas User App → Check-In History |
| **Severity / Priority** | High / High |
| **Reported** | 30-Sep-2026 (QA) |
| **Owner** | Backend (customer-account-service + check-in producer) |
| **Frontend status** | No frontend defect. Hardening shipped (see §6) |

## 1. Summary

A user completes a check-in at a venue, opens **Check-ins** in the User App, pulls to refresh, and sees **"No bookings yet"**. The app renders whatever `GET /cb/bookings` returns. For these users the endpoint returns an empty list, because **no check-in event ever reaches the bookings read model**.

This matches the open item already listed in `CUSTOMER_APP_FRONTEND_INTEGRATION.md` §13/§16 and `BACKEND_INTEGRATION_REPORT.md` §6:

> The read model is implemented, but a booking/check-in event producer must populate it. Empty history is valid until that integration is active.

QA has now completed real check-ins, so this is no longer an acceptable empty state. It is a missing integration.

## 2. Data flow and where it breaks

```
Venue / kiosk / partner check-in (face match)      ✅ check-in succeeds
        │
        │  "check-in completed" event               ❌ NOT PUBLISHED / NOT CONSUMED
        ▼
customer-account-service: bookings read model      ⚠️ no row written for the customer
        │
        ▼
customer-app-bff: GET /cb/bookings                  returns []
        │
        ▼
User App: Check-ins tab                             shows "No bookings yet"
```

The User App never creates check-ins itself. It is read-only for history.

## 3. How to confirm on dev

1. Log in as the QA user and take the access token.
2. `GET https://api.dev.truepas.com/cb/bookings` with `Authorization: Bearer <token>`.
3. Expected today: `200 []` (or `{ "bookings": [] }`), which confirms this bug is on the backend.
4. Query the bookings table in customer-account-service for that `customerId`. Expected today: zero rows.
5. Look up the same check-in in the venue/check-in service by time and venue. It exists there, which proves the event never crossed over.

## 4. What needs to be built

### 4.1 Producer (check-in / venue service)

On every **terminal** check-in outcome (success **and** failure), publish one event:

```json
{
  "eventId": "uuid",                    // idempotency key
  "eventType": "checkin.completed",     // or checkin.failed
  "occurredAt": "2026-09-30T10:15:00Z",
  "customerId": "customer-uuid",        // the Truepas account holder (not a family member)
  "bookingId": "booking-or-checkin-id",
  "venue": "Example Hotel",
  "location": "Orlando, FL",
  "type": "hotel",
  "image": null,
  "checkIn": "2026-09-30T10:15:00Z",
  "checkOut": null,
  "status": "completed",                // completed | failed
  "guests": 2,
  "amount": 0,
  "checkedInMembers": ["person-id"]     // account holder and/or family member ids
}
```

If a family member (minor) is checked in, `customerId` must be the **guardian's account**, so the check-in shows in the guardian's history. The member ids go in `checkedInMembers`.

Upcoming reservations, if supported, should publish the same shape with `status: "upcoming"`.

### 4.2 Consumer (customer-account-service)

- Subscribe to the check-in events and **upsert** by `bookingId` so a later `failed → completed` or `upcoming → completed` updates the same row.
- Dedupe on `eventId` so redeliveries do not create duplicates.
- Map `customerId → account` and drop and alert on unknown customers. Do not drop silently.
- Put failures on a DLQ and alert on it.

### 4.3 Read API (customer-app-bff)

`GET /cb/bookings` and `GET /cb/bookings/{bookingId}` must keep the contract from `CUSTOMER_APP_FRONTEND_INTEGRATION.md` §13:

| Field | Type | Notes |
|---|---|---|
| `id` | string | used for the detail route |
| `venue` | string | required |
| `location` | string | required |
| `type` | string | e.g. `hotel` |
| `image` | string \| null | |
| `checkIn` | ISO-8601 string | the app sorts and formats this |
| `checkOut` | ISO-8601 string \| null | |
| `status` | `completed` \| `failed` \| `upcoming` | **lowercase**. Anything other than `upcoming` lands under "Past" |
| `guests` | number | |
| `amount` | number | |
| `checkedInMembers` | string[] | optional |

- Response body: a bare array (preferred) or `{ "bookings": [...] }`. The app also tolerates `items` / `data` / `content`. **Any other shape is now shown as an error in the app, not as an empty list.**
- Order: newest `checkIn` first.
- Scope: only the caller's own bookings (BOLA check on `/bookings/{id}`, return 404 for other customers' ids).
- Freshness: a check-in should be visible within **≤ 5 seconds** of completion. The app refetches on app foreground and on tab focus, so near-real-time propagation is enough. Push is not required.

## 5. Acceptance criteria (for QA re-test)

1. Complete a check-in at a venue → within 5 s, `GET /cb/bookings` for that user contains it with `status: "completed"`, correct venue, location and time.
2. Open the app / switch to Check-ins tab → the record appears under **Past** without manual refresh.
3. A failed check-in appears with `status: "failed"`.
4. Checking in a family member shows the record in the guardian's history with the member in `checkedInMembers`.
5. Redelivering the same event does not create a duplicate row.
6. User A cannot see or fetch User B's bookings.

## 6. Frontend changes already made

These make the app more robust. They do not fix the missing data.

- `src/api/endpoints.ts`: `getBookings` no longer turns an unknown response shape into `[]`. It accepts `[]`, `bookings`, `items`, `data` or `content`, and otherwise raises an error with a dev log, so contract mismatches become visible.
- `src/app/_layout.tsx`: on native, React Query refetches stale queries when the app returns to the foreground.
- `src/app/(tabs)/history.tsx`: the Check-ins tab refetches every time it regains focus.

## 7. Open questions for backend

1. Which service owns check-ins today (venue service / kiosk / partner integration), and which broker/topic should the event use?
2. Is there a backfill plan for check-ins already completed on dev (including QA's test runs)?
3. Is `amount` meaningful for check-ins, or should it be optional / `0`?
