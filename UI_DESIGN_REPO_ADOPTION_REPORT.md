# UI-Design-Repo → truepas-app-1 Adoption Report

Date: 2026-09-16
Source analyzed: `Downloads/truepas-ui-native/truepas-ui-native/UI-design-repo` (`@truepas/ui-native` 0.1.0)
Target app: `truepas-app-1` (Expo 57 / RN 0.86 / expo-router)

## TL;DR

The app already contains a **near-complete port** of the design system's
`theme`, `ui`, `composite`, and `complex` layers plus the motion primitives.
What is **not yet adopted**:

1. The **`components/truepas/` product-widget layer** (~40 Truepas-specific
   composed widgets) — the biggest untapped asset.
2. The **`verification.tsx` showcase set** (9 product-flow frames) — only 2 of
   its designs were implemented in the real app so far (face-scan intro +
   detection frame, done 2026-09-16).
3. A few upstream API extras (`Badge variant="brand"`, palette
   `COMBO_PRESETS`, `typeface` prop, extra fonts).

---

## 1. Layer-by-layer parity

| Design-repo layer | App equivalent | Status |
|---|---|---|
| `src/theme/*` (tokens, palette, themes, ThemeProvider, fonts) | `src/theme/*` | ✅ Ported (same API: `makeStyles`, `useThemeTokens`, `alpha`, `mix`, `BRAND_PRESETS`, `useTruepasFonts`) |
| `ui/` 18 primitives | `src/components/ui/` | ✅ Ported — all 18 present + `RowIcon` + `motion.tsx` |
| `composite/` 15 components | `src/components/composite/` | ✅ Ported — all 15 |
| `complex/` 10 components | `src/components/complex/` | ✅ Ported — all 10 |
| `truepas/` product widgets | — | ❌ **Not ported** |
| `showcase/screens/*` (49 frames) | `src/app/demo/ui/screens/*` | ⚠️ Partial — 6 of 7 files ported; `verification.tsx` missing |
| `docs/*.md` | repo-root `*_REPORT.md`/`DOCUMENTATION.md` | ℹ️ Reference docs only |

### Known API deltas (small)

- `Badge`: app lacks the repo's `brand` variant (has neutral/primary/success/
  warning/error/info + `appearance` + `dot` + `icon` — everything else matches).
- `ThemeProvider`: repo adds `palette` (`COMBO_PRESETS`), `ratio`, and
  `typeface` (`inter | jakarta | grotesk`) props; app has `brand`/`brandRamp`/
  `scheme`/`tokens`/`radius` only.
- Fonts: repo loads Inter + JetBrains Mono + Plus Jakarta Sans + Space Grotesk;
  app loads only Inter + JetBrains Mono.
- `src/components/ui/BottomSheet.tsx` — app-only duplicate alongside
  `composite/BottomSheet.tsx`; consider consolidating.
- **App is now AHEAD of upstream** (changes made 2026-09-16): `DatePicker` has a
  year-selection mode; `BottomSheet`/`ActionSheet` respect bottom safe-area
  insets. Worth back-porting to the design repo.

### App-only component layers (not in the design repo)

`src/components/app/` (neumorphism + clay SVGs + `PinPad` etc.),
`src/components/gff/` (GFF brand), `src/components/layout/`, and the legacy
compat shims in `ui/index.tsx` (`Core*` aliases + old-prop wrappers). These are
outside the design system — candidates for gradual retirement, not adoption.

---

## 2. Showcase screens → real app mapping

49 reference frames in `src/showcase/screens/`. Demo equivalents exist under
`src/app/demo/ui/screens/` for all files **except `verification.tsx`**.

### auth.tsx (8 frames) → app routes

| Showcase frame | Endpoint | App route | Status |
|---|---|---|---|
| Register — enter phone | POST /cb/auth/register | `(auth)/register.tsx` | ✅ Real |
| Verify phone — OTP | POST /cb/auth/verify-otp | `(auth)/verify-phone.tsx` | ✅ Real |
| Account details | POST /cb/auth/account-details | `(auth)/account-details.tsx` | ✅ Real |
| Verify email — OTP | POST /cb/auth/verify-otp | `(auth)/verify-email.tsx` | ✅ Real |
| Login | POST /cb/auth/login | `(auth)/login.tsx` | ✅ Real |
| Forgot password | POST /cb/auth/forgot-password | `(auth)/forgot-password.tsx` | ✅ Real |
| Reset password | POST /cb/auth/reset-password | — | ⚠️ merged into forgot flow |
| Sign out & refresh | POST /cb/auth/logout | `security/index.tsx` | ✅ Real |

### security.tsx (7 frames) → app routes

