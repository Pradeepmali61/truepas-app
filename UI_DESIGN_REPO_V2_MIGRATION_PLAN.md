# UI-Design-Repo v2 → truepas-app-1 Migration Plan

Date: 2026-09-21
New drop analyzed: `OneDrive/Documents/Trupas DS/UI-design-repo` (`@truepas/ui-native`)
Baseline drop: `Downloads/truepas-ui-native/UI-design-repo` (last commit 2026-09-16)
Target app: `truepas-app-1` (Expo 57 / RN 0.86 / expo-router / Redux Toolkit / react-query)

Supersedes the remaining work in `UI_DESIGN_REPO_ADOPTION_REPORT.md` (2026-09-16).

---

## TL;DR

The new drop is not just a component kit — it adds a **complete runnable customer-app
layer** (`src/app/`): ~30 production-style screens, a session store, a mock+live
API seam (`CustomerApi` covering every `/cb/*` endpoint), an app-chrome layer
(`AppScreen`, `BottomNav`, `ListTile`, `AsyncBlock`…), and an appearance system
(radius presets, `violetLedger` palette, `grotesk` typeface).

**Do NOT port it wholesale.** Its navigation, store, and API layer are a
self-contained reference shell. Our equivalents are more hardened (token
rotation, session-expired teardown, flow guards, RTK/react-query). The correct
strategy is **screen transplant**: copy each repo screen's JSX/composition into
the matching expo-router route and swap 4 seams (nav → `router`, session → auth
slice, `api.*` → feature hooks, `useApiData` → react-query).

---

## 1. What is new in this drop

| Area | Delta vs Sep-16 drop |
|---|---|
| `src/app/` | **Entirely new.** `TruepasApp.tsx` shell, `navigation.tsx` (custom stack), `store.tsx` (session state machine + `useApiData`), `api/` (`client` + `service` + `mock` + `types`), `appearance.tsx`, `screens/` (30 screens in auth/main/settings/verify + `registry.tsx`), `ui/` (`chrome.tsx` 488 lines, `neu.tsx` 371 lines, `ScanFrame`, `ProfileDrawer`, `ProfileMenu`, `haptics`, `motion`). |
| `components/composite/` | ~14 files refined; **new `FieldLabelStyle.tsx`** (provider consumed by `appearance.tsx`). |
| `components/truepas/` | `documents`, `home`, `liveness`, `product`, `styles`, `widgets` all updated. |
| `components/ui/` | ~10 files refined; `motion.tsx` added upstream (we already have our own — diff needed). |
| `theme/` | `tokens`, `palette`, `themes` updated; `theme.test.ts` changed. |
| Deps | `react-native-keyboard-controller@1.21.9` (new — not in our package.json), `react-native-worklets`, `expo-haptics`. |

---

## 2. Architecture mapping (repo → app)

This is the contract for every screen transplant. Only the left column changes;
the right column is what we already have and keep.

