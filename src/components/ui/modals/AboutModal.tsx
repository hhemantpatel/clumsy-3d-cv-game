import React from 'react';
import { MapPin, GraduationCap, Code2, School, Star, Users } from 'lucide-react';
import { cvData } from '../../../data/cvData';
import { GameModal } from '../kit/GameModal';
import { tw, UI } from '../kit/theme';
import { PlayerAvatar } from './about/PlayerAvatar';

const STAT_ICONS: Record<string, React.ReactNode> = {
  College: <School className="w-4 h-4" strokeWidth={2.5} />,
  Degree: <GraduationCap className="w-4 h-4" strokeWidth={2.5} />,
  CGPA: <Star className="w-4 h-4" strokeWidth={2.5} />,
  'Core Stack': <Code2 className="w-4 h-4" strokeWidth={2.5} />,
};

// Kit label/chip use 11px; keep every bit of text at >= 12px here.
const label = tw.label.replace('text-[11px]', 'text-xs');
const chip = tw.chip.replace('text-[11px]', 'text-xs');

const PERK_COLORS = [UI.amberLight, '#d4ecf7', UI.meadowLight, '#e6dcf3'];

/** "7.52 / 10.0" -> 0.752, otherwise null (rendered as a badge instead of a bar). */
const ratioOf = (value: string): number | null => {
  const m = value.match(/^\s*([\d.]+)\s*\/\s*([\d.]+)/);
  if (!m) return null;
  const r = parseFloat(m[1]) / parseFloat(m[2]);
  return Number.isFinite(r) ? Math.min(1, Math.max(0, r)) : null;
};

const SectionTitle: React.FC<{ emoji: string; children: React.ReactNode }> = ({ emoji, children }) => (
  <h3 className={`${tw.heading} text-lg flex items-center gap-2 mb-3`}>
    <span aria-hidden className="text-xl">{emoji}</span>
    {children}
  </h3>
);

