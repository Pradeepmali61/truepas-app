export const CAR_CLAY_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bodyGrad" x1="120" y1="150" x2="400" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#A78BFA"/>
      <stop offset="1" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="cabinGrad" x1="180" y1="110" x2="340" y2="230" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#C4B5FD"/>
      <stop offset="1" stop-color="#8B5CF6"/>
    </linearGradient>
    <linearGradient id="wheelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4C1D95"/>
      <stop offset="1" stop-color="#2E1065"/>
    </linearGradient>
    <radialGradient id="hubGrad" cx="0.35" cy="0.35" r="0.9">
      <stop offset="0" stop-color="#DDD6FE"/>
      <stop offset="1" stop-color="#A78BFA"/>
    </radialGradient>
    <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <filter id="shadowBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>
  <ellipse cx="256" cy="418" rx="180" ry="26" fill="#2E1065" opacity="0.22" filter="url(#shadowBlur)"/>
  <path d="M96 260 C96 238 112 224 134 220 L160 215 C178 170 214 140 256 140 C298 140 334 170 352 215 L378 220 C400 224 416 238 416 260 L416 300 C416 322 402 336 380 336 L132 336 C110 336 96 322 96 300 Z" fill="url(#bodyGrad)"/>
  <path d="M170 214 C184 178 214 156 246 154 L246 214 Z" fill="url(#cabinGrad)"/>
  <path d="M342 214 C328 178 298 156 266 154 L266 214 Z" fill="url(#cabinGrad)"/>
  <path d="M186 208 C196 184 214 168 234 164" stroke="#EDE9FE" stroke-width="6" stroke-linecap="round" opacity="0.6" fill="none"/>
  <path d="M326 208 C316 184 298 168 282 165" stroke="#EDE9FE" stroke-width="5" stroke-linecap="round" opacity="0.45" fill="none"/>
  <path d="M120 252 C128 236 146 230 166 228" stroke="#DDD6FE" stroke-width="8" stroke-linecap="round" opacity="0.7" fill="none"/>
  <ellipse cx="392" cy="268" rx="12" ry="14" fill="#FDE68A" opacity="0.9"/>
  <ellipse cx="120" cy="268" rx="10" ry="13" fill="#FCA5A5" opacity="0.85"/>
  <rect x="150" y="312" width="212" height="10" rx="5" fill="#5B21B6" opacity="0.35"/>
  <circle cx="158" cy="336" r="52" fill="url(#wheelGrad)"/>
  <circle cx="354" cy="336" r="52" fill="url(#wheelGrad)"/>
  <circle cx="158" cy="336" r="24" fill="url(#hubGrad)"/>
  <circle cx="354" cy="336" r="24" fill="url(#hubGrad)"/>
  <circle cx="158" cy="336" r="8" fill="#7C3AED"/>
  <circle cx="354" cy="336" r="8" fill="#7C3AED"/>
  <path d="M132 306 A46 46 0 0 1 166 292" stroke="#8B5CF6" stroke-width="7" stroke-linecap="round" opacity="0.5" fill="none"/>
  <path d="M328 306 A46 46 0 0 1 362 292" stroke="#8B5CF6" stroke-width="7" stroke-linecap="round" opacity="0.5" fill="none"/>
  <ellipse cx="256" cy="340" rx="150" ry="12" fill="#2E1065" opacity="0.12" filter="url(#softBlur)"/>
</svg>`;
