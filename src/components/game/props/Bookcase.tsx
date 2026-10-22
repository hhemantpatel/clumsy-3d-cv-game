import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Merged, Part, box, composeMatrix, cyl, mergeParts, rng, sph, torus } from './kit';

/**
 * Open bookcase (side panels, back, shelves) with ~80 instanced books whose colours encode skill
 * categories, a trailing plant, a small trophy and a floating "skill crystal" on top.
 * Local frame: front faces +x, back panel against the wall at x = -0.21, width along z.
 */
const D = 0.42;
const H = 2.5;
const HALF_W = 0.95;
const WOOD = '#9b6a43';
const WOOD_DARK = '#7a4e33';
const GOLD = '#e0b04a';
const SHELF_Y = [0.1, 0.72, 1.32, 1.92];
const SHELF_TOP = SHELF_Y.map((y) => y + 0.035);

// Colour per skill category (languages, frontend, backend, data, devops, design, ...)
const BOOK_COLORS = ['#b5523b', '#3d6f9e', '#e0a43a', '#5c8f4f', '#7d5a96', '#2f7f78', '#c96b3c', '#34405a', '#d9c39a', '#9e3b4f'];

function bodyParts(): Part[] {
  const parts: Part[] = [
    box(D, H, 0.05, WOOD, [0, H / 2, -HALF_W + 0.025], { m: 'satin' }),
    box(D, H, 0.05, WOOD, [0, H / 2, HALF_W - 0.025], { m: 'satin' }),
    box(0.03, H, 2 * HALF_W - 0.1, '#6e4a2f', [-D / 2 + 0.015, H / 2, 0]),
    box(D + 0.04, 0.05, 2 * HALF_W + 0.06, WOOD, [0.02, H + 0.025, 0], { m: 'satin' }),
    box(D + 0.08, 0.04, 2 * HALF_W + 0.12, WOOD_DARK, [0.03, H + 0.07, 0]),
    box(D, 0.1, 2 * HALF_W - 0.1, WOOD_DARK, [0, 0.05, 0]),
  ];
  for (const y of SHELF_Y) parts.push(box(D - 0.03, 0.035, 2 * HALF_W - 0.1, WOOD, [0, y + 0.0175, 0], { m: 'satin' }));

  // Trailing pothos on shelf 2
  const py = SHELF_TOP[1];
  parts.push(cyl(0.1, 0.08, 0.16, '#efe7d6', [0, py + 0.08, 0.66], { m: 'satin', seg: 12 }));
  const r = rng(17);
  for (let i = 0; i < 5; i++) {
    parts.push(sph(0.07, i % 2 ? '#5c8f4f' : '#4f7d44', [(r() - 0.5) * 0.12, py + 0.2 + r() * 0.06, 0.66 + (r() - 0.5) * 0.14], { seg: 7 }));
  }
  for (let i = 0; i < 7; i++) {
    parts.push(
      sph(0.045, i % 2 ? '#5c8f4f' : '#6aa25a', [0.12 + i * 0.012, py + 0.12 - i * 0.075, 0.6 + Math.sin(i * 1.3) * 0.06], {
        s: [0.6, 1, 1.2],
        seg: 6,
      })
    );
  }

  // Small trophy on shelf 3
  const ty = SHELF_TOP[2];
  parts.push(box(0.16, 0.06, 0.16, '#3a2a20', [0, ty + 0.03, -0.66]));
  parts.push(cyl(0.02, 0.035, 0.1, GOLD, [0, ty + 0.11, -0.66], { m: 'metal', seg: 10 }));
  parts.push(cyl(0.09, 0.04, 0.14, GOLD, [0, ty + 0.23, -0.66], { m: 'metal', seg: 14 }));
  parts.push(torus(0.045, 0.01, GOLD, [0, ty + 0.24, -0.75], { r: [0, Math.PI / 2, 0], m: 'metal', seg: 10 }));
  parts.push(torus(0.045, 0.01, GOLD, [0, ty + 0.24, -0.57], { r: [0, Math.PI / 2, 0], m: 'metal', seg: 10 }));

  // Vase + crystal pedestal on top
  parts.push(cyl(0.07, 0.09, 0.22, '#2f7f78', [0, H + 0.2, -0.6], { m: 'satin', seg: 12 }));
  parts.push(cyl(0.012, 0.012, 0.3, '#4f7d44', [0, H + 0.42, -0.6], { seg: 5 }));
  parts.push(sph(0.06, '#f4a259', [0, H + 0.58, -0.6], { seg: 7 }));
  parts.push(cyl(0.08, 0.1, 0.06, '#3a2a20', [0, H + 0.12, 0.1], { seg: 12 }));
  return parts;
}

