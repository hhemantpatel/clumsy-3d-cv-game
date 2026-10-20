import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Animated butterflies and firefly motes fluttering through the garden.
 */
export const Butterflies: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  const butterflies = useMemo(() => {
    const list: {
      pos: THREE.Vector3;
      color: string;
      speed: number;
      radius: number;
      phase: number;
      heightOffset: number;
    }[] = [];

    const colors = ['#f472b6', '#facc15', '#60a5fa', '#a78bfa', '#fb923c', '#34d399'];
    let seed = 777;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    for (let i = 0; i < 8; i++) {
      list.push({
        pos: new THREE.Vector3(rand() * 18 - 9, 1.2 + rand() * 2.5, rand() * 18 - 9),
        color: colors[i % colors.length],
        speed: 0.4 + rand() * 0.6,
        radius: 2.0 + rand() * 3.0,
        phase: rand() * Math.PI * 2,
        heightOffset: 1.0 + rand() * 2.0,
      });
    }
    return list;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;

    groupRef.current.children.forEach((butterfly, i) => {
      const b = butterflies[i];
      if (!b) return;

      // Lazy figure-8 / lemniscate flight path
      const theta = t * b.speed + b.phase;
      const x = b.pos.x + Math.sin(theta) * b.radius;
      const z = b.pos.z + Math.sin(theta * 2) * b.radius * 0.5;
      const y = b.heightOffset + Math.sin(theta * 1.5) * 0.6;

      butterfly.position.set(x, y, z);

      // Face direction of travel
      const dx = Math.cos(theta) * b.radius * b.speed;
      const dz = Math.cos(theta * 2) * b.radius * 0.5 * b.speed * 2;
      butterfly.rotation.y = Math.atan2(dx, dz);

      // Wing flap via scaling Y of the left/right wing children
      const flapSpeed = 12 + i * 2;
      const flapAngle = Math.sin(t * flapSpeed) * 0.85;
      const leftWing = (butterfly as THREE.Group).children[0];
      const rightWing = (butterfly as THREE.Group).children[1];
      if (leftWing) leftWing.rotation.z = flapAngle;
      if (rightWing) rightWing.rotation.z = -flapAngle;
    });
  });

  return (
    <group ref={groupRef}>
      {butterflies.map((b, i) => (
        <group key={i} position={[b.pos.x, b.heightOffset, b.pos.z]} scale={[0.15, 0.15, 0.15]}>
          {/* Left Wing */}
          <mesh rotation={[0, 0, 0]} position={[-0.3, 0, 0]}>
            <planeGeometry args={[0.8, 0.5]} />
            <meshStandardMaterial
              color={b.color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              emissive={b.color}
              emissiveIntensity={0.2}
              roughness={0.6}
            />
          </mesh>
          {/* Right Wing */}
          <mesh rotation={[0, 0, 0]} position={[0.3, 0, 0]}>
            <planeGeometry args={[0.8, 0.5]} />
            <meshStandardMaterial
              color={b.color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              emissive={b.color}
              emissiveIntensity={0.2}
              roughness={0.6}
            />
          </mesh>
          {/* Tiny Body */}
          <mesh>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
