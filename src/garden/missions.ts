// Mission definitions, goal checks and star ratings for the Automaton Garden.

import { CROPS } from './types';
import type { CropType, FarmTile } from './types';
import { countCodeLines } from './interpreter';
import { CROP_TYPES, createState, emptyGrid, makeTile } from './sim';
import type { GardenState } from './sim';

export type MissionGoal =
  | { kind: 'earn'; target: number }
  | { kind: 'harvest'; crop: CropType; target: number }
  | { kind: 'coins'; target: number }
  | { kind: 'none' };

export interface Mission {
  id: string;
  title: string;
  badge: string;
  desc: string;
  goal: MissionGoal;
  /** The goal only counts if the program defines a function with `def`. */
  requireDef?: boolean;
  startCoins: number;
  makeGrid: () => FarmTile[][];
  /** Starter code template with # TODO comments (not the solution). */
  template: string;
  /** Progressive hints; the last one is a full solution. */
  hints: string[];
  /** Par for stars: ticks to reach the goal and lines of code (non-blank, non-comment). */
  par: { ticks: number; lines: number };
  /** Shown on the mission-complete card. */
  reward?: string;
}

const gridWith = (fill: (x: number, y: number) => FarmTile | null): (() => FarmTile[][]) => () =>
  emptyGrid().map((row, y) => row.map((t, x) => fill(x, y) ?? t));

