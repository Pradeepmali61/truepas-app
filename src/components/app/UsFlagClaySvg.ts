export const USFLAG_CLAY_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="flagRed" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E85A50"/>
      <stop offset="100%" stop-color="#B22234"/>
    </linearGradient>
    <linearGradient id="flagWhite" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E8E4DC"/>
    </linearGradient>
    <linearGradient id="flagBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5A6AB0"/>
      <stop offset="100%" stop-color="#3C3B6E"/>
    </linearGradient>
    <radialGradient id="flagGloss" cx="30%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="flagShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
    <filter id="flagSoft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
    <clipPath id="flagClip">
      <rect x="76" y="106" width="360" height="300" rx="24"/>
    </clipPath>
  </defs>

  <!-- Ground shadow -->
  <ellipse cx="256" cy="428" rx="170" ry="22" fill="#1a1a2e" opacity="0.25" filter="url(#flagShadow)"/>

  <!-- Flag base (rounded card) -->
  <rect x="76" y="106" width="360" height="300" rx="24" fill="#B22234"/>

  <g clip-path="url(#flagClip)">
    <!-- White stripes -->
    <rect x="76" y="152" width="360" height="23" fill="url(#flagWhite)"/>
    <rect x="76" y="198" width="360" height="23" fill="url(#flagWhite)"/>
    <rect x="76" y="244" width="360" height="23" fill="url(#flagWhite)"/>
    <rect x="76" y="290" width="360" height="23" fill="url(#flagWhite)"/>
    <rect x="76" y="336" width="360" height="23" fill="url(#flagWhite)"/>
    <rect x="76" y="382" width="360" height="24" fill="url(#flagWhite)"/>

    <!-- Red stripe shading for clay depth -->
    <rect x="76" y="106" width="360" height="23" fill="url(#flagRed)"/>
    <rect x="76" y="129" width="360" height="23" fill="url(#flagRed)"/>
    <rect x="76" y="175" width="360" height="23" fill="url(#flagRed)"/>
    <rect x="76" y="221" width="360" height="23" fill="url(#flagRed)"/>
    <rect x="76" y="267" width="360" height="23" fill="url(#flagRed)"/>
    <rect x="76" y="313" width="360" height="23" fill="url(#flagRed)"/>
    <rect x="76" y="359" width="360" height="23" fill="url(#flagRed)"/>

    <!-- Blue canton -->
    <rect x="76" y="106" width="150" height="161" rx="0" fill="url(#flagBlue)"/>
    <rect x="76" y="106" width="150" height="161" fill="none" stroke="#2a2950" stroke-width="1" opacity="0.3"/>

    <!-- Stars (simplified clay dots) -->
    <g fill="#FFFFFF" opacity="0.95">
      <circle cx="95" cy="126" r="5"/><circle cx="120" cy="126" r="5"/><circle cx="145" cy="126" r="5"/><circle cx="170" cy="126" r="5"/><circle cx="195" cy="126" r="5"/><circle cx="215" cy="126" r="5"/>
      <circle cx="107" cy="144" r="5"/><circle cx="132" cy="144" r="5"/><circle cx="157" cy="144" r="5"/><circle cx="182" cy="144" r="5"/><circle cx="207" cy="144" r="5"/>
      <circle cx="95" cy="162" r="5"/><circle cx="120" cy="162" r="5"/><circle cx="145" cy="162" r="5"/><circle cx="170" cy="162" r="5"/><circle cx="195" cy="162" r="5"/><circle cx="215" cy="162" r="5"/>
      <circle cx="107" cy="180" r="5"/><circle cx="132" cy="180" r="5"/><circle cx="157" cy="180" r="5"/><circle cx="182" cy="180" r="5"/><circle cx="207" cy="180" r="5"/>
      <circle cx="95" cy="198" r="5"/><circle cx="120" cy="198" r="5"/><circle cx="145" cy="198" r="5"/><circle cx="170" cy="198" r="5"/><circle cx="195" cy="198" r="5"/><circle cx="215" cy="198" r="5"/>
      <circle cx="107" cy="216" r="5"/><circle cx="132" cy="216" r="5"/><circle cx="157" cy="216" r="5"/><circle cx="182" cy="216" r="5"/><circle cx="207" cy="216" r="5"/>
      <circle cx="95" cy="234" r="5"/><circle cx="120" cy="234" r="5"/><circle cx="145" cy="234" r="5"/><circle cx="170" cy="234" r="5"/><circle cx="195" cy="234" r="5"/><circle cx="215" cy="234" r="5"/>
      <circle cx="107" cy="252" r="5"/><circle cx="132" cy="252" r="5"/><circle cx="157" cy="252" r="5"/><circle cx="182" cy="252" r="5"/><circle cx="207" cy="252" r="5"/>
      <circle cx="95" cy="262" r="5"/><circle cx="120" cy="262" r="5"/><circle cx="145" cy="262" r="5"/><circle cx="170" cy="262" r="5"/><circle cx="195" cy="262" r="5"/>
    </g>

    <!-- Star highlights for clay shine -->
    <g fill="#FFFFFF" opacity="0.6" filter="url(#flagSoft)">
      <circle cx="93" cy="124" r="2"/><circle cx="118" cy="124" r="2"/><circle cx="143" cy="124" r="2"/>
      <circle cx="93" cy="160" r="2"/><circle cx="118" cy="160" r="2"/><circle cx="143" cy="160" r="2"/>
      <circle cx="93" cy="196" r="2"/><circle cx="118" cy="196" r="2"/><circle cx="143" cy="196" r="2"/>
      <circle cx="93" cy="232" r="2"/><circle cx="118" cy="232" r="2"/><circle cx="143" cy="232" r="2"/>
    </g>

    <!-- Wave effect: subtle curves on stripes -->
    <path d="M76 120 Q256 100 436 120" stroke="#ffffff" stroke-width="2" opacity="0.15" fill="none"/>
    <path d="M76 165 Q256 148 436 165" stroke="#ffffff" stroke-width="2" opacity="0.1" fill="none"/>
    <path d="M76 210 Q256 195 436 210" stroke="#ffffff" stroke-width="2" opacity="0.1" fill="none"/>
    <path d="M76 255 Q256 242 436 255" stroke="#ffffff" stroke-width="2" opacity="0.08" fill="none"/>
  </g>

  <!-- Flag border highlight -->
  <rect x="76" y="106" width="360" height="300" rx="24" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.2"/>

  <!-- Top-left gloss -->
  <ellipse cx="180" cy="150" rx="100" ry="40" fill="url(#flagGloss)" transform="rotate(-20 180 150)" opacity="0.5"/>
  <ellipse cx="140" cy="125" rx="35" ry="14" fill="#ffffff" opacity="0.35" filter="url(#flagSoft)" transform="rotate(-20 140 125)"/>

  <!-- Bottom-right shade -->
  <ellipse cx="380" cy="380" rx="120" ry="50" fill="#1a1a2e" opacity="0.1" filter="url(#flagSoft)"/>
</svg>`;
