import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../../../context/GameContext';
import { ModalType } from '../../../types/game';
import { PhysicsEngine } from '../../../wasm/pkg/game_engine_wasm';
import type { V3 } from './kit';

interface ZonePromptProps {
  zone: Exclude<ModalType, null>;
  icon: string;
  label: string;
  position: V3;
  engine?: PhysicsEngine | null;
  groundRadius?: number;
  groundOffset?: [number, number, number];
  groundY?: number;
}

// Reusable scratch objects to guarantee zero per-frame garbage collection
const _propPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _camToProp = new THREE.Vector3();

// Shared geometries allocated once across all interaction points
const RING_GEO = new THREE.RingGeometry(0.82, 0.94, 32);
const DISC_GEO = new THREE.CircleGeometry(0.82, 24);

/**
 * Clean diorama interaction prompt:
 * - Appears ONLY when the player is near AND looking toward the interactable prop.
 * - Never shows distant cluttered signs or floating gems.
 * - When looking away or walking past with back turned, stays 100% hidden.
 */
export const ZonePrompt: React.FC<ZonePromptProps> = ({
  zone,
  icon,
  label,
  position,
  engine,
  groundRadius = 1.0,
  groundOffset = [0, 0, 0],
  groundY = 0.02,
}) => {
  const { nearbyZone, openModal, activeModal } = useGame();
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const [visible, setVisible] = useState(false);

  // Materials with smooth opacity fade
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fbbf24',
        transparent: true,
        opacity: 0.0,
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
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const isNearby = nearbyZone === zone && !activeModal;

    if (!isNearby) {
      if (visible) setVisible(false);
      if (ringMat.opacity > 0.01) {
        ringMat.opacity = THREE.MathUtils.damp(ringMat.opacity, 0, 12, delta);
        discMat.opacity = THREE.MathUtils.damp(discMat.opacity, 0, 12, delta);
      }
      return;
    }

    // 1. Camera facing check: is camera looking towards the prop?
    group.getWorldPosition(_propPos);
    state.camera.getWorldDirection(_camDir);
    _camToProp.subVectors(_propPos, state.camera.position).normalize();
    const camDot = _camDir.dot(_camToProp);

    // 2. Player facing check: is character facing generally towards the prop?
    let playerFacing = true;
    if (engine) {
      const px = engine.get_player_x();
      const pz = engine.get_player_z();
      const rot = engine.get_player_rotation();
      const toPropX = _propPos.x - px;
      const toPropZ = _propPos.z - pz;
      const dist = Math.hypot(toPropX, toPropZ);

      if (dist > 0.1) {
        // Player forward vector (rot = PI faces negative Z)
        const forwardX = -Math.sin(rot);
        const forwardZ = -Math.cos(rot);
        const playerDot = (forwardX * toPropX + forwardZ * toPropZ) / dist;
        // If player is facing more than 75° away from the prop, do not show
        if (playerDot < 0.25) playerFacing = false;
      }
    }

    // Must satisfy: camera looking toward prop AND player facing prop
    const shouldShow = camDot > 0.62 && playerFacing;
    if (visible !== shouldShow) setVisible(shouldShow);

    // Animate ground ring
    if (ringRef.current) {
      const targetOpacity = shouldShow ? 0.65 : 0.0;
      ringMat.opacity = THREE.MathUtils.damp(ringMat.opacity, targetOpacity, 10, delta);
      discMat.opacity = THREE.MathUtils.damp(discMat.opacity, shouldShow ? 0.14 : 0.0, 10, delta);

      if (shouldShow) {
        const t = state.clock.elapsedTime;
        ringRef.current.rotation.z = t * 0.25;
        const pulse = 1.0 + Math.sin(t * 3.5) * 0.04;
        ringRef.current.scale.set(groundRadius * pulse, groundRadius * pulse, 1);
      }
    }
  });

  if (activeModal) return null;

  return (
    <group ref={groupRef}>
      {/* 1. Ground Interaction Ring Decal (smoothly illuminates only when looking toward the prop) */}
      <group
        ref={ringRef}
        position={[groundOffset[0], groundY, groundOffset[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <mesh geometry={RING_GEO} material={ringMat} />
        <mesh geometry={DISC_GEO} material={discMat} />
      </group>

      {/* 2. Compact Sleek Interaction Prompt (only visible when nearby AND looking towards prop) */}
      {visible && (
        <Html position={position} center distanceFactor={14}>
          <button
            onClick={() => openModal(zone)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 text-[#451a03] text-xs font-bold shadow-xl border border-[#b45309]/60 hover:border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap backdrop-blur-md animate-fade-in"
          >
            <span className="text-sm">{icon}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[10px] font-black shadow-xs">
              E
            </span>
            <span className="pr-0.5 tracking-tight">{label}</span>
          </button>
        </Html>
      )}
    </group>
  );
};
