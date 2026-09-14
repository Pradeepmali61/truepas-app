/**
 * GFF reference design tokens — reverse-engineered from the 5 demo screenshots
 * (assets/images/demo-screens/*, 720×1600 px ≈ 360×800 dp @2x).
 *
 * Separate from theme.ts (Truepas brand) — this is the reference design system
 * for the demo screens (sign-in, OTP, event home). Values measured from the
 * screenshots; [ESTIMATED] items are marked in DESIGN_SYSTEM_GFF_REPORT.md.
 */

export const GfColors = {
  // Primary — indigo used by active segment, filled OTP boxes, links
  primary: '#4F46E5', // [ESTIMATED] indigo-600
  primaryDeep: '#4338CA', // indigo-700 — filled OTP boxes / active segment
  primarySoft: '#EEF2FF', // "Resend OTP" pill background
  // Button gradient (Get OTP / Verify OTP), left → right
  primaryGradient: ['#4A7DF0', '#4F46E5'] as const, // [ESTIMATED]

  // Surfaces
  bg: '#FFFFFF',
  bgTinted: '#F7F5FF', // event home lower background wash [ESTIMATED]
  card: '#FFFFFF',
  fieldBg: '#F1F2F6', // inactive segment + empty OTP boxes
  inputBg: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderFocused: '#4338CA',

  // Text
  textPrimary: '#0A0A0F',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  placeholder: '#9CA3AF',

  // States
  disabledBg: '#D1D5DB',
  disabledText: '#9CA3AF',
  danger: '#EF4444', // notification dot

  // Bottom tabs
  tabActive: '#4F46E5',
  tabInactive: '#9CA3AF',
} as const;

export const GfGradients = {
  /** Primary CTA — horizontal, light blue → indigo. */
  button: ['#4A7DF0', '#4F46E5'] as const, // [ESTIMATED]
  /** Event home page wash — white → faint lavender. */
  page: ['#FFFFFF', '#F3F1FE'] as const, // [ESTIMATED]
};

export const GfRadius = {
  input: 12, // country selector, phone field
  segment: 14, // segmented control outer
  segmentInner: 10, // active segment inset
  otp: 10,
  button: 14,
  card: 16, // menu cards
  pill: 999, // Need Help? / Resend OTP
} as const;

export const GfTypography = {
  // "Sign in to your account" / "Let's Verify" — 2-line centered display
  display: { size: 32, weight: '800' as const, lineHeight: 38 }, // [ESTIMATED weight 800]
  screenSubtitle: { size: 15, weight: '400' as const },
  helper: { size: 14, weight: '400' as const },
  terms: { size: 14, weight: '400' as const },
  button: { size: 18, weight: '700' as const },
  otpDigit: { size: 28, weight: '700' as const },
  resendLabel: { size: 16, weight: '500' as const },
  sectionHeader: { size: 22, weight: '700' as const }, // "Discover GFF 2026"
  menuItem: { size: 17, weight: '600' as const },
  tabLabel: { size: 12, weight: '500' as const },
  help: { size: 14, weight: '600' as const },
} as const;

export const GfSpacing = {
  screenX: 24, // horizontal screen padding
  sectionGap: 32, // between "Discover" and "Getting Around"
  cardGap: 12, // vertical gap between menu cards
  fieldGap: 16, // between input rows
  otpGap: 10, // between OTP boxes
  iconTextGap: 16, // menu icon → label
} as const;

export const GfLayout = {
  inputHeight: 56,
  buttonHeight: 56,
  segmentHeight: 52,
  otpBox: { width: 44, height: 56 },
  menuCardHeight: 64,
  tabBarHeight: 64,
  countryCodeWidth: 96,
} as const;

export const GfElevation = {
  card: {
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  helpPill: {
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
} as const;

export const GfFontFamily = {
  // Rounded geometric sans in the screenshots — closest match; verify against
  // the real brand font before shipping. [ASSUMPTION]
  bold: 'Gilroy-Bold',
  semibold: 'Gilroy-SemiBold',
  medium: 'Gilroy-Medium',
  regular: 'Gilroy-Regular',
  fallback: 'System',
} as const;