export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [playerClass, school] = cvData.title.split('|').map((s) => s.trim());
  const degree = cvData.stats.find((s) => s.label === 'Degree')?.value;

  return (
    <GameModal
      onClose={onClose}
      icon="🧑‍🚀"
      kicker="Player profile"
      title={cvData.name}
      subtitle="Character sheet · stats, backstory, perks & guilds"
      accent={UI.sky}
      width="max-w-5xl"
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        {/* ---------- Character card ---------- */}
        <section aria-label="Character card" className={`${tw.card} overflow-hidden self-start`}>
          <div
            className="relative h-56 border-b-[3px] border-[#2b1d16] flex items-end justify-center"
            style={{ background: `linear-gradient(180deg, ${UI.sky} 0%, #bfe3f2 62%, ${UI.meadowLight} 62%, ${UI.meadow} 100%)` }}
          >
            {/* little sun + clouds */}
            <div aria-hidden className="absolute top-4 left-5 w-9 h-9 rounded-full bg-[#fde68a] border-[3px] border-[#2b1d16]" />
            <div aria-hidden className="absolute top-14 left-14 w-14 h-5 rounded-full bg-white border-2 border-[#2b1d16]/60 game-float" />
            {degree && (
              <div className="absolute top-3 right-3 game-wiggle">
                <span className={`${chip} bg-[#d97706] text-white !border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16] `}>
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden /> LV · {degree}
                </span>
              </div>
            )}
            <PlayerAvatar className="relative w-44 h-44 game-float" />
          </div>
          <div className="p-4 space-y-2 text-center">
            <p className={label}>Class</p>
            <p className={`${tw.heading} text-xl leading-tight`}>Engineer · Researcher</p>
            <p className="text-[13px] font-bold text-[#6b4730]">{playerClass}</p>
            {school && <p className="text-xs font-semibold text-[#9a6a43]">{school}</p>}
            <p className="inline-flex items-center gap-1 text-[13px] font-bold text-[#355f25]">
              <MapPin className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden />
              <span>{cvData.location}</span>
            </p>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          {/* ---------- Tagline ---------- */}
          <div className={`${tw.cardSoft} relative p-4 bg-[#fef6dc]`}>
            <p className={label}>Player bio</p>
            <p className="mt-1 text-[15px] font-bold text-[#2b1d16] leading-snug">“{cvData.bioShort}”</p>
          </div>

          {/* ---------- Stats ---------- */}
          <section aria-labelledby="about-stats">
            <SectionTitle emoji="📊">
              <span id="about-stats">Stats</span>
            </SectionTitle>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {cvData.stats.map((s) => {
                const ratio = ratioOf(s.value);
                return (
                  <li key={s.label} className={`${tw.inset} p-3`}>
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="w-7 h-7 shrink-0 rounded-lg bg-[#fffaf0] border-2 border-[#2b1d16] flex items-center justify-center text-[#9a6a43]">
                        {STAT_ICONS[s.label] ?? <Star className="w-4 h-4" />}
                      </span>
                      <span className={label}>{s.label}</span>
                      <span className="ml-auto font-black text-[#2b1d16] text-sm text-right">{s.value}</span>
                    </div>
                    {ratio !== null && (
                      <div
                        className="mt-2 h-3.5 rounded-full bg-[#fffaf0] border-2 border-[#2b1d16] overflow-hidden"
                        role="meter"
                        aria-label={s.label}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(ratio * 100)}
                        aria-valuetext={s.value}
                      >
                        <div className="h-full bg-[#5f9a45] border-r-2 border-[#2b1d16]" style={{ width: `${ratio * 100}%` }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---------- Backstory ---------- */}
          <section aria-labelledby="about-backstory">
            <SectionTitle emoji="📜">
              <span id="about-backstory">Backstory</span>
            </SectionTitle>
            <ol className="space-y-3">
              {cvData.bioLong.map((para, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="shrink-0 w-8 h-8 rounded-full bg-[#fde68a] border-2 border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16] flex items-center justify-center font-black text-sm text-[#2b1d16]"
                  >
                    {i + 1}
                  </span>
                  <p className={`${tw.body} ${tw.cardSoft} px-3.5 py-2.5 flex-1 min-w-0`}>{para}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ---------- Perks ---------- */}
          <section aria-labelledby="about-perks">
            <SectionTitle emoji="✨">
              <span id="about-perks">Traits &amp; hobbies</span>
            </SectionTitle>
            <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {cvData.hobbies.map((h, i) => (
                <li key={h.name} className={`${tw.cardSoft} p-3 flex gap-3 items-start transition-transform hover:-translate-y-0.5`}>
                  <span
                    aria-hidden
                    className="shrink-0 w-12 h-12 rounded-xl border-2 border-[#2b1d16] flex items-center justify-center text-2xl"
                    style={{ backgroundColor: PERK_COLORS[i % PERK_COLORS.length] }}
                  >
                    {h.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5f9a45]">Perk</p>
                    <p className="font-black text-[#2b1d16] text-sm">{h.name}</p>
                    <p className="text-[13px] text-[#5c4033] leading-snug">{h.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- Guilds ---------- */}
          <section aria-labelledby="about-guilds">
            <SectionTitle emoji="🛡️">
              <span id="about-guilds">Guilds</span>
            </SectionTitle>
            <ul className="space-y-3">
              {cvData.leadership.map((l) => (
                <li key={l.role + l.org} className={`${tw.card} !shadow-[0_4px_0_0_#2b1d16] p-4`}>
                  <div className="flex flex-wrap items-start gap-2">
                    <span aria-hidden className="w-9 h-9 shrink-0 rounded-xl bg-[#7c5ba6] text-white border-2 border-[#2b1d16] flex items-center justify-center">
                      <Users className="w-5 h-5" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#2b1d16] leading-tight">{l.role}</p>
                      <p className="text-[13px] font-semibold text-[#6b4730]">{l.org}</p>
                    </div>
                    <span className={`${chip} bg-[#f6ecd6] text-[#5c4033] `}>{l.period.replace(/\s*--\s*/, '–')}</span>
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {l.bullets.map((b) => (
                      <li key={b} className={`${tw.body} flex gap-2`}>
                        <span aria-hidden className="text-[#d97706] font-black">★</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </GameModal>
  );
};

export default AboutModal;