| Repo seam | Our equivalent | Action |
|---|---|---|
| `useNav()` → `push/replace/pop/reset` | `expo-router` `router.push/replace/back` | Swap per call site. `reset("main")` → `router.replace("/(tabs)")` etc. |
| `useRoute<T>()` params | `useLocalSearchParams()` | Swap; keep our existing param names. |
| `useSession()` → `user`, `pendingEnrollment` | `useAppSelector(s => s.auth)` + auth slice | Swap. |
| `signIn(auth)` / `signOut()` | `sessionStarted` / `sessionEnded` + `useLogoutFlow` | Swap. |
| `registration` / `enrollment` flow state | `services/` stores (`accountDetailsStore`, `pinStore`, `scanStore`, `flowGuards`) + route params | Map per screen — our flow guards are stricter; keep them. |
| `api.*` (`CustomerApi`) | `src/api/` client + `features/*/hooks` + `mutations` | Swap calls. Use repo `service.ts` only as an endpoint-contract reference. |
| `useApiData(fetcher)` | `useQuery` (react-query) | Prefer `useQuery`; or port the 30-line hook into `src/hooks/` if a screen's loading/empty UX depends on its exact shape. |
| `AppScreen`, `TabShell`, `BottomNav`, `ListTile`, `StatusChip`, `SectionTitle`, `AsyncBlock` (`ui/chrome.tsx`) | — (nothing equivalent; our `ScreenContainer`/`AppChrome` are legacy) | **Port** to `src/components/shell/`. This is the biggest visual win — one shared layout contract for all screens. |
| `ui/neu.tsx` (`NeuBox`, `NeuSegmented`…) | — | **Port** — several screens depend on it. |
| `ScanFrame`, `ProfileDrawer`, `ProfileMenu`, `ui/haptics`, `ui/motion` | partial (`ui/motion.tsx` exists, differs) | **Port**, reconcile `motion` variants. |
| `appearance.tsx` (radius presets + `FieldLabelStyleProvider` + `palette`/`typeface` ThemeProvider props) | `src/features/theme/ThemeProvider.tsx` | Merge — port the new ThemeProvider props in Phase 1, then wire radius/palette controls into `settings/appearance`. |
| `MainTabs` (custom 3-tab shell) | `(tabs)/_layout.tsx` | Keep expo-router tabs; restyle our tab bar to match `BottomNav` design. Repo tabs = Home / Documents / Check-ins — ours = Home / Documents / History. **Decide tab set.** |
| `PhaseRouter` (welcome → consent → main) | `src/app/index.tsx` entry gate | **Already equivalent** — ours does the same phase routing. Keep ours. |
| `navigation.tsx` (custom navigator) | expo-router | **Do not port.** Two nav systems would break back-handling, deep links, and tab state. |
| `store.tsx` `SessionProvider` | Redux auth slice | **Do not port.** |
| `api/mock.ts` (in-memory demo backend) | `src/api/mock.ts` (exists) | Optional — port only if we want a runtime demo mode for QA/sales demos. |
| `TruepasApp.tsx` shell | `app/_layout.tsx` | **Do not port** — adopt only the `Splash` visual if desired. |
| `KeyboardProvider` | — | Add `react-native-keyboard-controller` via `npx expo install` only if a ported screen actually uses it (check imports first). |

---

## 3. Route → screen mapping (all 30 repo screens)

