import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';

interface ParticlesProps {
  engine: PhysicsEngine | null;
}

export const Particles: React.FC<ParticlesProps> = ({ engine }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 45;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!engine || !meshRef.current) return;

    // Fetch particle simulation data from Rust WASM
    const data = engine.get_particles_data();
    if (!data || data.length === 0) return;

    for (let i = 0; i < count; i++) {
      const offset = i * 7;
      const x = data[offset];
      const y = data[offset + 1];
      const z = data[offset + 2];
      const rx = data[offset + 3];
      const ry = data[offset + 4];
      const rz = data[offset + 5];
      const scale = data[offset + 6];

      dummy.position.set(x, y, z);
      dummy.rotation.set(rx, ry, rz);
      dummy.scale.set(scale, scale, scale * 1.5);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Low-poly stylized leaf diamond */}
      <tetrahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#f97316" roughness={0.7} /> {/* Autumn orange leaf */}
    </instancedMesh>
  );
};
