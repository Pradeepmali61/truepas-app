# GFF Demo Screens — Design System Extraction

**Source:** 5 screenshots in `assets/images/demo-screens/` (720×1600 px ≈ 360×800 dp @2x)
**Token file:** `src/constants/gffTheme.ts`
**Method:** visual reverse-engineering. Values that cannot be measured exactly are marked **[ESTIMATED]** with a confidence level.

---

## 1. Visual Design Summary

Clean, white, typography-led auth flow + a card-based event home. One strong
indigo primary carries all interactive states (active segment, filled OTP boxes,
links, enabled buttons, active tab). Buttons use a subtle left→right blue→indigo
gradient. Radii are generous (12–16 dp inputs/cards, full-round pills). Shadows
are minimal — cards float on 2dp elevation, the help pill slightly more.

## 2. Color System

| Token | HEX | Usage | Confidence |
|---|---|---|---|
| primary | `#4F46E5` | Active segment, filled OTP, links, active tab | High |
| primaryDeep | `#4338CA` | Filled OTP boxes (slightly deeper) | Medium |
| primarySoft | `#EEF2FF` | "Resend OTP" pill bg | Medium |
| buttonGradient | `#4A7DF0 → #4F46E5` | Get OTP / Verify OTP (left→right) | **[ESTIMATED]** Medium |
| bg | `#FFFFFF` | All screens | High |
| fieldBg | `#F1F2F6` | Inactive segment, empty OTP boxes, disabled-ish surfaces | High |
| borderInput | `#E5E7EB` | Phone/country inputs, empty OTP boxes | High |
| textPrimary | `#0A0A0F` | Headings, values, menu labels | High |
| textSecondary | `#6B7280` | Subtitles, helpers, terms text | High |
| textTertiary | `#9CA3AF` | Placeholders, inactive tabs | Medium |
| disabledBg | `#D1D5DB` | Get OTP / Verify OTP disabled | High |
| disabledText | `#9CA3AF` | Disabled button label | High |
| danger | `#EF4444` | Notification red dot | High |
| homeWash | `#F3F1FE` | Event-home background tint (bottom) | **[ESTIMATED]** Low |

## 3. Typography System

Geometric rounded sans — **closest match: Gilroy** (Facepe uses it); Poppins is
the second candidate. **[ASSUMPTION]** — verify against the brand font.

| Style | Size (dp) | Weight | Notes |
|---|---|---|---|
| display | 32 | 800 | "Sign in to your account", "Let's Verify" — 2 lines, centered, lineHeight ≈ 1.15 |
| screenSubtitle | 15 | 400 | "Please enter the mobile number…" |
| helper | 14 | 400 | "The OTP will be sent…" |
| terms | 14 | 400 | Links underlined, same size |
| button | 18 | 700 | Get OTP / Verify OTP |
| otpDigit | 28 | 700 | White digits in filled boxes |
| resendTimer | 16 | 400 | "Resend OTP in" — time in primary, medium |
| sectionHeader | 22 | 700 | "Discover GFF 2026" |
| menuItem | 18 | 600 | Menu card labels |
| tabLabel | 12 | 500 | Bottom tab labels |
| help | 15 | 600 | "Need Help?" pill |

## 4. Spacing System

Scale (dp): `4 / 8 / 12 / 16 / 24 / 32`

- Screen horizontal padding: **24**
- Title → subtitle: 16; subtitle → form: 32
- Between input rows: 16; segmented → phone row: 16
- OTP gap: 10; OTP → resend: 24
- Menu card padding: 20 h / 18 v; icon→label gap: 16
- Bottom CTA bottom inset: 24 (+ safe area)

## 5. Layout System

- Viewport: 360×800 dp reference
- Content width: 360 − 2×24 = **312 dp**
- Sign-in: content top-anchored, terms + CTA **bottom-anchored** (space-between) — empty state pushes CTA to the bottom; filled state keeps it after content. Implement with `flex:1` spacer.
- Header (auth): back arrow left, help pill right, both on one row, top inset + 8
- Event header height ≈ 56 dp; bottom tab bar ≈ 64 dp + nav safe area
- All measurements fixed dp (no % layouts); safe-area dependent at top/bottom only

## 6. Radius System

| Token | Value | Used by |
|---|---|---|
| input | 12 | country selector, phone field |
| segment | 14 | segmented control container |
| segmentInner | 10 | active segment |
| otp | 10 | OTP boxes |
| button | 14 | primary buttons |
| card | 16 | menu cards |
| pill | full | Need Help?, Resend OTP |

## 7. Border & Shadow System

