import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Merged, Part, box, cone, cyl, mergeParts, place, sph, torus } from './kit';

/** Bed local frame: headboard at -z (against the divider), foot at +z (trigger side). */
const WOOD = '#9b6a43';
const WOOD_DARK = '#7a4e33';
const DUVET = '#6f9a8d';
const SHEET = '#f5efe3';

function bedParts(): Part[] {
  const parts: Part[] = [
    box(1.95, 0.26, 2.5, WOOD, [0, 0.25, 0], { m: 'satin' }),
    // Headboard
    box(1.9, 0.75, 0.07, WOOD, [0, 0.85, -1.27], { m: 'satin' }),
    box(1.6, 0.5, 0.09, '#d9c6a5', [0, 0.88, -1.26]),
    box(2.12, 0.07, 0.14, WOOD_DARK, [0, 1.28, -1.27]),
    // Footboard
    box(1.95, 0.42, 0.07, WOOD, [0, 0.38, 1.27], { m: 'satin' }),
    box(2.1, 0.06, 0.12, WOOD_DARK, [0, 0.6, 1.27]),
    // Mattress, duvet (draped over the sides), turned-down sheet
    box(1.84, 0.22, 2.4, SHEET, [0, 0.49, 0]),
    box(1.92, 0.24, 1.75, DUVET, [0, 0.58, 0.3]),
    box(1.93, 0.12, 0.28, '#e9e1cf', [0, 0.65, -0.66]),
    // Pillows + accent cushion
    sph(1, '#fbf7ee', [-0.45, 0.68, -0.95], { s: [0.38, 0.1, 0.22], seg: 12 }),
    sph(1, '#fbf7ee', [0.45, 0.68, -0.95], { s: [0.38, 0.1, 0.22], seg: 12 }),
    sph(1, '#e0a43a', [0.05, 0.74, -0.78], { s: [0.18, 0.13, 0.06], r: [-0.35, 0, 0], seg: 10 }),
    // Folded blanket at the foot
    box(1.7, 0.08, 0.45, '#d9a441', [0, 0.74, 0.88]),
    box(1.72, 0.082, 0.05, '#b5523b', [0, 0.74, 0.76]),
    box(1.72, 0.082, 0.05, '#b5523b', [0, 0.74, 1.0]),
    // Bedside rug + slippers
    box(0.8, 0.012, 1.3, '#c97b5a', [-1.45, 0.006, -0.1]),
    box(0.64, 0.014, 1.14, '#e9dcc0', [-1.45, 0.007, -0.1]),
    sph(1, '#7d5a96', [-1.35, 0.035, 0.3], { s: [0.06, 0.035, 0.13], seg: 8 }),
    sph(1, '#7d5a96', [-1.5, 0.035, 0.32], { s: [0.06, 0.035, 0.13], r: [0, 0.2, 0], seg: 8 }),
  ];
  for (const sx of [-1, 1]) {
    parts.push(box(0.1, 1.25, 0.1, WOOD_DARK, [sx * 1.0, 0.625, -1.27]));
    parts.push(box(0.1, 0.65, 0.1, WOOD_DARK, [sx * 1.0, 0.325, 1.27]));
    parts.push(box(0.1, 0.14, 0.1, WOOD_DARK, [sx * 0.9, 0.07, 0]));
  }

  // Nightstand (+x side, near the head) with an emissive lamp shade, book and alarm clock
  const ns: Part[] = [
    box(0.5, 0.46, 0.45, WOOD, [0, 0.35, 0], { m: 'satin' }),
    box(0.42, 0.18, 0.02, '#bf8a52', [0, 0.42, 0.235]),
    sph(0.02, '#d4a440', [0, 0.42, 0.25], { m: 'metal', seg: 6 }),
    cyl(0.07, 0.08, 0.04, '#2f5d57', [0, 0.6, -0.1], { m: 'satin', seg: 12 }),
    cyl(0.015, 0.015, 0.22, '#d4a440', [0, 0.73, -0.1], { m: 'metal', seg: 6 }),
    cyl(0.1, 0.14, 0.18, '#ffe2b0', [0, 0.9, -0.1], { m: 'glow', k: 1.6, seg: 14 }),
    box(0.18, 0.04, 0.24, '#3d6f9e', [-0.03, 0.6, 0.1], { r: [0, 0.3, 0] }),
    box(0.1, 0.08, 0.05, '#e07a5f', [0.15, 0.62, 0.11]),
    box(0.07, 0.04, 0.005, '#9ff0c0', [0.15, 0.625, 0.137], { m: 'glow', k: 1.5 }),
  ];
  for (const x of [-0.21, 0.21]) for (const z of [-0.18, 0.18]) ns.push(box(0.05, 0.12, 0.05, WOOD_DARK, [x, 0.06, z]));
  parts.push(...place(ns, [1.35, 0, -0.95]));
  return parts;
}