export const GARDEN_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'M1: First Harvest',
    badge: 'Tutorial',
    desc: 'The top row is full of ripe golden wheat. Fly east along the row and harvest every stalk.',
    goal: { kind: 'earn', target: 40 },
    startCoins: 0,
    makeGrid: gridWith((_x, y) => (y === 0 ? makeTile('wheat', 1) : null)),
    template: `# Mission 1: First Harvest
# The drone starts at (0, 0) facing east.
# harvest() collects the crop under the drone.
# move(east) flies one tile east.

for i in range(5):
    # TODO: harvest the tile under the drone
    # TODO: then move east
    pass
`,
    hints: [
      'Inside the loop you need two commands: one to harvest, one to move. Remove `pass` once the loop has real code.',
      'Each loop pass should run harvest() first and then move(east). Indent both lines by 4 spaces so they belong to the loop.',
      `for i in range(5):
    harvest()
    move(east)`,
    ],
    par: { ticks: 9, lines: 3 },
    reward: 'Unlocked M2: Seeds & Patience',
  },
  {
    id: 'm2',
    title: 'M2: Seeds & Patience',
    badge: 'Growth',
    desc: 'Plant 3 carrots, water them so they grow twice as fast, wait until they are ripe, then harvest all 3. Harvesting early destroys the crop!',
    goal: { kind: 'harvest', crop: 'carrot', target: 3 },
    startCoins: 9,
    makeGrid: () => emptyGrid(),
    template: `# Mission 2: Seeds & Patience
# plant("carrot") costs 3 coins. Carrots need 6 ticks to grow,
# or 3 ticks if the soil is watered. Every action takes 1 tick.
# wait() spends one tick doing nothing.
# can_harvest() is True when the crop under the drone is ripe.

for i in range(3):
    # TODO: plant a carrot and water it
    # TODO: wait while the carrot is not ripe yet
    # TODO: harvest it, then move east
    pass
`,
    hints: [
      'Use plant("carrot") then water(). Watered soil makes crops grow twice as fast.',
      'To wait for growth use a while loop: `while not can_harvest():` with `wait()` inside it.',
      `for i in range(3):
    plant("carrot")
    water()
    while not can_harvest():
        wait()
    harvest()
    move(east)`,
    ],
    par: { ticks: 17, lines: 7 },
    reward: 'Unlocked M3: Serpentine Sweep',
  },
  {
    id: 'm3',
    title: 'M3: Serpentine Sweep',
    badge: 'Nested loops',
    desc: 'The whole 5x5 field is ripe wheat, except for 5 empty patches. Sweep every row in a zig-zag and only harvest where something is ripe.',
    goal: { kind: 'earn', target: 160 },
    startCoins: 0,
    makeGrid: gridWith((x, y) => ((x + 2 * y) % 5 === 3 ? null : makeTile('wheat', 1))),
    template: `# Mission 3: Serpentine Sweep
# Use a loop inside a loop: one for rows, one for columns.
# Snake through the field: east on even rows, west on odd rows.
# Harvesting an empty tile still costs a tick, so check first!

for y in range(5):
    for x in range(5):
        # TODO: harvest only if can_harvest()
        # TODO: move east or west (but not off the end of the row)
        pass
    # TODO: drop down to the next row
`,
    hints: [
      'Wrap harvest() in `if can_harvest():` so you do not waste ticks on empty patches.',
      'Pick the direction with a conditional expression: `move(east if y % 2 == 0 else west)`. Only move sideways while `x < 4`, then move(south) after each row.',
      `for y in range(5):
    for x in range(5):
        if can_harvest():
            harvest()
        if x < 4:
            move(east if y % 2 == 0 else west)
    move(south)`,
    ],
    par: { ticks: 44, lines: 7 },
    reward: 'Unlocked M4: Tend the Rows',
  },
  {
    id: 'm4',
    title: 'M4: Tend the Rows',
    badge: 'Functions',
    desc: 'Write a function tend() that harvests a ripe crop and replants watered wheat on empty soil. Call it on every tile of the top row, twice around. Earn 100 coins (your program must use def).',
    goal: { kind: 'earn', target: 100 },
    requireDef: true,
    startCoins: 0,
    makeGrid: gridWith((x, y) => (y === 0 && x % 2 === 0 ? makeTile('carrot', 1) : null)),
    template: `# Mission 4: Tend the Rows
# A function bundles commands you want to reuse:
#
#   def name():
#       commands...
#
# Wheat seeds are free. Watered wheat ripens in 2 ticks.

def tend():
    # TODO: if the crop is ripe, harvest it
    # TODO: if the tile is empty, plant wheat and water it
    pass

for lap in range(2):
    for i in range(5):
        # TODO: call tend(), then move east (the field wraps around)
        pass
`,
    hints: [
      'tend() needs two separate `if` checks: `if can_harvest():` then `if is_empty():`. Using two ifs means a tile can be harvested and replanted in one visit.',
      'Inside the loop call tend() and then move(east). Moving east from x=4 wraps you back to x=0.',
      `def tend():
    if can_harvest():
        harvest()
    if is_empty():
        plant("wheat")
        water()

for lap in range(2):
    for i in range(5):
        tend()
        move(east)`,
    ],
    par: { ticks: 35, lines: 10 },
    reward: 'Unlocked 🌻 Sunflower seeds, 10x speed and M5: Profit Run',
  },
  {
    id: 'm5',
    title: 'M5: Profit Run',
    badge: 'Strategy',
    desc: 'You have 30 coins and an empty field. Plan your seeds and watering to grow your wallet to 300 coins. Pumpkins are pricey but lucrative; carrots are cheap and quick.',
    goal: { kind: 'coins', target: 300 },
    startCoins: 30,
    makeGrid: () => emptyGrid(),
    template: `# Mission 5: Profit Run
# Seeds: wheat 0 -> 8, carrot 3 -> 20, pumpkin 10 -> 60 coins
# Watered soil halves growth time; water lasts 10 ticks.
# get_coins() tells you how much money you have.

def tend():
    # TODO: harvest ripe crops
    # TODO: plant something you can afford on empty soil
    # TODO: water planted soil that is dry (is_watered())
    pass

while True:
    # TODO: sweep the field: maybe 5 steps east, then one south?
    tend()
    move(east)
`,
    hints: [
      'Pumpkins earn 50 coins of profit each but need 12 ticks dry or 6 watered. Start with what you can afford and reinvest.',
      'In tend(): harvest if can_harvest(); if is_empty() and get_coins() >= 10 plant a pumpkin; if the tile is not empty and not is_watered(), water it. Then sweep a small loop of tiles forever.',
      `def tend():
    if can_harvest():
        harvest()
    if is_empty() and get_coins() >= 10:
        plant("pumpkin")
    if not is_empty() and not is_watered():
        water()

while True:
    for i in range(5):
        tend()
        move(east)
    move(south)`,
    ],
    par: { ticks: 127, lines: 12 },
    reward: 'You are a garden tycoon! The Sandbox is all yours.',
  },
  {
    id: 'sandbox',
    title: 'Sandbox',
    badge: 'Creative',
    desc: 'No goal, no limits (well, 400 actions). 150 coins, every unlocked seed, and the whole field to experiment with.',
    goal: { kind: 'none' },
    startCoins: 150,
    makeGrid: gridWith((x, y) => {
      if (y === 0 && x > 0 && x < 4) return makeTile('wheat', 1);
      if (y === 2 && x === 2) return makeTile('pumpkin', 0.5);
      if (y === 1 && x % 2 === 0) return makeTile('carrot', 0.3);
      return null;
    }),
    template: `# Sandbox: build any farming program you like!
# Open the API reference below for every command.

def tend():
    if can_harvest():
        harvest()
    if is_empty():
        plant("carrot")
        water()

for row in range(5):
    for col in range(5):
        tend()
        move(east)
    move(south)
print("Coins:", get_coins())
`,
    hints: [
      'Try get_growth() to see how ripe a crop is (0.0 to 1.0) and print() to debug.',
      'Recursion works too: a function can call itself. Try a function that sweeps a row and calls itself for the next one.',
      `def sweep(rows):
    if rows == 0:
        return
    for i in range(5):
        if can_harvest():
            harvest()
        elif is_empty():
            plant("carrot")
            water()
        move(east)
    move(south)
    sweep(rows - 1)

sweep(5)`,
    ],
    par: { ticks: 0, lines: 0 },
  },
];

