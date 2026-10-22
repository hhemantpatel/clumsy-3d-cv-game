import React from 'react';
import { ExternalLink, Github, Mail, ArrowUp } from 'lucide-react';
import type { Project } from '../../../../data/cvData';
import { tw } from '../../kit/theme';
import { CATEGORIES, FALLBACK_CATEGORY, inCategory, primaryCategory, projectEmoji } from './projectMeta';

/** Bold the numbers inside a highlight so metrics ("95%", "R² = 0.93") pop like item stats. */
const METRIC_RE = /(R² = \d+(?:\.\d+)?|\b\d+(?:[.,]\d+)?(?:[–-]\d+(?:\.\d+)?)?(?:\s?%|x\b)?)/g;

const Emphasize: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(METRIC_RE).map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-black text-[#92400e]">
          {part}
        </strong>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    )}
  </>
);

interface ProjectInspectProps {
  project: Project;
  headingRef: React.Ref<HTMLHeadingElement>;
  onContact: () => void;
  /** Mobile only: jump back up to the selected card. */
  onBack: () => void;
}

/** The "item inspect" sheet: description, stats (highlights), recipe (stack) and links. */
export const ProjectInspect: React.FC<ProjectInspectProps> = ({ project, headingRef, onContact, onBack }) => {
  const cat = primaryCategory(project) ?? FALLBACK_CATEGORY;
  const alsoIn = CATEGORIES.filter((c) => c.label !== cat.label && inCategory(project, c.id));
  const hasLinks = Boolean(project.githubUrl || project.liveUrl);

  return (
    <article
      key={project.id}
      aria-label={`Inspecting ${project.title}`}
      className={`game-fade-in ${tw.card} overflow-hidden select-text`}
    >
      {/* Coloured header plate */}
      <div
        className="relative px-4 pt-4 pb-3 border-b-[3px] border-[#2b1d16]"
        style={{ backgroundColor: cat.tint }}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="game-float shrink-0 w-16 h-16 rounded-[20px] bg-[#fffaf0] border-[3px] border-[#2b1d16] shadow-[0_4px_0_0_#2b1d16] flex items-center justify-center text-[34px] leading-none"
          >
            {projectEmoji(project)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <span
                className="px-2 py-0.5 rounded-full border-2 border-[#2b1d16] text-xs font-black text-white"
                style={{ backgroundColor: cat.color }}
              >
                {cat.label}
              </span>
              {alsoIn.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-full border-2 border-[#2b1d16]/40 bg-[#fffaf0] text-xs font-bold text-[#4a3426]"
                >
                  {c.emoji} {c.label}
                </span>
              ))}
              {project.featured && (
                <span className="px-2 py-0.5 rounded-full border-2 border-[#2b1d16] bg-[#fde68a] text-xs font-black text-[#92400e]">
                  ★ Featured
                </span>
              )}
            </div>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className={`${tw.heading} text-lg sm:text-xl leading-tight focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7cc4e4] rounded-md`}
            >
              {project.title}
            </h3>
          </div>
        </div>
        <p className="mt-2 text-[13px] font-bold leading-snug text-[#6b4730]">{project.tagline}</p>
      </div>

      <div className="p-4 space-y-4">
        <p className={tw.body}>{project.description}</p>

        <section aria-label="Item stats">
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a43] mb-2">📊 Item stats</h4>
          <ul className="space-y-2">
            {project.highlights.map((h, i) => (
              <li key={i} className={`${tw.inset} flex gap-2.5 px-3 py-2 text-[13px] leading-snug text-[#4a3426]`}>
                <span
                  aria-hidden
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#d97706] border-2 border-[#2b1d16] text-white text-xs font-black flex items-center justify-center"
                >
                  {i + 1}
                </span>
                <span>
                  <Emphasize text={h} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Crafting recipe">
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a43] mb-2">🧪 Crafting recipe</h4>
          <ul className="flex flex-wrap items-center gap-1.5">
            {project.tags.map((t, i) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border-2 border-[#2b1d16] bg-[#fffaf0] shadow-[0_2px_0_0_#2b1d16] text-[#2b1d16]">
                  {t}
                </span>
                {i < project.tags.length - 1 && (
                  <span aria-hidden className="text-sm font-black text-[#9a6a43]">
                    +
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2 pt-1">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className={`${tw.btn} bg-[#2b1d16] text-[#fffaf0] flex-1 min-w-[140px] py-2.5`}
            >
              <Github className="w-4 h-4" strokeWidth={2.5} />
              <span>View on GitHub</span>
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className={`${tw.btn} ${tw.btnGreen} flex-1 min-w-[140px] py-2.5`}
            >
              <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
              <span>Live demo</span>
            </a>
          )}
          {!hasLinks && (
            <button type="button" onClick={onContact} className={`${tw.btn} ${tw.btnPaper} flex-1 min-w-[140px] py-2.5`}>
              <Mail className="w-4 h-4" strokeWidth={2.5} />
              <span>No public link yet, ask me about it</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className={`lg:hidden ${tw.btn} ${tw.btnSky} w-full`}
        >
          <ArrowUp className="w-4 h-4" strokeWidth={3} />
          <span>Back to inventory</span>
        </button>
      </div>
    </article>
  );
};