| Showcase frame | Endpoint | App route | Status |
|---|---|---|---|
| Profile | GET /cb/user/me | `profile/index.tsx` | ✅ Real |
| Edit profile | PUT /cb/user/me | `profile/edit.tsx` | ✅ Real |
| Verify PIN gate | POST /cb/auth/verify-pin | `security/confirm-pin.tsx`, `face-update/pin.tsx` | ✅ Real |
| Change PIN | POST /cb/auth/change-pin | `security/change-pin.tsx` | ✅ Real |
| Change password | POST /cb/auth/change-password | `security/change-password.tsx` | ✅ Real |
| Biometric consent | POST /cb/user/me/biometric-consent | `(onboarding)/consent.tsx`, `security/index.tsx` | ✅ Real |
| Delete account | DELETE /cb/user/me | `account/delete/*` | ✅ Real |

### identity.tsx (8 frames) → app routes

| Showcase frame | Endpoint | App route | Status |
|---|---|---|---|
| Identity dashboard | GET /cb/identity/summary | `(tabs)/index.tsx` | ✅ Real |
| Documents wallet | GET /cb/documents | `(tabs)/documents.tsx` | ✅ Real |
| Add document — metadata | POST /cb/documents | `document/select-type.tsx` | ✅ Real |
| Upload captures | POST /cb/documents/{id}/verification-sessions | `document/scan.tsx` | ✅ Real (Regula scan) |
| Verify — processing | POST /cb/document-verification-sessions/{id}/verify | `document/processing.tsx` | ✅ Real |
| Verification result | GET /cb/document-verification-sessions/{id} | `document/verified.tsx`, `document/[id].tsx` | ✅ Real |
| Document rejected | GET /cb/documents/{id} | `document/[id].tsx` | ✅ Real |
| Issued credentials | GET /cb/documents/issued | — | ❌ No route yet |

### face.tsx (7 frames) → app routes

| Showcase frame | Endpoint | App route | Status |
|---|---|---|---|
| Liveness — intro | POST /cb/liveness/v2/challenge | inside `LivenessCamera` ("challenging && !started") + new `(onboarding)/face-scan.tsx` intro | ✅ Real |
| Liveness — challenge step | POST …/evidence | `LivenessCamera` viewfinder (restyled to design 2026-09-16) | ✅ Real |
| Liveness — finalize | POST …/finalize | `LivenessCamera` "Verifying…" state | ✅ Real |
| Liveness — passed | GET …/challenge/{id} | `LivenessCamera` "Liveness verified" state | ✅ Real |
| Liveness — failed | GET …/challenge/{id} | `LivenessCamera` failed state + cooldown | ✅ Real |
| Face enrolled | POST /cb/face/enroll | `(onboarding)/face-enrolled.tsx` | ✅ Real |
| Child photo capture | POST /cb/face/enroll | `features/liveness/PhotoCapture.tsx` | ✅ Real |

### family.tsx (5 frames) → app routes

| Showcase frame | Endpoint | App route | Status |
|---|---|---|---|
| Family list | GET /cb/family | `(tabs)/family.tsx` | ✅ Real |
| Add family member | POST /cb/family | `family/add/index.tsx` | ✅ Real |
| Member detail 10+ | GET /cb/family/{personId} | `family/[id].tsx` | ✅ Real |
| Member detail <5 | GET /cb/family/{personId} | `family/[id].tsx` (same screen, age-band) | ✅ Real |
| Member activity | GET /cb/family/{personId}/activity | `family/[id]/activity.tsx` | ✅ Real |

### bookings.tsx (5 frames) → app routes

| Showcase frame | Endpoint | App route | Status |
|---|---|---|---|
| Booking history | GET /cb/bookings | `(tabs)/history.tsx` | ✅ Real |
| Booking history — empty | GET /cb/bookings | `(tabs)/history.tsx` (EmptyState) | ✅ Real |
| Booking detail | GET /cb/bookings/{id} | `booking/[id].tsx` | ✅ Real |
| Notifications inbox | GET /cb/notifications | `notification/index.tsx` | ✅ Real |
| Notifications — empty | GET /cb/notifications | `notification/index.tsx` | ✅ Real |

### verification.tsx (9 frames) — the "product flow" set — NOT in demo

| Showcase frame | Endpoint | App equivalent | Status |
|---|---|---|---|
| 1. Welcome / home | GET /cb/user/me | `(tabs)/index.tsx` (different composition) | ⚠️ design differs |
| 2. Identity verification — intro | POST /cb/identity/verification-sessions | `(onboarding)/face-scan.tsx` intro | ✅ Done 2026-09-16 |
| 3. Face detection | POST /cb/liveness/v2/challenge | `LivenessCamera` creating/challenging `FaceFrame` | ✅ Done 2026-09-16 |
| 4. Liveness check | POST …/evidence | `LivenessCamera` viewfinder + chip | ✅ Real |
| 5. Processing (step sequence) | POST …/finalize | `LivenessCamera` finalize ("Verifying…" spinner-style) | ⚠️ design has FlowStep list; app shows simple state |
| 6. Verified (emerald halo + confidence) | GET /cb/identity/verification-sessions/{id} | `(onboarding)/face-enrolled.tsx` | ⚠️ different design |
| 7. Verification failed | GET …/verification-sessions/{id} | `LivenessCamera` failed state | ✅ close enough |
| 8. Verification details (accordion) | GET …/verification-sessions/{id} | `document/verified.tsx` (partial) | ⚠️ progressive-disclosure pattern unused |
| 9. Settings / profile | GET /cb/user/me | `settings/index.tsx`, `profile/index.tsx` | ⚠️ different composition |

