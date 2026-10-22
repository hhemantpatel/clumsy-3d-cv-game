import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Merged, Part, box, cyl, mergeKeepUV, mergeParts, sph, torus } from './kit';
import { certificateTexture } from './textures';

/**
 * Experience corner: credenza with trophies, a wall of framed certificates and a medal shelf.
 * Local frame: wall (inner face) at z = -0.55, front faces +z.
 */
const WALL_Z = -0.55;
const GOLD = '#e0b04a';
const SILVER = '#c9ccd1';
const BRONZE = '#c07a45';
const FRAMES: { x: number; y: number; w: number; h: number }[] = [
  { x: -0.78, y: 1.72, w: 0.56, h: 0.42 },
  { x: 0, y: 1.8, w: 0.74, h: 0.55 },
  { x: 0.78, y: 1.72, w: 0.56, h: 0.42 },
];

function parts(): Part[] {
  const p: Part[] = [
    // Credenza
    box(2.4, 0.62, 0.5, '#8a5a3b', [0, 0.45, -0.29], { m: 'satin' }),
    box(2.46, 0.04, 0.54, '#6b4429', [0, 0.78, -0.29], { m: 'satin' }),
  ];
  for (const x of [-0.78, 0, 0.78]) {
    p.push(box(0.74, 0.5, 0.02, '#a8743f', [x, 0.45, -0.035]));
    p.push(sph(0.022, '#d4a440', [x + (x < 0 ? 0.3 : x > 0 ? -0.3 : 0.3), 0.45, -0.02], { m: 'metal', seg: 6 }));
  }
  for (const x of [-1.1, 1.1]) for (const z of [-0.08, -0.5]) p.push(cyl(0.03, 0.02, 0.14, '#6b4429', [x, 0.07, z], { seg: 8 }));

  // Champion cup
  p.push(box(0.2, 0.08, 0.2, '#3a2a20', [-0.8, 0.84, -0.3]));
  p.push(cyl(0.025, 0.04, 0.12, GOLD, [-0.8, 0.94, -0.3], { m: 'metal', seg: 10 }));
  p.push(cyl(0.12, 0.05, 0.2, GOLD, [-0.8, 1.1, -0.3], { m: 'metal', seg: 16 }));
  p.push(torus(0.06, 0.012, GOLD, [-0.93, 1.12, -0.3], { m: 'metal', seg: 10 }));
  p.push(torus(0.06, 0.012, GOLD, [-0.67, 1.12, -0.3], { m: 'metal', seg: 10 }));
  // Award plaque
  p.push(box(0.25, 0.32, 0.03, '#5e3b24', [0.75, 0.97, -0.42], { r: [-0.15, 0, 0] }));
  p.push(cyl(0.07, 0.07, 0.012, GOLD, [0.75, 1.0, -0.4], { r: [Math.PI / 2 - 0.15, 0, 0], m: 'metal', seg: 16 }));
  // Framed photo + plant
  p.push(box(0.18, 0.22, 0.02, '#2b2f36', [0.22, 0.92, -0.35], { r: [-0.2, 0, 0] }));
  p.push(box(0.14, 0.18, 0.022, '#81b29a', [0.22, 0.92, -0.349], { r: [-0.2, 0, 0] }));
  p.push(cyl(0.08, 0.06, 0.14, '#efe7d6', [1.05, 0.87, -0.3], { m: 'satin', seg: 12 }));
  p.push(sph(0.12, '#5c8f4f', [1.05, 1.02, -0.3], { seg: 8 }));
  p.push(sph(0.08, '#4f7d44', [1.0, 1.12, -0.26], { seg: 7 }));

  // Certificate frames
  for (const f of FRAMES) {
    p.push(box(f.w, f.h, 0.04, '#3a2a20', [f.x, f.y, WALL_Z + 0.02], { m: 'satin' }));
    p.push(box(f.w - 0.06, f.h - 0.06, 0.042, '#f7efdc', [f.x, f.y, WALL_Z + 0.022]));
  }

  // Medal shelf
  p.push(box(1.9, 0.04, 0.2, '#6b4429', [0, 2.4, WALL_Z + 0.1], { m: 'satin' }));
  for (const x of [-0.8, 0.8]) p.push(box(0.04, 0.12, 0.15, '#6b4429', [x, 2.33, WALL_Z + 0.08]));
  const cups: [number, string][] = [
    [-0.55, SILVER],
    [0, GOLD],
    [0.55, BRONZE],
  ];
  for (const [x, c] of cups) {
    p.push(box(0.1, 0.04, 0.1, '#3a2a20', [x, 2.44, WALL_Z + 0.1]));
    p.push(cyl(0.012, 0.02, 0.06, c, [x, 2.49, WALL_Z + 0.1], { m: 'metal', seg: 8 }));
    p.push(cyl(0.06, 0.025, 0.1, c, [x, 2.57, WALL_Z + 0.1], { m: 'metal', seg: 12 }));
  }
  const medals: [number, string, string][] = [
    [-0.4, GOLD, '#c0392b'],
    [-0.25, SILVER, '#3d6f9e'],
    [0.3, BRONZE, '#5c8f4f'],
  ];
  for (const [x, c, ribbon] of medals) {
    p.push(box(0.045, 0.14, 0.005, ribbon, [x, 2.31, WALL_Z + 0.205]));
    p.push(cyl(0.04, 0.04, 0.012, c, [x, 2.22, WALL_Z + 0.205], { r: [Math.PI / 2, 0, 0], m: 'metal', seg: 14 }));
  }
  return p;
}

export const Certificates: React.FC = () => {
  const built = useMemo(() => {
    const papers = FRAMES.map((f) => {
      const g = new THREE.PlaneGeometry(f.w - 0.14, f.h - 0.14);
      g.translate(f.x, f.y, WALL_Z + 0.045);
      return g;
    });
    const paperMat = new THREE.MeshStandardMaterial({ map: certificateTexture(), roughness: 0.85 });
    return { set: mergeParts(parts()), papers: mergeKeepUV(papers), paperMat };
  }, []);

  return (
    <group>
      <Merged set={built.set} castShadow receiveShadow />
      <mesh geometry={built.papers} material={built.paperMat} />
    </group>
  );
};
