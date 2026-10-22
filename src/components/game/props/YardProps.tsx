import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Merged, Part, box, cyl, mergeParts, sph, torus } from './kit';

const IRON = '#2e3136';

// ---------------- Mailbox (door faces -z, toward the house path / trigger) ----------------
function mailboxParts(): Part[] {
  const BODY = '#3f7f86';
  const DOOR = '#346b71';
  const p: Part[] = [
    box(0.3, 0.12, 0.3, '#9a9184', [0, 0.06, 0]),
    box(0.12, 1.05, 0.12, '#7a5233', [0, 0.525, 0]),
    box(0.2, 0.04, 0.5, '#7a5233', [0, 1.07, 0]),
    box(0.13, 0.2, 0.02, '#f3e6cc', [0, 0.75, -0.07]),
    box(0.03, 0.12, 0.022, '#5e3b24', [-0.025, 0.75, -0.072]),
    box(0.03, 0.12, 0.022, '#5e3b24', [0.025, 0.75, -0.072]),
    box(0.32, 0.2, 0.55, BODY, [0, 1.19, 0], { m: 'satin' }),
    cyl(0.16, 0.16, 0.55, BODY, [0, 1.29, 0], { r: [Math.PI / 2, 0, 0], m: 'satin', seg: 16 }),
    box(0.34, 0.2, 0.02, DOOR, [0, 1.19, -0.285], { m: 'satin' }),
    cyl(0.17, 0.17, 0.02, DOOR, [0, 1.29, -0.285], { r: [Math.PI / 2, 0, 0], m: 'satin', seg: 16 }),
    box(0.06, 0.025, 0.03, '#d4a440', [0, 1.33, -0.3], { m: 'metal' }),
    box(0.2, 0.006, 0.12, '#fbf7ee', [0.02, 1.11, -0.32], { r: [0.25, 0.1, 0] }),
    // Flag (raised = mail waiting)
    box(0.02, 0.3, 0.02, IRON, [0.175, 1.32, 0.12], { m: 'metal' }),
    box(0.015, 0.1, 0.14, '#d8452f', [0.175, 1.42, 0.05]),
  ];
  const blooms = ['#e85d75', '#f7d35c', '#b07bd8'];
  [
    [0.2, 0.15],
    [-0.2, 0.12],
    [0.15, -0.2],
    [-0.18, -0.18],
  ].forEach(([x, z], i) => {
    p.push(sph(0.1, i % 2 ? '#5c8f4f' : '#4f7d44', [x, 0.08, z], { seg: 7 }));
    p.push(sph(0.045, blooms[i % 3], [x, 0.17, z], { seg: 6 }));
  });
  return p;
}

export const Mailbox: React.FC = () => {
  const set = useMemo(() => mergeParts(mailboxParts()), []);
  return <Merged set={set} castShadow receiveShadow />;
};

// ---------------- Garden bench with a steaming mug ----------------
function benchParts(): Part[] {
  const p: Part[] = [];
  for (let i = 0; i < 4; i++) {
    p.push(box(1.8, 0.04, 0.11, i % 2 ? '#a3643c' : '#b07045', [0, 0.46, -0.18 + i * 0.125], { m: 'satin' }));
  }
  for (let i = 0; i < 3; i++) {
    p.push(box(1.8, 0.09, 0.03, i % 2 ? '#a3643c' : '#b07045', [0, 0.62 + i * 0.12, -0.28 - i * 0.02], { r: [-0.18, 0, 0], m: 'satin' }));
  }
  for (const x of [-0.85, 0.85]) {
    p.push(box(0.05, 0.46, 0.05, IRON, [x, 0.23, 0.2], { m: 'metal' }));
    p.push(box(0.05, 0.95, 0.05, IRON, [x, 0.47, -0.3], { r: [-0.12, 0, 0], m: 'metal' }));
    p.push(box(0.05, 0.04, 0.55, IRON, [x, 0.43, -0.03], { m: 'metal' }));
    p.push(box(0.04, 0.2, 0.04, IRON, [x, 0.55, 0.2], { m: 'metal' }));
    p.push(box(0.08, 0.04, 0.5, '#b07045', [x, 0.66, 0.0], { m: 'satin' }));
    p.push(torus(0.07, 0.012, IRON, [x, 0.25, -0.05], { r: [0, Math.PI / 2, 0], m: 'metal', seg: 12 }));
  }
  // Mug + book
  p.push(cyl(0.05, 0.045, 0.11, '#f3e6cc', [0.55, 0.535, 0.02], { m: 'satin', seg: 14 }));
  p.push(torus(0.035, 0.012, '#f3e6cc', [0.605, 0.54, 0.02], { m: 'satin', seg: 10 }));
  p.push(cyl(0.044, 0.044, 0.005, '#3b2416', [0.55, 0.588, 0.02], { seg: 14 }));
  p.push(box(0.22, 0.04, 0.3, '#3d6f9e', [0.15, 0.5, 0.02], { r: [0, 0.3, 0] }));
  p.push(box(0.2, 0.042, 0.28, '#f3e6cc', [0.155, 0.5, 0.02], { r: [0, 0.3, 0] }));
  return p;
}

export const Bench: React.FC = () => {
  const steamRef = useRef<THREE.Group>(null);
  const built = useMemo(
    () => ({
      set: mergeParts(benchParts()),
      steamGeo: new THREE.SphereGeometry(0.035, 8, 6),
      steamMat: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }),
    }),
    []
  );

  useFrame((state) => {
    const g = steamRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const puffs = g.children;
    for (let i = 0; i < puffs.length; i++) {
      const o = (t * 0.6 + i / puffs.length) % 1;
      const p = puffs[i];
      p.position.set(Math.sin(t * 2 + i * 2.1) * 0.02, o * 0.35, 0);
      p.scale.setScalar((0.6 + o * 1.2) * (1 - o));
    }
  });

  return (
    <group>
      <Merged set={built.set} castShadow receiveShadow />
      <group ref={steamRef} position={[0.55, 0.62, 0.02]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={built.steamGeo} material={built.steamMat} />
        ))}
      </group>
    </group>
  );
};
