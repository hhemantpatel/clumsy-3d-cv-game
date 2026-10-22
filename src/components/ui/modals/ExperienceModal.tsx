import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { cvData } from '../../../data/cvData';
import { GameModal } from '../kit/GameModal';
import { tw, UI } from '../kit/theme';
import { defaultIndex, FUTURE, KIND_META, LEGACY_FACTS, STOPS, type StopKind } from './experience/journey';
import { TimeMap } from './experience/TimeMap';
import { CheckpointCard, QuestLog } from './experience/Panels';

/**
 * Experience / timeline as a "Map of Time": a storybook landscape whose winding trail climbs from
 * school at the cottage gate to the mountain summit, with a checkpoint pin for every milestone,
 * side-quest branches for leadership, and a little beanie-wearing avatar that walks between them.
 */
export const ExperienceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { openModal } = useGame();
  const slots = useMemo(() => [...STOPS, FUTURE], []);
  const total = STOPS.length;
  const [selected, setSelected] = useState(() => defaultIndex(STOPS));
  const cardRef = useRef<HTMLElement>(null);

  const select = useCallback(
    (i: number, fromMap = false) => {
      const next = Math.max(0, Math.min(slots.length - 1, i));
      setSelected(next);
      // On narrow screens the card sits below the map: bring it into view after tapping a pin.
      if (fromMap && typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
      }
    },
    [slots.length]
  );

  // ← / → walk the trail (ignored while typing or with modifiers).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelected((s) => Math.min(slots.length - 1, s + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slots.length]);

  const stop = slots[selected];
  const firstYear = STOPS[0]?.startYear ?? new Date().getFullYear();
  const yearsOnTrail = Math.max(1, new Date().getFullYear() - firstYear);
  const cgpa = cvData.stats.find((s) => /cgpa/i.test(s.label))?.value;
  const sideCount = STOPS.filter((s) => s.side).length;
  const legendKinds = (Object.keys(KIND_META) as StopKind[]).filter((k) => k !== 'future' && STOPS.some((s) => s.kind === k));

  const contact = () => openModal('contact');

  return (
    <GameModal
      onClose={onClose}
      icon="🗺️"
      kicker="Chapter 2 · The Journey"
      title="Map of Time"
      subtitle={`Every checkpoint from ${firstYear} to today, plus the side quests along the way.`}
      accent={UI.sky}
      headerExtra={
        <div className="flex flex-wrap gap-1.5">
          <span className={`${tw.chip} !text-[12px] bg-[#fffaf0]`}>🧭 {yearsOnTrail}+ yrs on the trail</span>
          <span className={`${tw.chip} !text-[12px] bg-[#fffaf0]`}>
            🚩 {total - sideCount} checkpoints · {sideCount} side quests
          </span>
          {cgpa && <span className={`${tw.chip} !text-[12px] bg-[#fde68a]`}>⭐ CGPA {cgpa}</span>}
        </div>
      }
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {stop.kind === 'future'
          ? `${stop.role} ${stop.org}`
          : `Checkpoint ${selected + 1} of ${total}: ${stop.role}, ${stop.org}, ${stop.period}`}
      </p>

      {/* The map: wide landscape on tablets/desktop, a vertical climb on phones */}
      <div className="pt-6">
        <TimeMap
          orientation="wide"
          slots={slots}
          selected={selected}
          onSelect={(i) => select(i, true)}
          total={total}
          className="hidden md:block"
        />
        <TimeMap
          orientation="tall"
          slots={slots}
          selected={selected}
          onSelect={(i) => select(i, true)}
          total={total}
          className="md:hidden mx-auto max-w-[420px]"
        />
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] font-bold text-[#5c4033]">
        <span className={tw.label}>Legend</span>
        {legendKinds.map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span aria-hidden>{KIND_META[k].emoji}</span>
            {KIND_META[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span aria-hidden>✓</span> Cleared
        </span>
        <span className="sm:ml-auto text-[#9a6a43]">
          📍 Surveyed at {LEGACY_FACTS.coords} · IIT Jodhpur
        </span>
      </div>

      {/* checkpoint card + quest log */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] items-start">
        <CheckpointCard
          ref={cardRef}
          stop={stop}
          index={selected}
          total={total}
          slots={slots}
          onPrev={() => select(selected - 1)}
          onNext={() => select(selected + 1)}
          onContact={contact}
        />
        <div className="space-y-3">
          <QuestLog slots={slots} selected={selected} total={total} onSelect={(i) => select(i)} />
          <button
            type="button"
            onClick={contact}
            className={`${tw.btn} ${tw.btnSky} w-full`}
            aria-label="Next checkpoint: unknown. Open the contact menu"
          >
            <span aria-hidden>📮</span> Your team could be next
          </button>
        </div>
      </div>
    </GameModal>
  );
};

export default ExperienceModal;
