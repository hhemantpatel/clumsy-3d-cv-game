import React from 'react';
import { MAX_PIPS, levelToPips, skillEvidence, skillGlyph, tierFor } from './skillMeta';

export const Pips: React.FC<{ filled: number; color: string; size?: 'sm' | 'md' }> = ({ filled, color, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
  return (
    <span aria-hidden className="inline-flex items-center gap-[3px]">
      {Array.from({ length: MAX_PIPS }, (_, i) => (
        <span
          key={i}
          className={`${dim} rounded-full border-2 border-[#2b1d16]`}
          style={{ backgroundColor: i < filled ? color : '#fffaf0' }}
        />
      ))}
    </span>
  );
};

interface SkillNodeProps {
  id: string;
  skill: { name: string; level: number; highlight?: boolean };
  color: string;
  tint: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/** A round talent node + its label; hover / focus / tap reveals a tooltip card. */
export const SkillNode: React.FC<SkillNodeProps> = ({ id, skill, color, tint, open, onOpen, onClose }) => {
  const glyph = skillGlyph(skill.name);
  const tier = tierFor(skill.level);
  const pips = levelToPips(skill.level);
  const tipId = `${id}-tip`;
  const evidence = open ? skillEvidence(skill.name) : [];

  return (
    <li className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <div className="relative z-[1] flex items-center gap-3 py-1.5">
        <button
          type="button"
          onClick={onOpen}
          onFocus={onOpen}
          onBlur={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && open) {
              e.stopPropagation();
              onClose();
            }
          }}
          aria-label={`${skill.name}: ${tier.name}, ${pips} of ${MAX_PIPS}${skill.highlight ? ', signature skill' : ''}`}
          aria-describedby={open ? tipId : undefined}
          className={`relative shrink-0 w-12 h-12 rounded-full border-[3px] border-[#2b1d16] flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7cc4e4] ${
            open ? 'scale-110' : ''
          }`}
          style={{
            backgroundColor: skill.highlight ? '#fff4d6' : tint,
            boxShadow: skill.highlight
              ? `0 0 0 4px #fde68a, 0 0 18px 6px rgba(253, 230, 138, 0.95), 0 3px 0 0 #2b1d16`
              : '0 3px 0 0 #2b1d16',
          }}
        >
          <span
            aria-hidden
            className={glyph.isEmoji ? 'text-[22px] leading-none' : 'text-[13px] font-black leading-none'}
            style={glyph.isEmoji ? undefined : { color }}
          >
            {glyph.text}
          </span>
          {skill.highlight && (
            <span
              aria-hidden
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#d97706] border-2 border-[#2b1d16] text-white text-xs leading-none flex items-center justify-center"
            >
              ★
            </span>
          )}
        </button>

        <div className="min-w-0">
          <p className="text-[13px] font-black leading-snug text-[#2b1d16] break-words">{skill.name}</p>
          <p className="flex items-center gap-1.5 mt-0.5">
            <Pips filled={pips} color={color} />
            <span className="text-xs font-bold text-[#6b4730]">{tier.name}</span>
          </p>
        </div>
      </div>

      {open && (
        <div
          id={tipId}
          role="tooltip"
          className="game-fade-in absolute left-0 right-0 top-full z-20 -mt-0.5 rounded-2xl border-[3px] border-[#2b1d16] bg-[#fffaf0] shadow-[0_5px_0_0_#2b1d16] p-3 text-left"
        >
          <span
            aria-hidden
            className="absolute -top-[9px] left-[17px] w-3.5 h-3.5 rotate-45 bg-[#fffaf0] border-l-[3px] border-t-[3px] border-[#2b1d16]"
          />
          <p className="text-sm font-black text-[#2b1d16] leading-snug">{skill.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Pips filled={pips} color={color} size="md" />
            <span
              className="px-2 py-0.5 rounded-full border-2 border-[#2b1d16] text-xs font-black text-white"
              style={{ backgroundColor: color }}
            >
              {tier.name}
            </span>
            {skill.highlight && <span className="text-xs font-black text-[#d97706]">★ Signature</span>}
          </div>
          <p className="mt-1.5 text-xs leading-snug text-[#4a3426]">{tier.blurb}</p>
          {evidence.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9a6a43]">Used in</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {evidence.map((e) => (
                  <li
                    key={e}
                    className="px-2 py-0.5 rounded-full bg-[#f6ecd6] border-2 border-[#2b1d16]/30 text-xs font-bold text-[#4a3426]"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
};
