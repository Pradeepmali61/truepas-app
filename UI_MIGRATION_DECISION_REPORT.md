# Old UI vs New UI — Integration Decision Report

Date: 2026-09-21
Repos compared:
- **App** (backend-integrated): `C:\Users\Administrator\truepas-app-1` — Expo 57 / RN 0.86 / expo-router
- **New UI**: `OneDrive\Documents\Trupas DS\UI-design-repo` — `@truepas/ui-native` 0.1.0, Expo 57

Question answered: pending screens (face scanning, Regula document verification, and remaining new-UI designs) — build them inside the existing app, or move backend integration into the new-UI repo?

---

## TL;DR — Recommendation

**Keep `truepas-app-1` as the product codebase. Port the remaining new-UI pieces into it. Do NOT migrate the backend into UI-design-repo.**

The premise "old UI is integrated, new UI is only UI" is partially outdated:

1. The app is **not really "old UI" anymore** — ~90% of the new design system (theme, ui, composite, complex, and 9/10 `components/truepas/` files) is already ported, and all 9 `verification.tsx` product frames already live in real, backend-wired screens.
2. The new repo is **more than UI but less than an app** — it has a full screen catalog (~31 screens), a custom navigator, a session store, and a contract-accurate `/cb` API layer with mock/live switch — but **zero native capability**: no camera, no secure-store, no file-system, no EAS project, no bundle id, no Regula license. Face scan and document capture there are timer-based simulations sending empty frames.
3. Everything expensive about integration (native camera stack, Regula license + Maven config plugins, EAS project, token/session machinery, backend-quirk workarounds) **already exists only in the app**.

**Estimated effort:**
- Option A (recommended — finish adoption inside the app): **~1.5–2.5 weeks** for one developer including device testing.
- Option B (integrate backend into UI-design-repo): **~4–7 weeks**, re-doing already-solved work, plus re-verifying every backend quirk. Not justified by the remaining design delta.

---

## 1. Current state — what actually exists where

### App (`truepas-app-1`) — integration inventory

Complete `/cb/*` BFF layer: `src/api/client.ts` (axios, single-flight refresh, SecureStore refresh token), `endpoints.ts` (~40 endpoints), `mock.ts` + env flags (`EXPO_PUBLIC_USE_MOCK_API`, `FALLBACK_TO_MOCK`), normalized `ApiError` with trace ids. Redux Toolkit session + React Query server cache + in-memory stores (`pinStore`, `flowGuards`, `scanStore`, image stores).

| Flow | Status |
|---|---|
| Register → OTP → account-details → verify-email | ✅ Live |
| Login / logout / session restore / expiry redirect | ✅ Live |
| PIN verify/change, password reset/change | ✅ Live |
| Biometric consent | ✅ Live (device Face-ID login toggle is local-only) |
| Liveness challenge → evidence → finalize | ✅ Wired — Vision Camera + ML Kit face detector; **backend-blocked** (BFF drops JSON evidence body; form-urlencoded workaround in place) |
| Face enroll (`/face/enroll`) / update (`PUT /face`) | ✅ Wired — same liveness chain |
| Document scan (Regula native SDK + expo-camera fallback) | ✅ Wired — **backend-blocked** (`/documents/verify` returns 503, expects object-storage keys not yet deployed) |
| Documents CRUD, family CRUD + member activity, bookings, notifications, identity summary, profile + picture, delete account | ✅ Live (notifications have no mark-read endpoint; family activity projection returns empty) |

Design adoption state (corrects the stale `UI_DESIGN_REPO_ADOPTION_REPORT.md`):
- `theme`, `ui`, `composite`, `complex` layers: fully ported. `Badge variant="brand"`, `COMBO_PRESETS`, `palette`/`ratio` props: now present.
- `components/truepas/`: **9 of 10 files ported**; only `widgets.tsx` (23 exploratory demo widgets) absent. ~30 exports missing total (FamilyCard, NextCheckinCard + `formatCheckIn`, 5 liveness visuals Sonar/Mesh/Halo/Coach/GuideRail, ~25 `styles.ts` keys).
- All 9 `verification.tsx` frames adopted into real screens (welcome composition is the only intentional divergence; frame-4 uses the richer `LivenessGuideDial` instead of the simpler FaceFrame).
- Residue: 6 screens use the compat-API `Button`; neumorphism set in `components/app/` is dead code; `welcome.tsx` has off-token colors; 2 orphan routes (`face-update/error`, `notification/age-18`).

