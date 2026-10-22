import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { useGardenSim } from '../../context/GardenContext';
import { GEO, MAT, SOIL_Y, DroneLive } from './garden/assets';
import { ParticlePool, ParticleLayer } from './garden/particles';
import { FieldCrops } from './garden/FieldCrops';
import { GardenDrone } from './garden/GardenDrone';
import { Planter } from './garden/Planter';

/**
 * Automaton Garden — raised planter with a 5x5 field tended by a farming drone.
 * (Named BadmintonCourt for historical reasons; the zone id is still 'badminton'.)
 * Garden group sits at world [6.8, 0, 5.2]; tile (x, y) -> local (COLS[x], ROWS[y]).
 */
export const BadmintonCourt: React.FC = () => {
  const { nearbyZone, openModal, activeModal } = useGame();
  // Sim-only slice: { grid, drone, isRunning } typed by src/garden/types.ts
  const { grid, drone, isRunning } = useGardenSim();

  // Shared FX state (pooled, allocated once per mount).
  const fx = useMemo(
    () => ({
      live: { x: 0, y: 1.1, z: 0 } as DroneLive,
      bits: new ParticlePool(160), // water droplets, seeds, dust puffs
      coins: new ParticlePool(48),
      stars: new ParticlePool(64),
    }),
    []
  );

  return (
    <group position={[6.8, 0, 5.2]}>
      <Planter />

      <FieldCrops grid={grid} drone={drone} live={fx.live} bits={fx.bits} coins={fx.coins} stars={fx.stars} />

      <GardenDrone drone={drone} isRunning={isRunning} live={fx.live} bits={fx.bits} />

      <ParticleLayer pool={fx.bits} geometry={GEO.ico} material={MAT.bits} floorY={SOIL_Y} colors />
      <ParticleLayer pool={fx.coins} geometry={GEO.coin} material={MAT.coin} floorY={SOIL_Y} />
      <ParticleLayer pool={fx.stars} geometry={GEO.octa} material={MAT.sparkle} floorY={SOIL_Y} />

      {/* Floating Interaction Prompt */}
      {nearbyZone === 'badminton' && !activeModal && (
        <Html position={[0, 2.1, 0]} center distanceFactor={11}>
          <button
            onClick={() => openModal('badminton')}
            className="px-4 py-2.5 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-bounce"
          >
            <span className="text-base">🌱</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
            <span>Automaton Garden • Code & Farm Game</span>
          </button>
        </Html>
      )}
    </group>
  );
};

export const AutomatonGarden = BadmintonCourt;
