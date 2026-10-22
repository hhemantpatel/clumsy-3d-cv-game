import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../../../context/GameContext';
import { ModalType } from '../../../types/game';
import type { V3 } from './kit';

interface ZonePromptProps {
  zone: Exclude<ModalType, null>;
  icon: string;
  label: string;
  position: V3;
  groundRadius?: number;
  groundOffset?: [number, number, number];
  groundY?: number;
}

// Shared geometries allocated once across all interaction points
const RING_GEO = new THREE.RingGeometry(0.84, 0.98, 32);
const DISC_GEO = new THREE.CircleGeometry(0.84, 24);
const GEM_GEO = new THREE.OctahedronGeometry(0.12, 0);

/**
 * Storybook interaction station highlight:
 * - Gentle golden ground ring on the floor/lawn that pulses to show where to stand.
 * - Floating diorama gem and waypoint badge visible across the yard.
 * - Blossoms into full bouncing [E] prompt when the player approaches.
 */
export const ZonePrompt: React.FC<ZonePromptProps> = ({
  zone,
  icon,
  label,
  position,
  groundRadius = 1.0,
  groundOffset = [0, 0, 0],
  groundY = 0.02,
}) => {
  const { nearbyZone, openModal, activeModal } = useGame();
  const ringRef = useRef<THREE.Group>(null);
  const gemRef = useRef<THREE.Mesh>(null);

  const isNearby = nearbyZone === zone;

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fbbf24',
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const discMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const gemMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fef08a',
        toneMapped: false,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Animate ground ring
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.25;
      const pulse = Math.sin(t * (isNearby ? 4.5 : 2.0));
      const targetScale = groundRadius * (isNearby ? 1.08 + pulse * 0.06 : 1.0 + pulse * 0.03);
      ringRef.current.scale.set(targetScale, targetScale, targetScale);
      ringMat.opacity = isNearby ? 0.72 + pulse * 0.18 : 0.28 + pulse * 0.1;
      discMat.opacity = isNearby ? 0.18 + pulse * 0.06 : 0.06 + pulse * 0.03;
    }

    // Animate floating gem
    if (gemRef.current) {
      gemRef.current.rotation.y = t * 1.6;
      gemRef.current.position.y = position[1] - 0.25 + Math.sin(t * 2.4) * 0.05;
      const gPulse = isNearby ? 1.25 + Math.sin(t * 4.0) * 0.15 : 1.0;
      gemRef.current.scale.setScalar(gPulse);
    }
  });

  if (activeModal) return null;

  return (
    <group>
      {/* 1. Ground Interaction Ring Decal */}
      <group
        ref={ringRef}
        position={[groundOffset[0], groundY, groundOffset[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <mesh geometry={RING_GEO} material={ringMat} />
        <mesh geometry={DISC_GEO} material={discMat} />
      </group>

      {/* 2. Floating Storybook Beacon Gem */}
      <mesh
        ref={gemRef}
        geometry={GEM_GEO}
        material={gemMat}
        position={[position[0], position[1] - 0.25, position[2]]}
      />

      {/* 3. HTML Interaction Prompt Badge */}
      <Html position={position} center distanceFactor={11}>
        {isNearby ? (
          <button
            onClick={() => openModal(zone)}
            className="px-4 py-2.5 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-bounce"
          >
            <span className="text-base">{icon}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">
              E
            </span>
            <span>{label}</span>
          </button>
        ) : (
          <button
            onClick={() => openModal(zone)}
            className="px-2.5 py-1 rounded-full bg-[#fffdfa]/85 hover:bg-[#fffdfa] text-[#451a03] text-[11px] font-bold tracking-wide shadow-lg backdrop-blur-sm flex items-center gap-1.5 border border-[#b45309]/50 hover:border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap opacity-85 hover:opacity-100 group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] group-hover:bg-[#d97706] animate-ping shrink-0" />
            <span className="text-xs">{icon}</span>
            <span className="text-[#78350f]">{label.replace('View ', '').replace('Pet ', '')}</span>
          </button>
        )}
      </Html>
    </group>
  );
};
