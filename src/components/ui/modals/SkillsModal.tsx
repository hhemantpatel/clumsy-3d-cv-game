import React, { useEffect, useRef, useState } from 'react';
import { cvData } from '../../../data/cvData';
import { GameModal } from '../kit/GameModal';
import { UI, tw } from '../kit/theme';
import { Pips, SkillNode } from './skills/SkillNode';
import { TIERS, branchColor, branchIcon } from './skills/skillMeta';

const STAT_EMOJI: [RegExp, string][] = [
  [/college|university|school/i, '🏫'],
  [/degree/i, '🎓'],
  [/cgpa|gpa|grade/i, '⭐'],
  [/stack|weapon|tool/i, '⚔️'],
];
const statEmoji = (label: string) => STAT_EMOJI.find(([re]) => re.test(label))?.[1] ?? '✦';

/** Curvy root → branch connectors, measured in real pixels so strokes never stretch. */
const BranchConnectors: React.FC<{ count: number; colors: string[] }> = ({ count, colors }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const H = 56;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mid = width / 2;
  const paths = Array.from({ length: count }, (_, i) => {
    const x = ((i + 0.5) * width) / count;
    return `M ${mid} 0 C ${mid} ${H * 0.55}, ${x} ${H * 0.4}, ${x} ${H}`;
  });

  return (
    <div ref={ref} aria-hidden className="hidden lg:block w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block overflow-visible">
          {paths.map((d, i) => (
            <g key={i}>
              <path
                d={d}
                pathLength={1}
                fill="none"
                stroke={UI.ink}
                strokeWidth={9}
                strokeLinecap="round"
                className="game-draw-path"
                style={{ ['--path-length' as string]: 1 } as React.CSSProperties}
              />
              <path
                d={d}
                pathLength={1}
                fill="none"
                stroke={colors[i]}
                strokeWidth={4}
                strokeLinecap="round"
                className="game-draw-path"
                style={{ ['--path-length' as string]: 1 } as React.CSSProperties}
              />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};

/**
 * SKILLS: an RPG talent tree. A root node ("Hemant") sprouts one branch per skill category;
 * each skill is a round node with pips + a tier word. Desktop: branches fan out side by side
 * from SVG vines. Below lg: branches stack along a vertical trunk.
 */
export const SkillsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const categories = cvData.skillCategories;
  const [active, setActive] = useState<string | null>(null);

  const allSkills = categories.flatMap((c) => c.skills);
  const signatureCount = allSkills.filter((s) => s.highlight).length;
  const firstName = cvData.name.split(' ')[0];
  const [className] = cvData.title.split('|').map((s) => s.trim());
  const colors = categories.map((_, i) => branchColor(i)[0]);

  const headerBadges = (
    <ul className="flex flex-wrap gap-1.5 md:justify-end" aria-label="Skill tree summary">
      {[
        `🌳 ${categories.length} branches`,
        `✨ ${allSkills.length} skills unlocked`,
        `🌟 ${signatureCount} signature`,
      ].map((t) => (
        <li
          key={t}
          className="px-2.5 py-1 rounded-full text-xs font-black border-2 border-[#2b1d16]/40 bg-[#fffaf0] text-[#4a3426]"
        >
          {t}
        </li>
      ))}
    </ul>
  );

  return (
    <GameModal
      onClose={onClose}
      icon="🌳"
      kicker="Talent tree"
      title="Skills"
      subtitle="Hover, focus or tap a node to inspect it"
      headerExtra={headerBadges}
      accent={UI.meadow}
    >
      <div className="space-y-5">
        {/* Character stats strip */}
        <section aria-label="Character stats">
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a43] mb-2">🧾 Character stats</h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {cvData.stats.map((s) => (
              <div key={s.label} className={`${tw.cardSoft} flex items-center gap-2.5 px-3 py-2 min-w-0`}>
                <span aria-hidden className="text-xl shrink-0">
                  {statEmoji(s.label)}
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-black uppercase tracking-[0.1em] text-[#9a6a43]">{s.label}</dt>
                  <dd className="text-sm font-black text-[#2b1d16] leading-tight break-words">{s.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* Tree */}
        <section
          aria-label="Skill tree"
          className="relative rounded-[22px] border-[3px] border-[#2b1d16] bg-[#eef3d6] p-3 sm:p-5 overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(rgba(53,95,37,0.14) 1.5px, transparent 1.5px), linear-gradient(180deg, #f3f7e2 0%, #e3ecc4 100%)',
            backgroundSize: '18px 18px, 100% 100%',
          }}
        >
          {/* Trunk (stacked layout only) */}
          <div
            aria-hidden
            className="lg:hidden absolute left-[38px] sm:left-[46px] top-16 bottom-8 w-1 rounded-full bg-[#9a6a43]"
          />

          {/* Root node */}
          <div className="relative flex items-center gap-3 lg:flex-col lg:gap-1.5 lg:text-center">
            <div
              aria-hidden
              className="game-float shrink-0 w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-[#c49563] border-[3px] border-[#2b1d16] shadow-[0_0_0_4px_#fde68a,0_4px_0_0_#2b1d16] flex items-center justify-center text-[28px] lg:text-[38px]"
            >
              🧑‍🚀
            </div>
            <div className="min-w-0">
              <p className={`${tw.heading} text-lg leading-tight`}>{firstName}</p>
              <p className="text-xs font-bold text-[#6b4730]">{className}</p>
            </div>
          </div>

          <BranchConnectors count={categories.length} colors={colors} />

          <ol
            className="relative mt-5 lg:mt-0 flex flex-col gap-6 pl-[52px] sm:pl-[60px] lg:pl-0 lg:grid lg:gap-0"
            style={{
              gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
            }}
          >
            {categories.map((cat, ci) => {
              const [color, tint] = branchColor(ci);
              const Icon = branchIcon(cat.iconName);
              return (
                <li key={cat.category} className="relative min-w-0 lg:px-2">
                  {/* stub from the trunk (stacked layout) */}
                  <span
                    aria-hidden
                    className="lg:hidden absolute -left-[22px] sm:-left-[30px] top-[20px] w-[22px] sm:w-[30px] h-1 rounded-full bg-[#9a6a43]"
                  />
                  <h3 className="relative flex items-center gap-2 lg:justify-center lg:flex-col lg:gap-1 lg:text-center">
                    <span
                      aria-hidden
                      className="shrink-0 w-11 h-11 rounded-2xl border-[3px] border-[#2b1d16] shadow-[0_3px_0_0_#2b1d16] flex items-center justify-center text-white"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black leading-tight text-[#2b1d16]">{cat.category}</span>
                      <span className="block text-xs font-bold text-[#6b4730]">{cat.skills.length} skills</span>
                    </span>
                  </h3>

                  <div className="relative mt-2">
                    {/* vine linking this branch's nodes */}
                    <span
                      aria-hidden
                      className="sm:hidden lg:block absolute left-[22px] top-2 bottom-6 w-[3px] rounded-full"
                      style={{ backgroundColor: color, opacity: 0.45 }}
                    />
                    <ul className="relative sm:grid sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-1">
                      {cat.skills.map((skill, si) => {
                        const key = `skill-${ci}-${si}`;
                        return (
                          <SkillNode
                            key={skill.name}
                            id={key}
                            skill={skill}
                            color={color}
                            tint={tint}
                            open={active === key}
                            onOpen={() => setActive(key)}
                            onClose={() => setActive((cur) => (cur === key ? null : cur))}
                          />
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Legend */}
        <section aria-label="How to read the tree" className={`${tw.inset} px-3 py-2.5`}>
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a43] mb-1.5">📜 Legend</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#4a3426]">
            {TIERS.map((t) => (
              <li key={t.name} className="flex items-center gap-1.5">
                <Pips filled={t.pips} color={UI.amber} />
                <span className="font-black text-[#2b1d16]">{t.name}</span>
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="w-4 h-4 rounded-full border-2 border-[#2b1d16] bg-[#fff4d6] shadow-[0_0_0_3px_#fde68a,0_0_8px_3px_rgba(253,230,138,0.95)]"
              />
              <span className="font-black text-[#2b1d16]">Glowing ★ = signature skill</span>
            </li>
          </ul>
        </section>
      </div>
    </GameModal>
  );
};
