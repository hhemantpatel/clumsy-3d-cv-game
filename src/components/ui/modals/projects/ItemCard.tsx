import React from 'react';
import type { Project } from '../../../../data/cvData';
import { FALLBACK_CATEGORY, primaryCategory, projectEmoji } from './projectMeta';

interface ItemCardProps {
  project: Project;
  slot: number;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

const MAX_CHIPS = 3;

/** One collectible "item" in the inventory grid. */
export const ItemCard = React.forwardRef<HTMLButtonElement, ItemCardProps>(
  ({ project, slot, selected, onSelect, onKeyDown }, ref) => {
    const cat = primaryCategory(project) ?? FALLBACK_CATEGORY;
    const extra = project.tags.length - MAX_CHIPS;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        onKeyDown={onKeyDown}
        aria-pressed={selected}
        data-project-id={project.id}
        className={`group relative w-full h-full text-left flex flex-col gap-2.5 p-3.5 pt-4 rounded-2xl border-[3px] border-[#2b1d16] transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7cc4e4] select-text ${
          selected
            ? 'bg-[#fff4d6] shadow-[0_0_0_4px_#fde68a,0_6px_0_0_#2b1d16] -translate-y-1'
            : 'bg-[#fffaf0] shadow-[0_4px_0_0_#2b1d16] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#2b1d16]'
        }`}
      >
        {/* Category ribbon, folded over the right edge */}
        <span
          className="absolute -right-[3px] top-3 pl-2.5 pr-2 py-0.5 rounded-l-full border-[3px] border-r-0 border-[#2b1d16] text-xs font-black text-white"
          style={{ backgroundColor: cat.color }}
        >
          {cat.short}
        </span>

        <div className="flex items-center gap-3 pr-16">
          <span
            aria-hidden
            className={`shrink-0 w-14 h-14 rounded-2xl border-[3px] border-[#2b1d16] shadow-[inset_0_-4px_0_0_rgba(43,29,22,0.12)] flex items-center justify-center text-[28px] leading-none ${
              selected ? 'game-wiggle' : 'group-hover:scale-110 transition-transform'
            }`}
            style={{ backgroundColor: cat.tint }}
          >
            {projectEmoji(project)}
          </span>
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-black text-[#9a6a43] tabular-nums">
              Slot #{String(slot).padStart(2, '0')}
              {project.featured && <span className="ml-1.5 text-[#d97706]">★ Featured</span>}
            </span>
            {typeof project.stars === 'number' && (
              <span className="text-xs font-bold text-[#6b4730]">⭐ {project.stars} stars</span>
            )}
          </span>
        </div>

        <span className="font-black text-[15px] leading-snug text-[#2b1d16]">{project.title}</span>
        <span className="text-[13px] leading-snug text-[#5c4033] line-clamp-3">{project.tagline}</span>

        <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {project.tags.slice(0, MAX_CHIPS).map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border-2 border-[#2b1d16]/60 bg-[#f6ecd6] text-[#4a3426]"
            >
              {t}
            </span>
          ))}
          {extra > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border-2 border-dashed border-[#2b1d16]/40 text-[#6b4730]">
              +{extra} more
            </span>
          )}
        </span>

        {selected && (
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#d97706] text-white text-xs font-black border-2 border-[#2b1d16] whitespace-nowrap">
            Inspecting
          </span>
        )}
      </button>
    );
  }
);
ItemCard.displayName = 'ItemCard';
