# Report — Home Page 2×2 Tiles: Correct in Browser, Broken on Phone

Date: 2026-09-17
Scope: `src/app/(tabs)/index.tsx` (Home tab, V2 Dashboard) — 2×2 quick-tile grid
Symptom: Web browser renders the 2×2 tile grid with the correct sunken background
color and half-width tiles. The phone renders the same screen **without** the tile
background color and **without** the correct tile widths.

---

## TL;DR — Root Cause

**This is not a web-vs-native styling bug in the code.** The current home-page code
is platform-agnostic and correct. The phone is rendering a **stale / partially
updated JS bundle**, not the code that is on disk right now.

The entire V2 home page and its style sources were written today and are
**uncommitted / untracked**:

```
?? src/components/truepas/            ← whole kit is NEW (untracked), incl. styles.ts
 M src/theme/ThemeProvider.tsx        ← modified today (palette system added)
 M src/app/(tabs)/index.tsx           ← rewritten today (2×2 tile grid added)
MM src/theme/themes.ts                ← modified today
```

The browser reloads the fresh bundle from Metro on every refresh, so it always shows
the working tree. The phone (dev client / Expo Go) keeps serving its **last
successfully downloaded bundle** until an explicit reload — and on Windows, with this
repo's custom Metro resolver, Fast Refresh can also leave the phone with a **mixed
module graph** (new screen code + old style module). That mixed state produces
exactly this bug:

- Intermediate version of the home screen rendered tiles via
  `kit.quickTile` / `kit.productIcon` from `components/truepas/styles.ts`.
- If the phone's runtime has the new screen but a stale `styles.ts` (or vice versa),
  `kit.quickTile` resolves to `undefined` →
  `style={({ pressed }) => [undefined, …]}` → the `Pressable` renders with
  **no `backgroundColor`** and **no `width`/`flex`** → four unstyled boxes.
  That is precisely the reported symptom (boxes visible, no background, wrong widths).

A secondary factor can make even a fresh bundle look "colorless" on the phone — see
§3 (dark mode).

---

## 1. What the code actually says (verified)

Current home screen (`src/app/(tabs)/index.tsx`, working tree):

```tsx
{/* V2 quick tiles — 2×2 nav grid */}
<View style={styles.tileGrid}>
    {[tiles.slice(0, 2), tiles.slice(2, 4)].map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tileRow}>
            {row.map((tile) => (
                <Pressable
                    style={({ pressed }) => [styles.tile, pressed && kit.pressed]}>
                    <View style={[styles.tileIcon, { backgroundColor: t.colors.brandSubtle }]}>
```

```ts
tileGrid: { gap: t.spacing[3] },
tileRow:  { flexDirection: 'row', gap: t.spacing[3] },
tile: {
    flex: 1,                                   // ← half width on both platforms
    backgroundColor: t.colors.surfaceSunken,   // ← violetLedger light: #e8e3ff
    borderRadius: t.radii.lg,
    padding: t.spacing[3],
    gap: t.spacing[2],
},
```

Every one of these constructs is fully supported on native Android/iOS:

| Technique used | Native support | Verdict |
|---|---|---|
| `flexDirection: 'row'` + `flex: 1` children | Core RN layout (Yoga) | ✅ identical |
| `gap` in flexbox | RN ≥ 0.71 (app is on **RN 0.86.2 / Expo 57**) | ✅ |
| `borderRadius`, `padding` | Core RN | ✅ |
| Colors from theme | All **plain hex strings** (verified `palette.ts` / `themes.ts` — no `oklch()`, `color-mix()`, or CSS-only functions anywhere) | ✅ |
| `Pressable` style-as-function | Identical on web & native | ✅ |

Also verified and ruled out:

- **No platform-split files** — zero `*.web.tsx` / `*.native.tsx` files exist in `src/`.
- **ThemeProvider is mounted once at the root** (`src/app/_layout.tsx` line 45) for all platforms; `useThemeTokens()` cannot return a different theme shape per platform.
- **NativeWind / `global.css`** is configured (`babel.config.js`, `metro.config.js`), but the home page uses only `StyleSheet` styles, not `className` — so NativeWind cannot be the cause here.
- `surfaceSunken` resolves to a real hex in both schemes (light `#e8e3ff`, dark `#0c0a1c`) — never `undefined`.

**Conclusion: if the phone ran this exact code, it would render identically to the
browser. Therefore the phone is not running this code.**

---

## 2. Why the browser is right and the phone is wrong

### 2.1 The browser always runs the latest bundle
`expo start --web` recompiles on every page load / Fast Refresh. The browser cannot
"hold" an old bundle across a refresh. So whatever is on disk right now is what you
see — and on disk the tiles are correct.

### 2.2 The phone runs a cached bundle until told otherwise
With `expo-dev-client` (installed in this repo) or Expo Go:

