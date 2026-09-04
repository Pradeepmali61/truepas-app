# Truepas App — Design System, Theme & Layout Report

**Generated:** 4 September 2026
**App:** truepas-app (React Native / Expo SDK 57)
**Platform:** Android + iOS (managed Expo workflow)
**Bundle ID:** `com.truepas.truepasapp`

---

## 1. Overview

The Truepas app uses a **dual-layer theming system**:

1. **`src/constants/theme.ts`** — JavaScript design tokens (used via `Colors`, `Typography`, `Spacing`, `Radius`, `Elevation`, `Neumorphism`). These are imported directly in components for inline styles.
2. **`tailwind.config.js`** — NativeWind (Tailwind CSS for React Native) utility classes. The same color values are mirrored here so you can use `className="bg-primary text-ink"` etc.

Both layers are kept in sync. Components freely mix `className` (Tailwind) and `style` (theme tokens).

---

## 2. Color Palette

### 2.1 Primary Brand Colors

| Token (theme.ts)        | Tailwind class        | Hex       | Usage                                  |
|-------------------------|-----------------------|-----------|----------------------------------------|
| `Colors.primary`        | `bg-primary`          | `#08B6FC` | Primary buttons, active states, links  |
| `Colors.primaryPressed` | `bg-primary-pressed`  | `#0692CA` | Pressed / active button state          |
| `Colors.primaryDark`    | `bg-primary-dark`     | `#034965` | Dark accent text on light blue         |
| `Colors.primaryLight`   | `bg-primary-light`    | `#84DBFE` | Gradient end, welcome screen           |

### 2.2 Surface / Background Colors

| Token                   | Tailwind class          | Hex       | Usage                          |
|-------------------------|-------------------------|-----------|--------------------------------|
| `Colors.surface`        | `bg-surface`            | `#E6F8FF` | Light blue surface (cards bg)  |
| `Colors.surfaceAlt`     | `bg-surface-alt`        | `#CEF0FE` | Alternate surface              |
| `Colors.surfaceElevated`| `bg-surface-elevated`   | `#FFFFFF` | Elevated white surface         |
| `Colors.bgWhite`        | —                       | `#FFFFFF` | Pure white background           |
| `Colors.bgGray` / `canvas` | `bg-canvas`         | `#F5F5F5` | Page background, inactive track|
| `Colors.bgYellow`       | —                       | `#FFF9E6` | Warning background             |

### 2.3 Text Colors

| Token                | Tailwind class      | Hex       | Usage                          |
|----------------------|---------------------|-----------|--------------------------------|
| `Colors.ink` / `text`| `text-ink`          | `#000000` | Primary text                   |
| `Colors.textSecondary`/`textMuted` | `text-muted` | `#666666` | Secondary / muted text    |
| `Colors.textFaint`   | `text-faint`        | `#8A8A8A` | Faint labels, placeholders     |
| `Colors.textDisabled`| `text-disabled`     | `#B0B0B0` | Disabled state text            |

### 2.4 Border / Divider Colors

| Token              | Tailwind class   | Hex       | Usage                        |
|--------------------|------------------|-----------|------------------------------|
| `Colors.border`    | `border-line`    | `#CCCCCC` | Default border               |
| `Colors.borderInput`| —               | `#E0E0E0` | Input field border           |
| `Colors.borderLight`| —               | `#F5F5F5` | Light border (tab bar top)   |
| `Colors.divider`   | `border-divider` | `#F0F0F0` | Thin dividers                |

### 2.5 Semantic Colors

| Token           | Tailwind class   | Hex       | Background       | Usage                    |
|-----------------|------------------|-----------|------------------|--------------------------|
| `Colors.error`  | `bg-danger`      | `#DC2626` | `#FEF2F2`        | Error states, danger     |
| `Colors.success`| `bg-success`     | `#059669` | `#ECFDF5`        | Success states           |
| `Colors.warning`| `bg-warning`     | `#B45309` | `#FFF9E6`        | Warning states           |
| `Colors.info`   | `bg-info`        | `#3B82F6` | `#EFF6FF`        | Info banners             |
| `Colors.pending`| —                | `#FF9900` | —                | Pending status           |

### 2.6 Gradients

Defined in `Gradients` constant:

