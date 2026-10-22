import React from 'react';
import { UI } from '../../kit/theme';

const TEAL = '#2f9e9a';
const TEAL_DARK = '#217571';

/** Component-scoped keyframes (index.css belongs to the shared kit). */
const MAILBOX_CSS = `
@keyframes contact-card-in {
  0%   { transform: translate(-70px, -36px) rotate(-14deg); opacity: 0; }
  20%  { opacity: 1; }
  60%  { transform: translate(0, -8px) rotate(0deg); opacity: 1; }
  100% { transform: translate(28px, -8px) rotate(0deg); opacity: 0; }
}
.contact-card-in { animation: contact-card-in 1.1s ease-in-out both; }
@keyframes contact-flag-up {
  0%, 70% { transform: rotate(-90deg); }
  85% { transform: rotate(-12deg); }
  100% { transform: rotate(0deg); }
}
.contact-flag-up { animation: contact-flag-up 1.4s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .contact-card-in { animation: none; opacity: 0; }
  .contact-flag-up { animation: none; }
}
`;

/**
 * The teal yard mailbox. `sentCount` > 0 raises the red flag; changing it replays the
 * "postcard slides into the slot" animation.
 */
export const Mailbox: React.FC<{ sentCount: number; className?: string }> = ({ sentCount, className }) => {
  const flagUp = sentCount > 0;
  return (
    <svg viewBox="0 0 220 200" className={className} role="img" aria-label={flagUp ? 'Teal mailbox with its red flag raised: a postcard is on its way' : 'Teal mailbox waiting for a postcard'}>
      <style>{MAILBOX_CSS}</style>
      <g stroke={UI.ink} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        {/* grass tuft */}
        <ellipse cx="110" cy="190" rx="70" ry="9" fill={UI.meadow} />
        {/* post */}
        <rect x="100" y="112" width="22" height="78" rx="3" fill={UI.wood} />
        <path d="M106 124 L106 180" stroke={UI.woodDark} strokeWidth={2.5} />
        {/* box body */}
        <path d="M44 70 C44 40 64 30 96 30 L166 30 C184 30 190 46 190 70 L190 116 L44 116 Z" fill={TEAL} />
        <path d="M166 30 C184 30 190 46 190 70 L190 116 L166 116 Z" fill={TEAL_DARK} />
        {/* front door */}
        <path d="M44 70 C44 46 54 34 70 32 C84 34 94 46 94 70 L94 116 L44 116 Z" fill="#45b8b3" />
        <circle cx="86" cy="86" r="4" fill={UI.amberLight} strokeWidth={3} />
        {/* slot */}
        <rect x="56" y="62" width="28" height="7" rx="3" fill={UI.ink} />
      </g>

      {/* postcard flying into the slot (re-mounted per send so it replays) */}
      {sentCount > 0 && (
        <g key={sentCount} className="contact-card-in">
          <g transform="translate(56 50)">
            <rect x="0" y="0" width="30" height="18" rx="2" fill={UI.paper} stroke={UI.ink} strokeWidth={2.5} />
            <rect x="21" y="3" width="6" height="7" fill={UI.berry} />
            <path d="M4 6 L16 6 M4 10 L14 10 M4 14 L12 14" stroke={UI.inkSoft} strokeWidth={1.5} />
          </g>
        </g>
      )}

      {/* flag: pivot at (176, 60). Down = lying along the box, up = pointing to the sky */}
      <g
        key={`flag-${sentCount}`}
        className={flagUp ? 'contact-flag-up' : undefined}
        style={{ transformOrigin: '176px 60px', transform: flagUp ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.4s' }}
        stroke={UI.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      >
        <rect x="172" y="10" width="8" height="54" rx="2" fill={UI.berry} />
        <path d="M180 12 L204 12 L204 30 L180 30 Z" fill={UI.berry} />
        <circle cx="176" cy="60" r="4" fill={UI.ink} />
      </g>
    </svg>
  );
};