| Repo route | Repo screen | Our route | Notes |
|---|---|---|---|
| welcome | `auth/WelcomeScreen` | `(auth)/welcome.tsx` | |
| login | `auth/LoginScreen` | `(auth)/login.tsx` | Has email/phone `NeuSegmented` toggle — we already built this (585f8fa); reconcile. |
| registerPhone | `auth/RegisterPhoneScreen` | `(auth)/register.tsx` | |
| verifyOtp | `auth/VerifyOtpScreen` | `(auth)/verify-phone.tsx`, `verify-email.tsx` | One screen, two purposes — ours split. Keep split. |
| accountDetails | `auth/AccountDetailsScreen` | `(auth)/account-details.tsx` | Uses `registrationToken` from flow state → `accountDetailsStore`. |
| forgotPassword | `auth/ForgotPasswordScreen` | `(auth)/forgot-password.tsx` | |
| resetPassword | `auth/ResetPasswordScreen` | merged in forgot flow | **Decide**: adopt standalone screen or keep merged 3-step (6988024). |
| consent | `auth/ConsentScreen` | `(onboarding)/consent.tsx` | |
| liveness | `verify/LivenessScreen` | `(onboarding)/face-scan.tsx` + `LivenessCamera` | Repo screen is UI only — keep our camera/challenge logic (`features/liveness`), adopt layout + `ScanFrame`. |
| verifyResult | `verify/VerifyResultScreen` | `(onboarding)/face-enrolled.tsx` | |
| main | `main/MainTabs` | `(tabs)/_layout.tsx` | See tab-set decision above. |
| — home pane | `main/HomeScreen` | `(tabs)/index.tsx` | Replaces remaining `AppChrome` usage. |
| — documents pane | `main/IdentityScreen` | `(tabs)/documents.tsx` | |
| — check-ins pane | `main/ActivityScreen` | `(tabs)/history.tsx` | Repo "Check-ins" vs our "History" naming. |
| notifications | `main/NotificationsScreen` | `notification/index.tsx` | |
| documentDetail | `main/DocumentDetailScreen` | `document/[id].tsx` | |
| addDocument | `verify/AddDocumentScreen` | `document/select-type.tsx` (+ `scan.tsx`) | Repo screen is metadata-only; our Regula scan step stays. |
| docVerify | `verify/DocVerifyScreen` | `document/processing.tsx` + `verified.tsx` | Repo splits waiting/result; ours has processing + verified + mismatch. Keep our routes, adopt visuals. |
| familyDetail | `main/FamilyDetailScreen` | `family/[id].tsx` (+ `activity.tsx`) | |
| addFamily | `verify/AddFamilyScreen` | `family/add/index.tsx` (+ `document.tsx`) | |
| familyEnroll | `verify/FamilyEnrollScreen` | `family/add/face-capture.tsx`, `photo-capture.tsx` | <5 photo path preserved. |
| family | `main/FamilyScreen` | — (family tab dropped in 916aae9) | **Decide**: re-add tab or keep under home strip. |
| profile | `main/ProfileScreen` | `profile/index.tsx` | Includes Data-source (mock/live) switch — keep only if we port MockApi. |
| editProfile | `settings/EditProfileScreen` | `profile/edit.tsx` | |
| security | `settings/SecurityScreen` | `security/index.tsx` | |
| changePassword | `settings/ChangePasswordScreen` | `security/change-password.tsx` | |
| changePin | `settings/ChangePinScreen` | `security/change-pin.tsx` | |
| verifyPin | `settings/VerifyPinScreen` | `security/confirm-pin.tsx`, `face-update/pin.tsx` | |
| deleteAccount | `settings/DeleteAccountScreen` | `account/delete/index.tsx` (+ processing/success) | Ours is a 3-screen flow — keep it. |
| bookingDetail | `main/BookingDetailScreen` | `booking/[id].tsx` | |
| appearance | `settings/AppearanceScreen` | `settings/index.tsx` | New controls: palette, typeface, radius, field-label style. |

Screens with no repo counterpart stay as-is: `document/scan.tsx` (Regula),
`document/mismatch.tsx`, `face-update/*`, `family/add/processing.tsx`,
`notification/age-18.tsx`, `legal/*`, `about`, `help`, `dev.tsx`.

---

## 4. Execution plan (step by step)

### Phase 0 — Freeze & baseline
1. Commit all current WIP on branch `ui-native-v2`. `git status` clean.
2. Baseline: `npx tsc --noEmit`, `npm run lint` — record current error counts.
3. Walk the 6 core flows on device: register→OTP→login, consent→liveness→enroll,
   add document→scan→verified, add family member, change PIN, delete account.
   Screenshot each — these become the visual regression baseline.
4. Copy the new drop into the workspace, e.g. `vendor/ui-design-repo-v2/`
   (or keep the OneDrive path — but pin it, since OneDrive syncs).

### Phase 1 — Upstream component sync (3-way merge)
Our copies have diverged from the Sep-16 repo (safe-area fixes, year-picker,
Android switch fix). The new drop changed ~40 of those same files.

5. For each layer (`theme`, `ui`, `composite`, `complex`, `truepas`):
   `diff old-drop new-drop` → apply those hunks onto our copies, **keeping our
   app-side fixes**. Do NOT overwrite our files with new-drop files blindly.
6. Port new files: `composite/FieldLabelStyle.tsx`, `truepas/widgets.tsx` (if any
   screen imports it — check first), reconcile `ui/motion.tsx` vs repo's.
7. Update barrels (`index.ts`) to match new exports.
   Verify: `tsc --noEmit` clean; run app — every existing screen must render
   unchanged (this phase touches components, not screens).

