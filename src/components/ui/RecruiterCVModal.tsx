import React, { useId } from 'react';
import { useGame } from '../../context/GameContext';
import { cvData } from '../../data/cvData';
import { X, Printer, Mail, MapPin, Github, Linkedin, ExternalLink, Phone, FileText } from 'lucide-react';
import { tw } from './kit/theme';

/** Restrained section heading: warm game colours, but résumé-clean. */
const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#92400e] print:text-black">
    <span className="shrink-0">{children}</span>
    <span className="h-[2px] flex-1 rounded-full bg-[#2b1d16]/15 print:bg-black/30" aria-hidden />
  </h2>
);

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-2 text-[13px] leading-relaxed text-[#3d2a1e] print:text-black">
    <span className="mt-[0.55em] w-1.5 h-1.5 shrink-0 rounded-full bg-[#d97706] print:bg-black" aria-hidden />
    <span>{children}</span>
  </li>
);

const entry = 'pl-4 border-l-[3px] border-[#e8d6b4] print:border-black/20 space-y-1.5 break-inside-avoid';
const metaRow = 'flex flex-col sm:flex-row sm:items-baseline justify-between gap-x-3 gap-y-0.5';
const roleText = 'text-[15px] font-black text-[#2b1d16] print:text-black';
const periodText = 'text-xs font-bold text-[#6b4730] tabular-nums whitespace-nowrap print:text-black';
const orgText = 'text-[13px] font-bold text-[#b45309] print:text-black';
const bodyText = 'text-[13px] leading-relaxed text-[#4a3426] print:text-black';
const linkCls =
  'inline-flex items-center gap-1.5 rounded-md hover:text-[#b45309] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]';