---

## 3. `components/truepas/` — adoptable product widgets

These are **not** in the app today. Each maps to a real screen/flow:

### High value — direct matches to existing screens

| Widget | File | Where it fits in the app |
|---|---|---|
| `VerificationStatusCard` | `truepas/product.tsx` | `(tabs)/index.tsx` hero card (status verified/pending/failed) |
| `ConfidenceRing` | `truepas/product.tsx` | `document/verified.tsx` — match-confidence ring (SVG, matches "98.7%" design) |
| `RiskMeter` | `truepas/product.tsx` | verification result/detail screens (LOW/MED/HIGH) |
| `DocumentCard` | `truepas/product.tsx` | `(tabs)/documents.tsx` list rows |
| `DocumentIdCard` / `DocumentDetailCard` / `DocumentVerifyCard` | `truepas/documents.tsx` | `document/[id].tsx` flip-card + verify states |
| `DocumentRow` | `truepas/documents.tsx` | documents list rows |
| `FamilyCard` / `FamilyStrip` / `FamilyStripCell` | `truepas/product.tsx`, `family.tsx` | `(tabs)/family.tsx` member cards / member strip |
| `MemberProfileCard` | `truepas/family.tsx` | `family/[id].tsx` header |
| `BookingCard` | `truepas/product.tsx` | `(tabs)/history.tsx`, `booking/[id].tsx` |
| `HistoryRow` | `truepas/product.tsx` | history/booking event rows |
| `NotificationRow` | `truepas/product.tsx` | `notification/index.tsx` rows |
| `LivenessStepsCard` | `truepas/product.tsx` | `LivenessCamera` intro/step list |
| `ConsentCard` | `truepas/product.tsx` | `(onboarding)/consent.tsx`, `security/index.tsx` |
| `ProfileHeader` | `truepas/product.tsx` | `profile/index.tsx` |
| `EmptyStateCard` | `truepas/product.tsx` | empty documents state |
| `PopupDialog`/`PopupToast`/`PopupSheet` + `useTone` | `truepas/popups.tsx` | consistent confirmation/result popups (e.g. delete account, remove member) |
| `PinRow` | `truepas/auth.tsx` | `security/change-pin.tsx`, `confirm-pin.tsx`, `face-update/pin.tsx` |
| `LoginCard`/`RegisterCard`/`ForgotPasswordCard`/`ResetPinCard` | `truepas/auth.tsx` | `(auth)` screens — reference compositions |

### Home composition variants (pick one direction)

`truepas/home.tsx`: `HomeVerifyHero`, `HomeDashboard`, `HomeFeed`,
`HomeCommand`, `HomeNav` — four alternative home layouts. Useful when
redesigning `(tabs)/index.tsx`; choose one rather than mixing.

### Soft-UI kit (low priority)

`truepas/core.tsx` (`SoftCard`, `CircleButton`, `SquareButton`, `PillButton`,
`VariantTag`) + `truepas/widgets.tsx` (~21 demo widgets: charts, steppers,
calendar, sliders, ratings…) — exploratory "soft UI" references. Port only if
the product direction adopts that style; most app needs are already covered by
`ui/composite/complex`.

---

## 4. Recommended adoption order

1. **`verification.tsx` product frames → demo** — port the missing showcase
   file into `src/app/demo/ui/screens/verification.tsx` + register in
   `ScreensSection` (keeps demo = design source of truth).
2. **`components/truepas/` product widgets** — start with
   `VerificationStatusCard`, `ConfidenceRing`, `DocumentCard`, `FamilyCard`,
   `LivenessStepsCard`, `PinRow` — they map 1:1 to screens that already exist.
3. **Processing-step UX** — adopt the `FlowStep` step-sequence pattern
   (verification.tsx #5) in `document/processing.tsx` and
   `family/add/processing.tsx` instead of spinner-only states.
4. **Back-port today's app fixes upstream**: `DatePicker` year mode,
   BottomSheet/ActionSheet safe-area padding — keep the two repos in sync.
5. **Optional**: `Badge variant="brand"`, `COMBO_PRESETS`, `typeface` prop,
   Jakarta/Grotesk fonts if branding needs them.

## 5. Cautions

- `components/truepas/` imports `useKitStyles` from `styles.ts` — port that
  file too, and swap its color helpers to the app's `useThemeTokens` if
  signatures differ.
- The repo's showcase screens are **presentation-only** (mock data in
  `screens/mock.ts`) — wire real hooks (`src/features/*/hooks.ts`) when
  adopting, never the mock payloads.
- Don't copy `components/app/`, `gff/`, `layout/` patterns back into the
  design system — they're legacy/brand alternates, not part of the contract.
