import React from 'react';
import { useGame } from '../../context/GameContext';
import { Play, FileText } from 'lucide-react';

export const StartScreen: React.FC = () => {
  const { hasStarted, startGame, openModal } = useGame();

  if (hasStarted) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-end items-end p-6 sm:p-10 md:p-12 select-none font-sans">
      {/* Floating Side Start Controls */}
      <div className="pointer-events-auto flex flex-col items-end gap-3.5 max-w-[260px] sm:max-w-[280px]">
        {/* Game Title & Subtitle */}
        <div className="text-right">
          <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] tracking-tight">
            Hemant Patel
          </h1>
          <p className="text-xs sm:text-sm font-bold text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            IIT Jodhpur • 3D Portfolio
          </p>
        </div>

        {/* Buttons Stack */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Main Play Game Button: Tactile 3D Physical Game Press Style */}
          <button
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-lg tracking-wider uppercase shadow-[0_6px_0_#047857] hover:shadow-[0_4px_0_#047857] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all cursor-pointer border-t-2 border-emerald-200"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY</span>
          </button>

          {/* Secondary 2D Recruiter CV Button */}
          <button
            onClick={() => openModal('recruiter')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-950/75 hover:bg-stone-900/90 text-stone-200 hover:text-white font-semibold text-xs shadow-md border border-stone-700/60 backdrop-blur-md transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>2D Recruiter CV</span>
          </button>
        </div>

        {/* Minimal Press Hint */}
        <p className="text-[11px] text-white/80 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] text-right">
          Press <span className="font-bold text-white underline">Enter</span> or <span className="font-bold text-white underline">Space</span>
        </p>
      </div>
    </div>
  );
};
