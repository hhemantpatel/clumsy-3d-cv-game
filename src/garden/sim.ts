// Pure garden simulation. No React, no side effects: applyAction(state, action) returns a new
// state plus a list of events that the caller can turn into sounds / confetti / log lines.

import { CROPS, GRID_SIZE, WATER_DURATION_TICKS } from './types';
import type { CropType, Dir, DroneState, FarmTile } from './types';

export type SimAction =
  | { type: 'move'; dir?: Dir }
  | { type: 'turn'; turn: 'left' | 'right' }
  | { type: 'plant'; crop: string }
  | { type: 'water' }
  | { type: 'harvest' }
  | { type: 'wait' };

export type CropCounts = Record<CropType, number>;

export interface GardenState {
  grid: FarmTile[][];
  drone: DroneState;
  coins: number;
  /** Harvested produce (lifetime of this run / session). */
  inventory: CropCounts;
  /** Mature crops harvested this run (used by harvest goals). */
  harvested: CropCounts;
  /** Ticks elapsed this run. Every action costs exactly one tick. */
  tick: number;
  /** Coins earned from sales this run (gross, seeds not subtracted). */
  earned: number;
  /** Crops that cannot be planted yet. */
  lockedCrops: CropType[];
}

export type SimEventKind = 'move' | 'turn' | 'plant' | 'water' | 'harvest' | 'spoil' | 'wait' | 'fail';

export interface SimEvent {
  kind: SimEventKind;
  message: string;
  x: number;
  y: number;
  crop?: CropType;
  /** Coin delta caused by this event (negative for seed purchases). */
  coins?: number;
}

export interface ActionResult {
  state: GardenState;
  events: SimEvent[];
  /** Value returned to the script: plant()/harvest() -> True/False, others None. */
  result: boolean | null;
}

export const CROP_TYPES: CropType[] = ['wheat', 'carrot', 'pumpkin', 'sunflower'];
const DIRS: Dir[] = ['N', 'E', 'S', 'W'];

export const zeroCounts = (): CropCounts => ({ wheat: 0, carrot: 0, pumpkin: 0, sunflower: 0 });

export const emptyTile = (): FarmTile => ({ crop: 'none', watered: false, waterTicks: 0, growth: 0 });

export const makeTile = (crop: CropType | 'none', growth = 0, waterTicks = 0): FarmTile => ({
  crop,
  growth: crop === 'none' ? 0 : growth,
  waterTicks,
  watered: waterTicks > 0,
});

export const emptyGrid = (): FarmTile[][] =>
  Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, emptyTile));

export const initialDrone = (): DroneState => ({
  x: 0,
  y: 0,
  dir: 'E',
  isMoving: false,
  isWatering: false,
  isPlanting: false,
  isHarvesting: false,
});

export const createState = (grid: FarmTile[][], coins: number, lockedCrops: CropType[] = []): GardenState => ({
  grid,
  drone: initialDrone(),
  coins,
  inventory: zeroCounts(),
  harvested: zeroCounts(),
  tick: 0,
  earned: 0,
  lockedCrops,
});

