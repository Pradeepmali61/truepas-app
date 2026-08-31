export const PASSPORT_CLAY_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ppCover" x1="100" y1="80" x2="360" y2="440" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#475569"/>
      <stop offset="0.5" stop-color="#334155"/>
      <stop offset="1" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="ppDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#334155"/>
      <stop offset="1" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="ppGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FDE68A"/>
      <stop offset="0.5" stop-color="#FBBF24"/>
      <stop offset="1" stop-color="#D97706"/>
    </linearGradient>
    <radialGradient id="ppShine" cx="0.35" cy="0.25" r="0.45">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ppGlobe" cx="0.45" cy="0.35" r="0.65">
      <stop offset="0" stop-color="#FCD34D"/>
      <stop offset="0.5" stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#B45309"/>
    </radialGradient>
    <filter id="ppShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
    <filter id="ppSoft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
  </defs>

  <!-- Ground shadow -->
  <ellipse cx="280" cy="440" rx="150" ry="24" fill="#0F172A" opacity="0.35" filter="url(#ppShadow)"/>

  <!-- Passport back/back pages (right side edge) -->
  <path d="M158 116 L142 116 L142 400 L158 400 Z" fill="#1E293B" opacity="0.6"/>

  <!-- Passport cover -->
  <rect x="152" y="96" width="228" height="324" rx="22" fill="url(#ppCover)"/>
  <rect x="158" y="102" width="216" height="312" rx="18" fill="none" stroke="#64748B" stroke-width="2" opacity="0.3"/>

  <!-- Cover bevel -->
  <rect x="152" y="96" width="228" height="324" rx="22" fill="none" stroke="#64748B" stroke-width="4" opacity="0.2"/>

  <!-- PASSPORT text -->
  <text x="266" y="132" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#F8FAFC" text-anchor="middle" opacity="0.95">PASSPORT</text>
  <text x="266" y="132" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#F8FAFC" text-anchor="middle" transform="translate(-2 -2)" opacity="0.4" filter="url(#ppSoft)">PASSPORT</text>

  <!-- Decorative eagles/circles (clay embossed dots) -->
  <circle cx="178" cy="182" r="14" fill="#475569" opacity="0.7"/>
  <circle cx="178" cy="182" r="10" fill="#334155" opacity="0.5"/>
  <circle cx="178" cy="182" r="4" fill="#94A3B8" opacity="0.3"/>
  <circle cx="354" cy="182" r="14" fill="#475569" opacity="0.7"/>
  <circle cx="354" cy="182" r="10" fill="#334155" opacity="0.5"/>
  <circle cx="354" cy="182" r="4" fill="#94A3B8" opacity="0.3"/>
  <circle cx="178" cy="348" r="14" fill="#475569" opacity="0.7"/>
  <circle cx="178" cy="348" r="10" fill="#334155" opacity="0.5"/>
  <circle cx="354" cy="348" r="14" fill="#475569" opacity="0.7"/>
  <circle cx="354" cy="348" r="10" fill="#334155" opacity="0.5"/>

  <!-- Globe -->
  <circle cx="266" cy="230" r="78" fill="url(#ppGlobe)"/>
  <circle cx="266" cy="230" r="70" fill="#F59E0B" opacity="0.2"/>

  <!-- Globe grid (raised gold) -->
  <g fill="none" stroke="#FDE68A" stroke-width="9" stroke-linecap="round" opacity="0.9">
    <ellipse cx="266" cy="230" rx="24" ry="78"/>
    <ellipse cx="266" cy="230" rx="54" ry="78"/>
    <ellipse cx="266" cy="230" rx="78" ry="26"/>
    <ellipse cx="266" cy="230" rx="78" ry="54"/>
  </g>

  <!-- Globe grid shadows -->
  <g fill="none" stroke="#B45309" stroke-width="5" stroke-linecap="round" opacity="0.2" transform="translate(1 1)">
    <ellipse cx="266" cy="230" rx="24" ry="78"/>
    <ellipse cx="266" cy="230" rx="54" ry="78"/>
    <ellipse cx="266" cy="230" rx="78" ry="26"/>
    <ellipse cx="266" cy="230" rx="78" ry="54"/>
  </g>

  <!-- Globe highlight -->
  <ellipse cx="238" cy="198" rx="30" ry="20" fill="#FFFFFF" opacity="0.45" filter="url(#ppSoft)" transform="rotate(-25 238 198)"/>

  <!-- Bottom lines on passport -->
  <rect x="178" y="316" width="176" height="18" rx="9" fill="#F8FAFC" opacity="0.92"/>
  <rect x="178" y="342" width="176" height="18" rx="9" fill="#F8FAFC" opacity="0.92"/>
  <rect x="178" y="316" width="176" height="18" rx="9" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.5" transform="translate(-1 -1)"/>
  <rect x="178" y="342" width="176" height="18" rx="9" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.5" transform="translate(-1 -1)"/>

  <!-- Top-left glossy clay highlight on cover -->
  <ellipse cx="208" cy="150" rx="70" ry="40" fill="url(#ppShine)" transform="rotate(-20 208 150)" opacity="0.55"/>

  <!-- Right edge pages (white) -->
  <rect x="372" y="108" width="10" height="300" rx="4" fill="#F8FAFC" opacity="0.85"/>
  <rect x="380" y="112" width="10" height="292" rx="4" fill="#E2E8F0" opacity="0.85"/>

  <!-- Bottom-right ambient shade -->
  <ellipse cx="330" cy="380" rx="80" ry="30" fill="#0F172A" opacity="0.15" filter="url(#ppSoft)"/>
</svg>`;
