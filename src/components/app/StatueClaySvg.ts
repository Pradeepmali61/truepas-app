export const STATUE_CLAY_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="stBody" x1="140" y1="60" x2="380" y2="440" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7BD09F"/>
      <stop offset="0.5" stop-color="#4BAF7A"/>
      <stop offset="1" stop-color="#2E8B62"/>
    </linearGradient>
    <linearGradient id="stDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3D9E70"/>
      <stop offset="1" stop-color="#1F6B4A"/>
    </linearGradient>
    <linearGradient id="stFlame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FDE68A"/>
      <stop offset="0.5" stop-color="#FBBF24"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
    <radialGradient id="stGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FEF3C7" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="#FBBF24" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="stShine" cx="0.35" cy="0.25" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="stShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="stSoft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <!-- Ground shadow -->
  <ellipse cx="256" cy="430" rx="160" ry="24" fill="#1F6B4A" opacity="0.25" filter="url(#stShadow)"/>

  <!-- Shoulders / base of bust -->
  <path d="M146 430 C150 380 190 340 226 330 L286 330 C322 340 362 380 366 430 Z" fill="url(#stDark)"/>

  <!-- Neck -->
  <rect x="232" y="300" width="48" height="45" rx="14" fill="url(#stBody)"/>

  <!-- Head -->
  <ellipse cx="256" cy="238" rx="62" ry="70" fill="url(#stBody)"/>

  <!-- Face shading -->
  <ellipse cx="240" cy="252" rx="14" ry="20" fill="#1F6B4A" opacity="0.18" filter="url(#stSoft)"/>
  <ellipse cx="272" cy="252" rx="14" ry="20" fill="#1F6B4A" opacity="0.18" filter="url(#stSoft)"/>

  <!-- Eyes -->
  <ellipse cx="236" cy="238" rx="8" ry="5" fill="#1F6B4A" opacity="0.55"/>
  <ellipse cx="276" cy="238" rx="8" ry="5" fill="#1F6B4A" opacity="0.55"/>

  <!-- Nose -->
  <path d="M256 244 L250 266 Q256 271 262 266 Z" fill="#2E8B62" opacity="0.6"/>

  <!-- Mouth -->
  <path d="M240 284 Q256 292 272 284" stroke="#1F6B4A" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.5"/>

  <!-- Hair / crown base -->
  <path d="M196 220 C192 180 216 150 256 148 C296 150 320 180 316 220 C310 200 300 188 290 184 C296 176 290 166 282 170 C276 158 264 154 256 158 C248 154 236 158 230 170 C222 166 216 176 222 184 C212 188 202 200 196 220 Z" fill="url(#stDark)"/>

  <!-- Crown band -->
  <path d="M204 178 Q256 152 308 178 L308 190 Q256 164 204 190 Z" fill="#2E8B62"/>

  <!-- Crown spikes -->
  <g fill="url(#stBody)">
    <path d="M212 176 L196 118 L222 166 Z"/>
    <path d="M232 166 L228 98 L244 162 Z"/>
    <path d="M256 162 L256 88 L256 162 Z"/>
    <path d="M280 166 L284 98 L268 162 Z"/>
    <path d="M300 176 L316 118 L290 166 Z"/>
    <path d="M200 190 L172 148 L206 180 Z"/>
    <path d="M312 190 L340 148 L306 180 Z"/>
  </g>

  <!-- Spike highlights -->
  <g stroke="#A8E6C4" stroke-width="3" stroke-linecap="round" opacity="0.6" fill="none">
    <path d="M200 132 L208 158"/>
    <path d="M231 112 L236 150"/>
    <path d="M256 100 L256 150"/>
    <path d="M281 112 L276 150"/>
    <path d="M312 132 L304 158"/>
  </g>

  <!-- Raised arm (right side, bent up) -->
  <path d="M350 400 C352 360 360 320 372 285 C378 268 386 254 394 244" stroke="url(#stBody)" stroke-width="38" stroke-linecap="round" fill="none"/>
  <path d="M394 244 C398 236 402 224 404 210" stroke="url(#stBody)" stroke-width="30" stroke-linecap="round" fill="none"/>

  <!-- Arm shading -->
  <path d="M362 395 C366 350 374 310 386 278" stroke="#1F6B4A" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.25"/>

  <!-- Torch handle -->
  <rect x="392" y="168" width="22" height="52" rx="10" fill="url(#stDark)"/>
  <rect x="386" y="158" width="34" height="18" rx="9" fill="url(#stBody)"/>

  <!-- Torch glow -->
  <circle cx="403" cy="132" r="44" fill="url(#stGlow)"/>

  <!-- Torch flame -->
  <path d="M403 92 C388 112 388 134 403 152 C418 134 418 112 403 92 Z" fill="url(#stFlame)"/>
  <path d="M403 106 C395 118 395 132 403 142 C411 132 411 118 403 106 Z" fill="#FEF3C7" opacity="0.85"/>

  <!-- Flame highlight -->
  <ellipse cx="398" cy="112" rx="5" ry="10" fill="#FFFFFF" opacity="0.6" filter="url(#stSoft)"/>

  <!-- Face shine -->
  <ellipse cx="228" cy="200" rx="22" ry="30" fill="url(#stShine)"/>
  <ellipse cx="222" cy="188" rx="8" ry="12" fill="#FFFFFF" opacity="0.35" filter="url(#stSoft)"/>

  <!-- Ambient occlusion at base -->
  <ellipse cx="256" cy="428" rx="110" ry="8" fill="#1F6B4A" opacity="0.15" filter="url(#stSoft)"/>
</svg>`;
