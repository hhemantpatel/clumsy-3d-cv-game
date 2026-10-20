import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Grass } from './Grass';
import { BadmintonCourt } from './BadmintonCourt';
import { textureGen } from '../../utils/textures';

export const Yard: React.FC = () => {
  const grassTex = useMemo(() => {
    const tex = textureGen.getGrassTexture();
    tex.repeat.set(16, 16);
    return tex;
  }, []);

  const stoneTex = useMemo(() => {
    const tex = textureGen.getSlateStone();
    tex.repeat.set(2, 2);
    return tex;
  }, []);
  const fencePosts: [number, number][] = [];
  const spacing = 1.6;

  for (let x = -12.5; x <= 12.5; x += spacing) fencePosts.push([x, -12.5]);
  for (let x = -12.5; x <= 12.5; x += spacing) {
    if (Math.abs(x) > 1.2) fencePosts.push([x, 12.5]);
  }
  for (let z = -12.5; z <= 12.5; z += spacing) fencePosts.push([-12.5, z]);
  for (let z = -12.5; z <= 12.5; z += spacing) fencePosts.push([12.5, z]);

  const steppingStones: [number, number, number][] = [];
  for (let z = 11.2; z >= -0.4; z -= 1.1) {
    const jitterX = Math.sin(z * 1.4) * 0.2;
    const rot = Math.sin(z * 2.1) * 0.5;
    steppingStones.push([jitterX, z, rot]);
  }

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Seamless Natural Meadow Ground (Inner Yard + Outer Countryside Meadow) */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial
          color="#166534"
          map={grassTex}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Low Slate Stone Edging / Retaining Border along Fence Line */}
      <mesh position={[0, 0.04, -12.5]} receiveShadow>
        <boxGeometry args={[25.4, 0.1, 0.22]} />
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[-6.8, 0.04, 12.5]} receiveShadow>
        <boxGeometry args={[11.6, 0.1, 0.22]} />
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[6.8, 0.04, 12.5]} receiveShadow>
        <boxGeometry args={[11.6, 0.1, 0.22]} />
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[-12.5, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.22, 0.1, 25.4]} />
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[12.5, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.22, 0.1, 25.4]} />
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* 3. 3D Instanced Swaying Grass & Wildflowers */}
      <Grass />

      {/* 4. Authentic Badminton Court in Right Yard */}
      <BadmintonCourt />

      {/* 5. Flagstone Stepping Stones Path */}
      {steppingStones.map(([sx, sz, rot], i) => (
        <group key={i} position={[sx, 0.02, sz]} rotation={[0, rot, 0]}>
          <RoundedBox args={[0.9, 0.04, 0.7]} radius={0.08} smoothness={4} receiveShadow>
            <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.0} />
          </RoundedBox>
        </group>
      ))}

      {/* 5. Perimeter Fence Posts with Rounded Caps */}
      {fencePosts.map(([fx, fz], idx) => (
        <group key={idx} position={[fx, 0, fz]}>
          <RoundedBox args={[0.18, 1.1, 0.18]} radius={0.02} smoothness={3} position={[0, 0.55, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </RoundedBox>
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.14, 0.18, 4]} />
            <meshStandardMaterial color="#92400e" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Horizontal Railings */}
      <mesh position={[0, 0.45, -12.5]} castShadow>
        <boxGeometry args={[25.2, 0.1, 0.08]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.8, -12.5]} castShadow>
        <boxGeometry args={[25.2, 0.1, 0.08]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[-6.8, 0.45, 12.5]} castShadow>
        <boxGeometry args={[11.5, 0.1, 0.08]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[-6.8, 0.8, 12.5]} castShadow>
        <boxGeometry args={[11.5, 0.1, 0.08]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[6.8, 0.45, 12.5]} castShadow>
        <boxGeometry args={[11.5, 0.1, 0.08]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[6.8, 0.8, 12.5]} castShadow>
        <boxGeometry args={[11.5, 0.1, 0.08]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[-12.5, 0.45, 0]} castShadow>
        <boxGeometry args={[0.08, 0.1, 25.2]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[-12.5, 0.8, 0]} castShadow>
        <boxGeometry args={[0.08, 0.1, 25.2]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[12.5, 0.45, 0]} castShadow>
        <boxGeometry args={[0.08, 0.1, 25.2]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[12.5, 0.8, 0]} castShadow>
        <boxGeometry args={[0.08, 0.1, 25.2]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>

      {/* Front Entrance Garden Gate */}
      <group position={[0, 0, 12.5]}>
        <RoundedBox args={[0.26, 2.3, 0.26]} radius={0.03} smoothness={3} position={[-1.2, 1.15, 0]} castShadow>
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.26, 2.3, 0.26]} radius={0.03} smoothness={3} position={[1.2, 1.15, 0]} castShadow>
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[2.8, 0.22, 0.26]} radius={0.03} smoothness={3} position={[0, 2.35, 0]} castShadow>
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[1.7, 0.5, 0.06]} radius={0.04} smoothness={3} position={[0, 1.95, 0.14]} castShadow>
          <meshStandardMaterial color="#fef3c7" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* 6. High-Fidelity Sculpted Organic Trees with Swaying Canopies */}
      {/* Grand Oak Tree in Garden Corner */}
      <DetailedTree
        position={[-8.5, 0, -4.0]}
        scale={1.3}
        trunkColor="#543310"
        leafColors={['#15803d', '#16a34a', '#22c55e', '#4ade80']}
      />
      {/* Flowering Cherry Blossom Tree near Front Gate */}
      <DetailedTree
        position={[-6.0, 0, 9.5]}
        scale={1.05}
        trunkColor="#451a03"
        leafColors={['#f472b6', '#f9a8d4', '#fbcfe8', '#fda4af']}
      />
      {/* Autumn Maple Tree by East Fence */}
      <DetailedTree
        position={[9.8, 0, -4.0]}
        scale={1.2}
        trunkColor="#5c2d16"
        leafColors={['#ea580c', '#f97316', '#fb923c', '#fbbf24']}
      />
      {/* Tall Fir Tree behind House */}
      <DetailedTree
        position={[-9.5, 0, -8.5]}
        scale={1.4}
        trunkColor="#3e2723"
        leafColors={['#064e3b', '#065f46', '#047857', '#10b981']}
      />

      {/* Clustered Flowering Shrubs */}
      <LushShrub position={[-3.5, 0, 2.5]} flowerColor="#f43f5e" />
      <LushShrub position={[3.5, 0, 1.5]} flowerColor="#fbbf24" />
      <LushShrub position={[-2.8, 0, 8.5]} flowerColor="#a855f7" />
      <LushShrub position={[-7.5, 0, 2.2]} flowerColor="#ec4899" />
    </group>
  );
};

