import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Merged, Part, box, cone, cyl, mergeParts, place, sph, torus } from './kit';
import { codeScreenTexture } from './textures';

/** Desk top surface height (local, above the floor). */
const T = 0.935;
const WOOD = '#8a5a3b';
const WOOD_DARK = '#6b4429';
const IRON = '#2e3136';
const TEAL = '#2f5d57';

function chairParts(): Part[] {
  const fabric = '#c2683f';
  const parts: Part[] = [
    // seat + backrest (backrest on the +z side, i.e. away from the desk -> chair faces the desk)
    box(0.52, 0.08, 0.5, fabric, [0, 0.5, 0]),
    box(0.3, 0.04, 0.3, IRON, [0, 0.44, 0], { m: 'metal' }),
    box(0.48, 0.55, 0.07, fabric, [0, 0.9, 0.27], { r: [-0.1, 0, 0] }),
    box(0.06, 0.42, 0.05, IRON, [0, 0.62, 0.29], { m: 'metal' }),
    cyl(0.03, 0.03, 0.32, '#8c8f94', [0, 0.26, 0], { m: 'metal', seg: 8 }),
  ];
  for (const s of [-1, 1]) {
    parts.push(box(0.06, 0.04, 0.3, IRON, [s * 0.29, 0.68, 0.02], { m: 'metal' }));
    parts.push(box(0.04, 0.18, 0.04, IRON, [s * 0.29, 0.58, 0.06], { m: 'metal' }));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push(box(0.3, 0.035, 0.05, IRON, [Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15], { r: [0, -a, 0], m: 'metal' }));
    parts.push(sph(0.035, '#1d1f22', [Math.cos(a) * 0.3, 0.035, Math.sin(a) * 0.3], { seg: 6 }));
  }
  return parts;
}

