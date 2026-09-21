# Bug Report — Android: `borderRadius > h/2` + `borderWidth` kills the background fill

**Date:** 17 September 2026
**Status:** Root cause found · fixed in code · systemic pattern documented
**Severity:** High — platform-level rendering defect repeated across the design system
**Reported symptom:** The "Add" icon in the family-members carousel on the Home tab shows no background color. Multiple attempts to fix it had no effect.

---

## 1. Symptom

Home tab → family members strip (`FamilyStrip` → `FamilyStripCell name="Add" add`):
the `UserPlus` icon renders, but the circular tile behind it has **no visible
background** on Android. iOS/web render it correctly.

## 2. Root cause — why every previous attempt failed

This is **not** a color/token problem. The background color
(`t.colors.surfaceSunken` = `#e8e3ff`) is defined and correct — it is simply
**never drawn** on Android. Three stacked Android rendering defects are at
play:

1. **`borderStyle: "dashed"` + `borderRadius`** — the committed style had a
   dashed border. On Android, dashed/dotted borders on rounded views do not
   draw (long-standing RN limitation); combined with an oversized radius it
   also broke the fill. Already removed in the working tree.
2. **`borderRadius > h/2` + `borderWidth`** — `borderRadius: t.radii.full`
   (= 9999) on a 54dp tile with `borderWidth: 1`. The same combination broke
   the Switch track/knob fill and was fixed in commit `ca4ffd7` by capping the
   radius at `h/2`.
3. **Visual style on the `Pressable` itself via a style function** — the fill
   lived on `Pressable`'s `style` callback, while the avatar cells (which
   render correctly) keep the visual on a plain inner `View`
   (`Pressable → stripRing View → Avatar`).

Because the *fill* never drew, changing `surfaceSunken` to any other color —
the obvious fix everyone tries first — changed nothing. That is why the bug
survived repeated attempts.

## Fix (this session)

- `stripAdd` / `stripRing` / `onlineDot` / `heroRing` / `bubble` / `chip`:
  radius capped at `h/2` (see table below).
- `FamilyStripCell` add branch restructured to match the member cell —
  `Pressable` is now only the hit area and the visual circle lives on a plain
  inner `View`:

```tsx
<Pressable … style={({ pressed }) => pressed && styles.pressed}>
  <View style={styles.stripAdd}>
    <UserPlus … />
  </View>
</Pressable>
```

## 3. Blast radius — every style with the same pattern

`radii.full` = **9999**, so any circular element that also sets `borderWidth`
and `backgroundColor` loses its fill on Android:

| Style | File | Size | radius was | borderWidth | Fill affected |
|---|---|---:|---:|---:|---|
| `stripAdd` | `src/components/truepas/styles.ts` | 54×54 | 9999 | 1 | `surfaceSunken` — **the reported bug** |
| `stripRing` + `stripRingSelected` | `src/components/truepas/styles.ts` | ~58 | 9999 | 2–3 | `actionPrimarySubtle` fill on selected ring |
| `onlineDot` | `src/components/truepas/styles.ts` | 10×10 | 9999 | 2 | `success` — online indicator dot |
| `heroRing` | `src/components/truepas/styles.ts` | 150×150 | 9999 | 3 | `surfaceSunken` |
| `bubble` | `src/components/complex/MultiStepForm.tsx` | 28×28 | 9999 | 1 | `surface` — invisible because fill ≈ screen bg, masking the bug |
| `chip` | `src/components/complex/SearchAndFilterBar.tsx` | h = 32 | 9999 | 1 | `surface` / `actionPrimarySubtle` (active) — same masking |

Some of these went unnoticed only because the missing fill ≈ the background
behind them (`surface` on `surface`). The add-icon tile is the first place the
missing fill is visually obvious.

## 4. Fix applied

Same remedy as the Switch fix — cap the radius at `h/2` wherever `borderWidth`
is present. `h/2` still renders a perfect circle; nothing visual changes except
the fill now draws on Android:

| Style | Fix |
|---|---|
| `stripAdd` | `borderRadius: 27` (54/2) |
| `stripRing` | `borderRadius: 29` ((48 + 2×3 + 2×2)/2 — still ≤ h/2 when `stripRingSelected` bumps border to 3 → h/2 = 30) |
| `onlineDot` | `borderRadius: 5` (10/2) |
| `heroRing` | `borderRadius: 75` (150/2) |
| `bubble` | `borderRadius: 14` (28/2) |
| `chip` | `borderRadius: t.sizes.heightSm / 2` (32/2 — pill preserved) |

## 5. Prevention — the real "big bug"

`t.radii.full` (9999) is a foot-gun on Android: it is safe **only** on views
without `borderWidth`. Any future style combining `radii.full` + `borderWidth`
+ `backgroundColor` will silently lose its fill again.

Recommended conventions going forward:

- Circular elements **with** a border → use `Math.min(width, height) / 2`, not `radii.full`.
- `radii.full` stays fine for borderless dots/pills/avatars.
- When debugging "background not showing on Android," check `borderRadius > h/2` **and** `borderWidth` before touching colors.
- Other styles using `radii.full` **without** `borderWidth` (bullets, dots, slider fills, toast bars) are unaffected.

## 6. Verification

- `tsc --noEmit` — clean on touched files.
- Visual check on Android device/emulator: Home tab → add tile now shows the
  lavender `surfaceSunken` circle; selected member ring shows its fill; online
  dot on family avatars shows green.