### Phase 2 — App-shell layer
8. Port `src/app/ui/` → `src/components/shell/`: `chrome.tsx` (AppScreen,
   BottomNav, ListTile, StatusChip, AsyncBlock), `neu.tsx`, `ScanFrame`,
   `ProfileDrawer`, `ProfileMenu`, `haptics.ts`, `motion.ts`.
   Rewrite only their import paths (`../../theme` → `@/theme`); no logic changes.
9. Port `appearance.tsx` — merge radius presets + `FieldLabelStyleProvider` into
   `src/features/theme/ThemeProvider.tsx` and the root layout.
   Verify: a scratch screen using `<AppScreen>` + `<NeuBox>` renders correctly.

### Phase 3 — Live reference inside the app (optional, high value)
10. Mount the repo's `TruepasApp` as a dev-only route (e.g. `app/dev-reference.tsx`).
    It is self-contained (own nav + `MockApi`) so it runs without our backend —
    gives a pixel-perfect acceptance target next to each real screen during
    Phase 4. Delete after migration.
    Verify: `dev.tsx` screen browser links to it; demo flow runs on mock data.

### Phase 4 — Screen transplant (flow by flow, low→high risk)
For each screen: copy JSX → swap the 4 seams (§2) → verify the real flow →
commit. Suggested order:

11. **Settings cluster**: appearance, security index, changePin, verifyPin,
    changePassword, deleteAccount, editProfile, profile.
12. **Detail screens**: notifications, bookingDetail, documentDetail,
    familyDetail.
13. **Tabs**: restyle `(tabs)/_layout.tsx` bar to `BottomNav`; rebuild
    `(tabs)/index.tsx` (drops `AppChrome`), `documents.tsx`, `history.tsx`.
14. **Verify flows**: addDocument, docVerify→processing/verified, addFamily,
    familyEnroll.
15. **Auth flow**: welcome, login, registerPhone, verifyOtp×2, accountDetails,
    forgotPassword (+resetPassword decision). Highest blast radius — do last.
16. **Onboarding**: consent, liveness (UI around `LivenessCamera`), verifyResult.
    Verify: after each item — `tsc`, lint, and the real flow on device.

### Phase 5 — Legacy teardown
17. When `grep "components/(app|layout)"` returns zero app-route hits: delete
    `src/components/app/`, `src/components/layout/` (decide `DevFloatingButton`),
    and strip legacy re-exports/compat wrappers from `components/ui/index.tsx`.
    First check `DocIllustration` + clay SVGs — port into the new doc screens or
    drop deliberately.

### Phase 6 — Regression & sync-back
18. Full pass over `QA_TEST_CASES_E2E_REPORT.md` checklist.
19. Back-port our fixes upstream (safe-area, DatePicker year mode, switch fix)
    so the next drop diffs cleanly.
20. Update this report + `UI_DESIGN_REPO_ADOPTION_REPORT.md`.

---

## 5. Decisions needed before starting

1. **Tab set**: repo = Home / Documents / Check-ins; ours = Home / Documents /
   History (+ family dropped). Keep ours or adopt repo's?
2. **resetPassword**: standalone screen (repo) vs merged 3-step flow (ours).
3. **MockApi**: port for demo mode, or skip (we already have `src/api/mock.ts`)?
4. **Brand lock**: repo shell defaults to `violetLedger` palette + `grotesk`
   typeface — confirm this is the intended product look; it restyles everything.
5. **react-native-keyboard-controller**: add dep or avoid (check screen imports).
6. **Family tab**: repo keeps a `family` route/tab; we dropped ours — re-add?

## 6. Cautions

- Never copy `api/mock.ts` payloads or `showcase/screens/mock.ts` data into real
  screens — wire `features/*/hooks` / `src/api` only.
- The repo's `store.tsx` session model is simpler than ours (no token rotation,
  no session-expired teardown, no flow guards). Do not regress ours.
- `LivenessScreen`/`DocVerifyScreen` are presentation-only — Regula scan,
  VisionCamera face detection, and challenge/evidence/finalize sequencing stay
  in `features/liveness` + `document/scan.tsx`.
- Working tree currently has ~30 uncommitted modified files — commit or stash
  before Phase 1 or merges become unreviewable.