- Input borders: 1 dp `#E5E7EB`; focused OTP box: 2 dp `#4338CA`
- Menu card: `Elevation.card` — elevation 2, shadow `#6366F1` @ 6% (indigo-tinted) **[ESTIMATED]**
- Help pill: elevation 3, black @ 15% **[ESTIMATED]**
- No borders on cards — shadow only

## 8. Icon System

Outline style, 1.5–2 dp stroke, 20–24 dp:
- help/chat (pill), phone (input), chevron-down (country), back arrow
- search, bell (+8 dp red dot), profile (event header)
- 5 tab icons: home, network, agenda, message, more (filled when active)

## 9. Component Inventory

`HelpButton` · `ScreenTitle` · `ScreenSubtitle` · `AuthMethodSegment` ·
`CountryCodeSelector` · `PhoneInput` · `HelperText` · `TermsText` ·
`GradientButton` (enabled/disabled) · `BackButton` · `OtpInput` (6 boxes) ·
`ResendControl` (timer ↔ pill) · `EventHeader` (logo, search, bell+badge,
avatar) · `SectionHeader` · `MenuCard` · `BottomTabBar` · `BottomTabItem`

## 10. Component Specifications (key components)

### GradientButton
- 312×56 dp, radius 14, gradient `#4A7DF0→#4F46E5` (left→right) **[ESTIMATED]**
- Label: 18/700 white. Disabled: bg `#D1D5DB`, label `#9CA3AF`, no gradient
- Pressed: opacity 0.85. Loading: spinner replaces label

### AuthMethodSegment
- Full width, h 52, container `#F1F2F6` radius 14, padding 4
- Active segment: `#4338CA`, white 16/700, radius 10; inactive: transparent, `#374151` 16/500

### CountryCodeSelector + PhoneInput
- Row gap 12; country box w 96, input flex — both h 56, radius 12, border `#E5E7EB`, white bg
- Country: flag 24 + code 15/500 + chevron 16 gray. Input: phone icon 20 gray + value 17/600

### OtpInput
- 6 boxes 44×56, gap 10, radius 10
- Empty: bg `#F1F2F6`; focused: white bg + 2 dp indigo border; filled: `#4338CA` bg, white 28/700 digit
- Single hidden TextInput over the row (autoFocus, oneTimeCode)

### ResendControl
- Countdown: "Resend OTP in **00:25**" — 15/400 gray, time 15/500 primary
- Expired: pill — bg `#EEF2FF`, text primary 16/600, h 40, px 20, radius full

### MenuCard (event home)
- White, radius 16, h 64, padding-h 20, icon 24 primary + label 18/600 ink, gap 16
- Elevation.card; margin-bottom 12

### BottomTabBar
- White, h 64 + safe area, 5 items; inactive `#9CA3AF` icon 22 + label 12/500; active primary

## 11. Screen Analysis

| Screen | Structure | Notes |
|---|---|---|
| Sign in (empty) | help pill → title → subtitle → segment → phone row → helper → *(flex space)* → terms → Get OTP (disabled) | CTA pinned bottom |
| Sign in (filled) | same; terms sits directly under helper, button follows content | CTA is content-anchored when content fills the screen — implement as scroll content + bottom CTA |
| OTP empty | back + help → title → subtitle (number underlined) → 6 empty boxes (first focused) → "Resend OTP in 00:25" → *(space)* → Verify (disabled) | Verify disabled until 6 digits |
| OTP filled | boxes filled indigo → "Resend OTP" pill (timer expired) → Verify enabled (gradient) | auto-advance, numeric keyboard |
| Event home | header (logo, search, bell+dot, avatar) → gradient wash → "Discover GFF 2026" → 5 menu cards → "Getting Around" → 2 cards → tab bar | cards tappable rows |

Shared across screens: `ScreenTitle`, `GradientButton`, `HelpButton`, `OtpRow`, white bg, 24 dp screen padding.

## 12. React Native Files

- Tokens: `src/constants/gffTheme.ts` (created — mirrors `theme.ts` conventions)
- Suggested components: `src/components/gff/{GradientButton,AuthMethodSegment,PhoneInput,OtpInput,HelpButton,MenuCard}.tsx`
- Compose screens from tokens + components only — no magic numbers

## 13. Pixel-Perfect Validation Workflow

```
Reference screenshot (720×1600)
   → RN screen rendered at same viewport/dpr
   → overlay / pixel-diff (e.g. react-native-view-shot + pixelmatch)
   → mismatch list (color, spacing, type, radius)
   → adjust token → re-render → repeat
```

Checklist: same device/dpr · status-bar & keyboard state match · overlay diff < 2 dp drift · color sampling at 5 points per component · type size ±1 dp.

