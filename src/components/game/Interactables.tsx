import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import { useGame } from '../../context/GameContext';

export const Interactables: React.FC = () => {
  const { nearbyZone, openModal, activeModal } = useGame();
  const screenGlowRef = useRef<THREE.PointLight>(null);
  const runeRef = useRef<THREE.Group>(null);
  const catRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = performance.now() * 0.003;
    if (screenGlowRef.current) {
      screenGlowRef.current.intensity = 1.2 + Math.sin(t * 2) * 0.3;
    }
    if (runeRef.current) {
      runeRef.current.rotation.y = t * 0.8;
      runeRef.current.position.y = 1.8 + Math.sin(t * 1.5) * 0.08;
    }
    if (catRef.current) {
      catRef.current.scale.y = 1 + Math.sin(t * 1.8) * 0.06;
    }
    if (steamRef.current) {
      steamRef.current.position.y = 0.65 + Math.sin(t * 2.5) * 0.03;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ---------------- 1. HIGH-FIDELITY PROJECTS DESK ---------------- */}
      <group position={[-4.2, 0, -8.5]}>
        {/* Beveled Walnut Desk Top */}
        <RoundedBox
          args={[2.6, 0.08, 1.3]}
          radius={0.03}
          smoothness={4}
          castShadow
          receiveShadow
          position={[0, 1.0, 0]}
        >
          <meshStandardMaterial color="#1e1b18" roughness={0.3} metalness={0.1} />
        </RoundedBox>

        {/* Matte Black Metal Frame Legs */}
        <mesh castShadow position={[-1.15, 0.5, 0]}>
          <boxGeometry args={[0.08, 1.0, 1.1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[1.15, 0.5, 0]}>
          <boxGeometry args={[0.08, 1.0, 1.1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Large Premium Desk Mat */}
        <mesh receiveShadow position={[0, 1.042, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.8, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* Curved Ultrawide Studio Display */}
        <group position={[0, 1.55, -0.28]} rotation={[0.05, 0, 0]}>
          {/* Beveled Frame */}
          <RoundedBox args={[1.7, 0.75, 0.06]} radius={0.02} smoothness={4} castShadow>
            <meshStandardMaterial color="#090d16" roughness={0.2} metalness={0.8} />
          </RoundedBox>
          {/* Vibrant Glowing Screen Content */}
          <mesh position={[0, 0, 0.032]}>
            <planeGeometry args={[1.64, 0.69]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          {/* Cyberpunk Code IDE glowing lines */}
          <mesh position={[-0.35, 0.15, 0.034]}>
            <planeGeometry args={[0.7, 0.03]} />
            <meshBasicMaterial color="#ec4899" />
          </mesh>
          <mesh position={[-0.3, 0.08, 0.034]}>
            <planeGeometry args={[0.6, 0.03]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[-0.2, 0.01, 0.034]}>
            <planeGeometry args={[0.8, 0.03]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0.35, 0, 0.034]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#0369a1" />
          </mesh>
        </group>

        {/* Heavy Aluminum Monitor Arm */}
        <mesh castShadow position={[0, 1.2, -0.32]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Mechanical Backlit Keyboard */}
        <RoundedBox args={[0.6, 0.025, 0.22]} radius={0.01} smoothness={4} position={[0, 1.055, 0.15]} castShadow>
          <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.4} />
        </RoundedBox>
        {/* RGB Keyboard Underglow */}
        <mesh position={[0, 1.06, 0.15]}>
          <boxGeometry args={[0.56, 0.01, 0.18]} />
          <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={1.5} />
        </mesh>

        {/* Ergonomic Wireless Mouse */}
        <RoundedBox args={[0.09, 0.035, 0.14]} radius={0.02} smoothness={4} position={[0.45, 1.06, 0.15]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.6} />
        </RoundedBox>

        {/* Sleek Aluminum Laptop Open */}
        <group position={[-0.85, 1.05, 0.05]} rotation={[0, 0.35, 0]}>
          <RoundedBox args={[0.42, 0.015, 0.28]} radius={0.01} smoothness={4} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </RoundedBox>
          {/* Laptop Screen with Apple/Sleek angle */}
          <group position={[0, 0.14, -0.13]} rotation={[-0.32, 0, 0]}>
            <RoundedBox args={[0.42, 0.28, 0.012]} radius={0.01} smoothness={4} castShadow>
              <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
            </RoundedBox>
            <mesh position={[0, 0, 0.008]}>
              <planeGeometry args={[0.39, 0.25]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        </group>

        {/* Potted Ceramic Monstera Desk Plant */}
        <group position={[0.95, 1.05, -0.2]}>
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.11, 0.08, 0.2, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 0.26, 0]} rotation={[0.2, 0.4, 0.2]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} />
          </mesh>
          <mesh castShadow position={[-0.08, 0.32, 0.05]} rotation={[-0.2, -0.4, -0.3]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
        </group>

        {/* Premium Ergonomic Office Chair */}
        <group position={[0, 0, 0.65]} rotation={[0, Math.PI, 0]}>
          {/* Seat Cushion */}
          <RoundedBox args={[0.56, 0.1, 0.52]} radius={0.04} smoothness={4} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
          </RoundedBox>
          {/* Contoured Mesh Backrest */}
          <RoundedBox args={[0.5, 0.68, 0.08]} radius={0.03} smoothness={4} position={[0, 0.88, 0.24]} castShadow>
            <meshStandardMaterial color="#312e81" roughness={0.8} />
          </RoundedBox>
          {/* 3D Armrests */}
          <mesh castShadow position={[-0.28, 0.72, 0.05]}>
            <boxGeometry args={[0.07, 0.04, 0.26]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0.28, 0.72, 0.05]}>
            <boxGeometry args={[0.07, 0.04, 0.26]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          {/* Heavy Steel Hydraulic Base & 5 Casters */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.04, 5]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Dynamic Blue Screen Light */}
        <pointLight ref={screenGlowRef} color="#38bdf8" intensity={1.2} distance={4} position={[0, 1.7, 0.2]} />

        {/* Floating Interaction Badge */}
        {nearbyZone === 'projects' && !activeModal && (
          <Html position={[0, 2.4, 0]} center distanceFactor={11}>
            <button
              onClick={() => openModal('projects')}
              className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="text-base">💻</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
              <span>View Projects</span>
            </button>
          </Html>
        )}
      </group>

      {/* ---------------- 2. HIGH-FIDELITY SKILLS BOOKSHELF ---------------- */}
      <group position={[-5.8, 0, -4.5]}>
        {/* Rounded Modern Bookcase */}
        <RoundedBox args={[0.85, 3.4, 2.0]} radius={0.04} smoothness={4} position={[0, 1.7, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1c1917" roughness={0.5} metalness={0.1} />
        </RoundedBox>

        {/* Inner Shelving Cavity */}
        <mesh position={[0.04, 1.7, 0]}>
          <boxGeometry args={[0.78, 3.2, 1.88]} />
          <meshStandardMaterial color="#292524" roughness={0.8} />
        </mesh>

        {/* Varied Colorful Book Spines with Gold Ribbons */}
        <group position={[0.1, 0.7, 0]}>
          <mesh castShadow position={[0, 0.2, -0.4]}>
            <boxGeometry args={[0.55, 0.42, 0.12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.22, -0.2]}>
            <boxGeometry args={[0.55, 0.46, 0.14]} />
            <meshStandardMaterial color="#f97316" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.19, 0.1]}>
            <boxGeometry args={[0.55, 0.4, 0.16]} />
            <meshStandardMaterial color="#06b6d4" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.23, 0.4]}>
            <boxGeometry args={[0.55, 0.48, 0.18]} />
            <meshStandardMaterial color="#8b5cf6" roughness={0.4} />
          </mesh>
        </group>

        <group position={[0.1, 1.5, 0]}>
          <mesh castShadow position={[0, 0.2, -0.3]}>
            <boxGeometry args={[0.55, 0.44, 0.2]} />
            <meshStandardMaterial color="#10b981" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.24, 0.1]}>
            <boxGeometry args={[0.55, 0.5, 0.22]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.4} />
          </mesh>
        </group>

        {/* Floating Glowing Tech Rune */}
        <group ref={runeRef} position={[0.55, 1.8, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.22]} />
            <meshStandardMaterial color="#c084fc" emissive="#9333ea" emissiveIntensity={2.0} roughness={0.1} />
          </mesh>
          <pointLight color="#a855f7" intensity={1.0} distance={2.5} />
        </group>

        {nearbyZone === 'skills' && !activeModal && (
          <Html position={[0, 3.6, 0]} center distanceFactor={11}>
            <button
              onClick={() => openModal('skills')}
              className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="text-base">⚡</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
              <span>Skill Proficiencies</span>
            </button>
          </Html>
        )}
      </group>

      {/* ---------------- 3. HIGH-FIDELITY EXPERIENCE CREDENZA & GALLERY ---------------- */}
      <group position={[4.5, 0, -9.8]}>
        {/* Floating Credenza Cabinet */}
        <RoundedBox args={[2.2, 0.75, 0.7]} radius={0.04} smoothness={4} position={[0, 0.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        {/* Brass Cabinet Handles */}
        <mesh position={[-0.4, 0.55, 0.36]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.4, 0.55, 0.36]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Gleaming Gold Champion Trophy */}
        <group position={[-0.55, 0.88, 0]}>
          {/* Black Marble Pedestal */}
          <mesh castShadow position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.12, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
          </mesh>
          {/* Golden Cup */}
          <mesh castShadow position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.14, 0.06, 0.28, 16]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.15} />
          </mesh>
          <pointLight color="#fde047" intensity={0.6} distance={1.8} position={[0, 0.35, 0]} />
        </group>

        {/* Matted Certificate Frames on the Wall */}
        <group position={[0, 2.3, -0.48]}>
          <mesh castShadow position={[-0.65, 0, 0]}>
            <boxGeometry args={[0.8, 0.55, 0.04]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[-0.65, 0, 0.025]}>
            <planeGeometry args={[0.72, 0.47]} />
            <meshStandardMaterial color="#fef9c3" roughness={0.6} />
          </mesh>

          <mesh castShadow position={[0.65, 0, 0]}>
            <boxGeometry args={[0.8, 0.55, 0.04]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[0.65, 0, 0.025]}>
            <planeGeometry args={[0.72, 0.47]} />
            <meshStandardMaterial color="#fef9c3" roughness={0.6} />
          </mesh>
        </group>

        {nearbyZone === 'experience' && !activeModal && (
          <Html position={[0, 2.8, 0]} center distanceFactor={11}>
            <button
              onClick={() => openModal('experience')}
              className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="text-base">🏆</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
              <span>Quest Timeline</span>
            </button>
          </Html>
        )}
      </group>

      {/* ---------------- 4. HIGH-FIDELITY BEDROOM & SLEEPING PET ---------------- */}
      <group position={[4.2, 0, -3.8]}>
        {/* Tufted Headboard */}
        <RoundedBox args={[2.2, 1.2, 0.18]} radius={0.06} smoothness={4} position={[0, 0.7, -1.15]} castShadow>
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </RoundedBox>

        {/* Oak Bed Base */}
        <RoundedBox args={[2.1, 0.35, 2.3]} radius={0.04} smoothness={4} position={[0, 0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </RoundedBox>

        {/* Plush Mattress */}
        <RoundedBox args={[1.95, 0.28, 2.2]} radius={0.06} smoothness={4} position={[0, 0.48, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </RoundedBox>

        {/* Textured Soft Blue Duvet */}
        <RoundedBox args={[1.96, 0.18, 1.55]} radius={0.05} smoothness={4} position={[0, 0.58, 0.32]} castShadow receiveShadow>
          <meshStandardMaterial color="#0284c7" roughness={0.75} />
        </RoundedBox>

        {/* Dual Pillows */}
        <RoundedBox args={[0.75, 0.15, 0.48]} radius={0.06} smoothness={4} position={[-0.5, 0.68, -0.82]} castShadow>
          <meshStandardMaterial color="#f0f9ff" roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.75, 0.15, 0.48]} radius={0.06} smoothness={4} position={[0.5, 0.68, -0.82]} castShadow>
          <meshStandardMaterial color="#f0f9ff" roughness={0.5} />
        </RoundedBox>

        {/* Bedside Nightstand & Warm Lamp */}
        <group position={[-1.4, 0, -0.8]}>
          <RoundedBox args={[0.5, 0.55, 0.5]} radius={0.03} smoothness={4} position={[0, 0.28, 0]} castShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </RoundedBox>
          {/* Glowing Ceramic Touch Lamp */}
          <mesh castShadow position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.24, 16]} />
            <meshStandardMaterial color="#fed7aa" emissive="#f97316" emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
          <pointLight color="#fed7aa" intensity={0.7} distance={3} position={[0, 0.75, 0]} />
        </group>

        {/* Fluffy Sleeping Ginger Cat */}
        <group ref={catRef} position={[0.42, 0.68, 0.55]}>
          {/* Cat Curled Body */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#f97316" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh castShadow position={[0.12, 0.08, 0.1]}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color="#ea580c" roughness={0.8} />
          </mesh>
          {/* Ears */}
          <mesh position={[0.17, 0.18, 0.14]}>
            <coneGeometry args={[0.04, 0.08, 4]} />
            <meshStandardMaterial color="#c2410c" />
          </mesh>
          <mesh position={[0.07, 0.18, 0.14]}>
            <coneGeometry args={[0.04, 0.08, 4]} />
            <meshStandardMaterial color="#c2410c" />
          </mesh>
          {/* Fluffy Tail */}
          <mesh position={[-0.14, 0.02, -0.08]} rotation={[0, 0.6, 0]}>
            <torusGeometry args={[0.1, 0.035, 8, 16]} />
            <meshStandardMaterial color="#ea580c" roughness={0.8} />
          </mesh>
        </group>

        {nearbyZone === 'bed' && !activeModal && (
          <Html position={[0, 2.0, 0]} center distanceFactor={11}>
            <button
              onClick={() => openModal('bed')}
              className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="text-base">🐱</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
              <span>Pet Byte The Cat</span>
            </button>
          </Html>
        )}
      </group>

      {/* ---------------- 5. HIGH-FIDELITY YARD MAILBOX ---------------- */}
      <group position={[1.6, 0, 10.8]}>
        {/* Sculpted Wood Post */}
        <RoundedBox args={[0.16, 1.4, 0.16]} radius={0.02} smoothness={4} position={[0, 0.7, 0]} castShadow>
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </RoundedBox>
        {/* Curved Mailbox Body */}
        <RoundedBox args={[0.42, 0.38, 0.65]} radius={0.08} smoothness={4} position={[0, 1.45, 0]} castShadow>
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        {/* Brass Flag */}
        <mesh position={[0.23, 1.55, -0.1]}>
          <boxGeometry args={[0.02, 0.24, 0.09]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>

        {nearbyZone === 'contact' && !activeModal && (
          <Html position={[0, 2.3, 0]} center distanceFactor={11}>
            <button
              onClick={() => openModal('contact')}
              className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="text-base">📫</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
              <span>Post Office & Mail</span>
            </button>
          </Html>
        )}
      </group>

      {/* ---------------- 6. HIGH-FIDELITY GARDEN BENCH ---------------- */}
      <group position={[-7.5, 0, 4.5]} rotation={[0, Math.PI / 4, 0]}>
        {/* Mahogany Bench Slats */}
        <RoundedBox args={[1.9, 0.08, 0.58]} radius={0.02} smoothness={4} position={[0, 0.46, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#9a3412" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[1.9, 0.48, 0.08]} radius={0.02} smoothness={4} position={[0, 0.82, -0.26]} castShadow>
          <meshStandardMaterial color="#9a3412" roughness={0.6} />
        </RoundedBox>
        {/* Cast Iron Bench Supports */}
        <mesh castShadow position={[-0.8, 0.24, 0]}>
          <boxGeometry args={[0.08, 0.48, 0.5]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0.8, 0.24, 0]}>
          <boxGeometry args={[0.08, 0.48, 0.5]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Steaming Ceramic Coffee Mug */}
        <group position={[0.55, 0.5, 0]}>
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} />
          </mesh>
          {/* Animated Steam Puff */}
          <group ref={steamRef} position={[0, 0.22, 0]}>
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
            </mesh>
          </group>
        </group>

        {nearbyZone === 'about' && !activeModal && (
          <Html position={[0, 1.8, 0]} center distanceFactor={11}>
            <button
              onClick={() => openModal('about')}
              className="px-4 py-2 rounded-2xl bg-[#fffdfa]/95 text-[#451a03] text-xs font-black tracking-wide shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-[#b45309] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="text-base">☕</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#d97706] text-white font-mono text-[11px] font-bold shadow-xs border-b-2 border-[#92400e]">E</span>
              <span>About Me & Log</span>
            </button>
          </Html>
        )}
      </group>
    </group>
  );
};