export const missionIndexById = (id: string) => GARDEN_MISSIONS.findIndex((m) => m.id === id);

export const lockedCropsFor = (best: Record<string, number>): CropType[] =>
  CROP_TYPES.filter((c) => {
    const by = CROPS[c].unlockedBy;
    return !!by && !(best[by] > 0);
  });

export const isMissionUnlocked = (idx: number, best: Record<string, number>): boolean => {
  const m = GARDEN_MISSIONS[idx];
  if (!m) return false;
  if (idx === 0 || m.goal.kind === 'none') return true;
  return (best[GARDEN_MISSIONS[idx - 1].id] ?? 0) > 0;
};

export const initialStateFor = (m: Mission, lockedCrops: CropType[]): GardenState =>
  createState(m.makeGrid(), m.startCoins, lockedCrops);

export const goalProgress = (m: Mission, s: GardenState): { value: number; target: number } => {
  switch (m.goal.kind) {
    case 'earn':
      return { value: s.earned, target: m.goal.target };
    case 'harvest':
      return { value: s.harvested[m.goal.crop], target: m.goal.target };
    case 'coins':
      return { value: s.coins, target: m.goal.target };
    case 'none':
      return { value: 0, target: 0 };
  }
};

export const goalText = (m: Mission): string => {
  switch (m.goal.kind) {
    case 'earn':
      return `Earn ${m.goal.target} coins from harvests${m.requireDef ? ' using a def function' : ''}`;
    case 'harvest':
      return `Harvest ${m.goal.target} ripe ${CROPS[m.goal.crop].emoji} ${m.goal.crop}s`;
    case 'coins':
      return `Reach ${m.goal.target} coins in your wallet`;
    case 'none':
      return 'Free play: no goal';
  }
};

export const isGoalMet = (m: Mission, s: GardenState, hasDef: boolean): boolean => {
  if (m.goal.kind === 'none') return false;
  if (m.requireDef && !hasDef) return false;
  const { value, target } = goalProgress(m, s);
  return value >= target;
};

export const computeStars = (m: Mission, goalMet: boolean, ticks: number, code: string): 0 | 1 | 2 | 3 => {
  if (!goalMet) return 0;
  if (ticks > m.par.ticks) return 1;
  if (countCodeLines(code) > m.par.lines) return 2;
  return 3;
};
