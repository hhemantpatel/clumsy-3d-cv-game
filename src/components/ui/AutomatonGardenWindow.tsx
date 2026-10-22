import React, { useEffect, useRef, useState } from 'react';
import { useGardenSim, useGardenUI } from '../../context/GardenContext';
import type { Speed } from '../../context/GardenContext';
import { CROPS } from '../../garden/types';
import type { CropType } from '../../garden/types';
import { CROP_TYPES } from '../../garden/sim';
import { goalText } from '../../garden/missions';
import { tw } from './kit/theme';
import { DroneIcon } from './garden/DroneIcon';
import { CodeEditor, LogPanel } from './garden/CodeEditor';
import { CodeTerminalWindow } from './garden/CodeTerminalWindow';
import { useFloatingWindow, ResizeGrip } from './garden/useFloatingWindow';

interface AutomatonGardenWindowProps {
  onClose: () => void;
}

const POP_OUT_KEY = 'clumsy_cv_garden_editor_popped_out';

const API_REFERENCE: [string, string][] = [
  ['move(east)', 'Fly one tile: north / east / south / west. The field wraps around. (1 tick)'],
  ['move()', 'Fly one tile in the direction the drone is facing. (1 tick)'],
  ['turn_left() / turn_right()', 'Rotate the drone 90 degrees. (1 tick)'],
  ['plant("carrot")', 'Buy & plant a seed on empty soil. Returns True on success. (1 tick)'],
  ['water()', 'Wet the soil for 10 ticks: crops grow twice as fast. (1 tick)'],
  ['harvest()', 'Collect a ripe crop for coins. Unripe crops are destroyed! (1 tick)'],
  ['wait()', 'Do nothing for one tick while crops grow. (1 tick)'],
  ['can_harvest()', 'True if the crop under the drone is ripe. (free)'],
  ['is_empty()', 'True if nothing is planted here. (free)'],
  ['is_watered()', 'True if the soil here is wet. (free)'],
  ['get_crop()', 'Crop name here, or None. (free)'],
  ['get_growth()', 'Growth of the crop here, 0.0 to 1.0. (free)'],
  ['get_x() / get_y()', 'Drone column / row, 0 to 4. (free)'],
  ['get_coins() / get_tick()', 'Your coins / ticks elapsed this run. (free)'],
  ['print(a, b, ...)', 'Write to the console log.'],
  ['range, abs, min, max, len, str, int, round', 'Python builtins.'],
  ['if / elif / else, while, for, def, return', 'Also: break, continue, pass, and / or / not, x if c else y.'],
];

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));

// ---- toon style fragments local to the console (built on the kit tokens) ----
const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]';
/** Small chunky pressable button for the dense console. */
const smallBtn = `inline-flex items-center justify-center gap-1 rounded-lg border-2 border-[#2b1d16] bg-[#fffaf0] text-[#2b1d16] font-black shadow-[0_2px_0_0_#2b1d16] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none transition-transform cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none ${focusRing}`;
const statChip = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-2 font-bold text-[11px] whitespace-nowrap';
const chipNeutral = `${statChip} bg-[#fffaf0] border-[#2b1d16]/60 text-[#2b1d16]`;

