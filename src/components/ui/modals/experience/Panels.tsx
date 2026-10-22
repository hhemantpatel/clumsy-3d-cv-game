import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Send } from 'lucide-react';
import { tw } from '../../kit/theme';
import { KIND_META, type Stop } from './journey';

/* ------------------------------------------------------------------ progress */

export const TrailProgress: React.FC<{ slots: Stop[]; selected: number; total: number }> = ({ slots, selected, total }) => (
  <div className="flex items-center gap-1" aria-hidden>
    {slots.map((s, i) => (
      <span
        key={s.key}
        className={`h-2.5 rounded-full border-2 border-[#2b1d16] transition-all duration-300 ${
          i === selected ? 'w-7 bg-[#d97706]' : i < selected ? 'w-2.5 bg-[#5f9a45]' : i < total ? 'w-2.5 bg-[#fffaf0]' : 'w-2.5 bg-[#fffaf0] border-dashed opacity-60'
        }`}
      />
    ))}
  </div>
);

/* ------------------------------------------------------------------ checkpoint card */

interface CardProps {
  stop: Stop;
  index: number;
  total: number;
  slots: Stop[];
  onPrev: () => void;
  onNext: () => void;
  onContact: () => void;
}

export const CheckpointCard = React.forwardRef<HTMLElement, CardProps>(
  ({ stop, index, total, slots, onPrev, onNext, onContact }, ref) => {
    const meta = KIND_META[stop.kind];
    const future = stop.kind === 'future';
    const isFirst = index === 0;
    const isLast = index === slots.length - 1;

    return (
      <article
        ref={ref}
        className={`${tw.card} p-4 sm:p-5 scroll-mt-4 ${future ? 'border-dashed' : ''}`}
      >
        {/* tab row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-dashed border-[#2b1d16]/20">
          <div className="flex items-center gap-2">
            <span
              className="w-10 h-10 shrink-0 rounded-xl border-[3px] border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16] flex items-center justify-center text-xl"
              style={{ backgroundColor: meta.color }}
              aria-hidden
            >
              {future ? '❓' : meta.emoji}
            </span>
            <div>
              <p className={tw.label}>{future ? 'Uncharted territory' : `Checkpoint ${index + 1} of ${total}`}</p>
              <p className="text-[12px] font-bold text-[#5c4033]">
                {meta.label}
                {!future && (stop.ongoing ? ' · in progress ⏳' : ' · cleared ✓')}
              </p>
            </div>
          </div>
          <TrailProgress slots={slots} selected={index} total={total} />
        </div>

        <div key={stop.key} className="game-fade-in">
          <h3 className={`${tw.heading} text-lg sm:text-xl leading-snug`}>{stop.role}</h3>
          <p className="text-sm font-bold text-[#92400e]">{stop.org}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`${tw.chip} !text-[12px] bg-[#fde68a]`}>
              <CalendarDays className="w-3.5 h-3.5" aria-hidden /> {stop.period}
            </span>
            {stop.location && (
              <span className={`${tw.chip} !text-[12px] bg-[#fffaf0]`}>
                <MapPin className="w-3.5 h-3.5" aria-hidden /> {stop.location}
              </span>
            )}
          </div>

          {stop.summary && <p className={`${tw.body} mt-3`}>{stop.summary}</p>}

          {future ? (
            <div className="mt-3 space-y-3">
              <p className={tw.body}>
                The trail keeps climbing. The next flag on this map hasn't been planted yet: maybe it's a full-time role,
                maybe it's a research lab, maybe it's <strong>your team</strong>.
              </p>
              <button type="button" onClick={onContact} className={`${tw.btn} ${tw.btnPrimary}`}>
                <Send className="w-4 h-4" aria-hidden /> Plant the next flag together
              </button>
            </div>
          ) : (
            stop.bullets.length > 0 && (
              <div className="mt-4">
                <p className={tw.label}>{stop.side ? 'Quest rewards' : 'Loot collected'}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {stop.bullets.map((b) => (
                    <li key={b} className={`${tw.body} flex gap-2`}>
                      <span aria-hidden className="mt-[7px] w-2 h-2 shrink-0 rotate-45 bg-[#d97706] border border-[#2b1d16]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {stop.skills.length > 0 && (
            <div className="mt-4">
              <p className={tw.label}>Skills unlocked</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {stop.skills.map((s) => (
                  <li key={s} className={`${tw.chip} !text-[12px] bg-[#c5d77a]/60 text-[#2b1d16]`}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* prev / next */}
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Previous checkpoint"
            className={`${tw.btn} ${tw.btnPaper} disabled:opacity-40 disabled:pointer-events-none`}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={3} aria-hidden /> Prev
          </button>
          <span className="hidden sm:inline text-[12px] font-bold text-[#9a6a43]">Tip: use ← / → to walk the trail</span>
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            aria-label="Next checkpoint"
            className={`${tw.btn} ${tw.btnGreen} disabled:opacity-40 disabled:pointer-events-none`}
          >
            Next <ChevronRight className="w-4 h-4" strokeWidth={3} aria-hidden />
          </button>
        </div>
      </article>
    );
  }
);
CheckpointCard.displayName = 'CheckpointCard';

/* ------------------------------------------------------------------ quest log */

export const QuestLog: React.FC<{ slots: Stop[]; selected: number; total: number; onSelect: (i: number) => void }> = ({
  slots,
  selected,
  total,
  onSelect,
}) => (
  <nav aria-label="Quest log" className={`${tw.cardSoft} p-3`}>
    <p className={`${tw.label} px-1`}>📜 Quest log</p>
    <ol className="mt-2 space-y-1.5">
      {slots.map((s, i) => {
        const future = s.kind === 'future';
        const isSel = i === selected;
        const flag = future ? '🔒' : s.ongoing ? '🚩' : '✅';
        return (
          <li key={s.key} className={s.side ? 'pl-4' : ''}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={isSel ? 'step' : undefined}
              aria-label={`${future ? 'Next checkpoint' : `Checkpoint ${i + 1} of ${total}`}: ${s.role}, ${s.org}${
                future ? '' : s.ongoing ? ', in progress' : ', cleared'
              }`}
              className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-xl border-2 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a] ${
                isSel
                  ? 'bg-[#fde68a] border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16]'
                  : 'bg-transparent border-transparent hover:border-[#2b1d16]/30 hover:bg-[#fffaf0]'
              } ${future ? 'opacity-75' : ''}`}
            >
              <span aria-hidden className="text-base leading-none">
                {flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-black text-[#2b1d16] truncate">
                  {s.side && <span aria-hidden>↳ </span>}
                  {future ? s.role : s.short}
                </span>
                <span className="block text-[12px] text-[#6b4730] truncate">
                  {future ? s.org : `${s.startYear} · ${KIND_META[s.kind].emoji} ${s.side ? 'Side quest' : KIND_META[s.kind].label}`}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