### New UI (`UI-design-repo`) — what it actually is

- Runnable Expo app (`registerRootComponent` → `TruepasApp`), **custom dependency-free navigator** (`src/app/navigation.tsx`, 28 routes), Context-based session store (`store.tsx`), no expo-router/React Navigation/Redux/React Query.
- `src/app/api/` — genuinely good contract layer: fetch `HttpClient` (single-flight refresh, `SecureStoreLike` seam — in-memory default), `CustomerApi` interface with `BffApi` (all `/cb/*` endpoints incl. liveness evidence FormData workaround) + `MockApi` (572-line demo backend), runtime mock↔live switch. Base URL: same `api.dev.truepas.com/cb`.
- `src/app/screens/` — 31 wired screens (auth 8, verify 7, main 10, settings 7) incl. `LivenessScreen`, `DocVerifyScreen`, `AddDocumentScreen`, `FamilyEnrollScreen`.
- **What's missing for production**: `expo-camera`/vision-camera/ML Kit (capture is simulated — `finalizeChallenge` sends an empty `frame`), `expo-secure-store` (seam ready, not installed → sessions don't survive restart), `expo-image-picker`/`document-picker` (FileUploader unwired), `app.json` has no bundle ids/permissions/plugins, no `eas.json`, no EAS project, no Regula license, custom navigator lacks deep-linking/typed routes/Android-back handling.

---

## 2. Options compared

### Option A — Port remaining new-UI pieces into the app ✅ Recommended

Remaining work is small and mostly mechanical:

| Work item | Type | Effort |
|---|---|---|
| Port ~25 missing `styles.ts` keys + `FamilyCard`, `NextCheckinCard`/`formatCheckIn` (+ type adaptations `ProductMember`, `ProductBooking.image`) | Port | 1–2 d |
| Wire already-ported-but-unused widgets into existing screens (`VerificationStatusCard`→home/identity, `RiskMeter`→doc result, `MemberProfileCard`→family detail, `PinRow`→3 PIN screens, `PopupDialog/Toast/Sheet`→confirmations, `DocumentCard` variants) | Restyle-only | 2–4 d |
| Issued-credentials route (`GET /documents/issued`, `IssuedCard` already ported) — the only true "new screen + integration" | New screen | 0.5–1 d |
| 5 liveness visuals (Sonar/Mesh/Halo/Coach/GuideRail) — optional alternates to `LivenessGuideDial` | Optional | 1–2 d |
| `widgets.tsx` 23 demo widgets | Optional/low value | 0.5 d |
| Cleanup: 6 compat-`Button`→`CoreButton`, dead neumorphism removal, `welcome.tsx` token colors, orphan routes | Hygiene | 1 d |
| Pending integration items (`PENDING_INTEGRATIONS.md`): doc-type rules (birthCertificate/minors), image compression, 413/429/503 handling, recovery poll | Integration | 2–3 d |
| EAS prebuild + dev-client rebuild, device test of camera flows, first iOS build | Build/QA | 2–4 d (mostly wait/test) |

**Total ≈ 1.5–2.5 weeks** (one dev), dominated by device testing — not by wiring.

### Option B — Integrate the backend into UI-design-repo ❌

