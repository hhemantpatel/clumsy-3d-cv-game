import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import type { CropType, DroneState, FarmTile } from '../garden/types';
import { GardenSession } from '../garden/session';
import { applyAction } from '../garden/sim';
import type { CropCounts, GardenState, SimAction, SimEvent, SimEventKind } from '../garden/sim';
import {
  GARDEN_MISSIONS,
  computeStars,
  goalProgress,
  initialStateFor,
  isGoalMet,
  isMissionUnlocked as missionUnlockedFor,
  lockedCropsFor,
} from '../garden/missions';
import type { Mission } from '../garden/missions';
import { countCodeLines, MAX_ACTIONS } from '../garden/interpreter';

// Backwards-compatible re-exports for existing consumers.
export type { FarmTile, DroneState, CropType } from '../garden/types';
export { GARDEN_MISSIONS } from '../garden/missions';
export type { Mission } from '../garden/missions';

export type Speed = 1 | 2 | 5 | 10;
export const SPEED_MS: Record<Speed, number> = { 1: 600, 2: 300, 5: 120, 10: 60 };

export interface CurrentAction {
  kind: SimEventKind;
  x: number;
  y: number;
  crop?: CropType;
  /** Increments on every action so repeated identical actions can retrigger animations. */
  seq: number;
}

export type LogTone = 'info' | 'success' | 'harvest' | 'water' | 'warn' | 'error' | 'print';
export interface LogLine {
  id: number;
  text: string;
  tone: LogTone;
}

export interface ScriptError {
  message: string;
  line: number;
}

export interface MissionCompletion {
  missionIdx: number;
  stars: 0 | 1 | 2 | 3;
  ticks: number;
  lines: number;
  newBest: boolean;
  reward?: string;
}

/** What the 3D scene needs. Changes only when the field / drone / playback changes. */
export interface GardenSimValue {
  grid: FarmTile[][];
  drone: DroneState;
  isRunning: boolean;
  currentAction: CurrentAction | null;
  tick: number;
  /** Milliseconds between playback steps at the current speed (useful for animation timing). */
  stepMs: number;
}

/** Everything the editor window needs. */
export interface GardenUIValue {
  code: string;
  setCode: (code: string) => void;
  resetCode: () => void;
  coins: number;
  earned: number;
  /** Alias of `earned` (legacy name). */
  score: number;
  inventory: CropCounts;
  harvested: CropCounts;
  logs: LogLine[];
  clearLogs: () => void;
  error: ScriptError | null;
  currentLine: number | null;
  actionsUsed: number;
  maxActions: number;

  missions: Mission[];
  activeMissionIdx: number;
  activeMission: Mission;
  selectMission: (idx: number) => void;
  nextMission: () => void;
  isMissionUnlocked: (idx: number) => boolean;
  bestStars: Record<string, number>;
  lifetimeCoins: number;
  goal: { value: number; target: number };
  completion: MissionCompletion | null;
  dismissCompletion: () => void;
  hintsShown: number;
  revealHint: () => void;

  lockedCrops: CropType[];
  speed: Speed;
  setSpeed: (s: Speed) => void;
  availableSpeeds: Speed[];
  runScript: () => void;
  stopScript: () => void;
  resetField: () => void;

  selectedSeed: CropType;
  setSelectedSeed: (c: CropType) => void;
  manualStep: (dir: 'N' | 'E' | 'S' | 'W') => void;
  manualPlant: (crop?: CropType) => void;
  manualWater: () => void;
  manualHarvest: () => void;
  manualWait: () => void;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const SAVE_KEY = 'clumsy_cv_garden_v2';
const LEGACY_KEYS = ['clumsy_cv_garden_cleared_v1'];

interface SaveData {
  version: 2;
  best: Record<string, number>;
  lifetimeCoins: number;
}

const loadSave = (): SaveData => {
  const empty: SaveData = { version: 2, best: {}, lifetimeCoins: 0 };
  try {
    // Old v1 data tracked different missions; it cannot be mapped, so drop it.
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 2) return empty;
    const best: Record<string, number> = {};
    if (parsed.best && typeof parsed.best === 'object') {
      for (const m of GARDEN_MISSIONS) {
        const v = parsed.best[m.id];
        if (typeof v === 'number' && v >= 0 && v <= 3) best[m.id] = Math.floor(v);
      }
    }
    const lifetimeCoins =
      typeof parsed.lifetimeCoins === 'number' && Number.isFinite(parsed.lifetimeCoins) ? parsed.lifetimeCoins : 0;
    return { version: 2, best, lifetimeCoins };
  } catch {
    return empty;
  }
};