| Name          | Colors                                   | Usage                        |
|---------------|------------------------------------------|------------------------------|
| `brand`       | `['#08B6FC', '#84DBFE']`                 | Login screen background      |
| `welcome`     | `['#84DBFE', '#08B6FC', '#0692CA']`      | Welcome / onboarding screen  |
| `identityCard`| `['#0692CA', '#0692CA']`                  | Identity card surface        |
| `historyThumb`| `['#84DBFE', '#0692CA']`                  | History thumbnail gradient   |

---

## 3. Typography

### 3.1 Font Family

- **Primary font:** `Satoshi` (with `System` / `sans-serif` fallback)
- Variants registered in Tailwind: `font-sans`, `font-satoshi`, `font-satoshi-medium`, `font-satoshi-bold`
- Platform selection via `FontFamily` in theme.ts:
  - iOS: `Satoshi` → `System`
  - Android: `Satoshi` → `sans-serif`

### 3.2 Type Scale

Defined in `Typography` constant (`src/constants/theme.ts`):

| Variant        | Size (px) | Weight | Usage                        |
|----------------|-----------|--------|------------------------------|
| `caption`      | 12        | 400    | Captions, pill text          |
| `bodySmall`    | 14        | 400    | Secondary body text          |
| `body`         | 16        | 400    | Default body text            |
| `bodyLarge`    | 18        | 600    | Large body, top bar title    |
| `headingSmall` | 20        | 700    | Screen headers               |
| `heading`      | 24        | 700    | Page headings                |
| `headingLarge` | 32        | 700    | Large headings               |
| `display`      | 40        | 700    | Display / hero text          |

### 3.3 Common Inline Text Patterns

Used via Tailwind classes throughout the app:

| Pattern                  | Example                                  |
|--------------------------|------------------------------------------|
| Body text                | `text-[14px] text-muted`                 |
| Bold title               | `text-[16px] font-bold text-ink`         |
| Section title (uppercase)| `text-[12px] font-semibold uppercase tracking-[0.5px] text-muted` |
| Button label             | `text-[16px] font-bold text-white`       |
| Error text               | `text-[13px]` with `color: '#EF4444'`    |
| Caption                  | `text-[12px] font-medium`                |

### 3.4 AppText Component

`src/components/ui/AppText.tsx` — wraps `<Text>` with `Typography` variant support:

```tsx
<AppText variant="heading" color={Colors.primary}>Title</AppText>
```

---

## 4. Spacing System

Defined in `Spacing` constant:

| Token   | Value (px) | Tailwind equivalent |
|---------|------------|---------------------|
| `xs`    | 4          | `p-1` / `gap-1`     |
| `sm`    | 8          | `p-2`               |
| `md`    | 12         | `p-3`               |
| `lg`    | 16         | `p-4` / `px-5` (20) |
| `xl`    | 20         | `px-5`              |
| `xxl`   | 24         | `p-6`               |
| `xxxl`  | 32         | `p-8`               |
| `huge`  | 40         | —                   |
| `massive`| 48        | —                   |

**Common usage patterns:**
- Screen horizontal padding: `px-6` (24px) or `px-5` (20px)
- Card padding: `p-4` (16px)
- Section gap: `gap-2` (8px) or `gap-3` (12px)
- Bottom tab inset: iOS 50px, Android 80px

---

## 5. Border Radius

Defined in `Radius` constant and Tailwind:

| Token    | Value (px) | Tailwind class  | Usage                          |
|----------|------------|-----------------|--------------------------------|
| `card`   | 16         | `rounded-card`  | Cards, neumorphic surfaces     |
| `btn`    | 12         | `rounded-btn`   | Buttons, info banners          |
| `input`  | 8          | `rounded-[8px]` | Input fields, OTP boxes        |
| `chip`   | 8          | `rounded-[8px]` | Chips                          |
| `pill`   | 4          | `rounded-[4px]` | Status pills                   |
| `sheet`  | 20         | —               | Bottom sheet top corners       |
| `welcome`| 32         | —               | Welcome screen card            |

---

## 6. Elevation / Shadows

Defined in `Elevation` constant:

