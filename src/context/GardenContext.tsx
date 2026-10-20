import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';

export interface FarmTile {
  crop: 'none' | 'wheat' | 'carrot' | 'pumpkin';
  watered: boolean;
  growth: number; // 0=none/seed, 1=sprout, 2=mature
}

export interface DroneState {
  x: number; // 0..4 (col)
  y: number; // 0..4 (row)
  dir: 'N' | 'E' | 'S' | 'W';
  isMoving: boolean;
  isWatering: boolean;
  isPlanting: boolean;
  isHarvesting: boolean;
}

export interface FarmAction {
  type: 'move' | 'turn' | 'plant' | 'water' | 'harvest';
  x: number;
  y: number;
  dir?: 'N' | 'E' | 'S' | 'W';
  crop?: string;
  mature?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  badge: string;
  targetScore: number;
  desc: string;
  code: string;
}

export const GARDEN_MISSIONS: Mission[] = [
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
    desc: 'Snake through rows in a zigzag pattern to farm the entire 5x5 field in 3D!',
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
    desc: 'Plant high-value Royal Pumpkins (+50 pts each) down the columns in 3D!',
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
    desc: 'Write your own custom farming algorithm and watch Drone-Bot execute it live in 3D!',
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

export const createInitialGrid = (): FarmTile[][] => {
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

export const parsePythonToJS = (code: string): string => {
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

interface GardenContextType {
  grid: FarmTile[][];
  drone: DroneState;
  score: number;
  inventory: { wheat: number; carrot: number; pumpkin: number };
  activeMissionIdx: number;
  code: string;
  isRunning: boolean;
  speed: 1 | 2 | 5;
  logs: string[];
  missionCleared: boolean;
  setGrid: React.Dispatch<React.SetStateAction<FarmTile[][]>>;
  setDrone: React.Dispatch<React.SetStateAction<DroneState>>;
  setCode: (code: string) => void;
  setActiveMissionIdx: (idx: number) => void;
  setSpeed: (speed: 1 | 2 | 5) => void;
  runScript: () => void;
  stopScript: () => void;
  resetField: () => void;
  selectMission: (idx: number) => void;
  manualStep: (dir: 'N' | 'E' | 'S' | 'W') => void;
  manualPlant: (cropType: 'wheat' | 'carrot' | 'pumpkin') => void;
  manualWater: () => void;
  manualHarvest: () => void;
}

const GardenContext = createContext<GardenContextType | null>(null);

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [grid, setGrid] = useState<FarmTile[][]>(createInitialGrid);
  const [drone, setDrone] = useState<DroneState>({
    x: 0,
    y: 0,
    dir: 'E',
    isMoving: false,
    isWatering: false,
    isPlanting: false,
    isHarvesting: false,
  });
  const [score, setScore] = useState(0);
  const [inventory, setInventory] = useState({ wheat: 0, carrot: 0, pumpkin: 0 });
  const [activeMissionIdx, setActiveMissionIdx] = useState(0);
  const [code, setCode] = useState(GARDEN_MISSIONS[0].code);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(2);
  const [logs, setLogs] = useState<string[]>([
    '🌱 3D Automaton Garden connected to Drone-Bot 01.',
    '⌨️ Edit Python code, move the window, and watch Drone-Bot farm in real 3D!',
  ]);
  const [missionCleared, setMissionCleared] = useState(false);

  const playbackTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  const selectMission = useCallback((idx: number) => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setIsRunning(false);
    setActiveMissionIdx(idx);
    setCode(GARDEN_MISSIONS[idx].code);
    setGrid(createInitialGrid());
    setDrone({
      x: 0,
      y: 0,
      dir: 'E',
      isMoving: false,
      isWatering: false,
      isPlanting: false,
      isHarvesting: false,
    });
    setMissionCleared(false);
    setLogs((prev) => [
      `📂 Loaded ${GARDEN_MISSIONS[idx].title}`,
      `🎯 Goal: ${GARDEN_MISSIONS[idx].desc}`,
      ...prev.slice(0, 3),
    ]);
  }, []);

  const resetField = useCallback(() => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setIsRunning(false);
    setGrid(createInitialGrid());
    setDrone({
      x: 0,
      y: 0,
      dir: 'E',
      isMoving: false,
      isWatering: false,
      isPlanting: false,
      isHarvesting: false,
    });
    setMissionCleared(false);
    setLogs((prev) => ['🔄 Farm plot re-tilled to pristine state.', ...prev.slice(0, 3)]);
  }, []);

  const stopScript = useCallback(() => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setIsRunning(false);
    setDrone((d) => ({
      ...d,
      isMoving: false,
      isWatering: false,
      isPlanting: false,
      isHarvesting: false,
    }));
    setLogs((prev) => ['⏹ Execution stopped by operator.', ...prev]);
  }, []);

  const runScript = useCallback(() => {
    if (isRunning) {
      stopScript();
      return;
    }

    try {
      const simGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
      const simDrone = { x: drone.x, y: drone.y, dir: drone.dir };
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
        if (cell.crop !== 'none') cell.growth = 2;
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

      setIsRunning(true);
      setLogs((prev) => [
        `▶ Running script in 3D (${actions.length} action steps planned)...`,
        ...prev.slice(0, 4),
      ]);

      let actionIdx = 0;
      const intervalMs = speed === 1 ? 320 : speed === 2 ? 180 : 70;

      playbackTimerRef.current = setInterval(() => {
        if (actionIdx >= actions.length) {
          clearInterval(playbackTimerRef.current);
          setIsRunning(false);
          setDrone((d) => ({
            ...d,
            isMoving: false,
            isWatering: false,
            isPlanting: false,
            isHarvesting: false,
          }));
          setLogs((prev) => ['✨ 3D Farm script finished!', ...prev]);

          const curMission = GARDEN_MISSIONS[activeMissionIdx];
          if (curMission.targetScore > 0) {
            setScore((s) => {
              if (s >= curMission.targetScore) {
                setMissionCleared(true);
                confetti({
                  particleCount: 50,
                  spread: 80,
                  origin: { y: 0.5 },
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
          setDrone((d) => ({
            ...d,
            x: act.x,
            y: act.y,
            dir: act.dir || d.dir,
            isMoving: true,
            isWatering: false,
            isPlanting: false,
            isHarvesting: false,
          }));
          soundManager.playStep(true);
        } else if (act.type === 'turn') {
          setDrone((d) => ({ ...d, dir: act.dir || d.dir }));
        } else if (act.type === 'plant') {
          setDrone((d) => ({ ...d, isPlanting: true, isMoving: false, isWatering: false, isHarvesting: false }));
          setGrid((prevGrid) => {
            const next = prevGrid.map((r) => [...r]);
            next[act.y][act.x] = { crop: act.crop as any, watered: false, growth: 1 };
            return next;
          });
          soundManager.playPlant();
          setLogs((prev) => [`🌱 Planted ${act.crop} in 3D soil at (${act.x}, ${act.y})`, ...prev.slice(0, 4)]);
        } else if (act.type === 'water') {
          setDrone((d) => ({ ...d, isWatering: true, isMoving: false, isPlanting: false, isHarvesting: false }));
          setGrid((prevGrid) => {
            const next = prevGrid.map((r) => [...r]);
            const cell = next[act.y][act.x];
            cell.watered = true;
            if (cell.crop !== 'none') cell.growth = 2;
            return next;
          });
          setLogs((prev) => [`💧 Irrigated 3D furrow at (${act.x}, ${act.y})`, ...prev.slice(0, 4)]);
        } else if (act.type === 'harvest') {
          setDrone((d) => ({ ...d, isHarvesting: true, isMoving: false, isWatering: false, isPlanting: false }));
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
            `✂ 3D Harvested ${harvestedCrop} (+${pts} pts)! Total: ${score + pts}`,
            ...prev.slice(0, 4),
          ]);
        }
      }, intervalMs);
    } catch (err: any) {
      setLogs((prev) => [`❌ Script Error: ${err.message || err}`, ...prev]);
      setIsRunning(false);
    }
  }, [code, drone, grid, isRunning, speed, activeMissionIdx, score, stopScript]);

  const manualStep = useCallback((dir: 'N' | 'E' | 'S' | 'W') => {
    setDrone((d) => {
      let nx = d.x;
      let ny = d.y;
      if (dir === 'N') ny = (ny - 1 + 5) % 5;
      else if (dir === 'S') ny = (ny + 1) % 5;
      else if (dir === 'E') nx = (nx + 1) % 5;
      else if (dir === 'W') nx = (nx - 1 + 5) % 5;
      return { ...d, x: nx, y: ny, dir, isMoving: true, isWatering: false, isPlanting: false, isHarvesting: false };
    });
    soundManager.playStep(true);
  }, []);

  const manualPlant = useCallback((cropType: 'wheat' | 'carrot' | 'pumpkin') => {
    setDrone((d) => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[d.y][d.x] = { crop: cropType, watered: false, growth: 1 };
        return next;
      });
      return { ...d, isPlanting: true, isMoving: false, isWatering: false, isHarvesting: false };
    });
    soundManager.playPlant();
  }, []);

  const manualWater = useCallback(() => {
    setDrone((d) => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        const cell = next[d.y][d.x];
        cell.watered = true;
        if (cell.crop !== 'none') cell.growth = 2;
        return next;
      });
      return { ...d, isWatering: true, isMoving: false, isPlanting: false, isHarvesting: false };
    });
  }, []);

  const manualHarvest = useCallback(() => {
    setDrone((d) => {
      setGrid((prev) => {
        const cell = prev[d.y][d.x];
        if (cell.crop === 'none') return prev;
        const pts = cell.crop === 'pumpkin' ? 50 : cell.crop === 'carrot' ? 25 : 10;
        const crop = cell.crop;
        const next = prev.map((r) => [...r]);
        next[d.y][d.x] = { crop: 'none', watered: false, growth: 0 };
        setScore((s) => s + pts);
        setInventory((inv) => ({ ...inv, [crop]: inv[crop as keyof typeof inv] + 1 }));
        soundManager.playHarvest();
        return next;
      });
      return { ...d, isHarvesting: true, isMoving: false, isWatering: false, isPlanting: false };
    });
  }, []);

  useEffect(() => {
    (window as any).__garden = {
      grid,
      drone,
      score,
      inventory,
      activeMissionIdx,
      code,
      isRunning,
      runScript,
      stopScript,
      resetField,
      selectMission,
    };
  }, [grid, drone, score, inventory, activeMissionIdx, code, isRunning, runScript, stopScript, resetField, selectMission]);

  return (
    <GardenContext.Provider
      value={{
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
        setGrid,
        setDrone,
        setCode,
        setActiveMissionIdx,
        setSpeed,
        runScript,
        stopScript,
        resetField,
        selectMission,
        manualStep,
        manualPlant,
        manualWater,
        manualHarvest,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export const useGarden = () => {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error('useGarden must be used within a GardenProvider');
  return ctx;
};
