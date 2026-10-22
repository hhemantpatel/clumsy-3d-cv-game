import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useGame } from '../../../context/GameContext';
import type { ModalType } from '../../../types/game';
import { tw } from './theme';

/** The CV sections a visitor can hop between without walking back through the yard. */
export const SECTIONS: { id: Exclude<ModalType, null>; emoji: string; label: string }[] = [
  { id: 'about', emoji: '🧑‍🚀', label: 'About' },
  { id: 'experience', emoji: '🗺️', label: 'Journey' },
  { id: 'projects', emoji: '🛠️', label: 'Projects' },
  { id: 'skills', emoji: '🌳', label: 'Skills' },
  { id: 'contact', emoji: '📮', label: 'Contact' },
  { id: 'bed', emoji: '🐈', label: 'Byte' },
];

interface GameModalProps {
  onClose: () => void;
  /** Emoji or icon shown on the hanging signboard. */
  icon: React.ReactNode;
  /** Small kicker above the title, e.g. "Chapter 2". */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Extra controls rendered at the right of the header (filters, tabs...). */
  headerExtra?: React.ReactNode;
  /** Tailwind max-width class. */
  width?: string;
  /** Accent colour of the signboard ribbon (hex). */
  accent?: string;
  /** Hide the section hopper footer (e.g. for mini-games). */
  hideNav?: boolean;
  children: React.ReactNode;
}

/**
 * Shared frame for every CV menu: cream paper card with ink outline + toon drop shadow,
 * a wooden signboard header, scrollable body, and a footer to hop between sections.
 * Handles dialog semantics, initial focus, focus trap and focus restore.
 */
export const GameModal: React.FC<GameModalProps> = ({
  onClose,
  icon,
  kicker,
  title,
  subtitle,
  headerExtra,
  width = 'max-w-5xl',
  accent = '#d97706',
  hideNav,
  children,
}) => {
  const { activeModal, openModal } = useGame();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', trap);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`game-modal-pop relative w-full ${width} ${tw.card} flex flex-col max-h-[calc(100dvh-1.5rem)] outline-none font-game text-[#2b1d16] [color-scheme:light]`}
    >
      {/* Signboard header */}
      <header className="relative shrink-0 flex flex-wrap items-center gap-3 px-4 sm:px-6 pt-4 pb-3 border-b-[3px] border-[#2b1d16] bg-[#f6ecd6] rounded-t-[19px]">
        <div
          className="shrink-0 w-12 h-12 rounded-2xl border-[3px] border-[#2b1d16] shadow-[0_3px_0_0_#2b1d16] flex items-center justify-center text-2xl"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          {kicker && <p className={tw.label}>{kicker}</p>}
          <h2 id={titleId} className={`${tw.heading} text-xl sm:text-2xl leading-tight`}>
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-[#6b4730] font-medium">{subtitle}</p>}
        </div>
        {headerExtra && <div className="w-full md:w-auto md:ml-auto">{headerExtra}</div>}
        <button
          onClick={onClose}
          aria-label="Close"
          className={`${tw.btn} ${tw.btnPaper} !p-2 absolute -top-3 -right-3 rounded-full bg-[#fffaf0]`}
        >
          <X className="w-5 h-5" strokeWidth={3} />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 sm:px-6 py-5 select-text">{children}</div>

      {/* Section hopper */}
      {!hideNav && (
        <nav
          aria-label="CV sections"
          className="shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap px-3 py-2.5 border-t-[3px] border-[#2b1d16] bg-[#f6ecd6] rounded-b-[19px]"
        >
          {SECTIONS.map((s) => {
            const active = s.id === activeModal;
            return (
              <button
                key={s.id}
                onClick={() => !active && openModal(s.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border-2 transition ${
                  active
                    ? 'bg-[#d97706] text-white border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16]'
                    : 'bg-[#fffaf0] text-[#5c4033] border-[#2b1d16]/30 hover:border-[#2b1d16] hover:-translate-y-0.5'
                }`}
              >
                <span aria-hidden>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