const writeSave = (data: SaveData) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage full / disabled: progress just won't persist
  }
};

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const GardenSimContext = createContext<GardenSimValue | null>(null);
const GardenUIContext = createContext<GardenUIValue | null>(null);

const MAX_LOGS = 300;
const idleDrone = (d: DroneState): DroneState =>
  d.isMoving || d.isWatering || d.isPlanting || d.isHarvesting
    ? { ...d, isMoving: false, isWatering: false, isPlanting: false, isHarvesting: false }
    : d;

const toneFor = (kind: SimEventKind): LogTone =>
  kind === 'harvest' ? 'harvest' : kind === 'water' ? 'water' : kind === 'fail' || kind === 'spoil' ? 'warn' : 'info';

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSave = useMemo(loadSave, []);
  const [bestStars, setBestStars] = useState<Record<string, number>>(initialSave.best);
  const [lifetimeCoins, setLifetimeCoins] = useState(initialSave.lifetimeCoins);
  const lockedCrops = useMemo(() => lockedCropsFor(bestStars), [bestStars]);

  const [activeMissionIdx, setActiveMissionIdx] = useState(0);
  const activeMission = GARDEN_MISSIONS[activeMissionIdx] ?? GARDEN_MISSIONS[0];

  const [sim, setSim] = useState<GardenState>(() => initialStateFor(GARDEN_MISSIONS[0], lockedCropsFor(initialSave.best)));
  const simRef = useRef(sim);
  const [code, setCodeState] = useState(GARDEN_MISSIONS[0].template);
  const drafts = useRef<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeedState] = useState<Speed>(2);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<CurrentAction | null>(null);
  const [error, setError] = useState<ScriptError | null>(null);
  const [completion, setCompletion] = useState<MissionCompletion | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState<CropType>('wheat');
  const [actionsUsed, setActionsUsed] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>(() => [
    { id: 1, text: '🌱 Drone-Bot 01 connected to the 3D garden.', tone: 'info' },
    { id: 2, text: '⌨️ Write Python, press Run, and watch the drone farm live.', tone: 'info' },
  ]);

  const logId = useRef(3);
  const seq = useRef(0);
  const stepFoot = useRef(false);
  const sessionRef = useRef<GardenSession | null>(null);
  const runRef = useRef<{ missionIdx: number; code: string } | null>(null);
  const bestRef = useRef(bestStars);
  bestRef.current = bestStars;

  // Persist progress whenever it changes.
  useEffect(() => {
    writeSave({ version: 2, best: bestStars, lifetimeCoins });
  }, [bestStars, lifetimeCoins]);

  const commit = useCallback((s: GardenState) => {
    simRef.current = s;
    setSim(s);
  }, []);

  const addLogs = useCallback((items: { text: string; tone: LogTone }[]) => {
    if (!items.length) return;
    const withIds = items.map((i) => ({ ...i, id: logId.current++ }));
    setLogs((prev) => {
      const next = prev.concat(withIds);
      return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
    });
  }, []);
  const log = useCallback((text: string, tone: LogTone = 'info') => addLogs([{ text, tone }]), [addLogs]);

  /** Side effects for simulation events. Always called outside state updaters. */
  const handleEvents = useCallback(
    (events: SimEvent[], verbose: boolean) => {
      const lines: { text: string; tone: LogTone }[] = [];
      let gained = 0;
      for (const ev of events) {
        switch (ev.kind) {
          case 'move':
            stepFoot.current = !stepFoot.current;
            soundManager.playStep(stepFoot.current);
            break;
          case 'plant':
            soundManager.playPlant();
            break;
          case 'harvest':
            soundManager.playHarvest();
            gained += ev.coins ?? 0;
            break;
          case 'water':
            soundManager.playInteract();
            break;
          case 'fail':
          case 'spoil':
            soundManager.playBump();
            break;
          default:
            break;
        }
        const quiet = ev.kind === 'move' || ev.kind === 'turn' || ev.kind === 'wait';
        if (verbose || !quiet) lines.push({ text: ev.message, tone: toneFor(ev.kind) });
        seq.current++;
        setCurrentAction({ kind: ev.kind, x: ev.x, y: ev.y, crop: ev.crop, seq: seq.current });
      }
      if (gained) setLifetimeCoins((c) => c + gained);
      addLogs(lines);
    },
    [addLogs]
  );

  /** Tear down the running program (no logging). */
  const halt = useCallback(() => {
    const had = !!sessionRef.current;
    sessionRef.current?.stop();
    sessionRef.current = null;
    setIsRunning(false);
    setCurrentLine(null);
    const s = simRef.current;
    const d = idleDrone(s.drone);
    if (d !== s.drone) commit({ ...s, drone: d });
    return had;
  }, [commit]);

  const stopScript = useCallback(() => {
    if (halt()) log('⏹ Program stopped.', 'warn');
  }, [halt, log]);

  const finishRun = useCallback(
    (reason: 'finished' | 'out_of_energy' | 'goal') => {
      const run = runRef.current;
      const session = sessionRef.current;
      const hasDef = !!session?.hasDef;
      halt();
      if (!run) return;
      const m = GARDEN_MISSIONS[run.missionIdx];
      const s = simRef.current;
      if (reason === 'out_of_energy') {
        log(`🔋 Out of energy after ${MAX_ACTIONS} actions. Results so far are kept.`, 'warn');
      }
      if (m.goal.kind === 'none') {
        log(`✅ Program finished at tick ${s.tick} with ${s.coins} coins.`, 'success');
        return;
      }
      const met = isGoalMet(m, s, hasDef);
      if (!met) {
        const { value, target } = goalProgress(m, s);
        if (m.requireDef && !hasDef && value >= target) {
          log('🧩 Goal reached, but this mission needs your program to define a function with def.', 'warn');
        } else {
          log(`🎯 Goal not reached yet (${value}/${target}). Tweak your code and run again!`, 'warn');
        }
        return;
      }
      const stars = computeStars(m, true, s.tick, run.code);
      const prev = bestRef.current[m.id] ?? 0;
      if (stars > prev) setBestStars((b) => ({ ...b, [m.id]: Math.max(b[m.id] ?? 0, stars) }));
      setCompletion({
        missionIdx: run.missionIdx,
        stars,
        ticks: s.tick,
        lines: countCodeLines(run.code),
        newBest: stars > prev,
        reward: prev === 0 ? m.reward : undefined,
      });
      log(`🎉 ${m.title} complete! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} in ${s.tick} ticks.`, 'success');
      soundManager.playLevelUp();
      confetti({ particleCount: 80 + stars * 30, spread: 80, origin: { y: 0.6 } });
    },
    [halt, log]
  );

  /** One playback step: pull the next action from the program and apply it. */
  const step = useCallback(() => {
    const session = sessionRef.current;
    const run = runRef.current;
    if (!session || !run) return;
    const r = session.step();
    if (r.prints.length) addLogs(r.prints.map((p) => ({ text: `🖨️ ${p.text}`, tone: 'print' as const })));
    if (r.kind === 'error') {
      halt();
      const line = r.error.line;
      setError({ message: r.error.message, line });
      log(`❌ ${line ? `Line ${line}: ` : ''}${r.error.message}`, 'error');
      soundManager.playBump();
      return;
    }
    if (r.kind === 'done') {
      finishRun(r.status);
      return;
    }
    commit(session.state);
    setCurrentLine(r.line);
    setActionsUsed((n) => n + 1);
    handleEvents(r.events, false);
    const m = GARDEN_MISSIONS[run.missionIdx];
    if (isGoalMet(m, session.state, session.hasDef)) finishRun('goal');
  }, [addLogs, commit, finishRun, halt, handleEvents, log]);

  const stepRef = useRef(step);
  stepRef.current = step;

  // Single playback interval, owned by an effect so it is StrictMode-safe and never doubled.
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => stepRef.current(), SPEED_MS[speed]);
    return () => window.clearInterval(id);
  }, [isRunning, speed]);

  // Stop the program if the provider unmounts.
  useEffect(
    () => () => {
      sessionRef.current?.stop();
      sessionRef.current = null;
    },
    []
  );

  const runScript = useCallback(() => {
    if (sessionRef.current) {
      stopScript();
      return;
    }
    const m = GARDEN_MISSIONS[activeMissionIdx];
    const init = initialStateFor(m, lockedCrops);
    const session = new GardenSession(code, init);
    setCompletion(null);
    setCurrentLine(null);
    setActionsUsed(0);
    commit(init);
    if (session.parseError) {
      const e = session.parseError;
      setError({ message: e.message, line: e.line });
      log(`❌ Line ${e.line}: ${e.message}`, 'error');
      soundManager.playBump();
      return;
    }
    setError(null);
    sessionRef.current = session;
    runRef.current = { missionIdx: activeMissionIdx, code };
    setIsRunning(true);
    log(`▶ Running ${m.title}: field reset, ${m.startCoins} coins.`, 'info');
  }, [activeMissionIdx, code, commit, lockedCrops, log, stopScript]);

  const resetField = useCallback(() => {
    halt();
    commit(initialStateFor(GARDEN_MISSIONS[activeMissionIdx], lockedCrops));
    setError(null);
    setCompletion(null);
    setActionsUsed(0);
    log('🔄 Field re-tilled to the mission start.', 'info');
  }, [activeMissionIdx, commit, halt, lockedCrops, log]);

  const setCode = useCallback(
    (c: string) => {
      setCodeState(c);
      drafts.current[GARDEN_MISSIONS[activeMissionIdx].id] = c;
    },
    [activeMissionIdx]
  );

  const resetCode = useCallback(() => {
    const m = GARDEN_MISSIONS[activeMissionIdx];
    setCodeState(m.template);
    delete drafts.current[m.id];
    setError(null);
    log('📄 Code reset to the mission template.', 'info');
  }, [activeMissionIdx, log]);

  const isMissionUnlocked = useCallback((idx: number) => missionUnlockedFor(idx, bestStars), [bestStars]);

  const selectMission = useCallback(
    (idx: number) => {
      const m = GARDEN_MISSIONS[idx];
      if (!m) return;
      if (!missionUnlockedFor(idx, bestRef.current)) {
        log(`🔒 ${m.title} is locked. Clear ${GARDEN_MISSIONS[idx - 1]?.title ?? 'the previous mission'} first.`, 'warn');
        soundManager.playBump();
        return;
      }
      halt();
      setActiveMissionIdx(idx);
      setCodeState(drafts.current[m.id] ?? m.template);
      commit(initialStateFor(m, lockedCropsFor(bestRef.current)));
      setError(null);
      setCompletion(null);
      setHintsShown(0);
      setActionsUsed(0);
      addLogs([
        { text: `📂 Loaded ${m.title}`, tone: 'info' },
        { text: `🎯 ${m.desc}`, tone: 'info' },
      ]);
    },
    [addLogs, commit, halt, log]
  );

  const nextMission = useCallback(() => {
    const next = Math.min(activeMissionIdx + 1, GARDEN_MISSIONS.length - 1);
    selectMission(next);
  }, [activeMissionIdx, selectMission]);

  const dismissCompletion = useCallback(() => setCompletion(null), []);

  const revealHint = useCallback(() => {
    setHintsShown((n) => Math.min(n + 1, GARDEN_MISSIONS[activeMissionIdx].hints.length));
  }, [activeMissionIdx]);

  const availableSpeeds = useMemo<Speed[]>(() => ((bestStars.m4 ?? 0) > 0 ? [1, 2, 5, 10] : [1, 2, 5]), [bestStars]);
  const setSpeed = useCallback((s: Speed) => {
    if (s === 10 && !((bestRef.current.m4 ?? 0) > 0)) return;
    setSpeedState(s);
  }, []);

  // ---- manual controls (same reducer, disabled while a program runs) ----
  const manual = useCallback(
    (action: SimAction) => {
      if (sessionRef.current) return;
      const res = applyAction({ ...simRef.current, lockedCrops }, action);
      commit(res.state);
      handleEvents(res.events, action.type !== 'move');
    },
    [commit, handleEvents, lockedCrops]
  );
  const manualStep = useCallback((dir: 'N' | 'E' | 'S' | 'W') => manual({ type: 'move', dir }), [manual]);
  const manualPlant = useCallback((crop?: CropType) => manual({ type: 'plant', crop: crop ?? selectedSeed }), [manual, selectedSeed]);
  const manualWater = useCallback(() => manual({ type: 'water' }), [manual]);
  const manualHarvest = useCallback(() => manual({ type: 'harvest' }), [manual]);
  const manualWait = useCallback(() => manual({ type: 'wait' }), [manual]);
  const clearLogs = useCallback(() => setLogs([]), []);

  const simValue = useMemo<GardenSimValue>(
    () => ({
      grid: sim.grid,
      drone: sim.drone,
      isRunning,
      currentAction,
      tick: sim.tick,
      stepMs: SPEED_MS[speed],
    }),
    [sim.grid, sim.drone, sim.tick, isRunning, currentAction, speed]
  );

  const goal = useMemo(() => goalProgress(activeMission, sim), [activeMission, sim]);

  const uiValue = useMemo<GardenUIValue>(
    () => ({
      code,
      setCode,
      resetCode,
      coins: sim.coins,
      earned: sim.earned,
      score: sim.earned,
      inventory: sim.inventory,
      harvested: sim.harvested,
      logs,
      clearLogs,
      error,
      currentLine,
      actionsUsed,
      maxActions: MAX_ACTIONS,
      missions: GARDEN_MISSIONS,
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
    }),
    [
      code, setCode, resetCode, sim.coins, sim.earned, sim.inventory, sim.harvested, logs, clearLogs, error,
      currentLine, actionsUsed, activeMissionIdx, activeMission, selectMission, nextMission, isMissionUnlocked,
      bestStars, lifetimeCoins, goal, completion, dismissCompletion, hintsShown, revealHint, lockedCrops, speed,
      setSpeed, availableSpeeds, runScript, stopScript, resetField, selectedSeed, manualStep, manualPlant,
      manualWater, manualHarvest, manualWait,
    ]
  );

  return (
    <GardenSimContext.Provider value={simValue}>
      <GardenUIContext.Provider value={uiValue}>{children}</GardenUIContext.Provider>
    </GardenSimContext.Provider>
  );
};

/** Lightweight hook for the 3D scene: grid, drone, isRunning, currentAction, tick, stepMs. */
export const useGardenSim = (): GardenSimValue => {
  const ctx = useContext(GardenSimContext);
  if (!ctx) throw new Error('useGardenSim must be used within a GardenProvider');
  return ctx;
};

/** Editor / UI state (code, logs, missions, coins...). Does not include grid/drone. */
export const useGardenUI = (): GardenUIValue => {
  const ctx = useContext(GardenUIContext);
  if (!ctx) throw new Error('useGardenUI must be used within a GardenProvider');
  return ctx;
};

/** Merged legacy hook. Re-renders on every change (including typing); prefer useGardenSim in 3D code. */
export const useGarden = (): GardenSimValue & GardenUIValue => {
  const simValue = useGardenSim();
  const ui = useGardenUI();
  return useMemo(() => ({ ...simValue, ...ui }), [simValue, ui]);
};