export const AutomatonGardenWindow: React.FC<AutomatonGardenWindowProps> = ({ onClose }) => {
  const { drone, grid, isRunning, tick } = useGardenSim();
  const {
    resetCode,
    coins,
    inventory,
    actionsUsed,
    maxActions,
    missions,
    activeMissionIdx,
    activeMission,
    selectMission,
    nextMission,
    isMissionUnlocked,
    bestStars,
    lifetimeCoins,
    goal,
    completion,
    dismissCompletion,
    hintsShown,
    revealHint,
    lockedCrops,
    speed,
    setSpeed,
    availableSpeeds,
    runScript,
    stopScript,
    resetField,
    selectedSeed,
    setSelectedSeed,
    manualStep,
    manualPlant,
    manualWater,
    manualHarvest,
    manualWait,
  } = useGardenUI();

  // ---------------- floating window: drag / resize / minimise ----------------
  const minWidth = () => Math.min(380, window.innerWidth - 16);
  const { rect, onDragStart: handleDragStart, onResizeStart: handleResizeStart } = useFloatingWindow({
    initial: () => {
      const width = Math.max(minWidth(), Math.min(600, window.innerWidth - 16));
      const height = Math.max(320, Math.min(720, window.innerHeight - 32));
      return { x: Math.max(8, window.innerWidth - width - 16), y: 16, width, height };
    },
    minWidth,
    minHeight: 280,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showApi, setShowApi] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // ---------------- pop-out editor window ----------------
  const [editorPoppedOut, setEditorPoppedOut] = useState(() => {
    try {
      return localStorage.getItem(POP_OUT_KEY) === '1' && window.innerWidth >= 900;
    } catch {
      return false;
    }
  });
  const [front, setFront] = useState<'console' | 'terminal'>('terminal');
  const setPoppedOut = (v: boolean) => {
    setEditorPoppedOut(v);
    setFront(v ? 'terminal' : 'console');
    try {
      localStorage.setItem(POP_OUT_KEY, v ? '1' : '0');
    } catch {
      /* storage unavailable: preference just isn't remembered */
    }
  };

  // Stop the program when the window closes (unmounts).
  const stopRef = useRef(stopScript);
  stopRef.current = stopScript;
  useEffect(() => () => stopRef.current(), []);

  const missionStars = (id: string) => bestStars[id] ?? 0;
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
  const hasGoal = activeMission.goal.kind !== 'none';
  const tile = grid[drone.y]?.[drone.x];
  const isLastMission = activeMissionIdx >= missions.length - 1;

  return (
    <>
      <div
        role="dialog"
        aria-label="Drone-Bot garden programming console"
        onMouseDownCapture={() => setFront('console')}
        onTouchStartCapture={() => setFront('console')}
        style={{
          position: 'fixed',
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: isMinimized ? `${Math.min(320, window.innerWidth - 16)}px` : `${rect.width}px`,
          height: isMinimized ? 'auto' : `${rect.height}px`,
          zIndex: front === 'console' ? 51 : 50,
        }}
        className="game-modal-pop flex flex-col bg-[#fffaf0] border-[3px] border-[#2b1d16] rounded-[22px] shadow-[0_6px_0_0_#2b1d16] text-[#2b1d16] font-game overflow-hidden"
      >
        {/* 1. TITLEBAR (draggable wooden signboard) */}
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="garden-window-drag relative flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#9a6a43] bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.07)_0px,rgba(255,255,255,0.07)_2px,transparent_2px,transparent_11px)] border-b-[3px] border-[#2b1d16] cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2 min-w-0 pointer-events-none">
            <div className="relative shrink-0 w-9 h-9 rounded-xl bg-[#fffaf0] border-2 border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16] flex items-center justify-center">
              <DroneIcon className="w-7 h-7" spinning={isRunning} />
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#2b1d16] ${isRunning ? 'bg-[#5f9a45] animate-pulse' : 'bg-[#fde68a]'}`}
                aria-hidden
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black tracking-wide text-sm sm:text-base text-[#fffaf0] leading-tight truncate [text-shadow:0_2px_0_#2b1d16]">
                Drone-Bot 01
              </span>
              {!isMinimized && (
                <span className="text-[11px] font-bold text-[#fde68a] truncate leading-tight">
                  Garden console · 🪙 {lifetimeCoins} lifetime
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isMinimized && (
              <button
                onClick={isRunning ? stopScript : runScript}
                aria-label={isRunning ? 'Stop program' : 'Run program'}
                className={`${smallBtn} px-2 py-0.5 text-[11px] uppercase !text-white ${isRunning ? '!bg-[#c43a4c]' : '!bg-[#5f9a45]'}`}
              >
                {isRunning ? '⏹ Stop' : '▶ Run'}
              </button>
            )}
            <button
              onClick={() => setIsMinimized((v) => !v)}
              aria-label={isMinimized ? 'Expand window' : 'Minimise window'}
              title={isMinimized ? 'Expand window' : 'Minimise window'}
              className={`${smallBtn} w-8 h-8 !rounded-full text-sm`}
            >
              {isMinimized ? '□' : '–'}
            </button>
            <button
              onClick={onClose}
              aria-label="Close garden console"
              title="Close garden console"
              className={`${smallBtn} w-8 h-8 !rounded-full !bg-[#c43a4c] !text-white text-sm`}
            >
              ✕
            </button>
          </div>
        </div>

        {isMinimized ? (
          <div className="px-2.5 py-2 bg-[#f6ecd6] flex items-center justify-between gap-1.5 flex-wrap">
            <span className={`${statChip} bg-[#fde68a] border-[#2b1d16] text-[#2b1d16]`}>🪙 {coins}</span>
            <span className={chipNeutral}>⏱ {tick}</span>
            <span className={chipNeutral}>({drone.x}, {drone.y}) {drone.dir}</span>
            {hasGoal && <span className={`${statChip} bg-[#c5d77a] border-[#2b1d16] text-[#2b1d16]`}>🎯 {pct}%</span>}
          </div>
        ) : (
          <div className="relative flex-1 flex flex-col min-h-0 bg-[#fffaf0]">
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {/* 2. MISSION LIST (chunky pills) */}
              <div
                className="flex items-stretch gap-1.5 px-2.5 py-2 bg-[#f6ecd6] border-b-2 border-[#2b1d16]/20 overflow-x-auto text-xs shrink-0"
                role="tablist"
                aria-label="Missions"
              >
                {missions.map((m, idx) => {
                  const unlocked = isMissionUnlocked(idx);
                  const active = idx === activeMissionIdx;
                  return (
                    <button
                      key={m.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectMission(idx)}
                      disabled={!unlocked}
                      title={unlocked ? m.title : `Locked: clear ${missions[idx - 1]?.title} first`}
                      className={`shrink-0 px-2.5 py-1 rounded-full border-2 font-black whitespace-nowrap flex flex-col items-center leading-tight transition-transform cursor-pointer disabled:cursor-not-allowed ${focusRing} ${
                        active
                          ? 'bg-[#d97706] text-white border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16]'
                          : unlocked
                          ? 'bg-[#fffaf0] text-[#5c4033] border-[#2b1d16]/40 hover:border-[#2b1d16] hover:-translate-y-0.5'
                          : 'bg-[#f6ecd6] text-[#9a8574] border-dashed border-[#2b1d16]/30'
                      }`}
                    >
                      <span>{unlocked ? '' : '🔒 '}{m.title.split(':')[0]}</span>
                      {m.goal.kind !== 'none' && (
                        <span
                          className={`text-[11px] tracking-tight ${active ? 'text-[#fde68a]' : unlocked ? 'text-[#d97706]' : 'text-[#c9b8a3]'}`}
                          aria-label={`${missionStars(m.id)} of 3 stars`}
                        >
                          {stars(missionStars(m.id))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 3. MISSION BRIEF, GOAL & STATS */}
              <div className="px-3 py-2.5 border-b-2 border-[#2b1d16]/15 text-xs space-y-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${tw.heading} text-base leading-tight`}>{activeMission.title}</span>
                  <span className={`${tw.chip} bg-[#fde68a] text-[#92400e]`}>{activeMission.badge}</span>
                </div>
                <p className="text-xs text-[#4a3426] leading-snug">{activeMission.desc}</p>

                {hasGoal && (
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#5c4033] mb-1">
                      <span>🎯 {goalText(activeMission)}</span>
                      <span className="tabular-nums">{goal.value}/{goal.target}</span>
                    </div>
                    <div
                      className="h-3 rounded-full bg-[#f6ecd6] border-2 border-[#2b1d16] overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={goal.target}
                      aria-valuenow={goal.value}
                      aria-label="Goal progress"
                    >
                      <div
                        className="h-full bg-[#5f9a45] border-r-2 border-[#2b1d16] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0px,rgba(255,255,255,0.18)_6px,transparent_6px,transparent_12px)] transition-all duration-300"
                        style={{ width: `${pct}%`, borderRightWidth: pct > 0 && pct < 100 ? undefined : 0 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`${statChip} bg-[#fde68a] border-[#2b1d16] text-[#2b1d16]`} title="Coins">🪙 {coins}</span>
                  <span
                    className={`${statChip} ${
                      hasGoal && tick > activeMission.par.ticks
                        ? 'bg-[#fde8ea] border-[#c43a4c] text-[#9b2335]'
                        : 'bg-[#dbeff8] border-[#2b6f8f]/70 text-[#1f4f66]'
                    }`}
                    title="Ticks elapsed (every action costs 1 tick)"
                  >
                    ⏱ {tick}{hasGoal ? ` / par ${activeMission.par.ticks}` : ''}
                  </span>
                  <span className={`${statChip} bg-[#eef3d6] border-[#355f25]/60 text-[#355f25]`} title="Actions used this run">
                    🔋 {actionsUsed}/{maxActions}
                  </span>
                  <span className={`${chipNeutral} gap-1.5`} aria-label="Inventory">
                    {CROP_TYPES.map((c) => (
                      <span key={c} title={CROPS[c].label}>{CROPS[c].emoji}{inventory[c]}</span>
                    ))}
                  </span>
                  <span className={chipNeutral} title="Drone position, heading and tile">
                    ({drone.x},{drone.y}) {drone.dir} · {tile?.crop === 'none' ? 'empty' : `${tile?.crop} ${Math.round((tile?.growth ?? 0) * 100)}%`}{tile?.watered ? ' 💧' : ''}
                  </span>
                </div>

                {/* Hints & panels */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <button
                    onClick={revealHint}
                    disabled={hintsShown >= activeMission.hints.length}
                    className={`${smallBtn} px-2 py-1 text-[11px] !bg-[#fde68a]`}
                  >
                    💡 {hintsShown >= activeMission.hints.length ? 'All hints shown' : `Hint ${hintsShown + 1}/${activeMission.hints.length}`}
                  </button>
                  <button onClick={() => setShowApi((v) => !v)} aria-expanded={showApi} className={`${smallBtn} px-2 py-1 text-[11px]`}>
                    📖 API {showApi ? '▴' : '▾'}
                  </button>
                  <button onClick={() => setShowManual((v) => !v)} aria-expanded={showManual} className={`${smallBtn} px-2 py-1 text-[11px]`}>
                    🎮 Seeds & manual {showManual ? '▴' : '▾'}
                  </button>
                  <button onClick={resetCode} disabled={isRunning} className={`${smallBtn} px-2 py-1 text-[11px]`} title="Replace your code with the mission template">
                    📄 Reset code
                  </button>
                </div>
                {hintsShown > 0 && (
                  <ol className="space-y-1.5 text-xs">
                    {activeMission.hints.slice(0, hintsShown).map((h, i) => (
                      <li key={i} className="rounded-xl border-2 border-[#d97706]/60 bg-[#fff6dc] px-2.5 py-1.5">
                        <span className="text-[#92400e] font-black mr-1">Hint {i + 1}{i === activeMission.hints.length - 1 ? ' (solution)' : ''}:</span>
                        {h.includes('\n') ? (
                          <pre className="mt-1 rounded-lg bg-[#2f3a33] border-2 border-[#2b1d16] px-2 py-1.5 font-mono text-[11px] text-[#e6efd8] whitespace-pre overflow-x-auto">{h}</pre>
                        ) : (
                          <span className="text-[#4a3426]">{h}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* 4. API REFERENCE */}
              {showApi && (
                <div className="px-3 py-2.5 bg-[#f6ecd6] border-b-2 border-[#2b1d16]/15 text-[11px] shrink-0">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                    {API_REFERENCE.map(([sig, desc]) => (
                      <div key={sig}>
                        <dt className="font-mono font-bold text-[#355f25]">{sig}</dt>
                        <dd className="text-[#5c4033]">{desc}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* 5. SEEDS & MANUAL CONTROLS */}
              {showManual && (
                <div className="px-3 py-2.5 bg-[#f6ecd6] border-b-2 border-[#2b1d16]/15 text-xs space-y-2 shrink-0">
                  <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Seed picker">
                    {CROP_TYPES.map((c) => {
                      const info = CROPS[c];
                      const locked = lockedCrops.includes(c);
                      return (
                        <button
                          key={c}
                          role="radio"
                          aria-checked={selectedSeed === c}
                          disabled={locked}
                          onClick={() => setSelectedSeed(c as CropType)}
                          title={locked ? `Clear mission ${info.unlockedBy?.toUpperCase()} to unlock` : `Select ${info.label}`}
                          className={`text-left px-2 py-1.5 rounded-xl border-2 text-[11px] leading-tight cursor-pointer disabled:cursor-not-allowed transition-transform ${focusRing} ${
                            locked
                              ? 'border-dashed border-[#2b1d16]/25 bg-[#f6ecd6] text-[#9a8574] grayscale'
                              : selectedSeed === c
                              ? 'border-[#2b1d16] bg-[#fde68a] text-[#2b1d16] shadow-[0_2px_0_0_#2b1d16]'
                              : 'border-[#2b1d16]/30 bg-[#fffaf0] text-[#4a3426] hover:border-[#2b1d16] hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="font-black text-xs">{info.emoji} {info.label}</div>
                          {locked ? (
                            <div>🔒 Clear {info.unlockedBy?.toUpperCase()} to unlock</div>
                          ) : (
                            <div>
                              cost {info.seedCost} · sells {info.sellPrice} · {info.growTicks}t ({Math.ceil(info.growTicks / 2)}t wet)
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="grid grid-cols-3 gap-1" aria-label="Manual drive">
                      <span />
                      <button onClick={() => manualStep('N')} disabled={isRunning} aria-label="Move north" className={`${smallBtn} w-8 h-8 text-sm`}>↑</button>
                      <span />
                      <button onClick={() => manualStep('W')} disabled={isRunning} aria-label="Move west" className={`${smallBtn} w-8 h-8 text-sm`}>←</button>
                      <button onClick={() => manualStep('S')} disabled={isRunning} aria-label="Move south" className={`${smallBtn} w-8 h-8 text-sm`}>↓</button>
                      <button onClick={() => manualStep('E')} disabled={isRunning} aria-label="Move east" className={`${smallBtn} w-8 h-8 text-sm`}>→</button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => manualPlant(selectedSeed)} disabled={isRunning} className={`${smallBtn} px-2 py-1 text-[11px] !bg-[#c5d77a]`}>
                        🌱 Plant {CROPS[selectedSeed].emoji}
                      </button>
                      <button onClick={manualWater} disabled={isRunning} className={`${smallBtn} px-2 py-1 text-[11px] !bg-[#bfe3f2]`}>💧 Water</button>
                      <button onClick={manualHarvest} disabled={isRunning} className={`${smallBtn} px-2 py-1 text-[11px] !bg-[#fde68a]`}>✂️ Harvest</button>
                      <button onClick={manualWait} disabled={isRunning} className={`${smallBtn} px-2 py-1 text-[11px]`}>⏳ Wait</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6b4730]">Manual moves are practice only: Run always restarts from the mission start.</p>
                </div>
              )}

              {/* 6. CODE EDITOR + LOG (or a pointer to the popped-out terminal window) */}
              {editorPoppedOut ? (
                <div className="mx-2.5 my-3 rounded-2xl border-2 border-dashed border-[#2b1d16]/50 bg-[#f6ecd6] px-3 py-4 text-center shrink-0">
                  <div className="text-2xl" aria-hidden>🖥️</div>
                  <p className="mt-1 text-sm font-black">Your code is open in the Drone terminal</p>
                  <p className="text-xs text-[#6b4730]">Drag it anywhere and resize it from its corner. Run from either window.</p>
                  <button onClick={() => setPoppedOut(false)} className={`${tw.btn} ${tw.btnPaper} !text-xs mt-2.5`}>
                    ⇲ Bring editor back here
                  </button>
                </div>
              ) : (
                <>
                  <CodeEditor
                    headerAction={
                      <button
                        onClick={() => setPoppedOut(true)}
                        aria-label="Open the code editor in its own window"
                        title="Open in its own window"
                        className={`shrink-0 px-1.5 py-0.5 rounded-md border border-[#1c241f] bg-[#3a463e] text-[#e6efd8] font-bold hover:bg-[#46554b] cursor-pointer ${focusRing}`}
                      >
                        ⧉ Pop out
                      </button>
                    }
                  />
                  <LogPanel />
                </>
              )}
            </div>

            {/* 9. CONTROLS BAR */}
            <div className="px-3 py-2 bg-[#f6ecd6] border-t-[3px] border-[#2b1d16] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[11px]" role="group" aria-label="Playback speed">
                <span className="font-black uppercase tracking-wider text-[#9a6a43] mr-0.5">Speed</span>
                {([1, 2, 5, 10] as Speed[]).map((s) => {
                  const ok = availableSpeeds.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      disabled={!ok}
                      aria-pressed={speed === s}
                      title={ok ? `${s}x speed` : 'Clear M4 to unlock 10x'}
                      className={`px-2 py-0.5 rounded-full border-2 font-black transition-transform cursor-pointer disabled:cursor-not-allowed ${focusRing} ${
                        speed === s
                          ? 'bg-[#d97706] text-white border-[#2b1d16] shadow-[0_2px_0_0_#2b1d16]'
                          : ok
                          ? 'bg-[#fffaf0] text-[#5c4033] border-[#2b1d16]/40 hover:border-[#2b1d16] hover:-translate-y-0.5'
                          : 'bg-[#f6ecd6] text-[#9a8574] border-dashed border-[#2b1d16]/30'
                      }`}
                    >
                      {ok ? `${s}x` : `🔒${s}x`}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetField}
                  aria-label="Reset field to mission start"
                  title="Reset field to mission start"
                  className={`${tw.btn} ${tw.btnPaper} !px-3 !py-1.5`}
                >
                  ↺ Reset
                </button>
                <button
                  onClick={isRunning ? stopScript : runScript}
                  className={`${tw.btn} !px-5 !py-1.5 uppercase tracking-wide text-white ${isRunning ? 'bg-[#c43a4c]' : tw.btnGreen}`}
                >
                  {isRunning ? '⏹ Stop' : '▶ Run'}
                </button>
              </div>
            </div>

            {/* 10. MISSION COMPLETE CARD */}
            {completion && (
              <div className="game-fade-in absolute inset-0 z-20 flex items-center justify-center bg-[#2b1d16]/45 p-4">
                <div role="dialog" aria-label="Mission complete" className={`game-modal-pop relative w-full max-w-xs ${tw.card} p-4 pt-5 text-center`}>
                  <div aria-hidden className="absolute -top-5 inset-x-0 flex justify-center"><span className="game-float text-3xl">🎉</span></div>
                  <p className={tw.label}>Mission complete!</p>
                  <div className={`${tw.heading} text-lg leading-tight mt-0.5`}>{missions[completion.missionIdx]?.title}</div>
                  <div className="mt-2 flex justify-center gap-1" aria-label={`${completion.stars} of 3 stars`} role="img">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        aria-hidden
                        className={`text-5xl leading-none ${i === 1 ? '-translate-y-1.5' : ''} ${
                          i < completion.stars
                            ? 'text-[#f5b301] [text-shadow:0_3px_0_#2b1d16,2px_0_0_#2b1d16,-2px_0_0_#2b1d16,0_-2px_0_#2b1d16]'
                            : 'text-[#e8dcc4] [text-shadow:0_3px_0_rgba(43,29,22,0.35)]'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {completion.newBest && (
                    <div className={`${tw.chip} mt-2 bg-[#c5d77a] text-[#355f25] border-[#355f25]`}>✨ New best!</div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs font-bold text-[#2b1d16]">
                    <div className="rounded-xl bg-[#f6ecd6] border-2 border-[#2b1d16]/30 py-1.5">
                      ⏱ {completion.ticks} ticks
                      <div className="text-[11px] font-semibold text-[#6b4730]">par {missions[completion.missionIdx]?.par.ticks}</div>
                    </div>
                    <div className="rounded-xl bg-[#f6ecd6] border-2 border-[#2b1d16]/30 py-1.5">
                      📝 {completion.lines} lines
                      <div className="text-[11px] font-semibold text-[#6b4730]">par {missions[completion.missionIdx]?.par.lines}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-[#6b4730] leading-snug">
                    ★ goal met · ★★ within par ticks · ★★★ also within par lines
                  </p>
                  {completion.reward && (
                    <div className="mt-2 rounded-xl border-2 border-dashed border-[#d97706] bg-[#fff6dc] px-2 py-1 text-xs text-[#92400e] font-black">
                      🎁 {completion.reward}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    <button onClick={dismissCompletion} className={`${tw.btn} ${tw.btnPaper} !text-xs`}>
                      Keep tinkering
                    </button>
                    {!isLastMission && (
                      <button onClick={nextMission} className={`${tw.btn} ${tw.btnGreen} !text-xs`}>
                        Next mission →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESIZE HANDLE */}
        {!isMinimized && <ResizeGrip onResizeStart={handleResizeStart} />}
      </div>

      {editorPoppedOut && (
        <CodeTerminalWindow onDock={() => setPoppedOut(false)} zIndex={front === 'terminal' ? 51 : 50} onFocus={() => setFront('terminal')} />
      )}
    </>
  );
};
