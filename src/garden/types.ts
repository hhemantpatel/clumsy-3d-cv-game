// Shared contract between the garden simulation (GardenContext / interpreter)
// and the 3D garden plot (BadmintonCourt.tsx). Keep both sides in sync with this file.

export type CropType = 'wheat' | 'carrot' | 'pumpkin' | 'sunflower';
export type Dir = 'N' | 'E' | 'S' | 'W';

export interface FarmTile {
  crop: 'none' | CropType;
  /** Wet soil: crop grows twice as fast. Dries out after WATER_DURATION_TICKS. */
  watered: boolean;
  /** Ticks of water left on this tile (0 when dry). */
  waterTicks: number;
  /** Continuous growth progress 0..1. A crop is harvestable when growth >= 1. */
  growth: number;
}

export interface DroneState {
  x: number; // 0..4 (column)
  y: number; // 0..4 (row)
  dir: Dir;
  isMoving: boolean;
  isWatering: boolean;
  isPlanting: boolean;
  isHarvesting: boolean;
}

export interface CropInfo {
  label: string;
  emoji: string;
  /** Ticks to mature on dry soil (watered soil halves this). */
  growTicks: number;
  seedCost: number;
  sellPrice: number;
  /** Mission id that must be cleared before this seed can be planted (undefined = always available). */
  unlockedBy?: string;
}

export const CROPS: Record<CropType, CropInfo> = {
  wheat: { label: 'Golden Wheat', emoji: '🌾', growTicks: 4, seedCost: 0, sellPrice: 8 },
  carrot: { label: 'Crunchy Carrot', emoji: '🥕', growTicks: 6, seedCost: 3, sellPrice: 20 },
  pumpkin: { label: 'Royal Pumpkin', emoji: '🎃', growTicks: 12, seedCost: 10, sellPrice: 60 },
  sunflower: { label: 'Sunflower', emoji: '🌻', growTicks: 8, seedCost: 6, sellPrice: 40, unlockedBy: 'm4' },
};

export const GRID_SIZE = 5;
export const WATER_DURATION_TICKS = 10;

/** Visual growth stage used by the 3D plot: 0 empty, 1 sprout, 2 growing, 3 mature. */
export const growthStage = (tile: FarmTile): 0 | 1 | 2 | 3 => {
  if (tile.crop === 'none') return 0;
  if (tile.growth >= 1) return 3;
  if (tile.growth >= 0.4) return 2;
  return 1;
};
