import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { cvData, Project } from '../../data/cvData';
import {
  X,
  ExternalLink,
  Github,
  Mail,
  Copy,
  Check,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Code2,
  Server,
  Layout,
  Wrench,
  ChevronRight,
  Sparkles,
  MapPin,
  Phone,
  FileCode,
  Flame,
  Star,
  Palette,
  PenTool,
  BookOpen,
  Compass,
  Feather,
  Trophy,
  Flag,
  Milestone,
  Navigation,
  Route,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Droplets,
  Bot,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/audio';
import { AutomatonGardenWindow } from './AutomatonGardenWindow';

export const Modals: React.FC = () => {
  const { activeModal, closeModal } = useGame();

  if (!activeModal || activeModal === 'recruiter') return null;

  // Automaton Garden floating window overlays the live 3D farm directly without a dark backdrop
  if (activeModal === 'badminton') {
    return <AutomatonGardenWindow onClose={closeModal} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Render dedicated game artifact layout for each active modal */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {activeModal === 'contact' && <ContactPostcardModal onClose={closeModal} />}
        {activeModal === 'projects' && <ProjectsBinderModal onClose={closeModal} />}
        {activeModal === 'skills' && <SkillsGrimoireModal onClose={closeModal} />}
        {activeModal === 'experience' && <ExperiencePassportModal onClose={closeModal} />}
        {activeModal === 'about' && <AboutFieldJournalModal onClose={closeModal} />}
        {activeModal === 'bed' && <CatSanctuaryModal onClose={closeModal} />}
      </div>
    </div>
  );
};

/* =========================================================================================
   1. CONTACT: AUTHENTIC VINTAGE AIRMAIL POSTCARD FOLIO
   Arrangement: Unified saddle leather folio casing with brass corners, stamped header,
   and authentic vintage postcard spread with personal dispatch, stamps, and address lines.
   ========================================================================================= */
const ContactPostcardModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(cvData.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-4xl bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Tactile Crimson Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Fold Postcard [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Banner Plate */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Mail className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                POSTAL DISPATCH • OFFICIAL DESK
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              POSTAL MAILBOX & TRAVELER'S CORRESPONDENCE
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Direct Airmail Dispatch, Academic Inbox & Professional Networks
            </p>
          </div>
        </div>

        {/* Postal Zone Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#2a170e]/80 border border-amber-600/40 px-3.5 py-1.5 rounded-xl shadow-xs text-right">
          <MapPin className="w-4 h-4 text-amber-400" />
          <div className="text-[10px] font-mono text-amber-300 uppercase leading-tight font-bold">
            <p>Zone: RAJ-IN-342037</p>
            <p className="text-amber-400/70">Postal Dispatch</p>
          </div>
        </div>
      </div>

      {/* Postcard Inner Container */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-6 border border-[#dfceb5] shadow-inner flex flex-col md:flex-row gap-6">
        {/* Subtle Paper Texture */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Airmail Banner Ribbon */}
        <div className="absolute top-2 left-6 text-[10px] sm:text-[11px] font-sans font-black tracking-[0.25em] text-[#dc2626] uppercase flex items-center gap-2">
          <span>PAR AVION</span>
          <span>•</span>
          <span>AIR MAIL POSTAL DISPATCH</span>
        </div>

        {/* ================= LEFT HALF: THE PERSONAL DISPATCH ================= */}
        <div className="flex-1 pt-6 flex flex-col justify-between border-b md:border-b-0 md:border-r-2 border-dashed border-[#d97706]/40 pb-4 md:pb-0 md:pr-6 space-y-4">
          <div className="space-y-3 font-serif">
            <p className="text-xs sm:text-sm font-bold text-[#78350f] italic">
              To the Traveler visiting my yard & workshop,
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#57534e]">
              Thank you for stopping by! I am <strong className="text-[#451a03]">Hemant Patel</strong>, an engineer
              and researcher at <strong className="text-[#b45309]">IIT Jodhpur</strong> specializing in high-performance
              systems (Rust & WebAssembly), machine learning pipelines, and interactive 3D simulations.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#57534e]">
              Whether you represent an innovative engineering team, want to collaborate on open-source projects, or
              just want to discuss game physics and deep learning, my postal inbox is always open.
            </p>
            <div className="pt-2">
              <p className="text-xs text-[#78350f] italic">Warmest regards from the cottage,</p>
              <p className="text-base sm:text-lg font-black text-[#451a03] font-serif tracking-tight">Hemant Patel</p>
              <p className="text-[10px] font-sans font-bold text-[#b45309]">B.Tech Scholar • IIT Jodhpur</p>
            </div>
          </div>

          {/* Gold Embossed IIT Jodhpur Official Seal */}
          <div className="pt-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-amber-600/70 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 flex items-center justify-center shadow-md text-xl">
              🎓
            </div>
            <div className="text-[10px] font-sans uppercase font-black text-[#92400e] leading-tight tracking-wider">
              <p>Official Scholar Seal</p>
              <p className="text-[#78350f]">Indian Institute of Technology</p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT HALF: POSTAGE STAMPS & ADDRESS LINES ================= */}
        <div className="flex-1 pt-2 flex flex-col justify-between space-y-5">
          {/* Top Right: Postage Stamps & Circular Postmark Stamp */}
          <div className="flex items-start justify-between">
            {/* Airmail Delivery Badge */}
            <div className="border border-[#b45309]/50 bg-[#fffbeb] px-3 py-1.5 rounded-lg text-center shadow-xs">
              <p className="text-[9px] font-sans font-black uppercase text-[#92400e] tracking-wider">Postal Zone</p>
              <p className="text-xs font-mono font-bold text-[#451a03]">RAJ-IN-342037</p>
            </div>

            {/* Two Perforated Postage Stamps + Postmark Overlay */}
            <div className="relative flex items-center gap-2">
              {/* Stamp 1: Green Garden Tree */}
              <div className="w-16 h-18 bg-[#dcfce7] border-2 border-dashed border-[#16a34a] rounded-sm p-1.5 shadow-sm text-center flex flex-col justify-between">
                <span className="text-xl leading-none">🌲</span>
                <span className="text-[8px] font-sans font-black text-[#15803d] uppercase tracking-tighter">
                  Garden • 25¢
                </span>
              </div>
              {/* Stamp 2: Gold IIT Crest */}
              <div className="w-16 h-18 bg-[#fef3c7] border-2 border-dashed border-[#d97706] rounded-sm p-1.5 shadow-sm text-center flex flex-col justify-between">
                <span className="text-xl leading-none">⚡</span>
                <span className="text-[8px] font-sans font-black text-[#b45309] uppercase tracking-tighter">
                  Rust • 50¢
                </span>
              </div>
              {/* Circular Postmark Cancellation Ink Stamp */}
              <div className="absolute -left-4 -top-1 w-20 h-20 rounded-full border-2 border-dashed border-[#1e293b]/60 -rotate-12 flex items-center justify-center pointer-events-none text-center">
                <div className="w-16 h-16 rounded-full border border-[#1e293b]/40 flex flex-col items-center justify-center text-[7px] font-mono font-bold uppercase text-[#1e293b]/80">
                  <span>★ JODHPUR ★</span>
                  <span className="font-sans font-black">21 OCT 2026</span>
                  <span>DISPATCHED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Classic Ruled Postcard Address Lines */}
          <div className="space-y-3 font-sans">
            <div className="border-b border-[#b45309]/40 pb-1 flex items-baseline justify-between text-xs">
              <span className="text-[10px] font-bold text-[#92400e] uppercase tracking-wider">Recipient Name:</span>
              <span className="font-bold text-[#451a03] font-serif text-sm">Hemant Patel</span>
            </div>

            {/* Direct Email Address Line with Tactile Stamp Button */}
            <div className="border-b border-[#b45309]/40 pb-1 flex items-center justify-between gap-2">
              <div>
                <span className="text-[9px] font-bold text-[#92400e] uppercase tracking-wider block">Direct Email:</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-[#451a03]">{cvData.email}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="px-3 py-1.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white border-b-2 border-[#92400e] active:border-b-0 active:translate-y-0.5 text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Stamp'}</span>
              </button>
            </div>

            <div className="border-b border-[#b45309]/40 pb-1 flex items-baseline justify-between text-xs">
              <span className="text-[10px] font-bold text-[#92400e] uppercase tracking-wider">Academic Mail:</span>
              <span className="font-mono font-semibold text-[#57534e] text-xs">{cvData.iitEmail}</span>
            </div>

            <div className="border-b border-[#b45309]/40 pb-1 flex items-baseline justify-between text-xs">
              <span className="text-[10px] font-bold text-[#92400e] uppercase tracking-wider">Phone / WhatsApp:</span>
              <span className="font-mono font-bold text-[#451a03] text-xs">{cvData.phone}</span>
            </div>
          </div>

          {/* Postal Baggage Dispatches (GitHub & LinkedIn) */}
          <div className="grid grid-cols-2 gap-3 pt-1 font-sans">
            <a
              href={cvData.github}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-[#fffdfa] border-2 border-[#fed7aa] hover:border-[#b45309] shadow-xs hover:shadow-md flex items-center gap-2.5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#78350f] text-[#fef3c7] flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                <Github className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-[#451a03] truncate">GitHub Postal</p>
                <p className="text-[10px] text-[#78716c] truncate">Browse repos</p>
              </div>
            </a>

            <a
              href={cvData.linkedin}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-[#fffdfa] border-2 border-[#fed7aa] hover:border-[#b45309] shadow-xs hover:shadow-md flex items-center gap-2.5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-[#451a03] truncate">LinkedIn Express</p>
                <p className="text-[10px] text-[#78716c] truncate">Connect profile</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   2. PROJECTS: TWO-PAGE OPEN FIELD BINDER / LOGBOOK WITH SIDE INDEX TABS
   Arrangement: Side-by-side two-page spread with center binder rings.
   Right edge has physical protruding bookmark tabs.
   Left Page: Numbered project index & blueprint schematic.
   Right Page: Full project dossier with architecture specs & physical cartridge launch buttons.
   ========================================================================================= */
const ProjectsBinderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(cvData.projects[0]?.id || '');

  const tabs = [
    { key: 'all', label: 'All Builds' },
    { key: 'PyTorch', label: 'AI & ML' },
    { key: 'Rust', label: 'Rust WASM' },
    { key: 'Computer Vision', label: 'Vision' },
    { key: 'Chemistry', label: 'Chemistry' },
  ];

  const filteredProjects =
    filter === 'all'
      ? cvData.projects
      : cvData.projects.filter((p) => p.tags.some((t) => t.toLowerCase() === filter.toLowerCase()));

  const activeProject = cvData.projects.find((p) => p.id === selectedId) || filteredProjects[0] || cvData.projects[0];

  return (
    <div className="relative w-full max-w-5xl bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Tactile Crimson Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Close Archive [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Banner Plate */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col md:flex-row items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Code2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                ENGINEERING SCHEMATICS • ARCHIVAL DOSSIER
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              VOLUME IV: PRODUCTION SYSTEMS & RESEARCH BUILDS
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Bare-Metal Rust WASM, Deep Neural Networks & High-Throughput Graphics
            </p>
          </div>
        </div>

        {/* Filter Pills in Header */}
        <div className="flex flex-wrap items-center justify-center gap-1 bg-[#2a170e]/80 border border-amber-600/40 p-1.5 rounded-xl shrink-0">
          {tabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-sm font-black'
                    : 'bg-transparent text-amber-200/70 border-transparent hover:text-white hover:bg-amber-900/30'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inner Parchment Container */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#dfceb5] shadow-inner text-[#451a03]">
        {/* Subtle Draft Dot Texture */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Two-Column Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[460px]">
          {/* Left Column: Blueprint Index Roster (Cols 1-5) */}
          <div className="md:col-span-5 bg-[#faf5eb] rounded-xl p-3.5 sm:p-4 border border-[#e5d5be] shadow-inner flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#d97706]/30 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#92400e]">
                  Index of Blueprints
                </span>
                <span className="text-[10px] font-mono font-bold text-[#78350f]">
                  {filteredProjects.length} Entries
                </span>
              </div>

              {/* Project Directory List */}
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                {filteredProjects.map((p, idx) => {
                  const isSelected = p.id === activeProject.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#d97706] text-white border-[#92400e] shadow-md font-bold'
                          : 'bg-[#fffdfa] text-[#451a03] border-[#fed7aa] hover:bg-[#fef3c7] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-200' : 'text-[#b45309]'}`}>
                          0{idx + 1}.
                        </span>
                        <span className="truncate">{p.title}</span>
                      </div>
                      {p.featured && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                            isSelected ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-[#b45309]'
                          }`}
                        >
                          ★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Blueprint Schematic Preview */}
            <div className="p-3 rounded-xl bg-[#fffdfa] border-2 border-dashed border-[#d97706]/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase font-black text-[#92400e]">Blueprint Schematic</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  VERIFIED BUILD
                </span>
              </div>
              <p className="text-xs font-bold text-[#451a03]">{activeProject.title}</p>
              <p className="text-[11px] text-[#78716c] leading-relaxed line-clamp-2">{activeProject.tagline}</p>
            </div>
          </div>

          {/* Center Divider on Desktop */}
          <div className="hidden md:flex md:col-span-1 flex-col items-center justify-around py-4 opacity-30">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-3.5 h-5 rounded-full border-2 border-[#78350f] bg-[#d97706]/20 shadow-inner my-1"
              />
            ))}
          </div>

          {/* Right Column: Detailed Dossier (Cols 7-12) */}
          <div className="md:col-span-6 bg-[#faf5eb] rounded-xl p-4 sm:p-5 border border-[#e5d5be] shadow-inner flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#451a03] font-serif tracking-tight">
                    {activeProject.title}
                  </h3>
                  <p className="text-xs font-bold text-[#d97706] pt-0.5">{activeProject.tagline}</p>
                </div>
                {activeProject.featured && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#f59e0b] shadow-xs">
                    Featured
                  </span>
                )}
              </div>

              <p className="text-xs text-[#57534e] leading-relaxed">{activeProject.description}</p>

              {/* Technical Specifications */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-black uppercase text-[#92400e] tracking-wider">Architecture Specs:</p>
                <ul className="space-y-1">
                  {activeProject.highlights.map((h, i) => (
                    <li key={i} className="text-[11px] text-[#44403c] flex items-start gap-1.5 leading-snug">
                      <span className="text-[#d97706] font-bold">◈</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack Pills */}
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-[#92400e] tracking-wider pb-1">
                  Tech Stack Ingredients:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#fffdfa] text-[#78350f] border border-[#fed7aa] font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Physical Launch Buttons */}
            <div className="pt-3 border-t border-[#d97706]/30 flex items-center gap-3">
              {activeProject.liveUrl && (
                <a
                  href={activeProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#059669] hover:bg-[#10b981] text-white border-b-4 border-[#047857] active:border-b-0 active:translate-y-1 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Live Demo</span>
                </a>
              )}
              {activeProject.githubUrl && (
                <a
                  href={activeProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#78350f] hover:bg-[#92400e] text-[#fef3c7] border-b-4 border-[#451a03] active:border-b-0 active:translate-y-1 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Inspect Source</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   3. SKILLS: RPG CHARACTER STAT SHEET & 3-COLUMN DISCIPLINE SCROLLS
   Arrangement: Character class header, 3 distinct discipline scrolls side-by-side with
   RPG stars (★★★★★), numeric seals, and passive trait perk banner.
   ========================================================================================= */
const SkillsGrimoireModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="relative w-full max-w-5xl bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Tactile Crimson Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Close Grimoire [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Banner Plate */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                SCHOLAR ARSENAL • DISCIPLINE CODEX
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              SYSTEMS CRAFTSMAN & MACHINE INTELLIGENCE CODEX
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Scholar: Hemant Patel • Academic Mastery & Technical Competencies
            </p>
          </div>
        </div>

        {/* Guild Level Badge */}
        <div className="flex items-center gap-2 bg-[#2a170e]/80 border border-amber-600/40 px-3.5 py-1.5 rounded-xl shadow-xs text-right">
          <Award className="w-4 h-4 text-amber-400" />
          <div className="text-[10px] font-mono text-amber-300 uppercase leading-tight font-bold">
            <p>Guild Rank: Senior Scholar</p>
            <p className="text-amber-400/70">Final Year B.Tech • 8.65 CGPA</p>
          </div>
        </div>
      </div>

      {/* Inner Parchment Container */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-6 border border-[#dfceb5] shadow-inner text-[#451a03]">
        {/* Subtle Draft Dot Texture */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 space-y-4">
          {/* 3 Dedicated Discipline Scrolls Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scroll 1: AI & ML */}
            <div className="p-4 rounded-xl bg-[#faf5eb] border border-[#e5d5be] shadow-inner space-y-3">
              <div className="flex items-center gap-2 border-b border-[#fed7aa] pb-2">
                <div className="p-1.5 rounded-lg bg-[#fef3c7] text-[#d97706] text-sm">🧠</div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#78350f]">Machine Intelligence</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'PyTorch / Deep Learning', stars: '★★★★★', pct: 95 },
                  { name: 'Reinforcement Learning', stars: '★★★★☆', pct: 88 },
                  { name: 'Computer Vision', stars: '★★★★☆', pct: 86 },
                  { name: 'Molecular GNNs (Chem)', stars: '★★★★☆', pct: 85 },
                  { name: 'Python Ecosystem', stars: '★★★★★', pct: 96 },
                ].map((s) => (
                  <div key={s.name} className="space-y-0.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#451a03] text-[11px]">{s.name}</span>
                      <span className="font-mono text-amber-700 text-[11px]">{s.stars}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#fef3c7] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll 2: Systems & WASM */}
            <div className="p-4 rounded-xl bg-[#faf5eb] border border-[#e5d5be] shadow-inner space-y-3">
              <div className="flex items-center gap-2 border-b border-[#fed7aa] pb-2">
                <div className="p-1.5 rounded-lg bg-[#ecfdf5] text-[#059669] text-sm">⚙️</div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#065f46]">Systems & Core Engine</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'Rust & WebAssembly', stars: '★★★★★', pct: 92 },
                  { name: 'C / C++ Systems', stars: '★★★★☆', pct: 82 },
                  { name: 'Linux Internals / POSIX', stars: '★★★★★', pct: 90 },
                  { name: 'Physics & Collision Sim', stars: '★★★★☆', pct: 88 },
                  { name: 'Docker / Containered Env', stars: '★★★★☆', pct: 80 },
                ].map((s) => (
                  <div key={s.name} className="space-y-0.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#451a03] text-[11px]">{s.name}</span>
                      <span className="font-mono text-emerald-700 text-[11px]">{s.stars}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#ecfdf5] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll 3: Web & Architecture */}
            <div className="p-4 rounded-xl bg-[#faf5eb] border border-[#e5d5be] shadow-inner space-y-3">
              <div className="flex items-center gap-2 border-b border-[#fed7aa] pb-2">
                <div className="p-1.5 rounded-lg bg-[#eff6ff] text-[#2563eb] text-sm">🌐</div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1e40af]">3D & Full-Stack</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'TypeScript / Modern JS', stars: '★★★★★', pct: 94 },
                  { name: 'React / Three.js / R3F', stars: '★★★★★', pct: 92 },
                  { name: 'Node.js & API Design', stars: '★★★★☆', pct: 84 },
                  { name: 'Tailwind CSS UI', stars: '★★★★★', pct: 95 },
                  { name: 'PostgreSQL / SQL', stars: '★★★★☆', pct: 80 },
                ].map((s) => (
                  <div key={s.name} className="space-y-0.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#451a03] text-[11px]">{s.name}</span>
                      <span className="font-mono text-blue-700 text-[11px]">{s.stars}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#eff6ff] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Specialty Trait Perk Banner */}
          <div className="p-3.5 rounded-xl bg-[#faf5eb] border border-[#e5d5be] shadow-inner flex items-center gap-3 text-xs">
            <span className="text-xl">✨</span>
            <p className="text-[#78350f] leading-snug">
              <strong className="text-[#451a03]">Signature Trait: Cross-Stack Synthesis.</strong> Capable of writing bare-metal
              Rust WASM physics at 60 FPS, architecting rich 3D graphics in Three.js, and training deep neural networks in PyTorch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   4. EXPERIENCE: EXPEDITION TRAIL MAP & CHECKPOINTS TIMELINE
   Physical Format: Topographic Route Map with a connected vertical expedition trail,
   numbered checkpoint waypoints (Checkpoint 01 Origin -> Checkpoint 02 Citadel -> Checkpoint 03 Basecamp),
   cartographic legend, terrain zones, and campus leadership outposts.
   ========================================================================================= */
const ExperiencePassportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="relative w-full max-w-4xl bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Tactile Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Fold Map [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Cartographic Banner */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Compass className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                CARTOGRAPHIC SURVEY • TRAIL MAP
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              EXPEDITION ROUTE & CHECKPOINTS TIMELINE
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Milestone Waypoints from Secondary School Foundation to Industry Residency
            </p>
          </div>
        </div>

        {/* Route Coordinates Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#2a170e]/80 border border-amber-600/40 px-3.5 py-1.5 rounded-xl shadow-xs text-right">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <div className="text-[10px] font-mono text-amber-300 uppercase leading-tight font-bold">
            <p>26°14' N, 73°01' E</p>
            <p className="text-emerald-400">Expedition Active</p>
          </div>
        </div>
      </div>

      {/* Main Two-Page Map Spread */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#dfceb5] shadow-inner grid grid-cols-1 md:grid-cols-12 gap-5 max-h-[600px]">
        {/* Topographic Contour Overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* ================= LEFT PAGE: SURVEYOR FOLIO & MAP LEGEND (Cols 1-4) ================= */}
        <div className="relative z-10 md:col-span-4 flex flex-col justify-between space-y-3.5 border-b md:border-b-0 md:border-r-2 border-dashed border-[#b45309]/30 pb-4 md:pb-0 md:pr-4">
          <div className="space-y-3">
            {/* Explorer Profile Badge */}
            <div className="bg-[#fffdfa] rounded-xl p-3 border border-[#fed7aa] shadow-xs text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 border-2 border-amber-800 shadow-md flex items-center justify-center text-3xl">
                🧑‍💻
              </div>
              <div>
                <h3 className="font-black text-[#451a03] font-serif text-base">Hemant Patel</h3>
                <p className="text-[11px] font-bold text-[#b45309]">Software & AI Engineer</p>
                <p className="text-[10px] text-[#78716c]">B.Tech Scholar • IIT Jodhpur</p>
              </div>
            </div>

            {/* Cartographic Map Legend */}
            <div className="bg-[#fffdfa] rounded-xl p-3 border border-[#fed7aa] shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-[#fed7aa] text-[10px] font-mono font-black uppercase text-[#92400e]">
                <Route className="w-3.5 h-3.5" />
                <span>Map Trail Legend</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-[#065f46]">Checkpoint 03:</span>
                  <span className="text-[#78716c]">Active Basecamp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-[#b45309]">Checkpoint 02:</span>
                  <span className="text-[#78716c]">Academic Citadel</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-500" />
                  <span className="font-bold text-[#44403c]">Checkpoint 01:</span>
                  <span className="text-[#78716c]">Origin Outpost</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-bold text-[#6b21a8]">Forward Camps:</span>
                  <span className="text-[#78716c]">Campus Leadership</span>
                </div>
              </div>
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-[#fffdfa] border border-[#fed7aa]">
                <p className="text-[#92400e] font-bold">TOTAL TRAIL</p>
                <p className="text-xs font-black text-[#451a03]">6+ Years</p>
              </div>
              <div className="p-2 rounded-lg bg-[#fffdfa] border border-[#fed7aa]">
                <p className="text-[#92400e] font-bold">WAYPOINTS</p>
                <p className="text-xs font-black text-[#451a03]">5 Logged</p>
              </div>
            </div>
          </div>

          {/* Official IIT Jodhpur Golden Wax Stamp */}
          <div className="p-2.5 rounded-xl bg-[#fef3c7] border-2 border-dashed border-[#d97706]/50 text-center">
            <p className="text-[9px] font-mono font-black uppercase text-[#92400e]">Institutional Route Seal</p>
            <p className="text-xs font-serif font-black text-[#78350f]">IIT JODHPUR • CERTIFIED ROUTE</p>
          </div>
        </div>

        {/* ================= RIGHT PAGE: TIMELINE ON A MAP (CHECKPOINTS) (Cols 5-12) ================= */}
        <div className="relative z-10 md:col-span-8 flex flex-col space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {/* Section Header */}
          <div className="sticky top-0 z-20 bg-[#fbf7ee]/95 backdrop-blur-xs flex items-center justify-between pb-2 border-b border-[#b45309]/20">
            <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-[#92400e]">
              <Milestone className="w-4 h-4 text-amber-700" />
              <span>Survey Trail: Checkpoint Sequence</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
              SOUTH TO NORTH TRAIL
            </span>
          </div>

          {/* Connected Expedition Route Line Container */}
          <div className="relative pl-9 sm:pl-11 space-y-6 pt-1">
            {/* The Vertical Dashed Map Route Line (Centered with Pins) */}
            <div className="absolute left-4 sm:left-5 top-5 bottom-5 w-0.5 border-l-2 border-dashed border-[#b45309]/60 pointer-events-none" />

            {/* ================= CHECKPOINT 03: CURRENT BASECAMP ================= */}
            <div className="relative space-y-2">
              {/* Checkpoint Map Pin Node - Exactly centered on dashed trail line */}
              <div className="absolute left-[-24px] sm:left-[-28px] top-2 z-10 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-black">
                <Flag className="w-4 h-4 fill-current" />
                <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-40 pointer-events-none" />
              </div>

              {/* Checkpoint Card */}
              <div className="p-4 rounded-2xl bg-[#fffdfa] border-2 border-emerald-500/70 shadow-sm space-y-2 hover:border-emerald-600 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-dashed border-[#fed7aa]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-black text-[9px] uppercase tracking-wide">
                      CHECKPOINT 03 • ACTIVE BASECAMP
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                    Jan. 2026 -- Present
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-[#451a03]">Software Developer Intern</h4>
                  <p className="text-xs font-bold text-[#065f46]">
                    CoralDune Partners • <span className="text-[#78716c] font-normal">Remote / Hybrid Residency</span>
                  </p>
                </div>

                <p className="text-xs text-[#57534e] leading-relaxed">
                  Building production document-intelligence RAG pipelines, Rust backend microservices, and high-performance React user interfaces.
                </p>

                {/* Waypoint Field Logs */}
                <ul className="space-y-1 pt-1 text-xs text-[#44403c]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">◈</span>
                    <span>Architected scalable React interfaces with reusable components, custom hooks, and Context API across dashboards.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">◈</span>
                    <span>Engineered production RAG pipeline integrating Docling for layout-aware PDF extraction and RRF comparison retrieval.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">◈</span>
                    <span>Developed Rust backend services for asynchronous document ingestion and SSE streaming APIs for AI operations.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">◈</span>
                    <span>Built fact-reconciliation comparison engine with JSON state stitching for 200+ page technical documents.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">◈</span>
                    <span>Resolved GPU VRAM contention between Docling/TableFormer and Qwen2.5-VL through pre-warming.</span>
                  </li>
                </ul>

                {/* Waypoint Terrain Tags */}
                <div className="pt-1.5 flex flex-wrap gap-1">
                  {["Python", "Rust", "React", "PostgreSQL", "Docker", "Docling", "RAG", "Qwen2.5-VL"].map((sk, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Transit Route Marker */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#92400e] pl-1">
              <span className="text-xs">▼</span>
              <span className="italic">Trail Transit: Higher Education Expedition (340 Leagues)</span>
            </div>

            {/* ================= CHECKPOINT 02: ACADEMIC CITADEL ================= */}
            <div className="relative space-y-2">
              {/* Checkpoint Map Pin Node */}
              <div className="absolute left-[-24px] sm:left-[-28px] top-2 z-10 w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-black">
                <GraduationCap className="w-4 h-4 fill-current" />
              </div>

              {/* Checkpoint Card */}
              <div className="p-4 rounded-2xl bg-[#fffdfa] border border-[#fed7aa] shadow-sm space-y-2 hover:border-amber-500/70 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-dashed border-[#fed7aa]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-black text-[9px] uppercase tracking-wide">
                      CHECKPOINT 02 • ACADEMIC CITADEL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] w-fit">
                    2023 -- 2027 (Present)
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-[#451a03]">B.Tech. in Chemical Engineering</h4>
                  <p className="text-xs font-bold text-[#b45309]">
                    Indian Institute of Technology Jodhpur (IIT Jodhpur) • <span className="text-[#78716c] font-normal">Rajasthan, India</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold">
                    CGPA: 7.52 / 10.0
                  </span>
                  <span className="text-[#78716c] text-[11px]">Core Reaction Engineering & AI Modeling</span>
                </div>

                {/* Waypoint Field Logs */}
                <ul className="space-y-1 pt-1 text-xs text-[#44403c]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">◈</span>
                    <span>Core Coursework: Chemical Reaction Engineering, Process Dynamics & Control, Heat & Mass Transfer, Molecular Modelling.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">◈</span>
                    <span>Undergraduate research in AI surrogate reactor modeling (ANFIS/LSTM) outperforming linear benchmarks.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">◈</span>
                    <span>Conducted all-atom molecular dynamics of borate ionic liquids in GROMACS on the PARAM Ananta supercomputer.</span>
                  </li>
                </ul>

                {/* Waypoint Terrain Tags */}
                <div className="pt-1.5 flex flex-wrap gap-1">
                  {["Process Control", "Molecular Dynamics", "AI Modelling", "Python", "GROMACS", "SciPy"].map((sk, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Transit Route Marker */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#92400e] pl-1">
              <span className="text-xs">▼</span>
              <span className="italic">Trail Transit: Foundation Passage (820 Leagues)</span>
            </div>

            {/* ================= CHECKPOINT 01: ORIGIN WAYPOINT ================= */}
            <div className="relative space-y-2">
              {/* Checkpoint Map Pin Node */}
              <div className="absolute left-[-24px] sm:left-[-28px] top-2 z-10 w-8 h-8 rounded-full bg-stone-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-black">
                <Milestone className="w-4 h-4 fill-current" />
              </div>

              {/* Checkpoint Card */}
              <div className="p-4 rounded-2xl bg-[#fffdfa] border border-[#fed7aa] shadow-sm space-y-2 hover:border-stone-500 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-dashed border-[#fed7aa]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-mono font-black text-[9px] uppercase tracking-wide">
                      CHECKPOINT 01 • ORIGIN WAYPOINT
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 w-fit">
                    2020 -- 2022
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-[#451a03]">Senior Secondary & Secondary (CBSE)</h4>
                  <p className="text-xs font-bold text-[#57534e]">
                    Central Board of Secondary Education • <span className="text-[#78716c] font-normal">India</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-1.5 rounded bg-stone-50 border border-stone-200 text-center">
                    <p className="text-[9px] text-[#78716c]">CLASS XII</p>
                    <p className="font-bold text-[#451a03]">89.6% (Distinction)</p>
                  </div>
                  <div className="p-1.5 rounded bg-stone-50 border border-stone-200 text-center">
                    <p className="text-[9px] text-[#78716c]">CLASS X</p>
                    <p className="font-bold text-[#451a03]">90.2% (Distinction)</p>
                  </div>
                </div>

                <p className="text-xs text-[#57534e]">
                  Qualified the prestigious national <strong>JEE Advanced</strong> examination, securing merit admission to the Indian Institute of Technology Jodhpur.
                </p>
              </div>
            </div>

            {/* ================= FORWARD OUTPOSTS: CAMPUS LEADERSHIP ================= */}
            <div className="pt-2 border-t border-dashed border-[#b45309]/30 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-black uppercase text-[#92400e]">
                <Flag className="w-3.5 h-3.5 text-purple-700" />
                <span>Expedition Forward Outposts (Leadership)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {cvData.leadership.map((lead, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#fffdfa] border border-[#fed7aa] shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-xs text-[#451a03]">{lead.role}</p>
                      <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        {lead.period}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-[#b45309]">{lead.org}</p>
                    <p className="text-[10px] text-[#57534e] leading-snug">{lead.bullets[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   5. ABOUT: ARTIST'S FIELD SKETCHBOOK & SCHOLAR JOURNAL
   Physical Format: Open horizontal sketchbook folio bound in stitched saddle leather,
   brass corner plates, left drafting page with hand-drawn cottage perspective study & graphite tools,
   and right journal page with personal narrative and athletic / artistic pursuits (Table Tennis, Drawing, etc.)
   ========================================================================================= */
const AboutFieldJournalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="relative w-full max-w-4xl bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Red Ribbon Bookmark Hanging from Bottom Edge */}
      <div className="absolute -bottom-4 right-16 z-10 w-7 h-11 bg-[#be123c] rounded-b-sm shadow-lg border-x border-b border-[#9f1239] flex items-end justify-center pb-1 pointer-events-none">
        <span className="text-[9px] font-mono text-amber-200/90 font-bold">★</span>
      </div>

      {/* Tactile Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Close Sketchbook [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Banner Plate */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Palette className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                STUDIO FOLIO • LOG NO. 04
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              ARTIST & EXPLORER'S FIELD SKETCHBOOK
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Hand-Drawn Studies, Campus Athletics & Engineering Foundations
            </p>
          </div>
        </div>

        {/* Studio Stamp Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#2a170e]/80 border border-amber-600/40 px-3.5 py-1.5 rounded-xl shadow-xs text-right">
          <PenTool className="w-4 h-4 text-amber-400" />
          <div className="text-[10px] font-mono text-amber-300 uppercase leading-tight font-bold">
            <p>Pencil & Code</p>
            <p className="text-amber-400/70">Verified Archive</p>
          </div>
        </div>
      </div>

      {/* Main Two-Page Open Sketchbook Spread */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#dfceb5] shadow-inner grid grid-cols-1 md:grid-cols-12 gap-5 max-h-[580px] overflow-y-auto">
        {/* Subtle Paper Drafting Texture Overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* ================= LEFT PAGE: DRAWING & PERSPECTIVE STUDY (Cols 1-5) ================= */}
        <div className="relative z-10 md:col-span-5 flex flex-col justify-between space-y-3.5 border-b md:border-b-0 md:border-r-2 border-dashed border-[#b45309]/30 pb-4 md:pb-0 md:pr-4">
          <div>
            {/* Header of Left Page */}
            <div className="flex items-center justify-between pb-2 border-b border-[#b45309]/20 mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
                <PenTool className="w-3.5 h-3.5" />
                <span>Perspective & Art Study</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                PLATE #14
              </span>
            </div>

            {/* Hand-Drawn Architectural Isometric Cottage Canvas */}
            <div className="relative bg-[#fffdfa] rounded-xl p-3 border-2 border-[#d6c4a8] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#78716c] pb-1 border-b border-dashed border-[#e7d8c3]">
                <span>Isometric Cottage & Garden</span>
                <span>45° Drafting Grid</span>
              </div>

              {/* Hand-Drafted SVG Drawing of Hemant's 3D World */}
              <svg viewBox="0 0 280 145" className="w-full h-auto my-1.5 text-[#3f2e1e]" fill="none" stroke="currentColor">
                {/* Drafting Guidelines */}
                <line x1="20" y1="125" x2="260" y2="125" stroke="#d5c4af" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="140" y1="20" x2="140" y2="125" stroke="#d5c4af" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="50" y1="75" x2="230" y2="75" stroke="#d5c4af" strokeWidth="0.5" strokeDasharray="2 2" />

                {/* Ground Stone Stepping Stones */}
                <ellipse cx="140" cy="120" rx="14" ry="4" stroke="#78350f" strokeWidth="1.2" fill="#faf5eb" />
                <ellipse cx="120" cy="126" rx="11" ry="3.5" stroke="#78350f" strokeWidth="1.2" fill="#faf5eb" />
                <ellipse cx="160" cy="126" rx="11" ry="3.5" stroke="#78350f" strokeWidth="1.2" fill="#faf5eb" />

                {/* Isometric Cottage Structure */}
                {/* Front Left Wall */}
                <polygon points="105,75 140,92 140,118 105,100" stroke="#451a03" strokeWidth="1.6" fill="#fefae0" />
                {/* Front Right Wall */}
                <polygon points="140,92 185,75 185,100 140,118" stroke="#451a03" strokeWidth="1.6" fill="#faedcd" />
                {/* Front Gable Triangle */}
                <polygon points="105,75 140,55 140,92" stroke="#451a03" strokeWidth="1.6" fill="#e9edc9" />
                {/* Roof Slopes */}
                <polygon points="140,55 180,38 215,55 185,75 140,92" stroke="#b45309" strokeWidth="1.6" fill="#fde68a" />
                {/* Chimney */}
                <polygon points="165,42 175,37 175,54 165,58" stroke="#78350f" strokeWidth="1.3" fill="#fed7aa" />
                {/* Door & Crossbeam */}
                <rect x="133" y="102" width="14" height="15" stroke="#78350f" strokeWidth="1.2" fill="#d97706" />
                {/* Window */}
                <rect x="113" y="83" width="12" height="10" stroke="#78350f" strokeWidth="1.1" fill="#e0f2fe" />

                {/* Garden Pine Trees (Hand-drawn cross-hatch style) */}
                {/* Left Pine */}
                <polygon points="65,45 50,75 80,75" stroke="#15803d" strokeWidth="1.4" fill="#dcfce7" />
                <polygon points="65,65 45,95 85,95" stroke="#15803d" strokeWidth="1.4" fill="#bbf7d0" />
                <line x1="65" y1="95" x2="65" y2="115" stroke="#78350f" strokeWidth="2.5" />

                {/* Right Pine */}
                <polygon points="225,50 212,78 238,78" stroke="#15803d" strokeWidth="1.4" fill="#dcfce7" />
                <polygon points="225,70 208,98 242,98" stroke="#15803d" strokeWidth="1.4" fill="#bbf7d0" />
                <line x1="225" y1="98" x2="225" y2="115" stroke="#78350f" strokeWidth="2.5" />

                {/* Hand-lettered Architectural Annotations */}
                <text x="75" y="32" fontSize="7" fontFamily="sans-serif" fontWeight="bold" fill="#78350f">
                  Isometric Cottage Study
                </text>
                <text x="188" y="35" fontSize="6" fontFamily="sans-serif" fill="#92400e">
                  Timber Rafters
                </text>
                <line x1="184" y1="34" x2="175" y2="40" stroke="#92400e" strokeWidth="0.8" />
              </svg>

              {/* Drawing Mediums & Shading Tool Swatches */}
              <div className="pt-1.5 border-t border-dashed border-[#e7d8c3] flex items-center justify-between text-[9px] font-mono text-[#78716c]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#451a03]">Mediums:</span>
                  <span>2B Graphite • Procreate • Vector</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1c1917]" title="6B Soft Graphite" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#57534e]" title="2B Graphite" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#a8a29e]" title="HB Hard" />
                </div>
              </div>
            </div>
          </div>

          {/* Academic & Scholar Credentials Plate */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
            <div className="p-2.5 rounded-xl bg-[#faf5eb] border border-[#fed7aa] shadow-xs">
              <p className="text-[9px] font-mono uppercase text-[#92400e] font-bold">Institution</p>
              <p className="font-black text-[#451a03] font-serif">IIT Jodhpur</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#faf5eb] border border-[#fed7aa] shadow-xs">
              <p className="text-[9px] font-mono uppercase text-[#92400e] font-bold">Tenure & CGPA</p>
              <p className="font-black text-[#b45309] font-mono">B.Tech '27 • 7.52</p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PAGE: PERSONAL PHILOSOPHY & PURSUITS (Cols 6-12) ================= */}
        <div className="relative z-10 md:col-span-7 flex flex-col justify-between space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#b45309]/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Studio Philosophy & Curiosities</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#b45309]">
              ACTIVE REPERTOIRE
            </span>
          </div>

          {/* Field Note Bio Narrative */}
          <div className="p-3.5 rounded-xl bg-[#fffdfa] border border-[#fed7aa] shadow-xs space-y-2 text-xs font-serif leading-relaxed text-[#57534e]">
            <p>
              <strong className="text-[#451a03] font-sans">"Engineering is the architecture of systems; visual art and athletic play keep the mind agile."</strong>
            </p>
            <p>
              At <strong className="text-[#b45309] font-sans">IIT Jodhpur</strong>, I combine rigorous software engineering (Rust microservices, React interfaces, RAG pipelines) with physical recreation and visual arts. Whether sketching perspective concepts, playing high-speed table tennis rallies, or editing video for campus festivals, curiosity and craftsmanship drive everything I do.
            </p>
          </div>

          {/* Curiosities & Pursuits Grid: Drawing, Table Tennis, Badminton, Media */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-sans font-black uppercase text-[#92400e] tracking-wider">
                Creative & Athletic Pursuits
              </h4>
              <span className="text-[10px] font-mono text-[#78716c]">4 Disciplines</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Drawing & Sketching (Featured) */}
              <div className="p-3 rounded-xl bg-[#fffdfa] border-2 border-amber-500/50 hover:border-amber-600 shadow-xs flex items-start gap-2.5 transition">
                <span className="text-2xl shrink-0">🎨</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-[#451a03]">Drawing & Sketching</p>
                    <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      Visual Art
                    </span>
                  </div>
                  <p className="text-[10px] text-[#78716c] leading-snug">
                    Pencil sketching, architectural line art, digital concept illustrations, and isometric perspective doodles.
                  </p>
                </div>
              </div>

              {/* 2. Table Tennis */}
              <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#fed7aa] hover:border-amber-500/60 shadow-xs flex items-start gap-2.5 transition">
                <span className="text-2xl shrink-0">🏓</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-[#451a03]">Table Tennis</p>
                    <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Athletics
                    </span>
                  </div>
                  <p className="text-[10px] text-[#78716c] leading-snug">
                    High-speed topspin rallies, agile footwork reaction drills, and campus hostel tournament matches.
                  </p>
                </div>
              </div>

              {/* 3. Badminton */}
              <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#fed7aa] hover:border-amber-500/60 shadow-xs flex items-start gap-2.5 transition">
                <span className="text-2xl shrink-0">🏸</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-[#451a03]">Badminton</p>
                    <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                      Court Sport
                    </span>
                  </div>
                  <p className="text-[10px] text-[#78716c] leading-snug">
                    Doubles court rallies, jump smashes, and competitive recreational play at the IIT Jodhpur sports complex.
                  </p>
                </div>
              </div>

              {/* 4. Media & Filmmaking */}
              <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#fed7aa] hover:border-amber-500/60 shadow-xs flex items-start gap-2.5 transition">
                <span className="text-2xl shrink-0">🎬</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-[#451a03]">Media & Filmmaking</p>
                    <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                      Leadership
                    </span>
                  </div>
                  <p className="text-[10px] text-[#78716c] leading-snug">
                    Head of Media at FrameX Club, cinematographic directing, and creative video editing for campus festivals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stamped Seal & Signature Footer */}
          <div className="pt-2 border-t border-[#b45309]/20 flex items-center justify-between text-[10px] font-mono text-[#78716c]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                ★
              </span>
              <span className="font-bold text-[#78350f]">OFFICIAL SCHOLAR JOURNAL • IIT JODHPUR</span>
            </div>
            {/* Red Artisan Chop Mark */}
            <div className="border border-[#b91c1c] text-[#b91c1c] px-2 py-0.5 rounded font-serif font-black text-[10px] tracking-wider -rotate-2">
              印 匠 • CRAFT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   6. BED & CAT: PET TAMAGOTCHI SANCTUARY NOOK
   ========================================================================================= */
const CatSanctuaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [happiness, setHappiness] = useState(100);
  const [lastAction, setLastAction] = useState('Byte is happily sleeping on the duvet.');

  const triggerAction = (actionText: string, emoji: string) => {
    setHappiness((prev) => prev + 5);
    setLastAction(actionText);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="relative w-full max-w-lg bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Tactile Crimson Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Tiptoe Away [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Banner Plate */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Heart className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                FELINE SANCTUARY • COTTAGE COMPANION
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              BYTE'S COZY HEARTH NOOK
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              90% Sleep, 10% Rust WASM Code Compilation Inspection
            </p>
          </div>
        </div>

        {/* Mood status */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#2a170e]/80 border border-amber-600/40 px-3 py-1.5 rounded-xl shadow-xs text-right">
          <span className="text-amber-400 text-xs">♥</span>
          <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">100% Bliss</span>
        </div>
      </div>

      {/* Parchment Inner Container */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#dfceb5] shadow-inner text-center space-y-4">
        {/* Subtle Draft Dot Texture */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 space-y-3.5">
          {/* Sleeping Cat Illustrated Avatar */}
          <div className="p-3.5 rounded-xl bg-[#faf5eb] border border-[#e5d5be] shadow-inner max-w-xs mx-auto space-y-1">
            <div className="text-5xl animate-bounce py-1">🐱</div>
            <div className="text-xs font-bold text-[#b45309] font-mono">(=^･ω･^=) *purrrr* • Fast Asleep</div>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-black text-[#451a03] font-serif">Byte the Cottage Cat</h3>
            <p className="text-xs text-[#78350f] leading-relaxed max-w-xs mx-auto">
              Curled up warm on the handwoven wool duvet, dreaming of bug-free memory safe code.
            </p>
          </div>

          {/* Dynamic Status Balloon */}
          <div className="p-3 rounded-xl bg-[#faf5eb] border border-[#e5d5be] shadow-inner text-xs font-bold text-[#451a03] min-h-[38px] flex items-center justify-center">
            {lastAction}
          </div>

          {/* 3 Interactive Pet Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => triggerAction('Byte happily munched a salmon treat!', '🐟')}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 font-black text-xs shadow-md transition cursor-pointer flex flex-col items-center gap-1"
            >
              <span className="text-base">🐟</span>
              <span>Feed Treat</span>
            </button>

            <button
              onClick={() => triggerAction('Byte lazily swatted the wool yarn ball!', '🧶')}
              className="p-2.5 rounded-xl bg-[#854d0e] hover:bg-[#a16207] text-amber-100 border-b-4 border-[#5c3407] active:border-b-0 active:translate-y-1 font-black text-xs shadow-md transition cursor-pointer flex flex-col items-center gap-1"
            >
              <span className="text-base">🧶</span>
              <span>Toss Yarn</span>
            </button>

            <button
              onClick={() => triggerAction('Byte purred deeply from a gentle chin scratch!', '✋')}
              className="p-2.5 rounded-xl bg-[#059669] hover:bg-[#10b981] text-white border-b-4 border-[#047857] active:border-b-0 active:translate-y-1 font-black text-xs shadow-md transition cursor-pointer flex flex-col items-center gap-1"
            >
              <span className="text-base">✋</span>
              <span>Pet Byte</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   7. AUTOMATON GARDEN: "THE FARMER WAS REPLACED" CODE-DRIVEN MINI-GAME
   Interactive Python programming & automation puzzle where visitors write scripts
   to command Drone-Bot 01 to till soil, plant crops, irrigate, and harvest.
   ========================================================================================= */

interface FarmTile {
  crop: 'none' | 'wheat' | 'carrot' | 'pumpkin';
  watered: boolean;
  growth: number; // 0=none, 1=sprout, 2=mature
}

interface DroneState {
  x: number;
  y: number;
  dir: 'N' | 'E' | 'S' | 'W';
}

interface FarmAction {
  type: 'move' | 'turn' | 'plant' | 'water' | 'harvest';
  x: number;
  y: number;
  dir?: 'N' | 'E' | 'S' | 'W';
  crop?: string;
  mature?: boolean;
}

const MISSIONS = [
  {
    id: 'm1',
    title: 'M1: Wheat Harvest',
    badge: 'Tutorial',
    targetScore: 30,
    desc: 'The row ahead has ripe golden wheat! Step east and harvest the ripe crops.',
    code: `# Mission 1: Move & Harvest Ripe Wheat
for i in range(5):
    if can_harvest():
        harvest()
    move(east)`,
  },
  {
    id: 'm2',
    title: 'M2: Carrot Furrow',
    badge: 'Automation',
    targetScore: 100,
    desc: 'Step south to row 1, plant juicy carrots, water them to maturity, and harvest!',
    code: `# Mission 2: Plant & Water Carrots
move(south)
for i in range(5):
    plant("carrot")
    water()
    harvest()
    move(east)`,
  },
  {
    id: 'm3',
    title: 'M3: Serpentine Loop',
    badge: 'Advanced',
    targetScore: 180,
    desc: 'Snake through rows in a zigzag pattern to farm the entire 5x5 field!',
    code: `# Mission 3: Full-Grid Serpentine Loop
for y in range(5):
    for x in range(4):
        plant("wheat")
        water()
        harvest()
        move(east if y % 2 == 0 else west)
    move(south)`,
  },
  {
    id: 'm4',
    title: 'M4: Pumpkin Tycoon',
    badge: 'High-Yield',
    targetScore: 250,
    desc: 'Plant high-value Royal Pumpkins (+50 pts each) down the columns!',
    code: `# Mission 4: Royal Pumpkin Tycoon
for i in range(5):
    plant("pumpkin")
    water()
    harvest()
    move(south)`,
  },
  {
    id: 'm5',
    title: 'Sandbox Garden',
    badge: 'Creative',
    targetScore: 0,
    desc: 'Write your own custom farming algorithm or loop to automate your farm.',
    code: `# Sandbox: Create your farming drone program!
while True:
    if is_empty():
        plant("carrot")
        water()
    if can_harvest():
        harvest()
    move()`,
  },
];

const createInitialGrid = (): FarmTile[][] => {
  const g: FarmTile[][] = Array(5)
    .fill(null)
    .map(() => Array(5).fill(null).map(() => ({ crop: 'none', watered: false, growth: 0 })));

  // Initial golden wheat in row 0
  g[0][1] = { crop: 'wheat', watered: true, growth: 2 };
  g[0][2] = { crop: 'wheat', watered: true, growth: 2 };
  g[0][3] = { crop: 'wheat', watered: true, growth: 2 };

  // Initial carrot seedlings in row 1
  g[1][0] = { crop: 'carrot', watered: false, growth: 1 };
  g[1][2] = { crop: 'carrot', watered: true, growth: 2 };
  g[1][4] = { crop: 'carrot', watered: false, growth: 1 };

  // Initial pumpkin in row 2
  g[2][2] = { crop: 'pumpkin', watered: true, growth: 2 };

  return g;
};

const parsePythonToJS = (code: string): string => {
  const lines = code.split('\n');
  let jsCode = '';
  const indentStack = [0];

  for (let rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indentMatch = rawLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsCode += '}\n';
    }

    let line = trimmed;

    // Python ternary: a if cond else b -> (cond ? a : b)
    line = line.replace(/(\w+)\s+if\s+(.+?)\s+else\s+(\w+)/g, '($2 ? $1 : $3)');

    // For range loop
    const forRangeMatch = line.match(/^for\s+(\w+)\s+in\s+range\(([^)]+)\):$/);
    if (forRangeMatch) {
      const varName = forRangeMatch[1];
      const rangeArg = forRangeMatch[2];
      indentStack.push(indent + 4);
      jsCode += `for (let ${varName} = 0; ${varName} < ${rangeArg}; ${varName}++) {\n`;
      continue;
    }

    // Repeat N loop
    const repeatMatch = line.match(/^repeat\s+(\d+):$/);
    if (repeatMatch) {
      indentStack.push(indent + 4);
      jsCode += `for (let _r = 0; _r < ${repeatMatch[1]}; _r++) {\n`;
      continue;
    }

    // While loop
    const whileMatch = line.match(/^while\s+(.+):$/);
    if (whileMatch) {
      indentStack.push(indent + 4);
      jsCode += `while (${whileMatch[1]}) {\n`;
      continue;
    }

    // If condition
    const ifMatch = line.match(/^if\s+(.+):$/);
    if (ifMatch) {
      indentStack.push(indent + 4);
      jsCode += `if (${ifMatch[1]}) {\n`;
      continue;
    }

    // Elif condition
    const elifMatch = line.match(/^elif\s+(.+):$/);
    if (elifMatch) {
      jsCode += `} else if (${elifMatch[1]}) {\n`;
      continue;
    }

    // Else condition
    if (line === 'else:') {
      jsCode += `} else {\n`;
      continue;
    }

    // Plain statement normalization
    if (line === 'move') line = 'move()';
    else if (line === 'harvest') line = 'harvest()';
    else if (line === 'water') line = 'water()';
    else if (line === 'turn_left') line = 'turn_left()';
    else if (line === 'turn_right') line = 'turn_right()';
    else if (line.startsWith('plant ') && !line.includes('(')) {
      const c = line.split(' ')[1];
      line = `plant("${c}")`;
    }

    if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
      line += ';';
    }
    jsCode += line + '\n';
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    jsCode += '}\n';
  }

  return jsCode;
};

const AutomatonGardenModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [grid, setGrid] = useState<FarmTile[][]>(createInitialGrid);
  const [drone, setDrone] = useState<DroneState>({ x: 0, y: 0, dir: 'E' });
  const [score, setScore] = useState(0);
  const [inventory, setInventory] = useState({ wheat: 0, carrot: 0, pumpkin: 0 });
  const [activeMissionIdx, setActiveMissionIdx] = useState(0);
  const [code, setCode] = useState(MISSIONS[0].code);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(2);
  const [logs, setLogs] = useState<string[]>([
    '🌱 Welcome to Drone-Bot 01 ("The Farmer Was Replaced").',
    '⌨️ Enter Python commands or choose a mission above, then click [RUN SCRIPT].',
  ]);
  const [missionCleared, setMissionCleared] = useState(false);

  const playbackTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  const handleSelectMission = (idx: number) => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setIsRunning(false);
    setActiveMissionIdx(idx);
    setCode(MISSIONS[idx].code);
    setGrid(createInitialGrid());
    setDrone({ x: 0, y: 0, dir: 'E' });
    setMissionCleared(false);
    setLogs((prev) => [
      `📂 Loaded ${MISSIONS[idx].title}`,
      `🎯 Goal: ${MISSIONS[idx].desc}`,
      ...prev.slice(0, 3),
    ]);
  };

  const handleResetField = () => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setIsRunning(false);
    setGrid(createInitialGrid());
    setDrone({ x: 0, y: 0, dir: 'E' });
    setMissionCleared(false);
    setLogs((prev) => ['🔄 Farm plot re-tilled to pristine state.', ...prev.slice(0, 3)]);
  };

  // Compile and run the Python code
  const handleRunCode = () => {
    if (isRunning) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      setIsRunning(false);
      setLogs((prev) => ['⏹ Execution stopped by operator.', ...prev]);
      return;
    }

    try {
      // Create virtual simulation clone
      const simGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
      const simDrone: DroneState = { ...drone };
      const actions: FarmAction[] = [];
      let tick = 0;
      const MAX_TICKS = 220;

      const DIRS: ('N' | 'E' | 'S' | 'W')[] = ['N', 'E', 'S', 'W'];
      const north = 'N',
        south = 'S',
        east = 'E',
        west = 'W';
      const wheat = 'wheat',
        carrot = 'carrot',
        pumpkin = 'pumpkin';

      const can_harvest = () => {
        const cell = simGrid[simDrone.y][simDrone.x];
        return cell.crop !== 'none' && cell.growth === 2;
      };

      const is_empty = () => simGrid[simDrone.y][simDrone.x].crop === 'none';
      const get_x = () => simDrone.x;
      const get_y = () => simDrone.y;

      const move = (targetDir?: any) => {
        if (tick++ > MAX_TICKS) throw new Error('Maximum safety execution limit (220 ticks) reached');
        const d: string = (targetDir || simDrone.dir).toUpperCase();
        if (d === 'N' || d === 'NORTH') {
          simDrone.y = (simDrone.y - 1 + 5) % 5;
          simDrone.dir = 'N';
        } else if (d === 'S' || d === 'SOUTH') {
          simDrone.y = (simDrone.y + 1) % 5;
          simDrone.dir = 'S';
        } else if (d === 'E' || d === 'EAST') {
          simDrone.x = (simDrone.x + 1) % 5;
          simDrone.dir = 'E';
        } else if (d === 'W' || d === 'WEST') {
          simDrone.x = (simDrone.x - 1 + 5) % 5;
          simDrone.dir = 'W';
        }
        actions.push({ type: 'move', x: simDrone.x, y: simDrone.y, dir: simDrone.dir });
      };

      const turn_left = () => {
        if (tick++ > MAX_TICKS) throw new Error('Maximum safety execution limit (220 ticks) reached');
        const idx = DIRS.indexOf(simDrone.dir);
        simDrone.dir = DIRS[(idx - 1 + 4) % 4];
        actions.push({ type: 'turn', dir: simDrone.dir, x: simDrone.x, y: simDrone.y });
      };

      const turn_right = () => {
        if (tick++ > MAX_TICKS) throw new Error('Maximum safety execution limit (220 ticks) reached');
        const idx = DIRS.indexOf(simDrone.dir);
        simDrone.dir = DIRS[(idx + 1) % 4];
        actions.push({ type: 'turn', dir: simDrone.dir, x: simDrone.x, y: simDrone.y });
      };

      const plant = (cropType: string = 'wheat') => {
        if (tick++ > MAX_TICKS) throw new Error('Maximum safety execution limit (220 ticks) reached');
        const normalized = cropType.toLowerCase() as any;
        simGrid[simDrone.y][simDrone.x] = { crop: normalized, watered: false, growth: 1 };
        actions.push({ type: 'plant', crop: normalized, x: simDrone.x, y: simDrone.y });
      };

      const water = () => {
        if (tick++ > MAX_TICKS) throw new Error('Maximum safety execution limit (220 ticks) reached');
        const cell = simGrid[simDrone.y][simDrone.x];
        cell.watered = true;
        if (cell.crop !== 'none') cell.growth = 2; // Water instantly matures crop!
        actions.push({ type: 'water', x: simDrone.x, y: simDrone.y });
      };

      const harvest = () => {
        if (tick++ > MAX_TICKS) throw new Error('Maximum safety execution limit (220 ticks) reached');
        const cell = simGrid[simDrone.y][simDrone.x];
        const harvestedCrop = cell.crop;
        const isMature = cell.growth === 2;
        cell.crop = 'none';
        cell.watered = false;
        cell.growth = 0;
        actions.push({
          type: 'harvest',
          crop: harvestedCrop,
          mature: isMature,
          x: simDrone.x,
          y: simDrone.y,
        });
      };

      // Compile Python to JS
      const compiledJS = parsePythonToJS(code);
      const runner = new Function(
        'move',
        'turn_left',
        'turn_right',
        'plant',
        'water',
        'harvest',
        'can_harvest',
        'is_empty',
        'get_x',
        'get_y',
        'north',
        'south',
        'east',
        'west',
        'wheat',
        'carrot',
        'pumpkin',
        compiledJS
      );

      runner(
        move,
        turn_left,
        turn_right,
        plant,
        water,
        harvest,
        can_harvest,
        is_empty,
        get_x,
        get_y,
        north,
        south,
        east,
        west,
        wheat,
        carrot,
        pumpkin
      );

      if (actions.length === 0) {
        setLogs((prev) => ['⚠️ Script executed with 0 drone actions.', ...prev]);
        return;
      }

      // Start step-by-step playback
      setIsRunning(true);
      setLogs((prev) => [
        `▶ Running script (${actions.length} action steps planned)...`,
        ...prev.slice(0, 4),
      ]);

      let actionIdx = 0;
      const intervalMs = speed === 1 ? 260 : speed === 2 ? 140 : 45;

      playbackTimerRef.current = setInterval(() => {
        if (actionIdx >= actions.length) {
          clearInterval(playbackTimerRef.current);
          setIsRunning(false);
          setLogs((prev) => ['✨ Script execution finished!', ...prev]);

          // Check mission target score
          const curMission = MISSIONS[activeMissionIdx];
          if (curMission.targetScore > 0) {
            setScore((s) => {
              if (s >= curMission.targetScore) {
                setMissionCleared(true);
                confetti({
                  particleCount: 40,
                  spread: 75,
                  origin: { y: 0.55 },
                  colors: ['#10b981', '#f59e0b', '#38bdf8', '#ffffff'],
                });
                setLogs((prev) => [
                  `🏆 Mission Accomplished! Target of ${curMission.targetScore} pts achieved!`,
                  ...prev,
                ]);
              }
              return s;
            });
          }
          return;
        }

        const act = actions[actionIdx++];

        if (act.type === 'move') {
          setDrone((d) => ({ ...d, x: act.x, y: act.y, dir: act.dir || d.dir }));
          soundManager.playStep(true);
        } else if (act.type === 'turn') {
          setDrone((d) => ({ ...d, dir: act.dir || d.dir }));
        } else if (act.type === 'plant') {
          setGrid((prevGrid) => {
            const next = prevGrid.map((r) => [...r]);
            next[act.y][act.x] = { crop: act.crop as any, watered: false, growth: 1 };
            return next;
          });
          soundManager.playPlant();
          setLogs((prev) => [`🌱 Planted ${act.crop} at (${act.x}, ${act.y})`, ...prev.slice(0, 4)]);
        } else if (act.type === 'water') {
          setGrid((prevGrid) => {
            const next = prevGrid.map((r) => [...r]);
            const cell = next[act.y][act.x];
            cell.watered = true;
            if (cell.crop !== 'none') cell.growth = 2;
            return next;
          });
          setLogs((prev) => [`💧 Irrigated furrow at (${act.x}, ${act.y})`, ...prev.slice(0, 4)]);
        } else if (act.type === 'harvest') {
          const harvestedCrop = act.crop || 'crop';
          const isMature = act.mature;
          const pts =
            harvestedCrop === 'pumpkin' ? (isMature ? 50 : 10) :
            harvestedCrop === 'carrot' ? (isMature ? 25 : 5) :
            (isMature ? 10 : 2);

          setGrid((prevGrid) => {
            const next = prevGrid.map((r) => [...r]);
            next[act.y][act.x] = { crop: 'none', watered: false, growth: 0 };
            return next;
          });

          setScore((s) => s + pts);
          setInventory((inv) => ({
            ...inv,
            [harvestedCrop]: (inv[harvestedCrop as keyof typeof inv] || 0) + 1,
          }));

          soundManager.playHarvest();
          setLogs((prev) => [
            `✂ Harvested ${harvestedCrop} (+${pts} pts)! Total: ${score + pts}`,
            ...prev.slice(0, 4),
          ]);
        }
      }, intervalMs);
    } catch (err: any) {
      setLogs((prev) => [`❌ Script Error: ${err.message || err}`, ...prev]);
      setIsRunning(false);
    }
  };

  // Quick Manual Controls for clicking or typing
  const manualStep = (dir: 'N' | 'E' | 'S' | 'W') => {
    let nx = drone.x;
    let ny = drone.y;
    if (dir === 'N') ny = (ny - 1 + 5) % 5;
    else if (dir === 'S') ny = (ny + 1) % 5;
    else if (dir === 'E') nx = (nx + 1) % 5;
    else if (dir === 'W') nx = (nx - 1 + 5) % 5;
    setDrone({ x: nx, y: ny, dir });
    soundManager.playStep(true);
  };

  const manualPlant = (cropType: 'wheat' | 'carrot' | 'pumpkin') => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[drone.y][drone.x] = { crop: cropType, watered: false, growth: 1 };
      return next;
    });
    soundManager.playPlant();
  };

  const manualWater = () => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      const cell = next[drone.y][drone.x];
      cell.watered = true;
      if (cell.crop !== 'none') cell.growth = 2;
      return next;
    });
  };

  const manualHarvest = () => {
    const cell = grid[drone.y][drone.x];
    if (cell.crop === 'none') return;
    const pts = cell.crop === 'pumpkin' ? 50 : cell.crop === 'carrot' ? 25 : 10;
    const crop = cell.crop;
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[drone.y][drone.x] = { crop: 'none', watered: false, growth: 0 };
      return next;
    });
    setScore((s) => s + pts);
    setInventory((inv) => ({ ...inv, [crop]: inv[crop as keyof typeof inv] + 1 }));
    soundManager.playHarvest();
  };

  return (
    <div className="relative w-full max-w-5xl bg-[#2a170e] rounded-3xl p-3 sm:p-5 border-4 border-[#5c2b14] shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-[#451a03] font-sans select-none">
      {/* Brass Corner Brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      {/* Tactile Crimson Wax Seal Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-3.5 -right-3.5 z-30 w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 shadow-xl flex items-center justify-center cursor-pointer transition-all"
        title="Leave Garden [ESC]"
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Header Stamped Banner Plate */}
      <div className="bg-gradient-to-r from-[#381e12] via-[#4a2617] to-[#381e12] rounded-2xl p-3.5 sm:px-6 mb-3 border border-[#6b3519] shadow-inner flex flex-col md:flex-row items-center justify-between gap-3 text-amber-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-md flex items-center justify-center text-amber-950 shrink-0">
            <Bot className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-amber-400">
                THE FARMER WAS REPLACED • AUTONOMOUS GARDEN
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">IIT JODHPUR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black font-serif tracking-tight text-white mt-0.5">
              AUTOMATON FARM ENGINE: CODE & CULTIVATE
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Command Drone-Bot 01 via Python scripts • Till, irrigate & harvest ripe crops
            </p>
          </div>
        </div>

        {/* Live Score & Granary Badges */}
        <div className="flex items-center gap-2 bg-[#2a170e]/80 border border-amber-600/40 p-2 rounded-xl text-right">
          <div className="text-[10px] font-mono text-amber-300 leading-tight font-bold pr-2 border-r border-amber-700/50">
            <p className="text-amber-400 text-xs">★ {score} PTS</p>
            <p className="text-amber-300/70">Total Yield</p>
          </div>
          <div className="text-[11px] font-mono font-bold text-amber-100 flex items-center gap-1.5 pl-1">
            <span title="Wheat">🌾 {inventory.wheat}</span>
            <span title="Carrots">🥕 {inventory.carrot}</span>
            <span title="Pumpkins">🎃 {inventory.pumpkin}</span>
          </div>
        </div>
      </div>

      {/* Parchment Inner Container */}
      <div className="relative bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#dfceb5] shadow-inner">
        {/* Subtle Draft Dot Texture */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#b45309 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[460px]">
          {/* ================= LEFT COLUMN: 5x5 FARM PLOT & MANUAL COCKPIT (Cols 1-5) ================= */}
          <div className="lg:col-span-5 bg-[#faf5eb] rounded-xl p-3.5 sm:p-4 border border-[#e5d5be] shadow-inner flex flex-col justify-between space-y-3">
            <div>
              {/* Drone Telemetry Status Bar */}
              <div className="flex items-center justify-between border-b border-[#d97706]/30 pb-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#78350f]">
                  <span>🤖 Drone-Bot:</span>
                  <span className="bg-[#fffdfa] border border-[#fed7aa] px-1.5 py-0.5 rounded text-[11px]">
                    ({drone.x}, {drone.y})
                  </span>
                  <span className="text-amber-600 font-black">
                    {drone.dir === 'N' ? '▲ N' : drone.dir === 'E' ? '▶ E' : drone.dir === 'S' ? '▼ S' : '◀ W'}
                  </span>
                </div>
                <button
                  onClick={handleResetField}
                  className="px-2 py-0.5 rounded-md bg-[#fed7aa] hover:bg-[#fdba74] text-[#78350f] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  title="Reset farm crops"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* 5x5 Garden Grid */}
              <div className="bg-[#381e12] p-2.5 rounded-2xl border-4 border-[#5c2b14] shadow-inner aspect-square max-w-[340px] mx-auto grid grid-cols-5 gap-1.5">
                {grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const isDroneHere = drone.x === cIdx && drone.y === rIdx;
                    return (
                      <div
                        key={`cell-${rIdx}-${cIdx}`}
                        onClick={() => setDrone((d) => ({ ...d, x: cIdx, y: rIdx }))}
                        className={`relative rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isDroneHere
                            ? 'bg-[#4a2617] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-2 ring-amber-400'
                            : 'bg-[#2a170e] border-[#5c2b14] hover:bg-[#381e12]'
                        }`}
                      >
                        {/* Coordinate watermark */}
                        <span className="absolute top-0.5 left-1 text-[8px] font-mono text-amber-500/40">
                          {cIdx},{rIdx}
                        </span>

                        {/* Water droplet indicator */}
                        {cell.watered && (
                          <span className="absolute top-0.5 right-1 text-[8px] text-sky-400">💧</span>
                        )}

                        {/* Crop visual */}
                        <div className="text-xl sm:text-2xl pt-1">
                          {cell.crop === 'none' && (
                            <span className="opacity-20 text-xs text-amber-800">🟫</span>
                          )}
                          {cell.crop === 'wheat' && (
                            <span className={cell.growth === 2 ? 'animate-bounce' : 'opacity-70 text-base'}>
                              {cell.growth === 2 ? '🌾' : '🌱'}
                            </span>
                          )}
                          {cell.crop === 'carrot' && (
                            <span className={cell.growth === 2 ? 'animate-bounce' : 'opacity-70 text-base'}>
                              {cell.growth === 2 ? '🥕' : '🌱'}
                            </span>
                          )}
                          {cell.crop === 'pumpkin' && (
                            <span className={cell.growth === 2 ? 'animate-bounce' : 'opacity-70 text-base'}>
                              {cell.growth === 2 ? '🎃' : '🌱'}
                            </span>
                          )}
                        </div>

                        {/* Drone Overlay */}
                        {isDroneHere && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-sm shadow-md animate-pulse">
                              🤖
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Manual Control Pad & Quick Actions */}
            <div className="space-y-2 pt-1 border-t border-[#d97706]/30">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#92400e]">
                <span>MANUAL OVERRIDE:</span>
                <span className="text-[9px] text-[#78716c]">Click arrows or tile</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                {/* D-Pad Arrows */}
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button
                    onClick={() => manualStep('N')}
                    className="p-1 rounded bg-[#fffdfa] hover:bg-[#fef3c7] border border-[#fed7aa] text-[#78350f] font-bold text-xs cursor-pointer shadow-xs"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    onClick={() => manualStep('W')}
                    className="p-1 rounded bg-[#fffdfa] hover:bg-[#fef3c7] border border-[#fed7aa] text-[#78350f] font-bold text-xs cursor-pointer shadow-xs"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => manualStep('S')}
                    className="p-1 rounded bg-[#fffdfa] hover:bg-[#fef3c7] border border-[#fed7aa] text-[#78350f] font-bold text-xs cursor-pointer shadow-xs"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => manualStep('E')}
                    className="p-1 rounded bg-[#fffdfa] hover:bg-[#fef3c7] border border-[#fed7aa] text-[#78350f] font-bold text-xs cursor-pointer shadow-xs"
                  >
                    ▶
                  </button>
                </div>

                {/* Quick Action Pills */}
                <div className="flex-1 grid grid-cols-3 gap-1 text-[10px] font-bold">
                  <button
                    onClick={() => manualPlant('wheat')}
                    className="py-1 px-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs cursor-pointer text-center"
                  >
                    🌾 Wheat
                  </button>
                  <button
                    onClick={() => manualPlant('carrot')}
                    className="py-1 px-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-xs cursor-pointer text-center"
                  >
                    🥕 Carrot
                  </button>
                  <button
                    onClick={() => manualPlant('pumpkin')}
                    className="py-1 px-1 rounded-lg bg-amber-800 hover:bg-amber-700 text-white shadow-xs cursor-pointer text-center"
                  >
                    🎃 Pumpkin
                  </button>
                  <button
                    onClick={manualWater}
                    className="col-span-1 py-1 px-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs cursor-pointer text-center flex items-center justify-center gap-0.5"
                  >
                    <Droplets className="w-2.5 h-2.5" />
                    <span>Water</span>
                  </button>
                  <button
                    onClick={manualHarvest}
                    className="col-span-2 py-1 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer text-center font-black"
                  >
                    ✂ Harvest Crop
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: PYTHON IDE & CODE TERMINAL (Cols 6-12) ================= */}
          <div className="lg:col-span-7 bg-[#faf5eb] rounded-xl p-3.5 sm:p-4 border border-[#e5d5be] shadow-inner flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              {/* Mission Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#d97706]/30 pb-2">
                {MISSIONS.map((m, idx) => {
                  const isSelected = activeMissionIdx === idx;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMission(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#d97706] text-white border-[#92400e] shadow-xs'
                          : 'bg-[#fffdfa] text-[#78350f] border-[#fed7aa] hover:bg-[#fef3c7]'
                      }`}
                    >
                      {m.title}
                    </button>
                  );
                })}
              </div>

              {/* Mission Goal Card */}
              <div className="p-2.5 rounded-xl bg-[#fffdfa] border border-[#fed7aa] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-[#b45309] uppercase tracking-wider">
                    {MISSIONS[activeMissionIdx].badge} Objective
                  </span>
                  {MISSIONS[activeMissionIdx].targetScore > 0 && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-[#b45309] font-bold border border-amber-300">
                      Goal: {MISSIONS[activeMissionIdx].targetScore} pts
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#451a03] font-medium leading-snug">
                  {MISSIONS[activeMissionIdx].desc}
                </p>
                {missionCleared && (
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>Challenge Completed! Great programming!</span>
                  </div>
                )}
              </div>

              {/* Monospace Code Editor */}
              <div className="rounded-xl overflow-hidden border-2 border-[#5c2b14] shadow-md bg-[#1f130b] text-[#fef3c7]">
                {/* Editor Header Bar */}
                <div className="px-3 py-1.5 bg-[#2d180e] border-b border-[#5c2b14] flex items-center justify-between text-[10px] font-mono text-amber-300/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-bold text-amber-200 ml-1">drone_script.py</span>
                  </div>
                  <span className="text-[9px] text-amber-400/60 font-mono">Python 3 / TFWR API</span>
                </div>

                {/* Code Textarea with line numbers */}
                <div className="flex p-2 font-mono text-xs">
                  <div className="select-none pr-2.5 text-right text-amber-700/60 text-[11px] leading-relaxed border-r border-[#3f2212]">
                    {[...Array(code.split('\n').length)].map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={7}
                    spellCheck={false}
                    className="flex-1 pl-2.5 bg-transparent text-amber-100 text-xs font-mono leading-relaxed resize-none focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Syntax Pill Cheat-Sheet */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold uppercase text-[#92400e]">
                  Quick Commands (Click to insert):
                </span>
                <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                  {[
                    'move()',
                    'harvest()',
                    'water()',
                    'plant("wheat")',
                    'plant("carrot")',
                    'plant("pumpkin")',
                    'turn_right()',
                    'if can_harvest():',
                    'for i in range(5):',
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setCode((prev) => `${prev.trim()}\n${cmd}`)}
                      className="px-2 py-0.5 rounded-md bg-[#fffdfa] hover:bg-[#fef3c7] border border-[#fed7aa] text-[#78350f] cursor-pointer transition shadow-2xs font-bold"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Run & Speed Execution Controls */}
            <div className="space-y-2 pt-2 border-t border-[#d97706]/30">
              <div className="flex items-center justify-between gap-3">
                {/* Run Button */}
                <button
                  onClick={handleRunCode}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    isRunning
                      ? 'bg-[#dc2626] hover:bg-[#b91c1c] border-b-4 border-[#991b1b] animate-pulse'
                      : 'bg-[#059669] hover:bg-[#10b981] border-b-4 border-[#047857] active:border-b-0 active:translate-y-1'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>STOP EXECUTION</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>RUN SCRIPT</span>
                    </>
                  )}
                </button>

                {/* Simulation Speed Pill Toggle */}
                <div className="flex items-center gap-1 bg-[#fffdfa] border border-[#fed7aa] p-1 rounded-xl">
                  {([1, 2, 5] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer transition ${
                        speed === s
                          ? 'bg-[#d97706] text-white shadow-xs'
                          : 'text-[#78350f] hover:bg-[#fef3c7]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Execution Trace Output */}
              <div className="bg-[#1f130b] rounded-xl p-2.5 border border-[#5c2b14] max-h-[85px] overflow-y-auto font-mono text-[10px] text-amber-200/90 space-y-0.5">
                {logs.map((log, i) => (
                  <div key={i} className="leading-snug truncate">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
