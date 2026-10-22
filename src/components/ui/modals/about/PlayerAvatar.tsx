import React from 'react';
import { UI } from '../../kit/theme';

const SKIN = '#e8b48c';
const BEANIE = '#e8742f';
const BEANIE_DARK = '#c45a1c';
const HOODIE = '#4f46a5';
const HOODIE_DARK = '#3b3486';
const HAIR = '#3a2418';

/** Toon-style portrait of the player character: orange beanie + pom-pom, round glasses, indigo hoodie. */
export const PlayerAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Illustrated portrait of Hemant: orange beanie, round glasses and an indigo hoodie">
    <g stroke={UI.ink} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
      {/* Hoodie body */}
      <path d="M34 200 C36 160 60 140 100 140 C140 140 164 160 166 200 Z" fill={HOODIE} />
      {/* Hood collar */}
      <path d="M62 146 C72 164 128 164 138 146 C130 140 70 140 62 146 Z" fill={HOODIE_DARK} />
      {/* Drawstrings */}
      <path d="M88 158 L86 184" fill="none" strokeWidth={3} />
      <path d="M112 158 L114 184" fill="none" strokeWidth={3} />
      <circle cx="86" cy="187" r="3.5" fill={UI.paper} strokeWidth={2.5} />
      <circle cx="114" cy="187" r="3.5" fill={UI.paper} strokeWidth={2.5} />
      {/* Neck */}
      <path d="M86 128 L86 146 C92 152 108 152 114 146 L114 128 Z" fill={SKIN} />
      {/* Ears */}
      <ellipse cx="52" cy="98" rx="10" ry="13" fill={SKIN} />
      <ellipse cx="148" cy="98" rx="10" ry="13" fill={SKIN} />
      {/* Head */}
      <path d="M54 82 C54 50 146 50 146 82 L146 104 C146 132 126 144 100 144 C74 144 54 132 54 104 Z" fill={SKIN} />
      {/* Hair peeking out */}
      <path d="M56 78 C64 92 76 84 82 78 C88 88 104 86 110 78 C118 88 134 90 144 78 L144 70 L56 70 Z" fill={HAIR} />
      {/* Beanie */}
      <path d="M50 74 C48 26 152 26 150 74 Z" fill={BEANIE} />
      <rect x="44" y="64" width="112" height="20" rx="9" fill={BEANIE_DARK} />
      <path d="M62 66 L62 82 M78 66 L78 82 M94 66 L94 82 M110 66 L110 82 M126 66 L126 82 M142 66 L142 82" stroke={UI.ink} strokeOpacity={0.35} strokeWidth={2.5} />
      <path d="M78 36 C84 48 86 56 86 64 M118 34 C114 46 112 56 112 64" fill="none" stroke={UI.ink} strokeOpacity={0.3} strokeWidth={2.5} />
      {/* Pom-pom */}
      <circle cx="100" cy="22" r="14" fill={UI.amberLight} />
      {/* Glasses */}
      <circle cx="80" cy="104" r="14" fill="#ffffff" fillOpacity={0.55} />
      <circle cx="120" cy="104" r="14" fill="#ffffff" fillOpacity={0.55} />
      <path d="M94 104 C97 100 103 100 106 104" fill="none" />
      <path d="M66 102 L56 98 M134 102 L144 98" fill="none" strokeWidth={3} />
    </g>
    {/* Eyes, cheeks, smile */}
    <circle cx="81" cy="105" r="4" fill={UI.ink} />
    <circle cx="121" cy="105" r="4" fill={UI.ink} />
    <circle cx="82.5" cy="103.5" r="1.3" fill="#fff" />
    <circle cx="122.5" cy="103.5" r="1.3" fill="#fff" />
    <ellipse cx="70" cy="124" rx="7" ry="4" fill="#e5806b" opacity={0.55} />
    <ellipse cx="130" cy="124" rx="7" ry="4" fill="#e5806b" opacity={0.55} />
    <path d="M90 126 C95 133 105 133 110 126" fill="none" stroke={UI.ink} strokeWidth={4} strokeLinecap="round" />
  </svg>
);
