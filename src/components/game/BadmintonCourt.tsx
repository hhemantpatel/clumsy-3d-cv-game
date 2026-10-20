import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { useGarden, FarmTile } from '../../context/GardenContext';

const COLS = [-1.4, -0.7, 0, 0.7, 1.4];
const ROWS = [-1.8, -0.9, 0, 0.9, 1.8];

const DIR_ROTATIONS: Record<string, number> = {
  S: 0,
  W: -Math.PI / 2,
  N: Math.PI,
  E: Math.PI / 2,
};

// 3D Crop Renderer component for a single tile
const Crop3D: React.FC<{ tile: FarmTile; x: number; z: number }> = ({ tile, x, z }) => {
  const { crop, growth, watered } = tile;

  return (
    <group position={[x, 0.082, z]}>
      {/* Damp watered soil disc patch */}
      {watered && (
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 12]} />
          <meshStandardMaterial color="#1e110a" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {/* Empty tilled plot furrow indicator (small dibble indent) */}
      {crop === 'none' && (
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 8]} />
          <meshStandardMaterial color="#22120b" roughness={0.9} />
        </mesh>
      )}

      {/* WHEAT */}
      {crop === 'wheat' && growth === 1 && (
        /* Sprouting green shoots */
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[-0.04, 0.05, 0]} rotation={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.007, 0.007, 0.1, 6]} />
            <meshStandardMaterial color="#84cc16" />
          </mesh>
          <mesh castShadow position={[0.04, 0.05, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.007, 0.007, 0.1, 6]} />
            <meshStandardMaterial color="#84cc16" />
          </mesh>
        </group>
      )}
      {crop === 'wheat' && growth >= 2 && (
        /* Full mature golden wheat stalks */
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
            <meshStandardMaterial color="#65a30d" roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0, 0.3, 0]}>
            <coneGeometry args={[0.05, 0.2, 7]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} emissive="#ca8a04" emissiveIntensity={0.2} />
          </mesh>
          {/* Side ears */}
          <mesh castShadow position={[-0.03, 0.24, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.025, 0.1, 5]} />
            <meshStandardMaterial color="#eab308" />
          </mesh>
          <mesh castShadow position={[0.03, 0.24, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.025, 0.1, 5]} />
            <meshStandardMaterial color="#eab308" />
          </mesh>
        </group>
      )}

      {/* CARROT */}
      {crop === 'carrot' && growth === 1 && (
        /* Small feather leaves */
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[0, 0.06, 0]}>
            <coneGeometry args={[0.04, 0.1, 6]} />
            <meshStandardMaterial color="#4ade80" />
          </mesh>
        </group>
      )}
      {crop === 'carrot' && growth >= 2 && (
        /* Plump orange carrot top shoulder & lush feathery foliage */
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.04, 0.02, 0.07, 8]} />
            <meshStandardMaterial color="#ea580c" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.14, 0]}>
            <coneGeometry args={[0.075, 0.16, 7]} />
            <meshStandardMaterial color="#16a34a" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* PUMPKIN */}
      {crop === 'pumpkin' && growth === 1 && (
        /* Young green squash bulb */
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#65a30d" />
          </mesh>
        </group>
      )}
      {crop === 'pumpkin' && growth >= 2 && (
        /* Full royal orange pumpkin with ribbed segments & wooden stem */
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.13, 14, 12]} />
            <meshStandardMaterial color="#f97316" roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, 0.22, 0]} rotation={[0.1, 0, 0.15]}>
            <cylinderGeometry args={[0.02, 0.024, 0.06, 6]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export const BadmintonCourt: React.FC = () => {
  const { nearbyZone, openModal, activeModal } = useGame();
  const { grid, drone } = useGarden();

  const droneGroupRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Group>(null);
  const waterSprayRef = useRef<THREE.Group>(null);

  // Target coordinates for smooth drone lerp
  const targetX = COLS[drone.x] ?? 0;
  const targetZ = ROWS[drone.y] ?? 0;
  const targetRotY = DIR_ROTATIONS[drone.dir] ?? 0;

  useFrame((state, delta) => {
    // Clamp delta to prevent frame lag spikes / runaway lerp extrapolation
    const safeDelta = Math.min(delta, 0.08);

    if (droneGroupRef.current) {
      // Smooth position lerp with strictly bounded alpha
      const currentPos = droneGroupRef.current.position;
      const baseHeight = 1.1 + (drone.isHarvesting || drone.isPlanting ? -0.22 : 0);
      const bob = Math.sin(state.clock.elapsedTime * 3.5) * 0.04;

      const tPos = Math.min(safeDelta * 7.0, 1.0);
      const tHeight = Math.min(safeDelta * 8.0, 1.0);

      currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetX, tPos);
      currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetZ, tPos);
      currentPos.y = THREE.MathUtils.lerp(currentPos.y, baseHeight + bob, tHeight);

      // Shortest rotation lerp
      let diffRot = targetRotY - droneGroupRef.current.rotation.y;
      while (diffRot < -Math.PI) diffRot += Math.PI * 2;
      while (diffRot > Math.PI) diffRot -= Math.PI * 2;
      droneGroupRef.current.rotation.y += diffRot * Math.min(safeDelta * 9.0, 1.0);

      // Atmospheric tilt
      const bank = drone.isMoving ? 0.08 : 0;
      droneGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2.0) * 0.03 + bank;
      droneGroupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 2.5) * 0.03;
    }

    if (rotorRef.current) {
      const rotorSpeed = drone.isMoving ? 45 : 22;
      rotorRef.current.rotation.y += safeDelta * rotorSpeed;
    }

    if (waterSprayRef.current && drone.isWatering) {
      waterSprayRef.current.rotation.y += safeDelta * 12;
    }

    (window as any).__droneGroup = droneGroupRef.current;
  });

  // Calculate beam light color based on current drone action
  const beamColor = useMemo(() => {
    if (drone.isHarvesting) return '#fbbf24'; // Golden amber harvest beam
    if (drone.isPlanting) return '#4ade80'; // Emerald plant beam
    if (drone.isWatering) return '#38bdf8'; // Crystal blue water beam
    return '#38bdf8';
  }, [drone.isHarvesting, drone.isPlanting, drone.isWatering]);

  return (
    // Garden Plot centered at X: 6.8, Z: 5.2 in the yard
    <group position={[6.8, 0, 5.2]}>
      {/* 1. Raised Cedar Wood Planter Box Perimeter */}
      <group position={[0, 0.16, 0]}>
        {/* North Wall */}
        <RoundedBox args={[4.2, 0.32, 0.16]} radius={0.03} smoothness={3} position={[0, 0, -3.1]} castShadow receiveShadow>
          <meshStandardMaterial color="#854d0e" roughness={0.75} />
        </RoundedBox>
        {/* South Wall */}
        <RoundedBox args={[4.2, 0.32, 0.16]} radius={0.03} smoothness={3} position={[0, 0, 3.1]} castShadow receiveShadow>
          <meshStandardMaterial color="#854d0e" roughness={0.75} />
        </RoundedBox>
        {/* West Wall */}
        <RoundedBox args={[0.16, 0.32, 6.2]} radius={0.03} smoothness={3} position={[-2.05, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#854d0e" roughness={0.75} />
        </RoundedBox>
        {/* East Wall */}
        <RoundedBox args={[0.16, 0.32, 6.2]} radius={0.03} smoothness={3} position={[2.05, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#854d0e" roughness={0.75} />
        </RoundedBox>
        {/* Inner Soil Bed (Dark Rich Compost Loam) */}
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[4.0, 0.22, 6.1]} />
          <meshStandardMaterial color="#24140d" roughness={0.92} />
        </mesh>
      </group>

      {/* 2. Furrow Ridges (Textured Soil Rows) & Dynamic 3D Crops */}
      {ROWS.map((rowZ, rowIdx) => (
        <group key={`row-${rowIdx}`} position={[0, 0.18, rowZ]}>
          {/* Soil Mound Ridge (Raised furrow bed) */}
          <RoundedBox args={[3.8, 0.08, 0.55]} radius={0.04} smoothness={2} position={[0, 0.04, 0]} receiveShadow>
            <meshStandardMaterial color="#341e13" roughness={0.9} />
          </RoundedBox>

          {/* Planted 3D Crops along the furrow from reactive GardenContext state */}
          {COLS.map((colX, colIdx) => {
            const tile = grid[rowIdx]?.[colIdx] ?? { crop: 'none', watered: false, growth: 0 };
            return (
              <Crop3D
                key={`crop-${rowIdx}-${colIdx}`}
                tile={tile}
                x={colX}
                z={0}
              />
            );
          })}
        </group>
      ))}

      {/* 3. Copper Irrigation Pipe Line along the planter border */}
      <group position={[-1.95, 0.32, 0]}>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 6.0, 8]} />
          <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Sprinkler Nozzles */}
        {[-2.2, -1.1, 0, 1.1, 2.2].map((pz, idx) => (
          <group key={`nozzle-${idx}`} position={[0, 0.04, pz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.012, 0.02, 0.08, 8]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.02, 0.04, 0]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Garden Work Bench & Tool Rack */}
      <group position={[2.55, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Potting Bench Surface */}
        <RoundedBox args={[1.6, 0.06, 0.6]} radius={0.02} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>
        {/* Bench Legs */}
        <mesh castShadow position={[-0.65, 0.22, -0.2]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.65, 0.22, -0.2]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.65, 0.22, 0.2]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.65, 0.22, 0.2]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>

        {/* Vintage Watering Can */}
        <group position={[-0.4, 0.58, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.18, 12]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Spout */}
          <mesh position={[0.1, 0.04, 0]} rotation={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.015, 0.025, 0.16, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Handle */}
          <mesh position={[-0.08, 0.05, 0]}>
            <torusGeometry args={[0.06, 0.01, 8, 16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* Wooden Harvest Crate with Pumpkins & Carrots */}
        <group position={[0.3, 0.56, 0]}>
          <RoundedBox args={[0.4, 0.14, 0.35]} radius={0.01} smoothness={2} castShadow>
            <meshStandardMaterial color="#a16207" roughness={0.8} />
          </RoundedBox>
          <mesh position={[-0.06, 0.08, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ea580c" />
          </mesh>
          <mesh position={[0.08, 0.07, 0.04]}>
            <coneGeometry args={[0.03, 0.1, 6]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        </group>
      </group>

      {/* 5. Autonomous Farming Drone Robot ("The Farmer Was Replaced" Automaton) */}
      <group ref={droneGroupRef} position={[0, 1.1, 0]}>
        {/* Main Drone Pod Body */}
        <RoundedBox args={[0.45, 0.32, 0.45]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
        </RoundedBox>
        {/* Golden Brass Trim Ring */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.26, 0.02, 12, 24]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Glowing Visor Screen */}
        <RoundedBox args={[0.3, 0.14, 0.05]} radius={0.03} smoothness={2} position={[0, 0.02, 0.22]}>
          <meshStandardMaterial
            color={beamColor}
            emissive={beamColor}
            emissiveIntensity={drone.isWatering || drone.isHarvesting || drone.isPlanting ? 1.0 : 0.6}
            roughness={0.1}
          />
        </RoundedBox>
        {/* Dual Camera Eyes */}
        <mesh position={[-0.08, 0.03, 0.25]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.08, 0.03, 0.25]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Top Rotor Mast & Spinning Propeller */}
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <group ref={rotorRef} position={[0, 0.23, 0]}>
          <mesh>
            <boxGeometry args={[0.65, 0.012, 0.045]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.65, 0.012, 0.045]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Manipulator Harvesting Claws underneath */}
        <mesh position={[-0.12, -0.2, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[0.12, -0.2, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>

        {/* Downward Work Spotlight Glow */}
        <pointLight
          position={[0, -0.2, 0]}
          distance={1.6}
          intensity={drone.isHarvesting || drone.isPlanting || drone.isWatering ? 2.5 : 0.8}
          color={beamColor}
        />

        {/* Action Beam: Cylinder light beam cone projecting downward when harvesting, planting, or watering */}
        {(drone.isHarvesting || drone.isPlanting || drone.isWatering) && (
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.15, 0.35, 0.7, 16, 1, true]} />
            <meshBasicMaterial color={beamColor} transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Water Droplet Sprinklers when watering */}
        {drone.isWatering && (
          <group ref={waterSprayRef} position={[0, -0.3, 0]}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ang = (i * Math.PI) / 3;
              const rad = 0.15;
              return (
                <mesh key={`drop-${i}`} position={[Math.cos(ang) * rad, -0.15, Math.sin(ang) * rad]}>
                  <sphereGeometry args={[0.02, 6, 6]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
                </mesh>
              );
            })}
          </group>
        )}
      </group>

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