// ---------------- Sleeping cat ("Byte") ----------------
const FUR = '#e8913a';
const FUR_DARK = '#c8702a';
const CREAM = '#f6e3c8';

function catBodyParts(): Part[] {
  return [
    sph(1, FUR, [0, 0.11, 0], { s: [0.25, 0.12, 0.18], seg: 14 }),
    sph(1, FUR_DARK, [-0.12, 0.115, 0], { s: [0.035, 0.124, 0.183], seg: 12 }),
    sph(1, FUR_DARK, [-0.04, 0.118, 0], { s: [0.035, 0.124, 0.183], seg: 12 }),
    sph(1, FUR_DARK, [0.04, 0.115, 0], { s: [0.03, 0.12, 0.18], seg: 12 }),
    sph(1, CREAM, [0.13, 0.08, 0.05], { s: [0.1, 0.075, 0.12], seg: 10 }),
  ];
}

function catHeadParts(): Part[] {
  return [
    sph(0.1, FUR, [0.2, 0.13, 0.07], { s: [1, 0.85, 1], seg: 12 }),
    sph(1, FUR_DARK, [0.18, 0.2, 0.07], { s: [0.05, 0.02, 0.04], seg: 8 }),
    cone(0.035, 0.07, FUR, [0.18, 0.22, 0.025], { r: [-0.3, 0, 0.2], seg: 4 }),
    cone(0.035, 0.07, FUR, [0.18, 0.22, 0.115], { r: [0.3, 0, 0.2], seg: 4 }),
    cone(0.02, 0.04, '#f2a3a8', [0.19, 0.215, 0.03], { r: [-0.3, 0, 0.2], seg: 4 }),
    cone(0.02, 0.04, '#f2a3a8', [0.19, 0.215, 0.11], { r: [0.3, 0, 0.2], seg: 4 }),
    sph(0.04, CREAM, [0.282, 0.1, 0.07], { s: [0.8, 0.7, 1.2], seg: 8 }),
    sph(0.012, '#e88a9a', [0.31, 0.118, 0.07], { seg: 6 }),
    // closed eyes
    box(0.006, 0.008, 0.032, '#2b1d14', [0.291, 0.15, 0.036], { r: [0.25, 0, 0] }),
    box(0.006, 0.008, 0.032, '#2b1d14', [0.291, 0.15, 0.104], { r: [-0.25, 0, 0] }),
  ];
}

function catStaticParts(): Part[] {
  return [
    torus(0.19, 0.035, FUR, [0, 0.04, 0], { r: [Math.PI / 2, 0, 0.9], arc: 2.6, seg: 14 }),
    sph(0.04, CREAM, [0.08, 0.04, -0.19], { seg: 7 }),
    sph(0.035, CREAM, [0.23, 0.03, 0.17], { s: [1.3, 0.8, 1], seg: 7 }),
    sph(0.035, CREAM, [0.16, 0.03, 0.2], { s: [1.3, 0.8, 1], seg: 7 }),
  ];
}

const SleepingCat: React.FC = () => {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const built = useMemo(
    () => ({
      body: mergeParts(catBodyParts()),
      head: mergeParts(catHeadParts()),
      rest: mergeParts(catStaticParts()),
    }),
    []
  );

  useFrame((state) => {
    const b = Math.sin(state.clock.elapsedTime * 1.7);
    if (bodyRef.current) {
      bodyRef.current.scale.set(1 + b * 0.015, 1 + b * 0.055, 1 + b * 0.015);
    }
    if (headRef.current) headRef.current.position.y = b * 0.005;
  });

  return (
    <group>
      <group ref={bodyRef}>
        <Merged set={built.body} castShadow />
      </group>
      <group ref={headRef}>
        <Merged set={built.head} castShadow />
      </group>
      <Merged set={built.rest} castShadow />
    </group>
  );
};

export const Bed: React.FC = () => {
  const set = useMemo(() => mergeParts(bedParts()), []);
  return (
    <group>
      <Merged set={set} castShadow receiveShadow />
      <group position={[-0.35, 0.7, 0.2]} rotation={[0, 0.6, 0]}>
        <SleepingCat />
      </group>
    </group>
  );
};
