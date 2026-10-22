import React from 'react';
import { useGardenSim, useGardenUI } from '../../../context/GardenContext';
import { tw } from '../kit/theme';
import { CodeEditor, LogPanel } from './CodeEditor';
import { useFloatingWindow, ResizeGrip } from './useFloatingWindow';

const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]';
const roundBtn = `inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#2b1d16] bg-[#fffaf0] text-[#2b1d16] text-sm font-black shadow-[0_2px_0_0_#2b1d16] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none transition-transform cursor-pointer ${focusRing}`;

interface CodeTerminalWindowProps {
  /** Put the editor back inside the garden console. */
  onDock: () => void;
  zIndex: number;
  onFocus: () => void;
}

/**
 * The Python editor + log popped out of the garden console into its own
 * movable, resizable window, so there's room to write longer programs.
 */
export const CodeTerminalWindow: React.FC<CodeTerminalWindowProps> = ({ onDock, zIndex, onFocus }) => {
  const { isRunning, tick } = useGardenSim();
  const { activeMission, goal, runScript, stopScript, resetField } = useGardenUI();

  const { rect, onDragStart, onResizeStart } = useFloatingWindow({
    initial: () => {
      const width = Math.min(560, window.innerWidth - 16);
      return { x: 8 + Math.max(0, Math.min(16, window.innerWidth - width - 16)), y: 72, width, height: Math.max(320, Math.min(620, window.innerHeight - 96)) };
    },
    minWidth: () => Math.min(340, window.innerWidth - 16),
    minHeight: 280,
  });

  const hasGoal = activeMission.goal.kind !== 'none';
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;

  return (
    <div
      role="dialog"
      aria-label="Drone terminal: Python editor"
      onMouseDownCapture={onFocus}
      onTouchStartCapture={onFocus}
      onFocusCapture={onFocus}
      style={{ position: 'fixed', left: rect.x, top: rect.y, width: rect.width, height: rect.height, zIndex }}
      className="game-modal-pop flex flex-col bg-[#fffaf0] border-[3px] border-[#2b1d16] rounded-[22px] shadow-[0_6px_0_0_#2b1d16] text-[#2b1d16] font-game overflow-hidden [color-scheme:light]"
    >
      {/* Title bar: slate signboard so it reads as "the terminal" next to the wooden console */}
      <div
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        className="garden-window-drag flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#2f3a33] border-b-[3px] border-[#2b1d16] cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
          <span className="shrink-0 w-9 h-9 rounded-xl bg-[#26302a] border-2 border-[#1c241f] flex items-center justify-center font-mono font-black text-[#9fd27f] text-sm">
            &gt;_
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-sm sm:text-base text-[#eef3e2] leading-tight truncate">Drone terminal</span>
            <span className="text-[11px] font-bold text-[#b7c4b2] truncate leading-tight">{activeMission.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onDock} aria-label="Dock editor back into the garden console" title="Dock back into the console" className={roundBtn}>
            ⇲
          </button>
        </div>
      </div>

      {/* Toolbar: what you're solving + run controls, so you don't need the console open */}
      <div className="flex flex-wrap items-center gap-2 px-2.5 py-2 bg-[#f6ecd6] border-b-2 border-[#2b1d16]/20 text-[11px] shrink-0">
        {hasGoal && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border-2 border-[#2b1d16] bg-[#c5d77a] font-bold whitespace-nowrap">
            🎯 {goal.value}/{goal.target}
            <span className="w-14 h-1.5 rounded-full bg-[#fffaf0] border border-[#2b1d16] overflow-hidden">
              <span className="block h-full bg-[#355f25]" style={{ width: `${pct}%` }} />
            </span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-2 border-[#2b1d16]/60 bg-[#fffaf0] font-bold whitespace-nowrap">
          ⏱ {tick}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={resetField} aria-label="Reset field to mission start" className={`${tw.btn} ${tw.btnPaper} !px-2.5 !py-1 !text-xs`}>
            ↺ Reset
          </button>
          <button
            onClick={isRunning ? stopScript : runScript}
            className={`${tw.btn} !px-4 !py-1 !text-xs uppercase tracking-wide text-white ${isRunning ? 'bg-[#c43a4c]' : tw.btnGreen}`}
          >
            {isRunning ? '⏹ Stop' : '▶ Run'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <CodeEditor large minHeight={140} />
        <LogPanel heightClass="h-28" />
      </div>

      <ResizeGrip onResizeStart={onResizeStart} />
    </div>
  );
};
