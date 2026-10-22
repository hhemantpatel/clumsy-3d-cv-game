import React from 'react';

/** Tiny toon-style drone badge (ink outline, warm wood + amber) for the garden console title bar. */
export const DroneIcon: React.FC<{ className?: string; spinning?: boolean }> = ({ className = 'w-7 h-7', spinning }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
    {/* rotor arms */}
    <path d="M7 10 L13 15 M25 10 L19 15" stroke="#2b1d16" strokeWidth="2.5" strokeLinecap="round" />
    {/* rotors */}
    <g className={spinning ? 'game-wiggle' : undefined} style={{ transformOrigin: '16px 9px' }}>
      <ellipse cx="7" cy="8.5" rx="5.5" ry="1.8" fill="#fde68a" stroke="#2b1d16" strokeWidth="2" />
      <ellipse cx="25" cy="8.5" rx="5.5" ry="1.8" fill="#fde68a" stroke="#2b1d16" strokeWidth="2" />
    </g>
    {/* body */}
    <rect x="9" y="13" width="14" height="10" rx="4" fill="#d97706" stroke="#2b1d16" strokeWidth="2.5" />
    {/* eye visor */}
    <rect x="12" y="16" width="8" height="4" rx="2" fill="#fffaf0" stroke="#2b1d16" strokeWidth="1.5" />
    <circle cx="16" cy="18" r="1.2" fill="#2b1d16" />
    {/* little legs */}
    <path d="M12 23 L11 27 M20 23 L21 27" stroke="#2b1d16" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
