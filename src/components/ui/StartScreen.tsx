import React from 'react';
import { useGame } from '../../context/GameContext';
import { Play, FileText } from 'lucide-react';
import { tw } from './kit/theme';

export const StartScreen: React.FC = () => {
  const { hasStarted, startGame, openModal } = useGame();

  if (hasStarted) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-end items-end p-4 sm:p-10 md:p-12 select-none font-game">
      {/* Floating title card */}
      <div className={`game-modal-pop pointer-events-auto flex flex-col items-stretch gap-3 w-full max-w-[280px] p-4 ${tw.card}`}>
        {/* Signboard title */}
        <div className="relative -mt-1 text-center">
          <span aria-hidden className="game-float absolute -top-7 -left-2 text-3xl">🏡</span>
          <p className={tw.label}>Welcome to the yard</p>
          <h1 className={`${tw.heading} text-3xl sm:text-4xl leading-none mt-1`}>Hemant Patel</h1>
          <p className="mt-1.5 text-[13px] font-bold text-[#6b4730]">IIT Jodhpur · 3D Portfolio</p>
        </div>

        <div className="h-[3px] rounded-full bg-[#2b1d16]/10" aria-hidden />

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button onClick={startGame} className={`${tw.btn} ${tw.btnPrimary} w-full !py-3 !text-lg uppercase tracking-wider`}>
            <Play className="w-5 h-5 fill-current" />
            <span>Play</span>
          </button>

          <button onClick={() => openModal('recruiter')} className={`${tw.btn} ${tw.btnPaper} w-full`}>
            <FileText className="w-4 h-4 text-[#d97706]" strokeWidth={2.5} />
            <span>2D Recruiter CV</span>
          </button>
        </div>

        {/* Press hint */}
        <p className="text-xs text-[#6b4730] font-semibold text-center">
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded-md border-2 border-[#2b1d16]/60 bg-[#f6ecd6] font-black text-[#2b1d16] text-[11px]">Enter</kbd>{' '}
          or{' '}
          <kbd className="px-1.5 py-0.5 rounded-md border-2 border-[#2b1d16]/60 bg-[#f6ecd6] font-black text-[#2b1d16] text-[11px]">Space</kbd>
        </p>
      </div>
    </div>
  );
};
