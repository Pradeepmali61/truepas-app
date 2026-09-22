# Truepas app — working notes

## UI design source of truth

Screen layouts mirror the design repo **1:1**:

`C:\Users\Administrator\OneDrive\Documents\Trupas DS\UI-design-repo`

- App screens: `src/app/screens/**` (e.g. `verify/LivenessScreen.tsx` = our `(onboarding)/face-scan.tsx` intro)
- Design primitives there (`AppScreen`, `Section`, `NeuBox`, `NeuWell`, `ScanFrame`, `Pulse`/`Blink` motion) map to our `src/components/ui` + `ScreenHeader`/`SafeAreaView` patterns.
- When rebuilding a screen, read the matching design file first — don't guess the layout.
- `src/components/ui/ScanFrame.tsx` — corner-bracket viewfinder ported from the design repo. In `LivenessCamera` the challenge stage mounts the live `Camera` INSIDE the ScanFrame square (`resizeMode="cover"`); during `finalizing`/`passed` the same `cameraView` element mounts off-screen at `-2000` (required for `capturePhotoToFile` + the Fabric unmount-crash workaround).
- Liveness stage UIs are pure presentational components in `src/features/liveness/LivenessStages.tsx` (camera arrives as a ReactNode). Preview them without a native camera via `src/app/dev-liveness.tsx` → dev menu entries "Liveness — challenge/verifying/verified/failed (preview)".

## Dev screen browser

`src/app/dev.tsx` (dev-only, opened via the floating button) lists every screen.

- Auth presets forge a session; while browsing, API calls resolve against `mockApi` via `setDevMockApi` (`src/api/index.ts`) — "Resume Normal Flow" resets it.
- Screens with deep-link guards need a `prepare` step on their entry: one-shot `flowGuards` flags (`src/services/flowGuards.ts`), `setRegistrationToken`, `scanStore`, or required route params — otherwise the jump bounces to the flow's start.
- Mock OTP: any 6-digit code passes `verifyOtp`.

## NativeWind pitfall — function `style` props die on native

`babel.config.js` sets `jsxImportSource: 'nativewind'`, so `Pressable`/`View`/`Text` etc. are wrapped by `react-native-css-interop`. On **native only**, a **function-valued** `style` prop (`style={({ pressed }) => …}`) is replaced with `{}` — `flexDirection`, `padding`, everything in it silently drops (rows collapse to columns). Web is unaffected, so it looks fine in the browser.

Any file that uses a function `style` (or `children` press-state fn) MUST have `/** @jsxImportSource react */` as line 1. ~20 files already do (`NotificationCenter.tsx`, `Accordion.tsx`, `Switch.tsx`, all of `src/components/truepas/`…). When porting a screen from the design repo, add the pragma if the file has `style={(`.

## Verify

- `npx tsc --noEmit`
- `npx eslint <file>`
