import React, { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';

export const Grass: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 450;

  // Generate randomized positions within yard lawn boundaries
  const grassInstances = useMemo(() => {
    const list: { pos: [number, number, number]; rotY: number; scale: number }[] = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const x = rand() * 24 - 12;
      const z = rand() * 24 - 12;

      // Avoid house interior (-6.5 to 6.5, -10.5 to -1.5)
      if (x > -6.8 && x < 6.8 && z > -11.0 && z < -1.0) continue;
      // Avoid stepping stones path (center line from z: -1 to 12)
      if (Math.abs(x) < 1.0 && z > -1.0 && z < 12.0) continue;
      // Avoid badminton court (x: 4.5 to 9.2, z: 1.2 to 9.0)
      if (x > 4.4 && x < 9.3 && z > 1.2 && z < 9.2) continue;
      // Avoid bench area (x: -8.8 to -6.0, z: 3.5 to 5.5)
      if (x > -9.0 && x < -5.8 && z > 3.2 && z < 5.8) continue;

      const scale = 0.5 + rand() * 0.45;
      const rotY = rand() * Math.PI * 2;
      list.push({ pos: [x, 0.01, z], rotY, scale });
    }
    return list;
  }, []);

  // Initialize all instance matrices ONCE at mount (0 CPU frame overhead)
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < grassInstances.length; i++) {
      const g = grassInstances[i];
      dummy.position.set(g.pos[0], g.pos[1], g.pos[2]);
      dummy.rotation.set(0.04 * Math.sin(g.rotY), g.rotY, 0.04 * Math.cos(g.rotY));
      dummy.scale.set(g.scale, g.scale, g.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [grassInstances]);

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Instanced Grass Blade Tufts (receiveShadow only, no shadow-map rasterization) */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, grassInstances.length]}
        receiveShadow
      >
        <coneGeometry args={[0.08, 0.45, 3]} />
        <meshStandardMaterial
          color="#16a34a"
          roughness={1.0}
          metalness={0.0}
        />
      </instancedMesh>

      {/* Scattered Lawn Daisies & Wildflowers */}
      <Wildflowers />
    </group>
  );
};

// Reusable scattered lawn wildflowers
const Wildflowers: React.FC = () => {
  const flowerSpots: [number, number, string][] = [
    [-3.8, 1.2, '#fef08a'],
    [-5.2, 2.8, '#ffffff'],
    [-4.5, 6.5, '#f472b6'],
    [-2.2, 7.8, '#ffffff'],
    [2.8, 2.2, '#fef08a'],
    [3.6, 9.8, '#ffffff'],
    [-8.2, 8.5, '#a78bfa'],
    [-10.2, 1.5, '#f472b6'],
    [10.5, 8.5, '#fef08a'],
    [10.8, -4.5, '#ffffff'],
    [-9.5, -7.5, '#ffffff'],
    [8.8, -9.2, '#fef08a'],
  ];

  return (
    <group position={[0, 0.02, 0]}>
      {flowerSpots.map(([fx, fz, color], idx) => (
        <group key={idx} position={[fx, 0, fz]}>
          {/* Stem */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
          {/* Flower Head */}
          <mesh position={[0, 0.21, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          {/* Petal Ring */}
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.055, 0.018, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
