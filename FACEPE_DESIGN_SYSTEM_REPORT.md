# Facepe Design System — Assessment & Adoption Report for Truepas

**Generated:** 6 September 2026
**Facepe reference:** `C:\Users\Administrator\OneDrive\Desktop\Facepe3\facepe-user-frontend`
**Truepas app:** `C:\Users\Administrator\truepas-app-1`
**Companion report:** `DESIGN_SYSTEM_REPORT.md` (Truepas's own design system)

---

## 1. Executive Summary

Facepe has a **mature, professional fintech design system** with three generations of tokens:

| File | Generation | Status |
|---|---|---|
| `src/constants/DesignSystem.ts` | Gen 1 — comprehensive token system (spacing, typography, 10-step color ramps, shadows, radius, animations, accessibility) | Active, used by `Colors.ts` |
| `src/constants/NewDesignSystem.ts` | Gen 2 — Figma-extracted tokens for Home/Cards/Transactions screens | Active for payment screens |
| `src/constants/Typography.ts` | Gen 3 — centralized text styles with responsive scaling | Active, used widely |
| `src/utils/responsive.ts` | Supporting — responsive scaling utilities (`wp`, `scale`, `fontScale`) | Active, used everywhere |

**Truepas verdict:** Truepas's design system is **already strong** (dual-layer Tailwind + tokens, neumorphism, 22 components, 48 SVG icons). Facepe's system is **more mature in 4 areas** where Truepas has gaps:

1. **Responsive scaling** — Facepe scales all dimensions to screen width; Truepas uses fixed px
2. **Font-scale capping** — Facepe prevents system font scaling from breaking layouts
3. **Full color ramps** — Facepe has 10-step scales (50–900) per color; Truepas has flat tokens
4. **Dark mode architecture** — Facepe has a complete dark theme; Truepas has none

Everything else, Truepas already matches or exceeds.

---

## 2. Facepe Design System — Full Assessment

### 2.1 Color System (`DesignSystem.ts` + `Colors.ts`)

**Structure:** 10-step ramps (50 → 900) for every color family:

| Family | 500 (main) | Notes |
|---|---|---|
| `primary` (purple) | `#6B46C1` | Brand color, fintech identity |
| `secondary` (cyan) | `#06B6D4` | Accent |
| `neutral` (gray) | `#737373` | Text/borders/backgrounds |
| `success` | `#10B981` | Tailwind Emerald palette |
| `warning` | `#F59E0B` | Tailwind Amber palette |
| `error` | `#EF4444` | Tailwind Red palette |

**Semantic layer** (`Colors.ts`): light/dark theme objects mapping ramps to roles (`textPrimary`, `backgroundSecondary`, `successLight`, etc.), plus a **gradients** registry including per-card-brand gradients (Visa `#1A1F71→#2D3A8C`, Mastercard `#EB001B→#FF5F00`, Amex, Discover).

**App background:** `#F8F7FF` (light) / `#1A1625` (dark) — tinted, not pure white/black.

**Assessment:** This is a textbook 2024-era fintech token system. The 10-step ramps enable hover/pressed/disabled states, tinted surfaces, and dark mode without inventing new hex values. The card-brand gradients are payment-specific (not applicable to Truepas).

### 2.2 Typography (`Typography.ts` + `NewDesignSystem.ts`)

- **Fonts:** Satoshi (primary) + Inter (secondary) — same Satoshi Truepas uses
- **Scale:** 9 steps (12/14/16/18/20/24/28/32/36) — nearly identical to Truepas's 8 steps
- **Pre-built styles:** `textStyles.h1–h4`, `body/bodyLarge/bodySmall`, `label`, `caption`, `button`, `input`, `inputError`, `otp`, `link`, `screenTitle`, `sectionTitle`, `cardTitle` — a **complete named-style catalog**
- **Weights:** 300–700 with named tokens

**Assessment:** The named text-style catalog is the standout. Truepas has `AppText` with variants but a thinner catalog; Facepe's covers inputs, OTP, links, and screen-specific styles.

### 2.3 Responsive Scaling (`utils/responsive.ts`) — **Facepe's biggest advantage**

Base design width: **375px** (iPhone 8/X). Four utilities:

| Utility | Purpose | Scaling behavior |
|---|---|---|
| `wp(pct)` | Container widths | % of screen width |
| `scale(size)` | Spacing, icons, dimensions | Linear proportional to width |
| `fontScale(size)` | **All text** | Moderate (50% factor), capped at 1.25× phones / 1.3× tablets, floored at 0.85× |
| `moderateScale(size, f)` | Mixed content | Adjustable factor |

Plus `screenSize` categories (isSmall/isMedium/isLarge/isXLarge/isTablet), `responsiveValue()` for per-breakpoint values, and `MIN_TOUCH_TARGET = 44`.

**Assessment:** Truepas uses **fixed pixel values everywhere** (`text-[14px]`, `h-[56px]`, `p-4`). On a tablet or large Android, Truepas UI will look small with wasted space; on small phones, cramped. Facepe's approach guarantees consistent proportions across the 375–768px range. This is the single highest-value adoption.

### 2.4 Font-Scaling Guard (`AppText.tsx`)

`AppText` wraps `<Text>` with `maxFontSizeMultiplier={1}` — **prevents the OS font-size setting from breaking layouts**. Also provides `AppTextAccessible` (caps at 1.15×) and `AppTextInput`.

**Assessment:** Truepas does not cap font scaling. A user with "Large text" accessibility settings will break Truepas layouts (OTP rows, buttons, cards). Simple, high-value fix — but note the accessibility trade-off (see §4.4).

### 2.5 Spacing / Radius / Shadows

- **Spacing:** 8px grid, 9 tokens (4–48) — identical to Truepas
- **Radius:** 8 tokens (4–24 + full) — Truepas has 7 tokens (4–32), equivalent
- **Shadows:** 5 elevation levels + `card` special — Truepas has 5 levels + neumorphism, equivalent or better
- **Animations:** fast 150 / normal 250–300 / slow 350–500 — Truepas uses Reanimated springs, equivalent

### 2.6 Component Library

Facepe's notable components (beyond what Truepas has):

| Component | File | What it does |
|---|---|---|
| `AlertModal` | `ui/AlertModal.tsx` | **In-app alert modal** with type-based theming (info/success/warning/error/logout), spring entrance, dashed icon ring — replaces native `Alert.alert` |
| `GradientButton` | `ui/Button/Button.tsx` | 56px gradient button, radius 28, Satoshi-Bold 16, left/right icon slots, pressed opacity 0.85 |
| `Button` (legacy) | `ui/Button.tsx` | 4 variants (primary/secondary/ghost/danger) × 3 sizes with per-variant gradients |
| `Input` | `ui/Input.tsx` | 4 variants (default/password/phone/email), label, error, hint, left/right icons, focus states |
| `EmptyState` | `ui/EmptyState.tsx` | Animated entrance, per-context variants (cards/transactions/notifications), gradient icon background |
| `AlertModal` system | `ui/AlertModal.tsx` + global alert context | App-wide styled alerts |
| `FlippingCard` | `components/FlippingCard.tsx` | 3D flip card (already adopted by Truepas) |
| Layout suite | `layouts/` | `AppHeader` (profile variant + title variant), `BottomTabBar`, `SafeAreaWrapper`, `ScreenContainer`, `ScrollContainer` — all folder-structured with `styles.ts`/`types.ts` separation |

**Component file convention:** Facepe uses **folder-per-component** (`Component/Component.tsx + styles.ts + types.ts + index.ts`). Truepas uses single-file components. Facepe's convention scales better for complex components but adds file count for simple ones.

### 2.7 Dark Mode

Complete dark theme in `Colors.ts` (inverted gray ramp, adjusted primary, dark gradients) — though screens hardcode `const colorScheme = 'light'` in places, so it's **architecturally present but not fully wired**.

### 2.8 Weaknesses in Facepe's System (do not copy)

1. **Three competing token files** — `DesignSystem.ts`, `NewDesignSystem.ts`, and `Typography.ts` overlap with different values (e.g., two different purple primaries: `#6B46C1` vs `#5f15ee`). Truepas's single `theme.ts` + `tailwind.config.js` is cleaner.
2. **Hardcoded hex values in screens** — verify.tsx hardcodes `#7A35FF`, `#9C6CFE`, `#F8F7FF` etc. despite having tokens. Truepas has the same disease but less severely.
3. **Mixed icon systems** — Ionicons + custom SVGs + PNG assets. Truepas's single SVG registry (48 icons) is better.
4. **`maxFontSizeMultiplier={1}`** — breaks OS-level accessibility font scaling (see §4.4).
5. **Dead code** — legacy `Button.tsx` alongside `Button/Button.tsx`, unused schema variants.

---

## 3. Side-by-Side Comparison

| Area | Facepe | Truepas | Winner | Action |
|---|---|---|---|---|
| Color tokens | 10-step ramps ×6 families | Flat tokens (~25 values) | **Facepe** | Adopt ramp structure |
| Dark mode | Full architecture (partially wired) | None | **Facepe** | Defer (see §4.5) |
| Typography scale | 9 steps + named catalog | 8 steps + AppText variants | Tie | Extend AppText catalog |
| **Responsive scaling** | `wp/scale/fontScale` on everything | Fixed px everywhere | **Facepe** | **Adopt (P1)** |
| **Font-scale cap** | `maxFontSizeMultiplier` | None | **Facepe** | **Adopt (P1)** |
| Spacing | 8px grid, 9 tokens | Same | Tie | — |
| Radius | 8 tokens | 7 tokens | Tie | — |
| Shadows | 5 levels | 5 levels + neumorphism | **Truepas** | — |
| Buttons | Gradient, 3 sizes, icon slots | 5 variants, scale+haptics | Tie | Add size props (P3) |
| Inputs | 4 variants, focus/error states | FloatingInput (stronger) | **Truepas** | — |
| **Alert modal** | Styled in-app AlertModal | Native `Alert.alert` | **Facepe** | **Adopt (P2)** |
| Empty states | Animated + context variants | Static | **Facepe** | Enhance (P3) |
| Icons | Mixed (Ionicons+SVG+PNG) | Single SVG registry (48) | **Truepas** | — |
| Component structure | Folder-per-component | Single-file | Tie | Folder for complex only |
| Token organization | 3 overlapping files | 1 theme.ts + tailwind | **Truepas** | — |
| Animations | Animated API | Reanimated v4 | **Truepas** | — |
| Haptics | Not systematic | Systematic on all presses | **Truepas** | — |

**Score: Facepe wins 5 areas, Truepas wins 6, tie 4.** Truepas's foundation is better organized; Facepe's advantages are concentrated in responsiveness and a few UX components.

---

## 4. Adoption Recommendations for Truepas

### P1 — High value, low effort (adopt now)

#### 4.1 Responsive scaling utility
Create `src/utils/responsive.ts` (port Facepe's file nearly 1:1 — it's self-contained):

```ts
// src/utils/responsive.ts
const BASE_WIDTH = 375;
export const scale = (size: number, min?: number, max?: number): number => { /* proportional */ };
export const fontScale = (size: number, min?: number, max?: number): number => { /* moderate 0.5 factor, capped */ };
export const wp = (pct: number): number => { /* % width */ };
export const MIN_TOUCH_TARGET = 44;
```

Then apply incrementally to **new** screens and when touching existing ones. Do not big-bang refactor — Tailwind classes like `text-[14px]` can migrate to `fontScale` gradually.

#### 4.2 Font-scale cap on Text
Add `maxFontSizeMultiplier` support to Truepas's `AppText`:

```tsx
export function AppText({ maxFontSizeMultiplier = 1.15, ...props }) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}
```

Use `1.15` (Facepe's accessible variant) rather than `1` — keeps layouts stable while respecting accessibility better than Facepe's default.

#### 4.3 Extend AppText named-style catalog
Add the missing styles from Facepe's catalog to `AppText`'s variants: `inputError`, `link`, `linkSmall`, `otp`, `screenSubtitle`, `cardSubtitle`. Cheap, improves consistency.

### P2 — Medium value (adopt next)

#### 4.4 In-app AlertModal (replaces `Alert.alert`)
Port Facepe's `AlertModal` pattern: type-based theming (info/success/warning/error), spring entrance, 2-button API compatible with `Alert.alert(title, message, buttons)` so migration is mechanical. This was already on Truepas's roadmap (FACEPE_ADOPTION_REPORT §4.5 `ConfirmModal`) — Facepe's implementation is the reference.

#### 4.5 Color ramp structure in theme.ts
Restructure `Colors` into ramps while keeping flat aliases for backward compatibility:

```ts
export const primary = { 50: '#E6F8FF', 100: '#CEF0FE', 300: '#84DBFE', 500: '#08B6FC', 600: '#0692CA', 700: '#034965', 900: '#022A3A' };
export const Colors = { primary: primary[500], primaryLight: primary[300], /* ...existing names */ };
```

Existing code keeps working; new code can use `primary[600]` for pressed states instead of ad-hoc hex.

### P3 — Lower priority (adopt opportunistically)

#### 4.6 Button size variants
Add `size?: 'small' | 'medium' | 'large'` to Truepas's Button (Facepe: 40/52/60px heights, 14/16/18px fonts).

#### 4.7 Animated EmptyState variants
Add entrance animation + per-context icon tinting to Truepas's `EmptyState`.

#### 4.8 Folder-per-component for complex components only
Adopt Facepe's `Component/styles.ts/types.ts` split only for components that exceed ~200 lines (e.g., future `FlippingCard` extraction). Keep single-file for simple ones.

### Do NOT adopt

| Facepe pattern | Why not |
|---|---|
| Three overlapping token files | Truepas's single `theme.ts` + `tailwind.config.js` is cleaner; don't regress |
| `maxFontSizeMultiplier={1}` default | Breaks OS accessibility; use `1.15` cap instead |
| Card-brand gradients (Visa/MC/Amex) | Payment-specific; Truepas has no cards |
| Ionicons + mixed icon sources | Truepas's unified SVG registry is superior |
| Payment components (PaymentCard, SlideToAccept, AutoPay, transactions suite) | No payment feature in Truepas |
| `Animated` API for new work | Truepas standard is Reanimated |

### Dark mode — defer with rationale

Facepe's dark architecture exists but is **half-wired** (screens hardcode light). Building dark mode for Truepas now would double the QA surface for every screen before the core flows (document verification, liveness) are stable. Revisit after backend blockers resolve. If adopted later, the P2 color-ramp restructure (§4.5) is the prerequisite.

---

## 5. Implementation Plan

| # | Task | Files | Effort |
|---|---|---|---|
| 1 | Port `responsive.ts` (scale/fontScale/wp) | `src/utils/responsive.ts` (new) | S |
| 2 | Add `maxFontSizeMultiplier` cap to AppText | `src/components/ui/AppText.tsx` | XS |
| 3 | Extend AppText style catalog | `src/components/ui/AppText.tsx` | S |
| 4 | AlertModal + alert context | `src/components/ui/AlertModal.tsx` (new), `src/components/ui/AlertProvider.tsx` (new) | M |
| 5 | Color ramps in theme.ts (backward-compatible) | `src/constants/theme.ts`, `tailwind.config.js` | M |
| 6 | Button size variants | `src/components/ui/Button.tsx` | S |
| 7 | Animated EmptyState | `src/components/ui/EmptyState.tsx` | S |
| 8 | Incremental responsive migration | Ongoing, per-screen when touched | Ongoing |

Tasks 1–3 are independent and can land together in one PR. Task 4 is the existing `ConfirmModal` roadmap item with Facepe's implementation as reference. Task 5 unblocks future dark mode.

---

## 6. Summary

**Truepas's design system is structurally better** — single source of truth, unified icons, Reanimated, systematic haptics, neumorphism. **Facepe is operationally better in responsiveness** — every dimension scales to the device, and OS font scaling can't break layouts.

The five highest-value adoptions, in order:
1. **`responsive.ts` scaling utilities** (P1) — fixes tablet/large-phone/small-phone consistency
2. **Font-scale cap at 1.15×** (P1) — prevents accessibility-setting layout breaks
3. **AppText catalog extension** (P1) — consistency, near-zero cost
4. **AlertModal** (P2) — replaces native alerts, already on the roadmap
5. **Color ramps** (P2) — unlocks pressed/disabled states and future dark mode

Everything else Facepe has, Truepas already matches or deliberately should not copy (payment UI, mixed icons, triple token files).

---

**Generated with [Devin](https://devin.ai)**