const wrap = (n: number) => ((n % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;

export const isMature = (t: FarmTile) => t.crop !== 'none' && t.growth >= 1;

/** Advance one tick of time: crops grow (x2 when watered), water evaporates. */
export const tickGrowth = (grid: FarmTile[][]): FarmTile[][] =>
  grid.map((row) =>
    row.map((t) => {
      if (t.crop === 'none' && t.waterTicks === 0) return t;
      let growth = t.growth;
      if (t.crop !== 'none' && growth < 1) {
        const inc = (t.watered ? 2 : 1) / CROPS[t.crop].growTicks;
        growth = growth + inc >= 1 - 1e-9 ? 1 : growth + inc;
      }
      const waterTicks = Math.max(0, t.waterTicks - 1);
      return { ...t, growth, waterTicks, watered: waterTicks > 0 };
    })
  );

const setTile = (grid: FarmTile[][], x: number, y: number, tile: FarmTile): FarmTile[][] =>
  grid.map((row, ry) => (ry === y ? row.map((t, rx) => (rx === x ? tile : t)) : row));

const cropLabel = (c: CropType) => `${CROPS[c].emoji} ${c}`;

export function applyAction(state: GardenState, action: SimAction): ActionResult {
  const { drone } = state;
  const { x, y } = drone;
  const tile = state.grid[y][x];
  const events: SimEvent[] = [];
  let grid = state.grid;
  let coins = state.coins;
  let earned = state.earned;
  let inventory = state.inventory;
  let harvested = state.harvested;
  let result: boolean | null = null;
  const flags = { isMoving: false, isWatering: false, isPlanting: false, isHarvesting: false };
  let nextDrone: DroneState = { ...drone, ...flags };

  switch (action.type) {
    case 'move': {
      const dir = action.dir ?? drone.dir;
      const nx = wrap(x + (dir === 'E' ? 1 : dir === 'W' ? -1 : 0));
      const ny = wrap(y + (dir === 'S' ? 1 : dir === 'N' ? -1 : 0));
      nextDrone = { ...nextDrone, x: nx, y: ny, dir, isMoving: true };
      events.push({ kind: 'move', message: `🚁 Moved to (${nx}, ${ny})`, x: nx, y: ny });
      break;
    }
    case 'turn': {
      const i = DIRS.indexOf(drone.dir);
      const dir = DIRS[(i + (action.turn === 'left' ? 3 : 1)) % 4];
      nextDrone = { ...nextDrone, dir };
      events.push({ kind: 'turn', message: `↻ Now facing ${dir}`, x, y });
      break;
    }
    case 'plant': {
      const crop = action.crop as CropType;
      nextDrone = { ...nextDrone, isPlanting: true };
      if (!(crop in CROPS)) {
        events.push({ kind: 'fail', message: `⚠️ Unknown seed '${action.crop}'`, x, y });
        result = false;
      } else if (state.lockedCrops.includes(crop)) {
        const by = CROPS[crop].unlockedBy;
        events.push({
          kind: 'fail',
          message: `🔒 ${cropLabel(crop)} seeds are locked${by ? ` (clear mission ${by.toUpperCase()} to unlock)` : ''}`,
          x,
          y,
          crop,
        });
        result = false;
      } else if (tile.crop !== 'none') {
        events.push({ kind: 'fail', message: `⚠️ (${x}, ${y}) already has ${tile.crop}; plant skipped`, x, y });
        result = false;
      } else if (coins < CROPS[crop].seedCost) {
        events.push({
          kind: 'fail',
          message: `💸 Not enough coins for ${crop} seeds (need ${CROPS[crop].seedCost}, have ${coins})`,
          x,
          y,
          crop,
        });
        result = false;
      } else {
        const cost = CROPS[crop].seedCost;
        coins -= cost;
        grid = setTile(grid, x, y, { ...tile, crop, growth: 0 });
        events.push({
          kind: 'plant',
          message: `🌱 Planted ${cropLabel(crop)} at (${x}, ${y})${cost ? ` (-${cost} coins)` : ''}`,
          x,
          y,
          crop,
          coins: -cost,
        });
        result = true;
      }
      break;
    }
    case 'water': {
      nextDrone = { ...nextDrone, isWatering: true };
      grid = setTile(grid, x, y, { ...tile, watered: true, waterTicks: WATER_DURATION_TICKS });
      events.push({ kind: 'water', message: `💧 Watered (${x}, ${y})`, x, y });
      break;
    }
    case 'harvest': {
      nextDrone = { ...nextDrone, isHarvesting: true };
      if (tile.crop === 'none') {
        events.push({ kind: 'fail', message: `✂️ Nothing to harvest at (${x}, ${y})`, x, y });
        result = false;
      } else if (tile.growth >= 1) {
        const crop = tile.crop;
        const price = CROPS[crop].sellPrice;
        coins += price;
        earned += price;
        inventory = { ...inventory, [crop]: inventory[crop] + 1 };
        harvested = { ...harvested, [crop]: harvested[crop] + 1 };
        grid = setTile(grid, x, y, { ...tile, crop: 'none', growth: 0 });
        events.push({ kind: 'harvest', message: `✂️ Harvested ${cropLabel(crop)} (+${price} coins)`, x, y, crop, coins: price });
        result = true;
      } else {
        const crop = tile.crop;
        grid = setTile(grid, x, y, { ...tile, crop: 'none', growth: 0 });
        events.push({
          kind: 'spoil',
          message: `🥀 Harvested ${crop} too early (${Math.round(tile.growth * 100)}% grown) and it was destroyed`,
          x,
          y,
          crop,
        });
        result = false;
      }
      break;
    }
    case 'wait': {
      events.push({ kind: 'wait', message: '⏳ Waited one tick', x, y });
      break;
    }
  }

  return {
    state: {
      ...state,
      grid: tickGrowth(grid),
      drone: nextDrone,
      coins,
      earned,
      inventory,
      harvested,
      tick: state.tick + 1,
    },
    events,
    result,
  };
}