// High-Fidelity Multi-Branch Organic Tree
interface DetailedTreeProps {
  position: [number, number, number];
  scale?: number;
  trunkColor: string;
  leafColors: string[];
}

const DetailedTree: React.FC<DetailedTreeProps> = ({ position, scale = 1.0, trunkColor, leafColors }) => {
  const canopyRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!canopyRef.current) return;
    const t = performance.now() * 0.0015;
    // Gentle natural wind sway
    canopyRef.current.rotation.z = Math.sin(t + position[0]) * 0.035;
    canopyRef.current.rotation.x = Math.cos(t * 0.8 + position[2]) * 0.025;
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Sculpted Trunk & Roots */}
      <group>
        {/* Main Trunk */}
        <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.26, 0.44, 2.2, 12]} />
          <meshStandardMaterial color={trunkColor} roughness={0.85} />
        </mesh>
        {/* Organic Root Flare */}
        <mesh receiveShadow position={[0.2, 0.12, 0.1]} rotation={[0.2, 0.4, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 0.4, 8]} />
          <meshStandardMaterial color={trunkColor} roughness={0.9} />
        </mesh>
        <mesh receiveShadow position={[-0.18, 0.12, -0.15]} rotation={[-0.3, 0.2, 0]}>
          <cylinderGeometry args={[0.1, 0.2, 0.4, 8]} />
          <meshStandardMaterial color={trunkColor} roughness={0.9} />
        </mesh>

        {/* Tree Branches */}
        <mesh castShadow position={[-0.25, 2.0, 0.1]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.12, 0.18, 0.9, 8]} />
          <meshStandardMaterial color={trunkColor} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0.28, 2.1, -0.1]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.11, 0.16, 0.85, 8]} />
          <meshStandardMaterial color={trunkColor} roughness={0.85} />
        </mesh>
      </group>

      {/* Fluffy Multi-Tier Cloud Canopy */}
      <group ref={canopyRef} position={[0, 2.4, 0]}>
        {/* Central Core Globe */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <sphereGeometry args={[1.4, 16, 16]} />
          <meshStandardMaterial color={leafColors[0]} roughness={0.7} />
        </mesh>
        {/* Left Canopy Cloud */}
        <mesh castShadow position={[-0.75, 0.8, 0.4]}>
          <sphereGeometry args={[1.05, 14, 14]} />
          <meshStandardMaterial color={leafColors[1]} roughness={0.7} />
        </mesh>
        {/* Right Canopy Cloud */}
        <mesh castShadow position={[0.8, 0.7, -0.3]}>
          <sphereGeometry args={[1.0, 14, 14]} />
          <meshStandardMaterial color={leafColors[2]} roughness={0.7} />
        </mesh>
        {/* Top Canopy Crown */}
        <mesh castShadow position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.9, 14, 14]} />
          <meshStandardMaterial color={leafColors[3]} roughness={0.65} />
        </mesh>
        {/* Back Canopy Cloud */}
        <mesh castShadow position={[-0.2, 0.9, -0.7]}>
          <sphereGeometry args={[0.95, 14, 14]} />
          <meshStandardMaterial color={leafColors[1]} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// Lush Garden Flowering Shrub
const LushShrub: React.FC<{ position: [number, number, number]; flowerColor: string }> = ({ position, flowerColor }) => {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.55, 14, 14]} />
        <meshStandardMaterial color="#166534" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0.2, 0.42, 0.15]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#15803d" roughness={0.75} />
      </mesh>
      <mesh position={[0.18, 0.65, 0.2]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={flowerColor} roughness={0.4} />
      </mesh>
      <mesh position={[-0.22, 0.58, -0.1]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={flowerColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color={flowerColor} roughness={0.4} />
      </mesh>
    </group>
  );
};
