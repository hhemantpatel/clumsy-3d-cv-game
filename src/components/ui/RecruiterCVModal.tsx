import React from 'react';
import { useGame } from '../../context/GameContext';
import { cvData } from '../../data/cvData';
import { X, Printer, Mail, MapPin, Globe, Github, Linkedin, ExternalLink, Phone, Award } from 'lucide-react';

export const RecruiterCVModal: React.FC = () => {
  const { activeModal, closeModal } = useGame();

  if (activeModal !== 'recruiter') return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Dark Saddle Leather & Brass Folio Outer Casing */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col font-sans select-none">
        {/* Brass Corner Brackets */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

        {/* Tactile Crimson Wax Seal Close Button */}
        <button
          onClick={closeModal}
          className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
          title="Close [ESC]"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Header Stamped Banner Plate */}
        <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                  OFFICIAL DOSSIER • RECRUITER 2D CV
                </span>
                <span className="text-amber-500">•</span>
                <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
              </div>
              <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
                AIRMAIL POSTAL DISPATCH • SCHOLAR RECORD
              </h2>
              <p className="text-xs text-amber-200/80 font-medium">
                Verified Candidate Portfolio • Systems & Machine Learning Engineer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Resume Content (Warm Parchment in Web View, Crisp Clean in Print Mode) */}
        <div className="relative flex-1 bg-[#fbf7ee] rounded-2xl p-6 sm:p-8 overflow-y-auto space-y-8 border border-[#dfceb5] shadow-inner text-[#451a03] print:bg-white print:p-0 print:text-black">
          {/* Subtle Draft Dot Texture */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-25"
            style={{
              backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
              backgroundSize: '20px 20px',
            }}
          />
          {/* Header Banner with Postmark Stamp */}
          <div className="border-b-2 border-[#fed7aa] pb-6 space-y-3 relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black font-serif text-[#451a03] tracking-tight">
                  {cvData.name}
                </h1>
                <p className="text-base font-bold text-[#b45309] pt-0.5">{cvData.title}</p>
              </div>

              {/* Vintage Ink Cancellation Postmark Stamp */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1e293b]/50 -rotate-12 flex items-center justify-center text-center p-1 pointer-events-none self-end sm:self-auto">
                <div className="w-20 h-20 rounded-full border border-[#1e293b]/30 flex flex-col items-center justify-center text-[7px] font-mono font-bold uppercase text-[#1e293b]/80">
                  <span>★ IIT JODHPUR ★</span>
                  <span className="font-sans font-black text-[9px] text-[#b45309]">2026</span>
                  <span>VERIFIED RECORD</span>
                </div>
              </div>
            </div>

            {/* Postal Coordinates & Contact Links */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-mono text-[#57534e]">
              <span className="flex items-center gap-1.5 font-sans font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#d97706]" />
                {cvData.location}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#451a03]">
                <Mail className="w-3.5 h-3.5 text-[#d97706]" />
                {cvData.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#059669]" />
                {cvData.phone}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-sans font-semibold pt-1">
              <a
                href={cvData.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#78350f] hover:text-[#b45309] transition"
              >
                <Github className="w-3.5 h-3.5" />
                <span>github.com/hhemantpatel</span>
              </a>
              <a
                href={cvData.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#0284c7] hover:text-[#0369a1] transition"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>linkedin.com/in/hemant-patel</span>
              </a>
            </div>

            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed pt-2 font-serif italic">
              {cvData.bioShort}
            </p>
          </div>

          {/* 1. Technical Core Competencies */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#78350f] flex items-center gap-2">
              <span>📋</span>
              <span>Technical Core Competencies</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              {cvData.skillCategories.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#faf5eb] border-2 border-[#fed7aa] shadow-xs">
                  <p className="font-extrabold text-[#451a03] mb-1">{cat.category}</p>
                  <p className="text-[#57534e] leading-relaxed">
                    {cat.skills.map((s) => s.name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Professional Work Experience */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#78350f] flex items-center gap-2">
              <span>💼</span>
              <span>Professional Experience</span>
            </h2>
            <div className="space-y-3 font-sans">
              {cvData.timeline
                .filter((item) => item.type === 'work')
                .map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-[#faf5eb] border-2 border-[#fed7aa] shadow-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-sm font-black text-[#451a03]">{item.role}</p>
                      <span className="text-xs font-mono font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-0.5 rounded-full border border-[#fde68a] w-fit">
                        {item.period}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#b45309]">
                      {item.company} • <span className="text-[#78716c] font-normal">{item.location}</span>
                    </p>
                    <p className="text-xs text-[#57534e]">{item.summary}</p>
                    <ul className="space-y-1 pt-1">
                      {item.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="text-xs text-[#44403c] flex items-start gap-2">
                          <span className="text-[#d97706] font-bold">◈</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>

          {/* 3. Featured Projects & Systems */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#78350f] flex items-center gap-2">
              <span>🚀</span>
              <span>Key Projects & Systems</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              {cvData.projects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-xl bg-[#faf5eb] border-2 border-[#fed7aa] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#451a03]">{proj.title}</p>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-[#78350f] hover:text-[#b45309]">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#d97706]">{proj.tagline}</p>
                  <p className="text-xs text-[#57534e] leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-[#fffdfa] text-[#78350f] border border-[#fed7aa] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Education */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#78350f] flex items-center gap-2">
              <span>🎓</span>
              <span>Academic Residency</span>
            </h2>
            <div className="space-y-3 font-sans">
              {cvData.timeline
                .filter((item) => item.type === 'education')
                .map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-[#faf5eb] border-2 border-[#fed7aa] shadow-xs">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-[#451a03]">{item.role}</p>
                      <span className="text-xs font-mono font-bold text-[#b45309]">{item.period}</span>
                    </div>
                    <p className="text-xs font-bold text-[#b45309]">{item.company} • {item.location}</p>
                    <p className="text-xs text-[#57534e] pt-1">{item.summary}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* 5. Leadership & Positions of Responsibility */}
          {cvData.leadership && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#78350f] flex items-center gap-2">
                <span>🏆</span>
                <span>Leadership & Positions of Responsibility</span>
              </h2>
              <div className="space-y-3 font-sans">
                {cvData.leadership.map((l, lIdx) => (
                  <div key={lIdx} className="p-4 rounded-xl bg-[#faf5eb] border-2 border-[#fed7aa] shadow-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-[#451a03]">{l.role}</p>
                      <span className="text-xs font-mono font-bold text-[#b45309]">{l.period}</span>
                    </div>
                    <p className="text-xs font-bold text-[#d97706]">{l.org}</p>
                    <ul className="space-y-1 pt-1">
                      {l.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="text-xs text-[#44403c] flex items-start gap-2">
                          <span className="text-[#d97706] font-bold">◈</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
