import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGarden, GARDEN_MISSIONS } from '../../context/GardenContext';

interface AutomatonGardenWindowProps {
  onClose: () => void;
}

export const AutomatonGardenWindow: React.FC<AutomatonGardenWindowProps> = ({ onClose }) => {
  const {
    grid,
    drone,
    score,
    inventory,
    activeMissionIdx,
    code,
    isRunning,
    speed,
    logs,
    missionCleared,
    setCode,
    setSpeed,
    runScript,
    stopScript,
    resetField,
    selectMission,
    manualStep,
    manualPlant,
    manualWater,
    manualHarvest,
  } = useGarden();

  // Floating Window Drag & Resize State
  const defaultWidth = Math.min(580, window.innerWidth - 40);
  const defaultHeight = Math.min(650, window.innerHeight - 80);
  const defaultX = Math.max(20, window.innerWidth - defaultWidth - 25);
  const defaultY = 30;

  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [showManualPad, setShowManualPad] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; initW: number; initH: number } | null>(null);

  // Dragging logic
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only drag from header, ignore buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initX: position.x,
      initY: position.y,
    };
  };

  // Resizing logic
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    resizeStartRef.current = {
      startX: clientX,
      startY: clientY,
      initW: size.width,
      initH: size.height,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (dragStartRef.current) {
        const dx = clientX - dragStartRef.current.startX;
        const dy = clientY - dragStartRef.current.startY;
        const nextX = Math.max(10, Math.min(window.innerWidth - 120, dragStartRef.current.initX + dx));
        const nextY = Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.initY + dy));
        setPosition({ x: nextX, y: nextY });
      }

      if (resizeStartRef.current) {
        const dx = clientX - resizeStartRef.current.startX;
        const dy = clientY - resizeStartRef.current.startY;
        const nextW = Math.max(380, Math.min(window.innerWidth - 30, resizeStartRef.current.initW + dx));
        const nextH = Math.max(280, Math.min(window.innerHeight - 30, resizeStartRef.current.initH + dy));
        setSize({ width: nextW, height: nextH });
      }
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  // Handle Tab key in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      textarea.value = val.substring(0, start) + '    ' + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
      setCode(textarea.value);
    }
  };

  const activeMission = GARDEN_MISSIONS[activeMissionIdx] ?? GARDEN_MISSIONS[0];

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '320px' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        zIndex: 50,
      }}
      className="flex flex-col bg-[#24130b]/95 backdrop-blur-md border-2 sm:border-[3px] border-[#78350f] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-[#fbf7ee] font-sans overflow-hidden select-none transition-shadow duration-150"
    >
      {/* 1. ARCHIVAL SADDLE LEATHER WINDOW TITLEBAR (DRAGGABLE) */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="garden-window-drag flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-[#2f190e] via-[#3b2012] to-[#2f190e] border-b-2 border-[#5c2b14] cursor-grab active:cursor-grabbing shadow-inner select-none"
      >
        {/* Title & Status Indicator */}
        <div className="flex items-center gap-2.5 pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/50 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-serif font-black tracking-wider text-xs sm:text-sm text-[#fef3c7] uppercase flex items-center gap-1.5 drop-shadow-sm truncate">
              <span>🌾 Drone-Bot 01</span>
              {!isMinimized && <span className="text-[10px] text-amber-400/80 font-mono font-normal">v3.4</span>}
            </span>
            {!isMinimized && (
              <span className="text-[9px] font-mono text-amber-300/60 uppercase tracking-widest hidden sm:inline">
                3D Garden Automaton Console
              </span>
            )}
          </div>
        </div>

        {/* Window Controls (Minimize & Wax Seal Close) */}
        <div className="flex items-center gap-1.5 z-10">
          {/* Quick Play/Stop button when minimized */}
          {isMinimized && (
            <button
              onClick={isRunning ? stopScript : runScript}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all ${
                isRunning
                  ? 'bg-rose-700 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              {isRunning ? '⏹ Stop' : '▶ Run'}
            </button>
          )}

          {/* Minimize / Maximize Button */}
          <button
            onClick={() => setIsMinimized((v) => !v)}
            title={isMinimized ? 'Expand window' : 'Minimize window'}
            className="w-7 h-7 rounded-full bg-[#1e0e07] hover:bg-[#3a1d0f] border border-[#78350f] text-amber-300/80 hover:text-amber-200 flex items-center justify-center font-mono text-xs transition-all cursor-pointer"
          >
            {isMinimized ? '□' : '–'}
          </button>

          {/* Crimson Wax Seal Close Button */}
          <button
            onClick={onClose}
            title="Close Automaton Console"
            className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 hover:from-rose-500 hover:to-rose-800 border border-rose-400 text-white font-serif font-bold text-xs shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* When minimized, only show compact status ribbon */}
      {isMinimized ? (
        <div className="p-2.5 bg-[#1a0e07] text-[11px] font-mono flex items-center justify-between text-amber-200">
          <span>Score: <strong className="text-amber-400">{score}</strong></span>
          <span>Pos: <strong className="text-amber-300">({drone.x}, {drone.y}) [{drone.dir}]</strong></span>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-[10px] text-amber-400 underline hover:text-amber-200 cursor-pointer"
          >
            Expand ↗
          </button>
        </div>
      ) : (
        /* EXPANDED FULL CONSOLE INTERIOR */
        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1009]/95 text-stone-200 overflow-hidden">
          {/* 2. MISSION TABS BAR */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#180c06] border-b border-[#3d1d0c] overflow-x-auto scrollbar-none text-[11px]">
            {GARDEN_MISSIONS.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => selectMission(idx)}
                className={`px-2.5 py-1 rounded-md font-serif font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeMissionIdx === idx
                    ? 'bg-[#d97706] text-[#24130b] font-bold shadow-xs'
                    : 'text-amber-200/70 hover:text-amber-100 hover:bg-[#2e170c]'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>

          {/* 3. ACTIVE MISSION BANNER & LIVE STATS */}
          <div className="px-3 py-2 bg-gradient-to-b from-[#2a170e] to-[#201109] border-b border-[#451f0f] flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Mission Objective */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-amber-300 text-xs">{activeMission.title}</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 font-mono text-[9px] border border-amber-700/50">
                  {activeMission.badge}
                </span>
                {missionCleared && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-bold text-[9px] border border-emerald-600 animate-bounce">
                    ✨ COMPLETED!
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-300/80 font-sans mt-0.5 line-clamp-1">
                {activeMission.desc}
              </p>
            </div>

            {/* Farm Score & Inventory Badges */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <div className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 flex items-center gap-1 shadow-xs">
                <span>⭐</span>
                <span>{score} pts</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#150a04] border border-[#4a2614] text-[10px] text-stone-300">
                <span title="Wheat">🌾 {inventory.wheat}</span>
                <span title="Carrots">🥕 {inventory.carrot}</span>
                <span title="Pumpkins">🎃 {inventory.pumpkin}</span>
              </div>
            </div>
          </div>

          {/* 4. DRONE POSITION & SENSOR TELEMETRY */}
          <div className="px-3 py-1 bg-[#140a04] border-b border-[#2e160a] flex items-center justify-between text-[10px] font-mono text-amber-200/70">
            <div className="flex items-center gap-2">
              <span>Drone: <strong className="text-amber-300">({drone.x}, {drone.y})</strong></span>
              <span>Facing: <strong className="text-amber-300">{drone.dir}</strong></span>
              <span>Crop: <strong className="text-emerald-300">{grid[drone.y]?.[drone.x]?.crop ?? 'none'}</strong></span>
              <span>Watered: <strong className={grid[drone.y]?.[drone.x]?.watered ? 'text-sky-300' : 'text-stone-400'}>{grid[drone.y]?.[drone.x]?.watered ? 'YES' : 'NO'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualPad((v) => !v)}
                className="text-amber-400/90 hover:text-amber-200 underline cursor-pointer text-[10px]"
              >
                {showManualPad ? 'Hide D-Pad' : 'Manual D-Pad'}
              </button>
              <button
                onClick={() => setShowCheatsheet((v) => !v)}
                className="text-amber-400/90 hover:text-amber-200 underline cursor-pointer text-[10px]"
              >
                {showCheatsheet ? 'Hide Guide' : 'Python API'}
              </button>
            </div>
          </div>

          {/* OPTIONAL MANUAL D-PAD CONTROLLER OVERLAY */}
          {showManualPad && (
            <div className="px-3 py-2 bg-[#1b0f08] border-b border-[#3b1c0d] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-400 font-mono mr-1">Drive:</span>
                <button
                  onClick={() => manualStep('W')}
                  className="w-7 h-7 rounded bg-[#2e170c] hover:bg-[#452313] border border-[#5c2b14] text-amber-300 font-bold cursor-pointer"
                >
                  ←
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => manualStep('N')}
                    className="w-7 h-7 rounded bg-[#2e170c] hover:bg-[#452313] border border-[#5c2b14] text-amber-300 font-bold cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => manualStep('S')}
                    className="w-7 h-7 rounded bg-[#2e170c] hover:bg-[#452313] border border-[#5c2b14] text-amber-300 font-bold cursor-pointer"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => manualStep('E')}
                  className="w-7 h-7 rounded bg-[#2e170c] hover:bg-[#452313] border border-[#5c2b14] text-amber-300 font-bold cursor-pointer"
                >
                  →
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => manualPlant('wheat')}
                  className="px-2 py-1 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-600/50 text-[10px] text-amber-200 font-bold cursor-pointer"
                >
                  🌾 Plant
                </button>
                <button
                  onClick={manualWater}
                  className="px-2 py-1 rounded bg-sky-900/60 hover:bg-sky-800 border border-sky-600/50 text-[10px] text-sky-200 font-bold cursor-pointer"
                >
                  💧 Water
                </button>
                <button
                  onClick={manualHarvest}
                  className="px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/50 text-[10px] text-emerald-200 font-bold cursor-pointer"
                >
                  ✂️ Harvest
                </button>
              </div>
            </div>
          )}

          {/* OPTIONAL QUICK PYTHON CHEATSHEET */}
          {showCheatsheet && (
            <div className="p-2.5 bg-[#170c06] border-b border-[#3b1c0d] grid grid-cols-2 gap-1.5 text-[10px] font-mono text-stone-300">
              <div><code>move(east|west|north|south)</code></div>
              <div><code>plant("wheat"|"carrot"|"pumpkin")</code></div>
              <div><code>water()</code> (ripens crops to mature)</div>
              <div><code>harvest()</code> (collects mature yield)</div>
              <div><code>can_harvest()</code> -&gt; boolean</div>
              <div><code>is_empty()</code> -&gt; boolean</div>
              <div><code>for i in range(5):</code></div>
              <div><code>while True: ...</code></div>
            </div>
          )}

          {/* 5. PYTHON CODE EDITOR (TEXTAREA) */}
          <div className="flex-1 relative min-h-[140px] bg-[#120904] flex flex-col font-mono text-xs overflow-hidden">
            <div className="px-3 py-1 bg-[#1a0e07] border-b border-[#2b1409] flex items-center justify-between text-[10px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>program.py</span>
              </span>
              <span>Python / Pseudo-Python Sub-interpreter</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full flex-1 p-3 bg-transparent text-emerald-200 font-mono text-xs leading-relaxed resize-none focus:outline-hidden selection:bg-amber-800/60 scrollbar-thin scrollbar-thumb-[#4a2614] scrollbar-track-transparent"
              placeholder="# Write Python farming instructions here..."
            />
          </div>

          {/* 6. CONSOLE EXECUTION TRACE LOGS */}
          <div className="h-20 bg-[#0d0603] border-t border-[#2d150a] px-3 py-1.5 overflow-y-auto font-mono text-[10px] flex flex-col-reverse justify-end scrollbar-none">
            {logs.slice(0, 4).map((line, idx) => (
              <div
                key={idx}
                className={`truncate ${
                  line.includes('Error') || line.includes('boundary')
                    ? 'text-rose-400 font-bold'
                    : line.includes('Harvested') || line.includes('COMPLETED')
                    ? 'text-amber-300 font-bold'
                    : line.includes('Watered')
                    ? 'text-sky-300'
                    : 'text-stone-400'
                }`}
              >
                {line}
              </div>
            ))}
          </div>

          {/* 7. CONTROLS BAR (EXECUTE, SPEED, RESET) */}
          <div className="px-3 py-2.5 bg-gradient-to-r from-[#24130b] via-[#2f190e] to-[#24130b] border-t-2 border-[#5c2b14] flex flex-wrap items-center justify-between gap-2">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-amber-300/80 mr-1 text-[10px]">Speed:</span>
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    speed === s
                      ? 'bg-amber-600 text-stone-950 shadow-xs'
                      : 'bg-[#180c06] hover:bg-[#341b0d] text-amber-200/80 border border-[#4a2614]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Run / Stop & Reset Field Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={resetField}
                title="Reset farm field to initial state"
                className="px-2.5 py-1.5 rounded-lg bg-[#1a0e07] hover:bg-[#32190d] border border-[#5c2b14] text-stone-300 hover:text-white font-mono text-xs font-semibold transition-all cursor-pointer"
              >
                ↺ Reset
              </button>

              <button
                onClick={isRunning ? stopScript : runScript}
                className={`px-4 py-1.5 rounded-xl font-serif font-black text-xs tracking-wide uppercase shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isRunning
                    ? 'bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white animate-pulse border border-rose-400'
                    : 'bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white border border-emerald-400'
                }`}
              >
                <span>{isRunning ? '⏹ STOP DRONE' : '▶ RUN SCRIPT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. RESIZE CORNER HANDLE (BOTTOM-RIGHT) */}
      {!isMinimized && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          title="Drag to resize window"
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-amber-500/60 hover:text-amber-300 z-30 select-none"
        >
          <svg className="w-3 h-3" viewBox="0 0 10 10" fill="currentColor">
            <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};