export const RecruiterCVModal: React.FC = () => {
  const { activeModal, closeModal } = useGame();
  const titleId = useId();

  if (activeModal !== 'recruiter') return null;

  const handlePrint = () => {
    window.print();
  };

  const work = cvData.timeline.filter((item) => item.type === 'work');
  const education = cvData.timeline.filter((item) => item.type === 'education');

  return (
    <div className="game-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#2b1d16]/45 font-game">
      {/* Click outside to close */}
      <div className="absolute inset-0 print-hidden" onClick={closeModal} />

      {/* Paper sheet frame (kit card) */}
      <div
        id="recruiter-cv-folio"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`game-modal-pop relative z-10 w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] flex flex-col ${tw.card}`}
      >
        {/* Toolbar (screen only) */}
        <div className="print-hidden shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b-[3px] border-[#2b1d16] bg-[#f6ecd6] rounded-t-[19px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="shrink-0 w-10 h-10 rounded-xl border-[3px] border-[#2b1d16] shadow-[0_3px_0_0_#2b1d16] bg-[#fde68a] flex items-center justify-center"
              aria-hidden
            >
              <FileText className="w-5 h-5 text-[#2b1d16]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className={tw.label}>Résumé</p>
              <p className={`${tw.heading} text-base sm:text-lg leading-tight`}>Printable CV</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-6 sm:mr-4">
            <button onClick={handlePrint} className={`${tw.btn} ${tw.btnPrimary}`}>
              <Printer className="w-4 h-4" strokeWidth={2.5} />
              <span>Print / PDF</span>
            </button>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close CV"
            title="Close [ESC]"
            className={`${tw.btn} ${tw.btnPaper} !p-2 absolute -top-3 -right-3 rounded-full z-20`}
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Printable résumé content */}
        <div
          id="recruiter-cv-dossier"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-10 py-6 sm:py-8 space-y-7 text-[#2b1d16] bg-[#fffaf0] rounded-b-[19px] select-text font-sans print:bg-white print:p-0 print:text-black print:overflow-visible"
        >
          {/* Header */}
          <header className="space-y-3 pb-5 border-b-[3px] border-[#2b1d16]/80 print:border-black">
            <div>
              <h1 id={titleId} className="font-game text-3xl sm:text-4xl font-black tracking-tight text-[#2b1d16] print:text-black">
                {cvData.name}
              </h1>
              <p className="text-base font-bold text-[#b45309] pt-0.5 print:text-black">{cvData.title}</p>
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[#4a3426] print:text-black">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9a6a43]" aria-hidden />
                {cvData.location}
              </li>
              <li>
                <a href={`mailto:${cvData.email}`} className={`${linkCls} font-semibold`}>
                  <Mail className="w-3.5 h-3.5 text-[#9a6a43]" aria-hidden />
                  {cvData.email}
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#9a6a43]" aria-hidden />
                {cvData.phone}
              </li>
              <li>
                <a href={cvData.github} target="_blank" rel="noreferrer" className={linkCls}>
                  <Github className="w-3.5 h-3.5 text-[#9a6a43]" aria-hidden />
                  github.com/hhemantpatel
                </a>
              </li>
              <li>
                <a href={cvData.linkedin} target="_blank" rel="noreferrer" className={linkCls}>
                  <Linkedin className="w-3.5 h-3.5 text-[#9a6a43]" aria-hidden />
                  linkedin.com/in/hemant-patel-992753369
                </a>
              </li>
            </ul>

            <p className="text-sm text-[#4a3426] leading-relaxed print:text-black">{cvData.bioShort}</p>
          </header>

          {/* Skills */}
          <section className="space-y-3">
            <SectionHeading>Technical Skills</SectionHeading>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {cvData.skillCategories.map((cat, idx) => (
                <div key={idx} className="break-inside-avoid">
                  <dt className="text-[13px] font-black text-[#2b1d16] print:text-black">{cat.category}</dt>
                  <dd className={bodyText}>{cat.skills.map((s) => s.name).join(', ')}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Experience */}
          <section className="space-y-4">
            <SectionHeading>Professional Experience</SectionHeading>
            <div className="space-y-5">
              {work.map((item) => (
                <article key={item.id} className={entry}>
                  <div className={metaRow}>
                    <h3 className={roleText}>{item.role}</h3>
                    <span className={periodText}>{item.period}</span>
                  </div>
                  <p className={orgText}>
                    {item.company} <span className="font-medium text-[#6b4730] print:text-black">· {item.location}</span>
                  </p>
                  <p className={bodyText}>{item.summary}</p>
                  <ul className="space-y-1 pt-0.5">
                    {item.bullets.map((b, bIdx) => (
                      <Bullet key={bIdx}>{b}</Bullet>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="space-y-4">
            <SectionHeading>Key Projects</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {cvData.projects.map((proj) => (
                <article key={proj.id} className={entry}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={roleText}>{proj.title}</h3>
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${proj.title} source code`}
                        className={`${linkCls} text-[#6b4730] p-0.5 print-hidden`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className={orgText}>{proj.tagline}</p>
                  <p className={bodyText}>{proj.description}</p>
                  <ul className="flex flex-wrap gap-1.5 pt-0.5" aria-label="Technologies">
                    {proj.tags.map((t) => (
                      <li
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#f6ecd6] text-[#5c4033] border border-[#2b1d16]/15 font-semibold print:bg-transparent print:text-black print:border-black/30"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="space-y-4">
            <SectionHeading>Education</SectionHeading>
            <div className="space-y-4">
              {education.map((item) => (
                <article key={item.id} className={entry}>
                  <div className={metaRow}>
                    <h3 className={roleText}>{item.role}</h3>
                    <span className={periodText}>{item.period}</span>
                  </div>
                  <p className={orgText}>
                    {item.company} <span className="font-medium text-[#6b4730] print:text-black">· {item.location}</span>
                  </p>
                  <p className={bodyText}>{item.summary}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Leadership */}
          {cvData.leadership && (
            <section className="space-y-4">
              <SectionHeading>Leadership &amp; Responsibilities</SectionHeading>
              <div className="space-y-4">
                {cvData.leadership.map((l, lIdx) => (
                  <article key={lIdx} className={entry}>
                    <div className={metaRow}>
                      <h3 className={roleText}>{l.role}</h3>
                      <span className={periodText}>{l.period}</span>
                    </div>
                    <p className={orgText}>{l.org}</p>
                    <ul className="space-y-1 pt-0.5">
                      {l.bullets.map((b, bIdx) => (
                        <Bullet key={bIdx}>{b}</Bullet>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