## 14. Unknowns / Assumptions

- **Font**: Gilroy assumed (rounded geometric); confirm brand font — fallback Poppins/System
- **Button gradient stops**: estimated from the visible left-lighter → right-darker ramp
- **Exact dp sizes**: derived from 720 px @2x; ±1 dp tolerance
- **Pressed/disabled segment states**: not visible in screenshots — standard patterns assumed
- **Event-home gradient tint**: very subtle; low confidence on exact stops

## 15. Final Tokens (JSON)

See `src/constants/gffTheme.ts` — `GfColors`, `GfGradients`, `GfRadius`, `GfTypography`, `GfSpacing`, `GfLayout`, `GfElevation`, `GfFontFamily`.

---

## 16. IMPLEMENTATION REPORT (Phase 14)

### Files created
| File | Purpose |
|---|---|
| `src/constants/gffTheme.ts` | GFF token layer (colors, gradients, radius, type, spacing, layout, elevation) |
| `src/components/gff/GffButton.tsx` | GradientButton — enabled/disabled/pressed/loading |
| `src/components/gff/GffText.tsx` | GffHelpButton, GffScreenTitle, GffDescription |
| `src/components/gff/GffAuthSegment.tsx` | Email/WhatsApp segmented control |
| `src/components/gff/GffPhoneInput.tsx` | Country selector + phone field (empty/focused/filled/error) |
| `src/components/gff/GffOtpInput.tsx` | 6-box OTP (empty/focused/filled/error) + GffResendControl |
| `src/components/gff/GffMenuCard.tsx` | Menu card + section header |
| `src/components/gff/GffTabBar.tsx` | Bottom tab bar (active/inactive) |
| `src/components/gff/index.ts` | Barrel export |
| `src/app/demo/_layout.tsx` | Demo stack |
| `src/app/demo/signin.tsx` | Screen 1 & 5 (empty/filled states) |
| `src/app/demo/otp.tsx` | Screens 2 & 3 (empty/focused + filled states) |
| `src/app/demo/home.tsx` | Screen 4 — GFF event home |

### Files modified
- `src/app/dev.tsx` — added "GFF DESIGN DEMO" group (navigation entries only)

### Existing components reused (no duplication)
- `Icon` / `IconName` (custom SVG registry) — all icons
- `scale` / `fontScale` responsive utils
- `useCountdown` + `formatCountdown` pattern (OTP resend timer)

### Font decision
Only **Satoshi** (Regular/Medium/Bold) exists in `assets/fonts`. Gilroy is NOT in the
project. Implementation uses system default + Satoshi weights — **[ASSUMPTION]** the
rounded geometric look of the screenshots is approximated by Satoshi Bold/800.
No font was downloaded (per instruction).

### Icon decision
Existing `Icon` SVG set reused. Mappings for missing GFF icons:
Meeting Table→`calendar`, Speakers→`user`, Partners→`family`, Exhibitors→`hotel`,
Live Videos→`smartphone`, Expo Floor Plan→`qr`, Venue→`location`,
Help→`info` (no chat-bubble icon exists), tabs: Home→`identity`, Message→`inbox`.

### Responsive / keyboard
- Reference 360×800 dp; `scale()`/`fontScale()` used for all dimensions (existing utils)
- Fixed: input/button/OTP heights; proportional: paddings via scale(); SafeArea via SafeAreaView edges; keyboard: KeyboardAvoidingView (padding iOS / height Android) + scrollable content + CTA anchored with `marginTop: 'auto'`

### Validation status
- TypeScript: **PASS** (0 errors in new files)
- ESLint: **PASS** (0 problems)
- Runtime screenshot diff: **NOT PERFORMED** — requires running the app on a
  720×1600 device/emulator and capturing screenshots. Static token values were
  measured from the reference screenshots instead.

### Known visual mismatches (to verify on device)
| Component | Issue | Expected | Actual | Likely cause | Fix |
|---|---|---|---|---|---|
| GffButton gradient | Exact stops unknown | `#4A7DF0→#4F46E5` [ESTIMATED] | token value | Screenshot sampling limits | Sample pixels from reference at 2 points, adjust `GfGradients.button` |
| OTP digit size | Token says 28dp | 28 | renders 28 | — | Confirm against overlay |
| Help pill shadow | Not implemented (flat) | subtle shadow | none | GfElevation.helpPill defined but unused | apply on pill if diff shows |
| Event-home bg wash | Gradient stops estimated | `#FFFFFF→#F3F1FE` | token value | Very subtle in screenshot | pixel-sample and tune |
| Font | Satoshi vs screenshot font | brand font | Satoshi | Font not in project | obtain brand font files |