Would require, from scratch in that repo:
- ~10 native packages (vision-camera + face-detector + worklets + nitro, expo-camera, secure-store, file-system, image-manipulator, image-picker, Regula api+mrz), both Regula config plugins, `assets/regula.license` (bound to `com.truepas.truepasapp` → must adopt that app id), full `app.json` permissions/plugins, `eas.json`, new EAS project.
- Port the KYC feature layer: `LivenessCamera` (~850 lines), `useLivenessSession`, `regulaScanner`, scan flow, secureStorage, image stores, flowGuards.
- Reconcile duplicated stacks: fetch-client vs axios layer (two implementations of one contract — pick one, kill one); Context store vs Redux+React Query; **custom navigator vs expo-router — every screen's navigation calls differ**, and the custom nav lacks deep-linking, typed routes, Android back handling.
- Re-verify every backend quirk already encoded in the app (form-urlencoded evidence workaround, camelCase/snake_case, registrationToken bearer, session-expired routing).
- Even then, the app repo would still exist with all of this done — two diverging products.

**Total ≈ 4–7 weeks** to reach parity the app already has, with real regression risk.

### Why A wins

- The expensive, fragile work (native modules, Regula license, EAS, session machinery, backend-quirk workarounds) is **already done and committed** in the app. Option B repurchases all of it.
- The remaining design delta is ~30 widget exports + a handful of screen restyles — a porting task measured in days, not an integration project.
- Backend blockers (verify 503, evidence contract, missing extracted fields) are **identical either way** — repo choice doesn't unblock them.
- The new repo keeps its value as (a) **design source of truth**, (b) a **mock-mode demo app** that runs in Expo Go for stakeholder/design review without backend, (c) a contract reference (`src/app/api/service.ts` is a clean spec of the `/cb` surface).

---

## 3. How — execution plan for Option A

1. **Sync the design layer** → verify: `tsc --noEmit` clean; components render in `/dev` browser.
   - Port missing `styles.ts` keys (`rowWrap`, `stripChevron`, liveness-studio block ~20 keys).
   - Port `FamilyCard` (+`ProductMember` shim), `NextCheckinCard` + `formatCheckIn`, optional liveness visuals; rewire their showcase imports (`StepDots`→`core.tsx`, `BrandMark`→`components/app/BrandMark`) — the pattern already used.
2. **Adopt ported widgets in existing screens** → verify: each touched screen renders identically on device/emulator; no behavior change.
   - PinRow → `security/change-pin.tsx`, `confirm-pin.tsx`, `face-update/pin.tsx` (replaces legacy `PinPad`).
   - `VerificationStatusCard`/`RiskMeter`/`MemberProfileCard`/`DocumentCard` family → home/identity/doc/family screens; `Popup*` → delete/remove confirmations.
3. **Add issued-credentials route** → verify: list renders from `GET /documents/issued`.
4. **Close `PENDING_INTEGRATIONS.md` items** → verify: doc-type rules enforced; compressed base64 <14MB; 413/429/503 handled; recovery poll on launch.
5. **Cleanup** → verify: `expo lint`, `tsc`, app boots; compat `Button` gone, dead files removed.
6. **Build & device QA** → verify: `npx expo prebuild --clean` + `eas build --profile development` (Regula/vision-camera need dev-client, not Expo Go); liveness, doc scan, face-update on a physical device; then iOS build.
7. **Back-port app fixes to the design repo** (DatePicker year mode, safe-area sheets, `StepDots`/`BrandMark` rewiring pattern) → keeps the design source of truth in sync.

### Watch-items (backend, not frontend)
- `/documents/verify` 503 — needs object-storage deployment server-side.
- Liveness `/evidence` JSON body drop — confirm the form-urlencoded workaround end-to-end or get BFF fix.
- Verify response still nulls `dateOfExpiry`/`matchScore`/`nationality`.
- `eas.json` production profile doesn't set `EXPO_PUBLIC_API_URL` — silently falls back to the dev URL.
- No PIN-reset endpoint — "Forgot PIN" dead-ends; no mark-read notifications endpoint.

---

## 4. If the team still wants the new repo as the app base

Then scope it honestly: it's an app-base migration, not an "integration task" — budget **4–7 weeks**, port the native/KYC stack wholesale (Section 2B), replace the custom navigator with expo-router (or accept its limits), choose one API layer (the repo's `service.ts` is cleaner; the app's axios layer encodes more quirks), and plan a full regression pass on every `/cb` flow. Recommend only if there's a strategic reason to abandon the app's codebase (there isn't one evident today).
