export const GLOBE_CLAY_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glSphere" cx="32%" cy="24%" r="85%">
      <stop offset="0%" stop-color="#B794F6"/>
      <stop offset="35%" stop-color="#8B5CF6"/>
      <stop offset="70%" stop-color="#6D28D9"/>
      <stop offset="100%" stop-color="#4C1D95"/>
    </radialGradient>
    <linearGradient id="glGrid" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#DDD0FB"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
    <linearGradient id="glHl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity=".2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glGloss" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glShade" cx="78%" cy="82%" r="70%">
      <stop offset="0%" stop-color="#2E1065" stop-opacity=".5"/>
      <stop offset="100%" stop-color="#2E1065" stop-opacity="0"/>
    </radialGradient>
    <filter id="glShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="glSoft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <clipPath id="glClip"><circle cx="256" cy="246" r="200"/></clipPath>
  </defs>

  <!-- Ground shadow -->
  <ellipse cx="256" cy="448" rx="165" ry="24" fill="#2E1065" opacity="0.3" filter="url(#glShadow)"/>

  <!-- Sphere -->
  <circle cx="256" cy="246" r="200" fill="url(#glSphere)"/>
  <circle cx="256" cy="246" r="186" fill="#7C3AED" opacity=".25"/>

  <g clip-path="url(#glClip)">
    <!-- Recessed segments (darker cells) -->
    <g fill="#5B21B6" opacity=".45">
      <!-- Top wedges -->
      <path d="M236 150 L276 150 L268 108 C260 92 252 92 244 108 Z"/>
      <path d="M112 158 C132 112 166 86 202 74 L210 158 Z"/>
      <path d="M302 158 L310 74 C346 86 380 112 400 158 Z"/>
      <!-- Row 1 -->
      <rect x="228" y="166" width="56" height="92" rx="22"/>
      <rect x="118" y="166" width="92" height="92" rx="22"/>
      <rect x="302" y="166" width="92" height="92" rx="22"/>
      <!-- Row 2 -->
      <rect x="228" y="274" width="56" height="92" rx="22"/>
      <rect x="118" y="274" width="92" height="92" rx="22"/>
      <rect x="302" y="274" width="92" height="92" rx="22"/>
      <!-- Bottom wedges -->
      <path d="M236 382 L276 382 L268 430 C260 444 252 444 244 430 Z"/>
      <path d="M112 382 L210 382 L198 436 C164 424 132 406 112 382 Z"/>
      <path d="M302 382 L400 382 C380 406 348 424 314 436 Z"/>
    </g>

    <!-- Cell inner top glow -->
    <g fill="#C4B5FD" opacity=".3" filter="url(#glSoft)">
      <ellipse cx="256" cy="174" rx="18" ry="6"/>
      <ellipse cx="164" cy="174" rx="28" ry="6"/>
      <ellipse cx="348" cy="174" rx="28" ry="6"/>
      <ellipse cx="256" cy="282" rx="18" ry="6"/>
      <ellipse cx="164" cy="282" rx="28" ry="6"/>
      <ellipse cx="348" cy="282" rx="28" ry="6"/>
    </g>

    <!-- Raised clay grid -->
    <g fill="none" stroke="url(#glGrid)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
      <path d="M219 92 L219 432"/>
      <path d="M293 92 L293 432"/>
      <path d="M98 162 L414 162"/>
      <path d="M98 270 L414 270"/>
      <path d="M98 378 L414 378"/>
    </g>

    <!-- Grid bevel highlights -->
    <g fill="none" stroke="url(#glHl)" stroke-width="6" stroke-linecap="round" opacity=".9" transform="translate(-2 -3)">
      <path d="M219 96 L219 428"/>
      <path d="M293 96 L293 428"/>
      <path d="M102 162 L410 162"/>
      <path d="M102 270 L410 270"/>
      <path d="M102 378 L410 378"/>
    </g>

    <!-- Specular blobs at junctions -->
    <g fill="url(#glGloss)" opacity=".8" filter="url(#glSoft)">
      <circle cx="219" cy="162" r="12"/>
      <circle cx="293" cy="162" r="12"/>
      <circle cx="219" cy="270" r="12"/>
      <circle cx="293" cy="270" r="12"/>
      <circle cx="219" cy="378" r="10"/>
      <circle cx="293" cy="378" r="10"/>
    </g>

    <!-- Bottom-right ambient shade -->
    <circle cx="256" cy="246" r="200" fill="url(#glShade)"/>
  </g>

  <!-- Top-left studio gloss -->
  <ellipse cx="182" cy="122" rx="84" ry="38" fill="url(#glGloss)" transform="rotate(-25 182 122)" opacity=".6"/>
  <ellipse cx="148" cy="98" rx="28" ry="12" fill="#ffffff" opacity=".5" filter="url(#glSoft)" transform="rotate(-25 148 98)"/>

  <!-- Outer rim -->
  <circle cx="256" cy="246" r="200" fill="none" stroke="#8B5CF6" stroke-width="7" opacity=".6"/>
  <circle cx="256" cy="246" r="200" fill="none" stroke="#ffffff" stroke-width="3" opacity=".25"/>
</svg>`;
