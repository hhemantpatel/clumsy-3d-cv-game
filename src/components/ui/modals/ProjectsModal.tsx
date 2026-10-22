import React, { useMemo, useRef, useState } from 'react';
import { cvData } from '../../../data/cvData';
import { useGame } from '../../../context/GameContext';
import { GameModal } from '../kit/GameModal';
import { UI } from '../kit/theme';
import { CATEGORIES, inCategory, type CategoryId } from './projects/projectMeta';
import { ItemCard } from './projects/ItemCard';
import { ProjectInspect } from './projects/ProjectInspect';

type FilterId = CategoryId | 'all';

const isCompact = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

/**
 * PROJECTS: "Workshop inventory". Every project is a collectible item card on the crafting
 * bench; picking one opens an inspect panel (side panel on desktop, sheet below on mobile).
 */
export const ProjectsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { openModal } = useGame();
  const projects = cvData.projects;
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? '');

  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const inspectRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Tabs with counts; never show an empty category.
  const tabs = useMemo(() => {
    const all = { id: 'all' as FilterId, label: 'All', emoji: '🎒', count: projects.length };
    const cats = CATEGORIES.map((c) => ({
      id: c.id as FilterId,
      label: c.label,
      emoji: c.emoji,
      count: projects.filter((p) => inCategory(p, c.id)).length,
    })).filter((t) => t.count > 0);
    return [all, ...cats];
  }, [projects]);

  const visible = useMemo(() => projects.filter((p) => inCategory(p, filter)), [projects, filter]);
  const selected = visible.find((p) => p.id === selectedId) ?? visible[0];

  const chooseFilter = (id: FilterId) => {
    setFilter(id);
    const next = projects.filter((p) => inCategory(p, id));
    if (next.length && !next.some((p) => p.id === selectedId)) setSelectedId(next[0].id);
  };

  const select = (id: string) => {
    setSelectedId(id);
    if (isCompact()) {
      // On phones the inspect sheet lives under the grid: bring it into view.
      requestAnimationFrame(() => {
        inspectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        headingRef.current?.focus({ preventScroll: true });
      });
    }
  };

  const backToCard = () => {
    if (!selected) return;
    const card = cardRefs.current.get(selected.id);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.focus({ preventScroll: true });
  };

  // Arrow-key navigation across the inventory grid (columns measured from layout).
  const onCardKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const buttons = visible.map((p) => cardRefs.current.get(p.id)).filter(Boolean) as HTMLButtonElement[];
    if (!buttons.length) return;
    const top = buttons[0].offsetTop;
    const cols = Math.max(1, buttons.filter((b) => b.offsetTop === top).length);
    let next = index;
    switch (e.key) {
      case 'ArrowRight': next = index + 1; break;
      case 'ArrowLeft': next = index - 1; break;
      case 'ArrowDown': next = index + cols; break;
      case 'ArrowUp': next = index - cols; break;
      case 'Home': next = 0; break;
      case 'End': next = buttons.length - 1; break;
      default: return;
    }
    e.preventDefault();
    next = Math.min(buttons.length - 1, Math.max(0, next));
    buttons[next].focus();
  };

  const featuredCount = projects.filter((p) => p.featured).length;

  const filterBar = (
    <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-1.5 md:justify-end">
      {tabs.map((t) => {
        const active = filter === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => chooseFilter(t.id)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-black border-2 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7cc4e4] ${
              active
                ? 'bg-[#d97706] text-white border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16]'
                : 'bg-[#fffaf0] text-[#5c4033] border-[#2b1d16]/30 hover:border-[#2b1d16] hover:-translate-y-0.5'
            }`}
          >
            <span aria-hidden>{t.emoji}</span>
            <span>{t.label}</span>
            <span
              className={`ml-0.5 min-w-[22px] px-1 rounded-full text-xs tabular-nums text-center ${
                active ? 'bg-white/25' : 'bg-[#f6ecd6]'
              }`}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <GameModal
      onClose={onClose}
      icon="🛠️"
      kicker="Workshop inventory"
      title="Projects"
      subtitle={`${projects.length} items crafted · ${featuredCount} featured · pick one to inspect`}
      headerExtra={filterBar}
      accent={UI.amber}
    >
      {projects.length === 0 ? (
        <p className="text-sm text-[#4a3426]">The workbench is empty for now. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 lg:gap-6 items-start">
          {/* Inventory grid on a wooden bench */}
          <section aria-label="Project items" className="min-w-0">
            <div className="rounded-[22px] border-[3px] border-[#2b1d16] bg-[#c49563] p-2.5 sm:p-3.5 shadow-[inset_0_-6px_0_0_rgba(43,29,22,0.18)]">
              <div className="flex items-center justify-between gap-2 px-1 pb-2.5 text-xs font-black text-[#2b1d16]">
                <span>🎒 {visible.length} {visible.length === 1 ? 'item' : 'items'}</span>
                <span className="hidden sm:inline text-[#2b1d16]/80">Arrow keys to browse · Enter to inspect</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3.5 pb-3">
                {visible.map((p, i) => (
                  <li key={p.id} className="game-fade-in">
                    <ItemCard
                      ref={(el) => {
                        if (el) cardRefs.current.set(p.id, el);
                        else cardRefs.current.delete(p.id);
                      }}
                      project={p}
                      slot={projects.indexOf(p) + 1}
                      selected={selected?.id === p.id}
                      onSelect={() => select(p.id)}
                      onKeyDown={onCardKeyDown(i)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Inspect panel */}
          <div ref={inspectRef} className="min-w-0 lg:sticky lg:top-0 scroll-mt-2">
            {selected && (
              <ProjectInspect
                key={selected.id}
                project={selected}
                headingRef={headingRef}
                onContact={() => openModal('contact')}
                onBack={backToCard}
              />
            )}
          </div>
        </div>
      )}
    </GameModal>
  );
};
