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

## Verify

- `npx tsc --noEmit`
- `npx eslint <file>`
