import React, { useMemo } from 'react';
import { useGardenSim } from '../../context/GardenContext';
import { GEO, MAT, SOIL_Y, DroneLive } from './garden/assets';
import { ParticlePool, ParticleLayer } from './garden/particles';
import { FieldCrops } from './garden/FieldCrops';
import { GardenDrone } from './garden/GardenDrone';
import { Planter } from './garden/Planter';
import { ZonePrompt } from './props/ZonePrompt';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';

interface BadmintonCourtProps {
  engine?: PhysicsEngine | null;
}

/**
 * Automaton Garden — raised planter with a 5x5 field tended by a farming drone.
 * Interaction prompt only appears when player approaches AND looks directly at the planter.
 */
export const BadmintonCourt: React.FC<BadmintonCourtProps> = ({ engine }) => {
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

      {/* Floating Interaction Prompt & Ground Highlight */}
      <ZonePrompt
        zone="badminton"
        icon="🌱"
        label="Automaton Garden"
        position={[0, 1.9, 0]}
        engine={engine}
        groundRadius={1.5}
        groundY={0.02}
      />
    </group>
  );
};

export const AutomatonGarden = BadmintonCourt;