interface BookSpec {
  M: THREE.Matrix4;
  band: THREE.Matrix4 | null;
  color: THREE.Color;
  bandColor: THREE.Color;
}

function bookSpecs(): BookSpec[] {
  const r = rng(2024);
  const out: BookSpec[] = [];
  const cream = new THREE.Color('#f3e6cc');
  const gold = new THREE.Color('#d4a440');
  const pick = () => new THREE.Color(BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)]);
  // Free z-intervals per shelf (the rest holds the plant / trophy / flat stack)
  const runs: [number, number][][] = [[[-0.88, 0.88]], [[-0.88, 0.45]], [[-0.45, 0.88]], [[-0.88, 0.32]]];
  const frontX = D / 2 - 0.02;

  SHELF_TOP.forEach((yb, level) => {
    for (const [a, b] of runs[level]) {
      let z = a;
      for (;;) {
        const t = 0.035 + r() * 0.045;
        if (z + t > b) break;
        if (r() < 0.06) {
          z += 0.04 + r() * 0.03;
          continue;
        }
        const h = 0.26 + r() * 0.2;
        const d = 0.22 + r() * 0.08;
        const cx = frontX - d / 2;
        const cy = yb + h / 2;
        const cz = z + t / 2;
        out.push({
          M: composeMatrix([cx, cy, cz], undefined, [d, h, t]),
          band: composeMatrix([cx + d / 2 + 0.002, cy + h * 0.25, cz], undefined, [0.004, 0.035, t * 0.8]),
          color: pick(),
          bandColor: r() < 0.5 ? cream : gold,
        });
        z += t + 0.003;
      }
      // Lean one last book into the leftover gap
      if (b - z > 0.09) {
        const t = 0.045;
        const h = 0.32;
        const d = 0.24;
        const lean = 0.3;
        out.push({
          M: composeMatrix(
            [frontX - d / 2, yb + (h / 2) * Math.cos(lean) + (t / 2) * Math.sin(lean), z + t / 2 + (h / 2) * Math.sin(lean)],
            [lean, 0, 0],
            [d, h, t]
          ),
          band: null,
          color: pick(),
          bandColor: cream,
        });
      }
    }
  });

  // Horizontal stack on the top shelf
  const yb = SHELF_TOP[3];
  let y = yb;
  for (let i = 0; i < 4; i++) {
    const th = 0.04 + r() * 0.02;
    const M = composeMatrix([frontX - 0.13, y + th / 2, 0.6], [0, (r() - 0.5) * 0.25, 0], [0.26, th, 0.34 - i * 0.02]);
    out.push({ M, band: null, color: pick(), bandColor: cream });
    y += th;
  }
  return out;
}

export const Bookcase: React.FC = () => {
  const crystalRef = useRef<THREE.Mesh>(null);

  const built = useMemo(() => {
    const specs = bookSpecs();
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const bookMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const books = new THREE.InstancedMesh(unit, bookMat, specs.length);
    const bandSpecs = specs.filter((s) => s.band);
    const bandMat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 });
    const bands = new THREE.InstancedMesh(unit, bandMat, bandSpecs.length);
    specs.forEach((s, i) => {
      books.setMatrixAt(i, s.M);
      books.setColorAt(i, s.color);
    });
    bandSpecs.forEach((s, i) => {
      bands.setMatrixAt(i, s.band!);
      bands.setColorAt(i, s.bandColor);
    });
    for (const m of [books, bands]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      m.receiveShadow = true;
    }
    books.castShadow = true;

    const crystalGeo = new THREE.OctahedronGeometry(0.14);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#c39bff',
      emissive: '#9b5de5',
      emissiveIntensity: 2.2,
      roughness: 0.2,
      toneMapped: false,
    });
    return { body: mergeParts(bodyParts()), books, bands, crystalGeo, crystalMat };
  }, []);

  useFrame((state) => {
    const c = crystalRef.current;
    if (!c) return;
    const t = state.clock.elapsedTime;
    c.rotation.y = t * 0.9;
    c.position.y = H + 0.42 + Math.sin(t * 1.6) * 0.05;
  });

  return (
    <group>
      <Merged set={built.body} castShadow receiveShadow />
      <primitive object={built.books} />
      <primitive object={built.bands} />
      <mesh ref={crystalRef} geometry={built.crystalGeo} material={built.crystalMat} position={[0, H + 0.42, 0.1]} />
    </group>
  );
};
