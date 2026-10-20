import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Procedural atmospheric sky dome with sun disc, solar halo, and cirrus wisps.
 * Blends seamlessly with scene fog at the horizon with zero jarring ground boundaries.
 */
export const SkyDome: React.FC = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = performance.now() * 0.00008;
    if (sunRef.current) {
      const s = 1.0 + Math.sin(t * 12) * 0.03;
      sunRef.current.scale.set(s, s, s);
    }
    if (haloRef.current) {
      const h = 1.0 + Math.sin(t * 8) * 0.05;
      haloRef.current.scale.set(h, h, h);
    }
  });

  // Procedural sky gradient sphere material
  const skyGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(210, 48, 24);
    const colors: number[] = [];
    const pos = geo.attributes.position;

    // Atmospheric palette matching scene fog '#bfdbfe'
    const zenith = new THREE.Color('#1d4ed8');       // Deep crisp sky blue at top
    const midSky = new THREE.Color('#60a5fa');       // Bright sky blue
    const horizon = new THREE.Color('#bfdbfe');      // Soft hazy atmospheric horizon

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 210; // -1 to 1
      const color = new THREE.Color();

      if (y > 0.35) {
        // Upper sky: midSky → zenith
        const t = Math.min((y - 0.35) / 0.65, 1.0);
        color.lerpColors(midSky, zenith, t);
      } else if (y > 0.0) {
        // Lower sky: horizon → midSky
        const t = y / 0.35;
        color.lerpColors(horizon, midSky, t);
      } else {
        // At and below horizon: pure atmospheric horizon color matching fog
        color.copy(horizon);
      }

      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <group>
      {/* Sky Gradient Dome */}
      <mesh geometry={skyGeo}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
      </mesh>

      {/* Warm Golden Sun Disc in South-East Sky */}
      <group position={[65, 80, -60]}>
        {/* Soft Outer Solar Halo */}
        <mesh ref={haloRef}>
          <circleGeometry args={[22, 32]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.15} fog={false} side={THREE.DoubleSide} />
        </mesh>
        {/* Inner Warm Glow Ring */}
        <mesh>
          <circleGeometry args={[11, 32]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.3} fog={false} side={THREE.DoubleSide} />
        </mesh>
        {/* Radiant Core */}
        <mesh ref={sunRef}>
          <circleGeometry args={[5.2, 32]} />
          <meshBasicMaterial color="#fffef0" fog={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Delicate Cirrus Cloud Streaks */}
      <CirrusWisps />
    </group>
  );
};

// High-altitude wispy cirrus streaks
const CirrusWisps: React.FC = () => {
  const wisps = useMemo(() => {
    const list: { pos: [number, number, number]; rot: number; scaleX: number; scaleZ: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.sin(i) * 0.3;
      const dist = 95 + ((i * 29) % 45);
      list.push({
        pos: [Math.cos(angle) * dist, 68 + ((i * 17) % 22), Math.sin(angle) * dist],
        rot: angle + Math.PI / 2,
        scaleX: 24 + ((i * 11) % 18),
        scaleZ: 3.2 + ((i * 5) % 3),
      });
    }
    return list;
  }, []);

  return (
    <group>
      {wisps.map((w, i) => (
        <mesh key={i} position={w.pos} rotation={[0, w.rot, 0]}>
          <planeGeometry args={[w.scaleX, w.scaleZ]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.14 + ((i % 3) * 0.03)}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};