function deskParts(): Part[] {
  const parts: Part[] = [
    // Desk body
    box(2.3, 0.07, 1.05, WOOD, [0, 0.9, -0.1], { m: 'satin' }),
    box(2.1, 0.08, 0.03, WOOD_DARK, [0, 0.8, -0.6]),
    box(0.6, 0.6, 0.9, '#7a4e33', [-0.75, 0.565, -0.1]),
    box(0.54, 0.24, 0.02, '#9b6a43', [-0.75, 0.72, 0.36]),
    box(0.54, 0.24, 0.02, '#9b6a43', [-0.75, 0.43, 0.36]),
    sph(0.025, '#d4a440', [-0.75, 0.72, 0.38], { m: 'metal', seg: 6 }),
    sph(0.025, '#d4a440', [-0.75, 0.43, 0.38], { m: 'metal', seg: 6 }),
    // Monitor
    box(0.32, 0.02, 0.2, '#2b2f36', [0, T + 0.01, -0.42], { m: 'satin' }),
    box(0.06, 0.32, 0.04, '#2b2f36', [0, T + 0.17, -0.47], { m: 'satin' }),
    box(1.06, 0.62, 0.04, '#22252b', [0, T + 0.5, -0.43], { m: 'satin' }),
    box(0.07, 0.07, 0.006, '#f7d35c', [0.46, T + 0.74, -0.408], { r: [0, 0, 0.12] }),
    box(0.07, 0.07, 0.006, '#f29fb5', [0.38, T + 0.76, -0.408], { r: [0, 0, -0.08] }),
    // Keyboard (base + key rows) & mouse
    box(0.62, 0.03, 0.2, '#3b3f46', [0, T + 0.015, 0.12], { m: 'satin' }),
    box(0.08, 0.016, 0.035, '#e07a5f', [0.24, T + 0.036, 0.18]),
    box(0.32, 0.006, 0.26, TEAL, [0.5, T + 0.003, 0.12]),
    sph(0.05, '#e9e4da', [0.5, T + 0.022, 0.13], { s: [0.75, 0.45, 1.1], seg: 10, m: 'satin' }),
    // Mug of coffee
    cyl(0.05, 0.045, 0.11, '#d65a3a', [0.8, T + 0.055, -0.02], { m: 'satin', seg: 14 }),
    torus(0.035, 0.012, '#d65a3a', [0.855, T + 0.06, -0.02], { m: 'satin', seg: 10 }),
    cyl(0.044, 0.044, 0.005, '#3b2416', [0.8, T + 0.108, -0.02], { seg: 14 }),
    // Book stack
    box(0.3, 0.05, 0.22, '#3d405b', [0.72, T + 0.025, -0.4]),
    box(0.28, 0.045, 0.2, '#e07a5f', [0.72, T + 0.073, -0.4], { r: [0, 0.15, 0] }),
    box(0.26, 0.04, 0.21, '#f2cc8f', [0.72, T + 0.115, -0.4], { r: [0, -0.1, 0] }),
    // Notebook + pencil
    box(0.2, 0.012, 0.28, '#81b29a', [-0.5, T + 0.006, 0.15], { r: [0, 0.2, 0] }),
    cyl(0.006, 0.006, 0.18, '#f7d35c', [-0.38, T + 0.016, 0.16], { r: [Math.PI / 2, 0, 0.3], seg: 6 }),
    // Succulent
    cyl(0.07, 0.055, 0.12, '#efe7d6', [1.0, T + 0.06, -0.38], { m: 'satin', seg: 12 }),
  ];
  for (let i = 0; i < 4; i++) {
    parts.push(box(0.58, 0.014, 0.035, '#efe7d6', [0, T + 0.035, 0.06 + i * 0.042]));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(
      sph(0.05, i % 2 ? '#5c8f4f' : '#4f7d44', [1.0 + Math.cos(a) * 0.035, T + 0.15, -0.38 + Math.sin(a) * 0.035], {
        s: [0.5, 1.2, 0.5],
        r: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5],
        seg: 6,
      })
    );
  }
  // Legs
  for (const x of [-1.07, 1.07]) {
    for (const z of [-0.55, 0.35]) parts.push(box(0.08, 0.865, 0.08, WOOD_DARK, [x, 0.4325, z]));
  }
  // Desk lamp (articulated arm, emissive bulb -> bloom, no real light)
  const lz = -0.22;
  parts.push(cyl(0.09, 0.1, 0.03, TEAL, [-1.0, T + 0.015, lz], { m: 'satin', seg: 14 }));
  parts.push(cyl(0.014, 0.014, 0.42, TEAL, [-0.96, T + 0.22, lz], { r: [0, 0, -0.2], m: 'satin', seg: 6 }));
  parts.push(sph(0.025, '#d4a440', [-0.918, T + 0.426, lz], { m: 'metal', seg: 6 }));
  parts.push(cyl(0.014, 0.014, 0.3, TEAL, [-0.775, T + 0.382, lz], { r: [0, 0, -1.871], m: 'satin', seg: 6 }));
  parts.push(cone(0.1, 0.16, TEAL, [-0.62, T + 0.3, lz], { r: [0, 0, 0.35], m: 'satin', seg: 14 }));
  parts.push(sph(0.04, '#ffe0a8', [-0.59, T + 0.225, lz], { m: 'glow', k: 3, seg: 8 }));

  parts.push(...place(chairParts(), [0.05, 0, 0.74], [0, 0.15, 0]));
  return parts;
}

export const Desk: React.FC = () => {
  const built = useMemo(() => {
    const tex = codeScreenTexture();
    const screenGeo = new THREE.PlaneGeometry(0.98, 0.54);
    // Show ~55% of the (square) code texture so it isn't stretched.
    const uv = screenGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 0.55);
    const screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    screenMat.color.setScalar(1.3);
    return { set: mergeParts(deskParts()), tex, screenGeo, screenMat };
  }, []);

  useFrame((_, delta) => {
    // Slowly scroll the code (the texture is owned by this screen only).
    const o = built.tex.offset;
    o.y += delta * 0.02;
    if (o.y > 1) o.y -= 1;
  });

  return (
    <group>
      <Merged set={built.set} castShadow receiveShadow />
      <mesh geometry={built.screenGeo} material={built.screenMat} position={[0, T + 0.5, -0.408]} />
    </group>
  );
};
