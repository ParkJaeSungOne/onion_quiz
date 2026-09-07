import fs from 'fs';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Clean Background Circle -->
  <circle cx="250" cy="250" r="236" fill="#FFF9E6" stroke="#1A1A1A" stroke-width="12"/>

  <!-- Subtle Pastel Inner Ring -->
  <circle cx="250" cy="250" r="220" fill="#FFFDF5"/>

  <!-- Character Group with Shadow -->
  <g filter="url(#shadow)">
    <!-- Little Feet -->
    <ellipse cx="215" cy="385" rx="22" ry="14" fill="#FFD166" stroke="#1A1A1A" stroke-width="8"/>
    <ellipse cx="285" cy="385" rx="22" ry="14" fill="#FFD166" stroke="#1A1A1A" stroke-width="8"/>

    <!-- Cute Chubby Locker Body (Anthropomorphic) -->
    <rect x="160" y="140" width="180" height="230" rx="36" fill="#FFEAA7" stroke="#1A1A1A" stroke-width="9"/>

    <!-- Locker Roof / Cap Curve -->
    <path d="M 160 180 Q 250 135 340 180" fill="none" stroke="#1A1A1A" stroke-width="8" stroke-linecap="round"/>

    <!-- Air Vents (Locker Grill) -->
    <line x1="220" y1="175" x2="280" y2="175" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round"/>
    <line x1="225" y1="188" x2="275" y2="188" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round"/>

    <!-- Left Arm holding Golden Key -->
    <path d="M 160 270 Q 110 260 115 210" fill="none" stroke="#1A1A1A" stroke-width="9" stroke-linecap="round"/>
    <circle cx="115" cy="210" r="14" fill="#FFEAA7" stroke="#1A1A1A" stroke-width="8"/>

    <!-- Golden Key (Retro Key) -->
    <g transform="translate(100, 140)">
      <!-- Key Ring -->
      <circle cx="15" cy="25" r="18" fill="#FFD166" stroke="#1A1A1A" stroke-width="7"/>
      <circle cx="15" cy="25" r="7" fill="#FFFDF5" stroke="#1A1A1A" stroke-width="6"/>
      <!-- Key Shaft -->
      <line x1="15" y1="43" x2="15" y2="90" stroke="#1A1A1A" stroke-width="8" stroke-linecap="round"/>
      <path d="M 15 70 L 28 70 M 15 82 L 25 82" stroke="#1A1A1A" stroke-width="7" stroke-linecap="round"/>
    </g>

    <!-- Right Arm (Cute wave / resting on side) -->
    <path d="M 340 270 Q 380 280 375 315" fill="none" stroke="#1A1A1A" stroke-width="9" stroke-linecap="round"/>
    <circle cx="375" cy="315" r="14" fill="#FFEAA7" stroke="#1A1A1A" stroke-width="8"/>

    <!-- Funny Quirky Meme Face (Deadpan / Quirky Hip Look) -->
    <!-- Two Simple Black Dot Eyes -->
    <circle cx="215" cy="235" r="8" fill="#1A1A1A"/>
    <circle cx="285" cy="235" r="8" fill="#1A1A1A"/>

    <!-- Rosy Cheek Blushes -->
    <ellipse cx="195" cy="250" rx="14" ry="8" fill="#FF7675" opacity="0.8"/>
    <ellipse cx="305" cy="250" rx="14" ry="8" fill="#FF7675" opacity="0.8"/>

    <!-- Cute Simple Smirk / Line Mouth -->
    <path d="M 242 245 Q 250 252 258 245" fill="none" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round"/>

    <!-- Open Belly Hatch (The Secret Pick Locker) -->
    <rect x="200" y="275" width="100" height="80" rx="12" fill="#FD79A8" stroke="#1A1A1A" stroke-width="8"/>

    <!-- Open Door Flap -->
    <path d="M 200 275 L 165 290 L 165 370 L 200 355 Z" fill="#FDCB6E" stroke="#1A1A1A" stroke-width="7"/>

    <!-- Glowing Secret Heart / Star Item Inside -->
    <path d="M 250 300 C 250 295, 238 288, 232 298 C 224 310, 250 330, 250 330 C 250 330, 276 310, 268 298 C 262 288, 250 295, 250 300 Z" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="5"/>
    
    <!-- Sparkle Stars -->
    <path d="M 220 295 L 223 302 L 230 305 L 223 308 L 220 315 L 217 308 L 210 305 L 217 302 Z" fill="#FFFA65" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 278 320 L 280 325 L 285 327 L 280 329 L 278 334 L 276 329 L 271 327 L 276 325 Z" fill="#FFFA65" stroke="#1A1A1A" stroke-width="2"/>
  </g>

  <!-- Hip Brand Label Tag at Bottom -->
  <g transform="translate(250, 440)">
    <rect x="-95" y="-18" width="190" height="36" rx="18" fill="#1A1A1A"/>
    <text x="0" y="6" font-family="'Helvetica Neue', 'Arial', sans-serif" font-weight="900" font-size="15" fill="#FFEAA7" text-anchor="middle" letter-spacing="1">PICKMYCABINET</text>
  </g>
</svg>`;

fs.writeFileSync('public/pickmycabinet/profile_hip_korean_vector_mascot.svg', svgContent);
console.log('Saved SVG mascot!');