| Level      | Elevation | Shadow Opacity | Shadow Radius | Offset  | Usage                    |
|------------|-----------|----------------|---------------|---------|--------------------------|
| `none`     | 0         | 0              | 0             | 0, 0    | Flat surfaces            |
| `small`    | 2         | 0.06           | 6             | 0, 2    | Cards (default)          |
| `medium`   | 3         | 0.08           | 8             | 0, 3    | Cards, elevated views    |
| `large`    | 4         | 0.10           | 10            | 0, 4    | Floating elements        |
| `floating` | 8         | 0.12           | 16            | 0, 6    | Toasts, bottom sheets    |

### Neumorphism

The app implements a **neumorphic design system** for soft UI elements:

- **Base color:** `Colors.surface` (`#E6F8FF`)
- **Light edge:** `#FFFFFF`
- **Dark edge:** base color darkened by 22%
- **Shadow distance:** 6px
- **Shadow blur:** 12px
- **Radius:** 16px (card)

Components using neumorphism:
- `NeuButton` — elevated soft/flat button with dual-shadow
- `NeuElevatedView` — elevated container with gradient fill
- `NeuPitView` — inset/pit container with inverted shadows

Platform handling:
- **iOS:** Dual `shadowColor` layers (light + dark) for true neumorphic effect
- **Android:** `elevation: 6` + gradient fill (Android doesn't support dual shadows)
- **Web:** CSS `box-shadow` via `getNeuBoxShadow()` helper

---

## 7. Layout System

### 7.1 Screen Container

`src/components/layout/ScreenContainer.tsx`

- Wraps every screen in `SafeAreaView` with `edges={['top', 'bottom']}`
- Background: `bg-white` (`#FFFFFF`)
- Scroll mode (default): wraps children in `ScrollView` with `flexGrow: 1`
- Non-scroll mode: direct `SafeAreaView` for camera/full-screen screens
- `Spacer` component: `<View className="flex-1" />` to push content to bottom

### 7.2 Top Bar

`src/components/layout/TopBar.tsx`

- Height: ~48px (py-3 = 12px top + 12px bottom + 24px icon)
- Layout: `flex-row items-center justify-between px-5`
- Back button: 36×36px touch target (`h-9 w-9`), icon size 24
- Title: `text-[18px] font-bold text-ink`
- Optional `rightSlot` for action buttons

### 7.3 Screen Header

`src/components/layout/ScreenHeader.tsx`

- Height: 64px
- Layout: centered title with absolute-positioned back button
- Back button: 44×44px touch target, icon size 22
- Title: `fontSize: 20, fontWeight: '700'`
- Light variant: white text (for gradient backgrounds)

### 7.4 Bottom Tab Bar

`src/app/(tabs)/_layout.tsx`

Custom tab bar with:
- **Position:** Absolute bottom, full width
- **Height:** 64px + safe area inset
- **Background:** White (`#FFFFFF`)
- **Top border:** 1px `#F5F5F5`
- **Shadow:** elevation 8, opacity 0.06
- **Active indicator:** 32×4px pill, `Colors.primary`, animated translateX
- **Tab items:** Icon (24px) + label (10px font)
  - Active: icon `Colors.primary`, label `fontWeight: '600'`, scale 1.15, translateY -2
  - Inactive: icon `Colors.textSecondary`, label `fontWeight: '500'`
- **Haptic feedback:** Light impact on tab press
- **Tabs:** Home (identity icon), Documents, Family, History

### 7.5 Navigation Flow

```
(auth)/welcome → (auth)/login → (auth)/register → (auth)/verify-phone → (auth)/account-details
                                                                                              ↓
(onboarding)/consent → (onboarding)/face-enroll → (tabs)/index
                                                        ↓
                                            Documents / Family / History
```

Auth guard: `status !== 'authenticated'` → redirect to welcome
Face guard: `!faceEnrolled` → redirect to consent

---

## 8. Component Library

All UI components are exported from `src/components/ui/index.ts`.

### 8.1 Button

`src/components/ui/Button.tsx`

| Variant    | Background       | Text Color  | Usage                    |
|------------|------------------|-------------|--------------------------|
| `primary`  | `bg-primary`     | white       | Main CTAs               |
| `secondary`| `bg-surface`     | primary     | Secondary actions       |
| `outline`  | transparent      | ink         | Tertiary actions        |
| `danger`   | `bg-primary`     | white       | Destructive (same as primary) |
| `link`     | transparent      | primary     | Text links              |

- **Size:** `p-[14px]` (14px vertical padding), `w-full`
- **Radius:** `rounded-btn` (12px)
- **Font:** `text-[16px] font-bold`
- **Animation:** Scale 0.96 on press (Reanimated `withTiming`, 90ms in / 120ms out)
- **Haptics:** Light impact on press (non-web)
- **States:** `disabled` → opacity 50%, `loading` → ActivityIndicator
- **Icon support:** Optional `icon` prop with `iconColor`

### 8.2 NeuButton

`src/components/ui/NeuButton.tsx`

- Neumorphic elevated button with soft/flat variants
- `elevated_soft`: gradient fill from light to dark
- `elevated_flat`: inner border with beveled edges
- Same press animation and haptics as Button
- Platform-specific shadow rendering (iOS dual-shadow, Android elevation)

### 8.3 FloatingInput

`src/components/ui/FloatingInput.tsx`

- **Height:** 56px (`h-[56px]`)
- **Radius:** 8px (gradient mode) or 12px (plain mode)
- **Border:** `Colors.borderInput` (default) → `Colors.primary` (focused) → `Colors.warning` (error)
- **Label:** 11px (gradient) or 12px (plain), color shifts with state
- **Gradient mode:** White-to-light-blue linear gradient background
- **Plain mode:** White background
- **Error:** 11px warning-colored text below input
- **Right slot:** Optional element (e.g., password visibility toggle)

### 8.4 Card

`src/components/ui/Card.tsx`

- **Margin:** `mx-5 my-[10px]` (20px horizontal, 10px vertical)
- **Padding:** `p-4` (16px)
- **Radius:** `rounded-card` (16px)
- **Border:** `0.5px border-canvas`
- **Background:** White
- **Shadow:** elevation 3

### 8.5 Chip

`src/components/ui/Chip.tsx`

- **Radius:** 8px
- **Border:** 1.5px
- **Selected:** `border-primary bg-primary` with white text
- **Unselected:** `border-line bg-white` with muted text
- **Font:** `text-[14px] font-medium`
- **Padding:** `px-4 py-2`
- `ChipRow` wrapper: `flex-row flex-wrap justify-center gap-2 px-6 pb-4`

### 8.6 Pill

`src/components/ui/Pill.tsx`

| Variant   | Background       | Text Color   |
|-----------|------------------|--------------|
| `default` | `bg-surface`     | primary      |
| `warn`    | `#FFF9E6`        | `#FF6600`    |
| `fail`    | `#FEF2F2`        | primary      |
| `active`  | `bg-primary`     | white        |
| `gray`    | `bg-canvas`      | muted        |

- **Radius:** 4px
- **Font:** `text-[12px] font-medium`
- **Padding:** `px-2 py-1`

### 8.7 Toggle

`src/components/ui/Toggle.tsx`

- **Size:** 44×26px
- **Knob:** 20×20px white circle, elevation 2
- **On:** `bg-primary`, knob at left:21
- **Off:** `bg-line`, knob at left:3
- **Accessibility:** `accessibilityRole="switch"`

### 8.8 Checkbox

`src/components/ui/Checkbox.tsx`

- **Box size:** 22×22px
- **Radius:** 6px
- **Border:** 1.5px
- **Checked:** `border-primary bg-primary` with white check icon (14px)
- **Unchecked:** `border-line bg-white`
- **Label:** `text-[13px] leading-[19.5px] text-muted`

### 8.9 OtpRow

`src/components/ui/OtpRow.tsx`

- **Box size:** 44×52px
- **Radius:** 8px
- **Border:** 1.5px
- **Filled:** `border-primary bg-surface`
- **Active:** `border-primary bg-white` with blinking cursor (2×24px, `#2563EB`)
- **Empty:** `border-[#e0e0e0] bg-white`
- **Digit font:** `text-[20px] font-bold text-ink`
- **Cursor blink:** 500ms interval

### 8.10 PinPad

`src/components/ui/PinPad.tsx`

- **Layout:** 3-column grid, `px-10`
- **Cell height:** 56px (`h-[56px] w-1/3`)
- **Keys:** 1-9, empty, 0, backspace (⌫)
- **Font:** `text-[24px] font-semibold text-ink`
- **PinDots:** 16×16px circles, `gap-4`, filled = `bg-primary`, empty = `bg-[#e0e0e0]`

### 8.11 ProgressTrack

`src/components/ui/ProgressTrack.tsx`

- **Height:** 4px (`h-1`)
- **Radius:** full (`rounded-full`)
- **Track:** `bg-canvas`
- **Fill:** `bg-primary`, width = `${percent}%`
- **Margin:** `mx-6 mb-[10px]`

### 8.12 Stepper

`src/components/ui/Stepper.tsx`

- **Segment height:** 4px (`h-1`)
- **Layout:** `flex-row gap-[6px] px-6 pb-4`
- **Done:** `bg-primary`
- **Pending:** `bg-canvas`
- **Radius:** full

### 8.13 ListItem

`src/components/ui/ListItem.tsx`

- **Min height:** 56px
- **Layout:** `flex-row items-center gap-3 px-5 py-3`
- **Icon wrap:** 40×40px, `rounded-btn`, default bg `#E8F0FE`
- **Title:** `text-[14px] font-medium text-ink`
- **Subtitle:** `text-[12px] text-muted`
- **Chevron:** 18px, color `#E5E5EA`
- **Press state:** `active:bg-canvas`

### 8.14 InfoBanner

`src/components/ui/InfoBanner.tsx`

| Variant  | Background  | Text Color   | Icon Color    |
|----------|-------------|--------------|---------------|
| `info`   | `bg-surface`| primary      | `Colors.primary` |
| `warn`   | `#FFF9E6`   | `#B45309`    | `Colors.warning` |
| `danger` | `#FEF2F2`   | primary      | `Colors.primary` |

- **Radius:** `rounded-btn` (12px)
- **Padding:** `px-[14px] py-3`
- **Font:** `text-[12px] leading-[18px]`
- **Layout:** `flex-row items-start gap-2`

### 8.15 BottomSheet

`src/components/ui/BottomSheet.tsx`

- **Position:** Absolute, bottom-aligned, full width
- **Background:** White
- **Top radius:** 20px (`Radius.sheet`)
- **Handle:** 40×4px gray bar (`Colors.divider`)
- **Title:** `text-[18px] font-bold text-ink`
- **Backdrop:** Black, opacity 0.5 (animated)
- **Animation:** Spring (stiffness 300, damping 30), translateY 400 → 0
- **Shadow:** elevation 16, opacity 0.15

### 8.16 Toast

`src/components/ui/Toast.tsx`

| Variant   | Background       | Icon           | Icon Color    |
|-----------|------------------|----------------|---------------|
| `success` | `Colors.successBg` | `checkCircle` | `Colors.success` |
| `error`   | `Colors.errorBg`   | `warning`     | `Colors.error`   |
| `warning` | `Colors.warningBg` | `warning`     | `Colors.warning` |
| `info`    | `Colors.infoBg`    | `info`        | `Colors.info`    |

- **Radius:** 12px
- **Padding:** `px-4 py-3.5` (16px / 14px)
- **Font:** `fontSize: 14, fontWeight: '600', color: Colors.ink`
- **Shadow:** elevation 8, opacity 0.12
- **Animation:** Spring slide from top (-100 → 0), opacity fade
- **Auto-dismiss:** Configurable duration (default in ToastProvider)

### 8.17 Skeleton

`src/components/ui/Skeleton.tsx`

- **Background:** `bg-canvas`
- **Shimmer:** Animated translateX (white 15% opacity overlay)
- **Reduced motion:** Pulse opacity 0.4 ↔ 1.0 (700ms)
- **Props:** `width`, `height` (default 16), `radius` (default 8)

### 8.18 EmptyState

`src/components/ui/EmptyState.tsx`

- **Layout:** Centered, `flex-1 items-center justify-center p-[30px]`
- **Icon:** 56px at 50% opacity
- **Title:** `text-[16px] font-bold text-ink`
- **Description:** `text-[13px] text-muted text-center`
- **Optional action:** ReactNode (e.g., Button)

### 8.19 ErrorState

`src/components/ui/ErrorState.tsx`

- **Icon circle:** 96×96px, `Colors.errorBg` background
- **Icon:** 40px, `Colors.error`
- **Title:** `text-[20px] font-bold text-ink`
- **Message:** `text-[14px] leading-[22px] text-muted`, max-width 280px
- **Retry button:** Full-width, `bg-primary`, `rounded-btn`, `p-[14px]`

### 8.20 Avatar

`src/components/ui/Avatar.tsx`

- **Size:** Default 48×48px (configurable)
- **Radius:** 16px (rounded square)
- **Background:** `bg-faint` (`#8A8A8A`)
- **Initials:** White, `fontSize: 28, fontWeight: '700'`

### 8.21 AnimatedCard

`src/components/ui/AnimatedCard.tsx`

- **Press animation:** Scale to 0.97 (spring, stiffness 400, damping 25)
- Wraps any content in a Pressable with Reanimated scale transform

### 8.22 SectionTitle

`src/components/ui/SectionTitle.tsx`

- **Font:** `text-[12px] font-semibold uppercase tracking-[0.5px] text-muted`
- **Margin:** `mx-5 mb-2 mt-4`
- Optional centered variant

---

## 9. Icon System

`src/components/ui/Icon.tsx` + `src/components/ui/iconPaths.tsx`

- **Format:** SVG-based (react-native-svg), 24×24 viewBox
- **Default size:** 22px
- **Default color:** `#000000`
- **Color control:** `color` prop controls stroke/fill
- **Available icons (48 total):**

| Category    | Icons                                                              |
|-------------|--------------------------------------------------------------------|
| Navigation  | `back`, `chevron`                                                  |
| Tabs        | `identity`, `documents`, `family`, `history`                       |
| Actions     | `camera`, `check`, `checkCircle`, `cross`, `edit`, `plus`, `trash` |
| Auth        | `lock`, `shield`, `face`, `scanFace`, `selfie`, `smartphone`, `phone`, `email`, `otpcode` |
| Status      | `warning`, `info`, `clock`, `hourglass`                            |
| Documents   | `document`, `passport`, `drivingLicense`, `idCard`, `greenCard`, `birthCertificate`, `usVisa` |
| Profile     | `bell`, `settings`, `user`, `logout`, `more`                       |
| Misc        | `calendar`, `cake`, `search`, `hotel`, `invoice`, `qr`, `sparkle`, `location`, `inbox`, `eye`, `eyeClosed` |

---

## 10. Animation Patterns

The app uses **react-native-reanimated** (v4.5.1) throughout:

| Pattern         | Component         | Animation                              |
|-----------------|-------------------|----------------------------------------|
| Button press    | Button, NeuButton | Scale 0.96, timing 90ms in / 120ms out |
| Card press      | AnimatedCard      | Scale 0.97, spring stiffness 400       |
| Tab switch      | TabItem           | Scale 1.15 + translateY -2, spring     |
| Bottom sheet    | BottomSheet       | translateY spring (300/30)             |
| Toast           | ToastItem         | translateY spring + opacity timing     |
| Skeleton shimmer| Skeleton          | translateX repeat + opacity pulse      |

**Haptics** (expo-haptics): Light impact on all button/tab presses (non-web only).

---

## 11. Platform-Specific Behavior

| Feature         | iOS                          | Android                     | Web                |
|-----------------|------------------------------|-----------------------------|--------------------|
| Font fallback   | `System`                     | `sans-serif`                | Browser default    |
| Neumorphic shadow| Dual shadowColor layers     | `elevation: 6` + gradient   | CSS `box-shadow`   |
| Haptics         | `Haptics.impactAsync`        | `Haptics.impactAsync`       | Skipped            |
| Bottom tab inset| 50px                         | 80px                        | —                  |
| Splash bg       | `#208AEF`                    | `#208AEF`                   | —                  |
| Adaptive icon   | —                            | bg `#E6F4FE`                | —                  |

---

## 12. App Configuration

### 12.1 Splash & Icon

- **Splash background:** `#208AEF` (blue)
- **Splash image:** `./assets/images/splash-icon.png`, width 76px
- **App icon:** `./assets/images/icon.png`
- **Android adaptive icon bg:** `#E6F4FE` (light blue)

### 12.2 Permissions

| Permission                    | Platform  | Purpose                          |
|-------------------------------|-----------|----------------------------------|
| `CAMERA`                      | Android   | Document scan, face liveness     |
| `INTERNET`                    | Android   | API calls                        |
| `ACCESS_NETWORK_STATE`        | Android   | Network detection                |
| `USE_BIOMETRIC`               | Android   | Biometric auth                   |
| `USE_FINGERPRINT`             | Android   | Fingerprint auth                 |
| `NSCameraUsageDescription`    | iOS       | Camera access                    |
| `NSPhotoLibraryUsageDescription` | iOS    | Photo library                    |
| `NSFaceIDUsageDescription`    | iOS       | Face ID                          |

### 12.3 Build Settings

- **iOS deployment target:** 16.4
- **Android minSdkVersion:** 29 (Android 10)
- **Android allowBackup:** false
- **User interface style:** automatic (light/dark)
- **Orientation:** default

---

## 13. File Structure Summary

```
src/
├── constants/
│   ├── theme.ts          ← Design tokens (Colors, Typography, Spacing, etc.)
│   └── documents.ts      ← Document type constants
├── components/
│   ├── layout/
│   │   ├── ScreenContainer.tsx   ← Safe area + scroll wrapper
│   │   ├── ScreenHeader.tsx      ← Centered title header
│   │   └── TopBar.tsx            ← Left-aligned title top bar
│   └── ui/
│       ├── index.ts              ← Barrel export
│       ├── Button.tsx            ← 5 variants
│       ├── NeuButton.tsx         ← Neumorphic button
│       ├── FloatingInput.tsx     ← 56px input with floating label
│       ├── Card.tsx              ← 16px radius card
│       ├── Chip.tsx              ← Selection chip
│       ├── Pill.tsx              ← Status pill
│       ├── Toggle.tsx            ← 44×26 switch
│       ├── Checkbox.tsx          ← 22px consent checkbox
│       ├── OtpRow.tsx            ← 44×52 OTP boxes
│       ├── PinPad.tsx            ← Numeric keypad
│       ├── ProgressTrack.tsx     ← 4px progress bar
│       ├── Stepper.tsx           ← Segmented progress
│       ├── ListItem.tsx          ← 56px list row
│       ├── InfoBanner.tsx        ← Alert banner
│       ├── BottomSheet.tsx       ← Modal bottom sheet
│       ├── Toast.tsx             ← Notification toast
│       ├── ToastProvider.tsx     ← Toast context
│       ├── Skeleton.tsx          ← Loading shimmer
│       ├── EmptyState.tsx        ← Empty placeholder
│       ├── ErrorState.tsx        ← Error placeholder
│       ├── Avatar.tsx            ← Initials avatar
│       ├── AnimatedCard.tsx      ← Press-scale card
│       ├── SectionTitle.tsx      ← Uppercase label
│       ├── AppText.tsx           ← Typography variant text
│       ├── Icon.tsx              ← SVG icon registry
│       ├── iconPaths.tsx         ← 48 SVG path definitions
│       ├── NeuElevatedView.tsx   ← Neumorphic elevated container
│       ├── NeuPitView.tsx        ← Neumorphic inset container
│       └── *.tsx (SVG illustrations)
├── global.css            ← Tailwind base/components/utilities
└── app/
    ├── (tabs)/_layout.tsx        ← Custom bottom tab bar
    └── ... (screen routes)
```

---

## 14. Design Principles

1. **Pixel-perfect mockup matching** — All components are extracted 1:1 from Figma mockups (Truepas-figma/styles.css, FacePe design system).
2. **Dual-layer theming** — Tailwind classes for rapid development + JS tokens for precise control.
3. **Neumorphism on light blue** — Soft UI with `#E6F8FF` base, dual shadows on iOS, elevation on Android.
4. **Accessibility-first** — Every interactive element has `accessibilityRole`, `accessibilityLabel`, and state attributes.
5. **Haptic feedback** — Light impact on all button presses and tab switches.
6. **Smooth animations** — Reanimated springs/timing for all press, sheet, and toast animations.
7. **Platform-aware** — Separate shadow rendering for iOS (dual shadow), Android (elevation), and Web (box-shadow).

---

**Generated with [Devin](https://devin.ai)**