1. **Last-bundle caching** — if the phone reloaded before the latest edits (or
   reconnected offline), it keeps executing the previously downloaded bundle. The
   home page was rewritten *today, in two rounds* (the git index even holds an
   intermediate staged version that used `kit.quickGrid`/`kit.quickTile`). A phone
   that last reloaded mid-iteration shows that intermediate state — not what you
   see in the browser.
2. **Fast Refresh desync (the exact symptom matcher)** — Metro pushes incremental
   updates per edited module. On Windows + this repo's custom
   `config.resolver.resolveRequest`, a refresh can apply the edited *screen* while
   the runtime keeps an older copy of `components/truepas/styles.ts`. The screen then
   reads `kit.quickTile` → `undefined` → tiles render with **no background color and
   no width**. The browser, having reloaded from scratch, never has this mixed state.
3. **Metro transformer cache** — long-lived Metro sessions on Windows (this repo
   already carries a Windows path workaround in `metro.config.js`) can serve stale
   transformed modules to newly connected devices.
4. **Wrong/old server** — the workspace also contains the `UI-design-repo` sample app.
   If the phone's dev-client launcher is pointed at a different Metro instance (or an
   EAS **preview APK** with an *embedded* JS bundle from build time), it can never
   show today's home page until the app is rebuilt or re-connected to this Metro.

---

## 3. Secondary factor: dark mode changes the tile colors on the phone

`ThemeProvider` is mounted with `scheme="system"` (`src/app/_layout.tsx` line 45):

```tsx
<ThemeProvider scheme="system" palette="violetLedger">
```

`useColorScheme()` follows **each device's OS setting**. A phone in dark mode
resolves the `violetLedger` dark variant:

| Token | Light (browser) | Dark (phone) |
|---|---|---|
| screen background `surface` | `#f8f7ff` (near-white) | `#1b1840` (dark indigo) |
| tile background `surfaceSunken` | `#e8e3ff` (light lavender) | `#0c0a1c` (near-black) |

In dark mode the sunken tiles are *darker* than the screen, which is easy to read as
"no background color" if you expect the light lavender look. Dark mode does **not**
affect widths, so this alone can't explain the full symptom — but it can compound
the stale-bundle confusion.

---

## 4. Fix / verification checklist (in order)

1. **Force a clean reload on the phone**
   - Stop Metro, then restart with cache cleared:
     ```
     npx expo start -c
     ```
   - On the phone: shake (or `adb shell input keyevent 82`) → **Reload**.
   - This eliminates both the last-bundle cache and the mixed Fast Refresh graph.
2. **Confirm the phone is talking to the right server**
   - Only one Metro should be running (close the UI-design-repo's dev server).
   - In the dev-client launcher, the URL must be your PC's LAN IP, e.g.
     `exp://192.168.x.x:8081` — same machine that runs the web preview.
   - Phone and PC on the same Wi-Fi; Windows Firewall must allow Node/Metro on
     private networks.
3. **Rule out a standalone/preview build**
   - If the phone icon was installed via `eas build` (preview/APK), it contains an
     **embedded bundle from build time**. It will never reflect working-tree edits.
     Test via the dev client connected to Metro instead, or rebuild.
4. **Prove which theme the phone resolves** (30-second check) — add temporarily to
   `HomeScreen`:
   ```tsx
   console.log('scheme colors:', t.colors.surface, t.colors.surfaceSunken);
   ```
   - Expected light: `#f8f7ff #e8e3ff` · Expected dark: `#1b1840 #0c0a1c`.
   - If the log doesn't even appear after reload → the phone is definitively running
     a stale bundle (see step 1/3).
5. **Test the dark-mode variable** — temporarily set
   `<ThemeProvider scheme="light" …>` in `src/app/_layout.tsx` and reload the phone.
   If the tile backgrounds appear, part of the confusion was scheme resolution.
6. **Commit the new work** — `src/components/truepas/` is currently untracked and
   `(tabs)/index.tsx` has diverged staged vs working-tree versions. Committing makes
   "which code is the phone running" much easier to reason about going forward.

---

## 5. What was checked and ruled out

| Hypothesis | Result |
|---|---|
| CSS-only color functions (`oklch`, `color-mix`) breaking native | Ruled out — all palette values are plain hex (`palette.ts`, `themes.ts`) |
| `gap` unsupported on native | Ruled out — RN 0.86 supports gap (since 0.71) |
| Percentage tile widths (`47.5%`) unsupported | Ruled out — supported on native; current code uses `flex: 1` anyway |
| Platform-specific style files (`.web.tsx`) | None exist in `src/` |
| ThemeProvider missing on native | Mounted at root for all platforms (`src/app/_layout.tsx`) |
| NativeWind/Tailwind class mismatch | Home page uses only `StyleSheet` styles |
| Fonts blocking render | `RootShell` gates on fonts, but that shows a blank screen — not this symptom |
| **Stale/mixed JS bundle on the phone** | **Matches all symptoms — root cause** |
| **Dark mode on the phone** | **Contributing factor for "missing" color** |
