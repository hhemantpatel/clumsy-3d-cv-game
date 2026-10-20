import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { textureGen } from '../../utils/textures';

/**
 * High-fidelity Scandinavian / Craftsman timber cottage.
 * Features dual-tone cedar & stucco walls, covered porch with warm glowing lantern,
 * picture bay windows with overflowing flower boxes, multi-tiered gable roof,
 * exposed rafters, brick chimney, and detailed interior studio.
 */
export const House: React.FC = () => {
  const { isInsideHouse } = useGame();
  const roofRef = useRef<THREE.Group>(null);
  const frontWallRef = useRef<THREE.Group>(null);
  const backWallRef = useRef<THREE.Group>(null);
  const leftWallRef = useRef<THREE.Group>(null);
  const rightWallRef = useRef<THREE.Group>(null);
  const chimneySmokeRef = useRef<THREE.Group>(null);

  const roofOpacityRef = useRef<number>(1.0);
  const frontOpacityRef = useRef<number>(1.0);
  const backOpacityRef = useRef<number>(1.0);
  const leftOpacityRef = useRef<number>(1.0);
  const rightOpacityRef = useRef<number>(1.0);

  // Load procedural PBR hardwood planks
  const woodPBR = useMemo(() => {
    const { map, roughnessMap } = textureGen.getWoodPlanks();
    map.repeat.set(4, 3);
    roughnessMap.repeat.set(4, 3);
    return { map, roughnessMap };
  }, []);

  useFrame(({ camera }, delta) => {
    const lerpSpeed = Math.min(1.0, delta * 8.0);

    // Camera position relative to the house interior (center at [0, 0, -6.0])
    const camX = camera.position.x;
    const camZ = camera.position.z;

    // Detect which walls lie between the camera and the interior
    // Front wall is at z = -1.5, back wall at z = -10.5, left at x = -6.5, right at x = 6.5
    const isFrontBetween = camZ > -1.8;
    const isBackBetween = camZ < -10.0;
    const isLeftBetween = camX < -6.0;
    const isRightBetween = camX > 6.0;

    // Wall target opacities: 0.0 if player is inside AND wall is between camera and player; 1.0 otherwise
    const targetRoof = isInsideHouse ? 0.0 : 1.0;
    const targetFront = isInsideHouse && isFrontBetween ? 0.0 : 1.0;
    const targetBack = isInsideHouse && isBackBetween ? 0.0 : 1.0;
    const targetLeft = isInsideHouse && isLeftBetween ? 0.0 : 1.0;
    const targetRight = isInsideHouse && isRightBetween ? 0.0 : 1.0;

    const updateGroupOpacity = (
      group: THREE.Group | null,
      currentOpRef: React.MutableRefObject<number>,
      targetOp: number,
      toggleShadow: boolean = false
    ) => {
      if (!group) return;
      if (Math.abs(currentOpRef.current - targetOp) > 0.005) {
        currentOpRef.current = THREE.MathUtils.lerp(currentOpRef.current, targetOp, lerpSpeed);
        if (Math.abs(currentOpRef.current - targetOp) <= 0.005) {
          currentOpRef.current = targetOp;
        }
        const op = currentOpRef.current;
        const isSolid = op > 0.5;

        group.visible = op > 0.02;
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.transparent = op < 0.98;
              mat.opacity = op;
              mat.depthWrite = op > 0.25;
              if (toggleShadow) {
                mesh.castShadow = isSolid;
              }
            }
          }
        });
      }
    };

    updateGroupOpacity(roofRef.current, roofOpacityRef, targetRoof, true);
    updateGroupOpacity(frontWallRef.current, frontOpacityRef, targetFront);
    updateGroupOpacity(backWallRef.current, backOpacityRef, targetBack);
    updateGroupOpacity(leftWallRef.current, leftOpacityRef, targetLeft);
    updateGroupOpacity(rightWallRef.current, rightOpacityRef, targetRight);

    // Gentle chimney smoke drift
    if (chimneySmokeRef.current) {
      const t = performance.now() * 0.001;
      chimneySmokeRef.current.children.forEach((puff, idx) => {
        const offset = (t * 0.8 + idx * 0.7) % 2.5;
        puff.position.y = offset * 1.2;
        puff.position.x = Math.sin(t * 1.5 + idx) * 0.15;
        const scale = 0.2 + offset * 0.35;
        puff.scale.set(scale, scale, scale);
        const mesh = puff as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.4 - offset * 0.15);
        }
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Heavy Stone Foundation & Polished Hardwood Flooring */}
      {/* Exterior Stone Foundation Base */}
      <mesh receiveShadow position={[0, 0.06, -6.0]}>
        <boxGeometry args={[13.4, 0.14, 9.4]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Interior Polished Hardwood Planks */}
      <mesh receiveShadow position={[0, 0.14, -6.0]}>
        <boxGeometry args={[12.8, 0.04, 8.8]} />
        <meshStandardMaterial
          map={woodPBR.map}
          roughnessMap={woodPBR.roughnessMap}
          roughness={0.35}
          metalness={0.08}
        />
      </mesh>

      {/* Decorative Woven Indigo Living Room Rug */}
      <group position={[-3.5, 0.17, -5.5]}>
        <RoundedBox args={[4.8, 0.02, 4.0]} radius={0.04} smoothness={4} receiveShadow>
          <meshStandardMaterial color="#312e81" roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[4.4, 0.025, 3.6]} radius={0.03} smoothness={4} receiveShadow>
          <meshStandardMaterial color="#4338ca" roughness={0.85} />
        </RoundedBox>
      </group>

      {/* Bedroom Cozy Plush Cream Carpet */}
      <RoundedBox args={[4.5, 0.02, 7.6]} radius={0.04} smoothness={4} position={[4.0, 0.17, -5.5]} receiveShadow>
        <meshStandardMaterial color="#f1f5f9" roughness={0.95} />
      </RoundedBox>

      {/* Architectural Baseboards / Trim */}
      <mesh position={[0, 0.22, -10.32]} receiveShadow>
        <boxGeometry args={[12.8, 0.14, 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>
      <mesh position={[-6.32, 0.22, -6.0]} receiveShadow>
        <boxGeometry args={[0.04, 0.14, 8.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>
      <mesh position={[6.32, 0.22, -6.0]} receiveShadow>
        <boxGeometry args={[0.04, 0.14, 8.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* 2. Back Wall Group (Fades when camera is behind the house) */}
      <group ref={backWallRef}>
        {/* Back Wall - Lower Cedar Siding */}
        <RoundedBox args={[13.2, 1.4, 0.3]} radius={0.03} smoothness={3} position={[0, 0.77, -10.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>
        {/* Back Wall - Upper Warm Stucco */}
        <RoundedBox args={[13.2, 2.3, 0.3]} radius={0.03} smoothness={3} position={[0, 2.55, -10.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </RoundedBox>
      </group>

      {/* 3. Left Wall Group (Fades when camera is to the left of the house) */}
      <group ref={leftWallRef}>
        {/* Left Wall - Lower Cedar Siding */}
        <RoundedBox args={[0.3, 1.4, 9.2]} radius={0.03} smoothness={3} position={[-6.5, 0.77, -6.0]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>
        {/* Left Wall - Upper Warm Stucco */}
        <RoundedBox args={[0.3, 2.3, 9.2]} radius={0.03} smoothness={3} position={[-6.5, 2.55, -6.0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </RoundedBox>

        {/* Left Wall Picture Windows with Planter Box */}
        <group position={[-6.5, 2.1, -6.0]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 1.6, 2.8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh>
            <planeGeometry args={[0.02, 1.46]} />
            <meshPhysicalMaterial color="#bae6fd" transmission={0.75} roughness={0.08} ior={1.5} />
          </mesh>
          <mesh position={[0, -0.84, 0]} castShadow>
            <boxGeometry args={[0.42, 0.08, 3.0]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* 4. Right Wall Group (Fades when camera is to the right of the house) */}
      <group ref={rightWallRef}>
        {/* Right Wall - Lower Cedar Siding */}
        <RoundedBox args={[0.3, 1.4, 9.2]} radius={0.03} smoothness={3} position={[6.5, 0.77, -6.0]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>
        {/* Right Wall - Upper Warm Stucco */}
        <RoundedBox args={[0.3, 2.3, 9.2]} radius={0.03} smoothness={3} position={[6.5, 2.55, -6.0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </RoundedBox>

        {/* Right Wall Picture Window */}
        <group position={[6.5, 2.1, -6.0]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 1.6, 2.8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh>
            <planeGeometry args={[0.02, 1.46]} />
            <meshPhysicalMaterial color="#bae6fd" transmission={0.75} roughness={0.08} ior={1.5} />
          </mesh>
          <mesh position={[0, -0.84, 0]} castShadow>
            <boxGeometry args={[0.42, 0.08, 3.0]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Modern Japandi Slatted Oak Room Divider (Studio vs Bedroom) */}
      <group position={[1.4, 1.8, -6.0]}>
        {[...Array(9)].map((_, idx) => (
          <mesh key={idx} position={[0, 0, (idx - 4) * 0.38]} castShadow>
            <boxGeometry args={[0.08, 3.4, 0.12]} />
            <meshStandardMaterial color="#b45309" roughness={0.65} />
          </mesh>
        ))}
        {/* Top & Bottom Horizontal Tie Beams */}
        <mesh position={[0, 1.65, 0]}>
          <boxGeometry args={[0.1, 0.08, 3.4]} />
          <meshStandardMaterial color="#92400e" roughness={0.65} />
        </mesh>
        <mesh position={[0, -1.65, 0]}>
          <boxGeometry args={[0.1, 0.08, 3.4]} />
          <meshStandardMaterial color="#92400e" roughness={0.65} />
        </mesh>
      </group>

      {/* 5. Front Walls Group (Smoothly fades when camera is in front) */}
      <group ref={frontWallRef}>
        {/* Front Left Wall - Lower Cedar */}
        <RoundedBox args={[5.6, 1.4, 0.3]} radius={0.03} smoothness={3} position={[-3.8, 0.77, -1.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>
        {/* Front Left Wall - Upper Stucco */}
        <RoundedBox args={[5.6, 2.3, 0.3]} radius={0.03} smoothness={3} position={[-3.8, 2.55, -1.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </RoundedBox>

        {/* Front Left Picture Window with Overflowing Flower Box */}
        <group position={[-3.8, 2.1, -1.35]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 1.4, 0.12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[2.2, 1.2]} />
            <meshPhysicalMaterial color="#bae6fd" transmission={0.7} roughness={0.08} />
          </mesh>
          {/* Flower Box */}
          <group position={[0, -0.85, 0.16]}>
            <RoundedBox args={[2.5, 0.32, 0.35]} radius={0.04} smoothness={3} castShadow>
              <meshStandardMaterial color="#78350f" roughness={0.75} />
            </RoundedBox>
            {/* Lush Blooming Flowers in Planter */}
            {[-0.9, -0.45, 0, 0.45, 0.9].map((fx, fIdx) => (
              <group key={fIdx} position={[fx, 0.2, 0.05]}>
                <mesh position={[0, 0, 0]}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                  <meshStandardMaterial color="#15803d" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                  <sphereGeometry args={[0.09, 8, 8]} />
                  <meshStandardMaterial color={fIdx % 2 === 0 ? '#ef4444' : '#ec4899'} roughness={0.5} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* Front Right Wall - Lower Cedar */}
        <RoundedBox args={[5.6, 1.4, 0.3]} radius={0.03} smoothness={3} position={[3.8, 0.77, -1.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>
        {/* Front Right Wall - Upper Stucco */}
        <RoundedBox args={[5.6, 2.3, 0.3]} radius={0.03} smoothness={3} position={[3.8, 2.55, -1.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </RoundedBox>

        {/* Front Right Picture Window with Flower Box */}
        <group position={[3.8, 2.1, -1.35]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 1.4, 0.12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[2.2, 1.2]} />
            <meshPhysicalMaterial color="#bae6fd" transmission={0.7} roughness={0.08} />
          </mesh>
          {/* Flower Box */}
          <group position={[0, -0.85, 0.16]}>
            <RoundedBox args={[2.5, 0.32, 0.35]} radius={0.04} smoothness={3} castShadow>
              <meshStandardMaterial color="#78350f" roughness={0.75} />
            </RoundedBox>
            {[-0.9, -0.45, 0, 0.45, 0.9].map((fx, fIdx) => (
              <group key={fIdx} position={[fx, 0.2, 0.05]}>
                <mesh position={[0, 0, 0]}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                  <meshStandardMaterial color="#15803d" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                  <sphereGeometry args={[0.09, 8, 8]} />
                  <meshStandardMaterial color={fIdx % 2 === 0 ? '#fbbf24' : '#a855f7'} roughness={0.5} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* Door Lintel & Trim */}
        <RoundedBox args={[2.2, 0.9, 0.34]} radius={0.03} smoothness={3} position={[0, 3.15, -1.5]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </RoundedBox>

        {/* 4. Welcoming Covered Front Entry Porch */}
        {/* Porch Stone Landing Deck */}
        <RoundedBox args={[3.6, 0.18, 1.8]} radius={0.04} smoothness={4} position={[0, 0.09, -0.6]} receiveShadow>
          <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.05} />
        </RoundedBox>
        {/* Porch Solid Timber Post Left */}
        <mesh position={[-1.6, 1.5, 0.2]} castShadow>
          <boxGeometry args={[0.22, 2.8, 0.22]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[-1.6, 0.25, 0.2]} castShadow>
          <boxGeometry args={[0.32, 0.5, 0.32]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>
        {/* Porch Solid Timber Post Right */}
        <mesh position={[1.6, 1.5, 0.2]} castShadow>
          <boxGeometry args={[0.22, 2.8, 0.22]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[1.6, 0.25, 0.2]} castShadow>
          <boxGeometry args={[0.32, 0.5, 0.32]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>
        {/* Porch Header Crossbeam */}
        <mesh position={[0, 2.85, 0.2]} castShadow>
          <boxGeometry args={[3.8, 0.24, 0.28]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>

        {/* Warm Glowing Entrance Porch Lantern */}
        <group position={[0, 2.6, 0.1]}>
          <pointLight color="#fde047" intensity={1.5} distance={6} decay={2} castShadow />
          {/* Lantern Bracket */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Lantern Cage */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.24, 0.32, 0.24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} wireframe />
          </mesh>
          {/* Glowing Filament Core */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>

        {/* Potted Cedar Planters Flanking Entrance */}
        <group position={[-1.4, 0.35, -0.4]}>
          <RoundedBox args={[0.42, 0.5, 0.42]} radius={0.04} smoothness={3} castShadow>
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </RoundedBox>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[0.28, 0.6, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
        <group position={[1.4, 0.35, -0.4]}>
          <RoundedBox args={[0.42, 0.5, 0.42]} radius={0.04} smoothness={3} castShadow>
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </RoundedBox>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[0.28, 0.6, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* 5. Craftsman Gable Roof Structure (Fades when inside) */}
      <group ref={roofRef} position={[0, 3.6, -6.0]}>
        {/* Porch Overhanging Awning Roof */}
        <mesh position={[0, -0.35, 5.8]} rotation={[0.28, 0, 0]} castShadow>
          <boxGeometry args={[4.2, 0.16, 1.8]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>

        {/* Exposed Dark Timber Ceiling Beams */}
        {[-2.5, 0.0, 2.5].map((bz, idx) => (
          <mesh key={idx} position={[0, -0.05, bz]} castShadow>
            <boxGeometry args={[13.0, 0.22, 0.26]} />
            <meshStandardMaterial color="#451a03" roughness={0.7} />
          </mesh>
        ))}

        {/* Left Roof Slant with Overhanging Eaves */}
        <mesh castShadow position={[-3.5, 1.28, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[8.0, 0.28, 10.4]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>
        {/* Right Roof Slant with Overhanging Eaves */}
        <mesh castShadow position={[3.5, 1.28, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[8.0, 0.28, 10.4]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>

        {/* Terracotta Decorative Ridge Cap */}
        <mesh position={[0, 3.12, 0]}>
          <boxGeometry args={[0.75, 0.38, 10.6]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.4} />
        </mesh>

        {/* Gable End Triangle Planks Front */}
        <mesh position={[0, 1.6, 5.0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.01, 4.0, 2.4, 3]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        {/* Gable End Triangle Planks Back */}
        <mesh position={[0, 1.6, -5.0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.01, 4.0, 2.4, 3]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>

        {/* Rustic Stone Chimney */}
        <RoundedBox args={[1.2, 2.8, 1.2]} radius={0.06} smoothness={4} position={[-4.0, 2.6, 1.8]} castShadow>
          <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
        </RoundedBox>
        {/* Chimney Stone Cap */}
        <RoundedBox args={[1.4, 0.24, 1.4]} radius={0.04} smoothness={4} position={[-4.0, 4.05, 1.8]} castShadow>
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </RoundedBox>
        {/* Chimney Pots */}
        <mesh position={[-4.2, 4.35, 1.8]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.45, 12]} />
          <meshStandardMaterial color="#c2410c" roughness={0.6} />
        </mesh>
        <mesh position={[-3.8, 4.35, 1.8]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.45, 12]} />
          <meshStandardMaterial color="#c2410c" roughness={0.6} />
        </mesh>

        {/* Animated Chimney Smoke Puffs */}
        <group ref={chimneySmokeRef} position={[-4.0, 4.7, 1.8]}>
          {[...Array(4)].map((_, sIdx) => (
            <mesh key={sIdx} position={[0, sIdx * 0.4, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.3} fog={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 6. Warm Interior Ambient Architectural Lights */}
      {/* Studio Desk Warm Pendant Lamp */}
      <group position={[-2.5, 3.2, -6.0]}>
        <pointLight color="#fde047" intensity={1.4} distance={9} decay={2} castShadow />
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.25, 0.48, 0.35, 24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>

      {/* Bedroom Ambient Sphere Lamp */}
      <group position={[4.5, 3.2, -6.0]}>
        <pointLight color="#fed7aa" intensity={1.0} distance={7} decay={2} />
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial color="#fed7aa" emissive="#f97316" emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
