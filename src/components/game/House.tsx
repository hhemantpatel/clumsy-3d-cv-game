import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../../context/GameContext';
import {
  FLOOR_Y,
  Merged,
  Part,
  V3,
  box,
  composeMatrix,
  cone,
  cyl,
  mergeParts,
  mergeWorldUV,
  part,
  place,
  rng,
  sph,
  tBox,
  torus,
} from './props/kit';
import { floorTexture, sidingTexture, stoneTexture } from './props/textures';

/**
 * Cozy low-poly timber cottage.
 *
 * Footprint (must match the Rust colliders): walls X -6.5..6.5, Z -10.5..-1.5, front doorway x -1..1,
 * bedroom divider x 2.2..6.2 @ z -6.
 *
 * Line-of-sight handling (deliberate feature): while the player is inside, the roof (and porch roof,
 * chimney, gables) lifts away and hides, and only the wall(s) lying between the camera and the
 * interior collapse to a short "cutaway" stub (scale.y), Sims-style. Because nothing is faded via
 * material opacity, materials stay shared/untouched and there are no transparency-sorting artefacts.
 */

// ---------------------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------------------
const WALL_T = 0.3;
const HALF_T = WALL_T / 2;
const WALL_TOP = 3.7;
const STONE_TOP = 0.95;
const X_OUT = 6.65; // outer face of the side walls (and half-width of front/back walls)
const STUB = 0.12; // cutaway wall height factor (≈0.45 m)

const PITCH = 0.5;
const TAN = Math.tan(PITCH);
const COS = Math.cos(PITCH);
const SIN = Math.sin(PITCH);
const EAVE_X = 7.25;
const SLAB_T = 0.18;
const SLAB_LEN = EAVE_X / COS;
const RIDGE_Y = WALL_TOP + X_OUT * TAN; // underside of the roof at the ridge
const ROOF_DEPTH = 10.2; // z -11.1 .. -0.9
const ROOF_ZC = -6.0;
// Slab centre (right side; left is mirrored)
const SLAB_CX = EAVE_X / 2 + SIN * (SLAB_T / 2);
const SLAB_CY = WALL_TOP + (X_OUT - EAVE_X / 2) * TAN + COS * (SLAB_T / 2);
const EAVE_Y = WALL_TOP - (EAVE_X - X_OUT) * TAN;

const CHIMNEY: V3 = [-4.0, 0, -7.6];

// Palette
const C = {
  trim: '#f3e6cc',
  plaster: '#efe2c8',
  stoneCap: '#d6c8ae',
  shutter: '#3f6f6a',
  shutterSlat: '#355e5a',
  door: '#3b6a5e',
  doorPanel: '#4a7d6f',
  brass: '#d4a440',
  iron: '#2e3136',
  walnut: '#5e3b24',
  oak: '#a8743f',
  oakLight: '#bf8a52',
  beam: '#6b4226',
  roofUnder: '#5e2c21',
  ridge: '#7a2f22',
  brick: '#a04a35',
  brickDark: '#7f3a2a',
  terracotta: '#b5654a',
  leaf: '#4f8a3c',
  leafDark: '#3c6e2e',
  glass: '#cfeaf5',
  gutter: '#8c8f94',
};

// ---------------------------------------------------------------------------------------
// Walls: each wall is built in a canonical local frame (u along the wall, +z = outward normal,
// y up) and then placed by a matrix. u ranges / openings are in that local frame.
// ---------------------------------------------------------------------------------------
interface Opening {
  c: number;
  w: number;
  b: number;
  t: number;
  door?: boolean;
  shutters?: boolean;
  flowers?: boolean;
}
interface Picture {
  u: number;
  y: number;
  w: number;
  h: number;
  seed: number;
}
interface WallDef {
  origin: V3;
  rotY: number;
  u0: number;
  u1: number;
  openings: Opening[];
  pictures: Picture[];
  corners: boolean;
}

const WALLS: WallDef[] = [
  // 0: front (u = x)
  {
    origin: [0, 0, -1.5],
    rotY: 0,
    u0: -X_OUT - 0.06,
    u1: X_OUT + 0.06,
    openings: [
      { c: -3.8, w: 1.8, b: 1.25, t: 2.6, shutters: true, flowers: true },
      { c: 0, w: 2.0, b: 0, t: 2.65, door: true },
      { c: 3.8, w: 1.8, b: 1.25, t: 2.6, shutters: true, flowers: true },
    ],
    pictures: [
      { u: -2.0, y: 2.1, w: 0.5, h: 0.62, seed: 1 },
      { u: 2.0, y: 2.1, w: 0.5, h: 0.62, seed: 2 },
    ],
    corners: true,
  },
  // 1: back (u = -x)
  {
    origin: [0, 0, -10.5],
    rotY: Math.PI,
    u0: -X_OUT - 0.06,
    u1: X_OUT + 0.06,
    openings: [{ c: 0.6, w: 1.6, b: 1.3, t: 2.6, shutters: true }],
    pictures: [
      { u: 5.25, y: 2.55, w: 0.62, h: 0.48, seed: 3 },
      { u: 4.25, y: 2.65, w: 0.5, h: 0.66, seed: 4 },
      { u: 3.25, y: 2.55, w: 0.62, h: 0.48, seed: 5 },
    ],
    corners: true,
  },
  // 2: left (u = z)
  {
    origin: [-6.5, 0, 0],
    rotY: -Math.PI / 2,
    u0: -10.35,
    u1: -1.65,
    openings: [{ c: -8.0, w: 1.6, b: 1.3, t: 2.6, shutters: true, flowers: true }],
    pictures: [{ u: -2.55, y: 2.05, w: 0.55, h: 0.7, seed: 6 }],
    corners: false,
  },
  // 3: right (u = -z)
  {
    origin: [6.5, 0, 0],
    rotY: Math.PI / 2,
    u0: 1.65,
    u1: 10.35,
    openings: [
      { c: 3.6, w: 1.5, b: 1.3, t: 2.6, shutters: true, flowers: true },
      { c: 8.3, w: 1.5, b: 1.3, t: 2.6, shutters: true },
    ],
    pictures: [{ u: 5.15, y: 2.2, w: 0.5, h: 0.5, seed: 7 }],
    corners: false,
  },
];

interface Rect {
  u0: number;
  u1: number;
  y0: number;
  y1: number;
}

/** Split a wall into solid rectangles around its openings. */
function wallRects(def: WallDef, y0: number, y1: number): Rect[] {
  const rects: Rect[] = [];
  const ops = [...def.openings].sort((a, b) => a.c - b.c);
  let cursor = def.u0;
  for (const o of ops) {
    const l = o.c - o.w / 2;
    const r = o.c + o.w / 2;
    if (l > cursor) rects.push({ u0: cursor, u1: l, y0, y1 });
    if (o.b > y0) rects.push({ u0: l, u1: r, y0, y1: Math.min(o.b, y1) });
    if (o.t < y1) rects.push({ u0: l, u1: r, y0: Math.max(o.t, y0), y1 });
    cursor = r;
  }
  if (def.u1 > cursor) rects.push({ u0: cursor, u1: def.u1, y0, y1 });
  return rects.filter((r) => r.u1 - r.u0 > 0.001 && r.y1 - r.y0 > 0.001);
}

function rectBoxGeo(r: Rect, depth: number, n: number, M: THREE.Matrix4) {
  const g = new THREE.BoxGeometry(r.u1 - r.u0, r.y1 - r.y0, depth);
  g.translate((r.u0 + r.u1) / 2, (r.y0 + r.y1) / 2, n);
  g.applyMatrix4(M);
  return g;
}

const ART_COLORS = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#5fa8d3', '#c06c84', '#f4a259', '#6c5b7b'];

/** Interior framed "project" art: frame, mat and a few colour blocks + a disc. Faces -z (inside). */
function pictureParts(p: Picture): Part[] {
  const r = rng(p.seed * 97);
  const pick = () => ART_COLORS[Math.floor(r() * ART_COLORS.length)];
  const n = -HALF_T;
  const iw = p.w - 0.14;
  const ih = p.h - 0.14;
  const parts: Part[] = [
    box(p.w, p.h, 0.04, C.walnut, [p.u, p.y, n - 0.02]),
    box(p.w - 0.06, p.h - 0.06, 0.044, '#f7efdc', [p.u, p.y, n - 0.022]),
    box(iw, ih, 0.046, pick(), [p.u, p.y, n - 0.024]),
    box(iw, ih * 0.22, 0.05, pick(), [p.u, p.y - ih * 0.39, n - 0.026]),
    box(iw * 0.35, ih * 0.3, 0.05, pick(), [p.u - iw * 0.25, p.y + ih * 0.05, n - 0.026]),
    cyl(ih * 0.16, ih * 0.16, 0.012, pick(), [p.u + iw * 0.22, p.y + ih * 0.2, n - 0.05], { r: [Math.PI / 2, 0, 0], seg: 16 }),
  ];
  return parts;
}

function windowParts(o: Opening): Part[] {
  const parts: Part[] = [];
  const ft = 0.07;
  const mid = (o.b + o.t) / 2;
  const h = o.t - o.b;
  // Frame (4 bars) + mullions
  parts.push(box(o.w, ft, 0.12, C.trim, [o.c, o.t - ft / 2, 0.08]));
  parts.push(box(o.w, ft, 0.12, C.trim, [o.c, o.b + ft / 2, 0.08]));
  parts.push(box(ft, h, 0.12, C.trim, [o.c - o.w / 2 + ft / 2, mid, 0.08]));
  parts.push(box(ft, h, 0.12, C.trim, [o.c + o.w / 2 - ft / 2, mid, 0.08]));
  parts.push(box(0.045, h, 0.06, C.trim, [o.c, mid, 0.08]));
  parts.push(box(o.w, 0.045, 0.06, C.trim, [o.c, mid, 0.08]));
  // Glass pane (cheap transparent standard material)
  parts.push(box(o.w - 0.04, h - 0.04, 0.012, C.glass, [o.c, mid, 0.06], { m: 'glass' }));
  // Exterior sill + head trim, interior stool
  parts.push(box(o.w + 0.26, 0.06, 0.2, C.trim, [o.c, o.b - 0.03, HALF_T + 0.08]));
  parts.push(box(o.w + 0.26, 0.1, 0.05, C.trim, [o.c, o.t + 0.05, HALF_T + 0.025]));
  parts.push(box(o.w + 0.1, 0.04, 0.12, C.trim, [o.c, o.b, -HALF_T - 0.04]));

  if (o.shutters) {
    const sw = o.w * 0.42;
    for (const side of [-1, 1]) {
      const su = o.c + side * (o.w / 2 + 0.07 + sw / 2);
      parts.push(box(sw, h, 0.04, C.shutter, [su, mid, HALF_T + 0.045]));
      for (let i = 0; i < 6; i++) {
        const sy = o.b + 0.14 + (i * (h - 0.28)) / 5;
        parts.push(box(sw - 0.09, 0.03, 0.02, C.shutterSlat, [su, sy, HALF_T + 0.072], { r: [-0.5, 0, 0] }));
      }
    }
  }

  if (o.flowers) {
    const fy = o.b - 0.2;
    const fn = HALF_T + 0.17;
    parts.push(box(o.w + 0.12, 0.24, 0.24, C.walnut, [o.c, fy, fn]));
    parts.push(box(o.w + 0.16, 0.04, 0.27, C.oak, [o.c, fy + 0.12, fn]));
    const r = rng(Math.round(o.c * 100) + 5);
    const blooms = ['#e85d75', '#f4a259', '#f7d35c', '#b07bd8', '#ffffff', '#ef6f4c'];
    const count = Math.round(o.w / 0.2);
    for (let i = 0; i < count; i++) {
      const u = o.c - o.w / 2 + 0.1 + (i * (o.w - 0.2)) / Math.max(1, count - 1);
      parts.push(sph(0.1 + r() * 0.03, i % 2 ? C.leaf : C.leafDark, [u, fy + 0.15, fn + (r() - 0.5) * 0.08], { seg: 7 }));
      parts.push(
        sph(0.05 + r() * 0.02, blooms[Math.floor(r() * blooms.length)], [u + (r() - 0.5) * 0.08, fy + 0.25 + r() * 0.05, fn + (r() - 0.3) * 0.1], { seg: 6 })
      );
      if (i % 3 === 1) {
        parts.push(sph(0.05, C.leaf, [u, fy - 0.12, fn + 0.13], { seg: 6, s: [1, 1.6, 1] }));
      }
    }
  }
  return parts;
}

/** One door leaf in local space, hinge at origin, extending along dir (+1 / -1) on x. */
function doorLeaf(dir: number): Part[] {
  const w = 0.96;
  const cx = (dir * w) / 2;
  const h = 2.52;
  const y0 = 0.14;
  return [
    box(w, h, 0.06, C.door, [cx, y0 + h / 2, 0]),
    box(w - 0.24, 0.85, 0.08, C.doorPanel, [cx, y0 + 0.62, 0]),
    box(w - 0.24, 0.9, 0.08, C.doorPanel, [cx, y0 + 1.75, 0]),
    box(w - 0.1, 0.06, 0.075, C.door, [cx, y0 + 1.18, 0]),
    sph(0.04, C.brass, [dir * (w - 0.1), y0 + 1.08, 0.06], { m: 'metal', seg: 8 }),
    sph(0.04, C.brass, [dir * (w - 0.1), y0 + 1.08, -0.06], { m: 'metal', seg: 8 }),
    box(0.06, 0.18, 0.08, C.brass, [dir * (w - 0.1), y0 + 1.08, 0], { m: 'metal' }),
  ];
}

function lanternParts(u: number): Part[] {
  const n = HALF_T + 0.18;
  const y = 2.3;
  const parts: Part[] = [
    box(0.08, 0.08, 0.2, C.iron, [u, y + 0.2, HALF_T + 0.08], { m: 'metal' }),
    box(0.2, 0.03, 0.2, C.iron, [u, y - 0.13, n], { m: 'metal' }),
    box(0.2, 0.03, 0.2, C.iron, [u, y + 0.13, n], { m: 'metal' }),
    cone(0.16, 0.14, C.iron, [u, y + 0.21, n], { m: 'metal', seg: 4, r: [0, Math.PI / 4, 0] }),
    box(0.13, 0.22, 0.13, '#ffcf7a', [u, y, n], { m: 'glow', k: 3.2 }),
  ];
  for (const dx of [-0.085, 0.085]) {
    for (const dz of [-0.085, 0.085]) {
      parts.push(box(0.02, 0.26, 0.02, C.iron, [u + dx, y, n + dz], { m: 'metal' }));
    }
  }
  return parts;
}

interface WallBuild {
  core: ReturnType<typeof mergeParts>;
  decor: ReturnType<typeof mergeParts>;
  siding: THREE.BufferGeometry;
  stone: THREE.BufferGeometry;
}

function buildWall(def: WallDef): WallBuild {
  const M = composeMatrix(def.origin, [0, def.rotY, 0]);

  // Core (plaster, full thickness) + stone ledge
  const coreParts: Part[] = [];
  for (const r of wallRects(def, 0.1, WALL_TOP)) {
    coreParts.push(box(r.u1 - r.u0, r.y1 - r.y0, WALL_T, C.plaster, [(r.u0 + r.u1) / 2, (r.y0 + r.y1) / 2, 0]));
  }
  for (const r of wallRects(def, STONE_TOP - 0.03, STONE_TOP + 0.03)) {
    coreParts.push(box(r.u1 - r.u0, 0.06, 0.12, C.stoneCap, [(r.u0 + r.u1) / 2, STONE_TOP, HALF_T + 0.06]));
  }
  // Top plate / frieze board
  coreParts.push(box(def.u1 - def.u0, 0.16, 0.06, C.trim, [(def.u0 + def.u1) / 2, WALL_TOP - 0.08, HALF_T + 0.03]));
  place(coreParts, def.origin, [0, def.rotY, 0]);

  // Exterior skins (world-space UVs, one texture instance each)
  const sidingGeos = wallRects(def, STONE_TOP, WALL_TOP).map((r) => rectBoxGeo(r, 0.025, HALF_T + 0.0125, M));
  const stoneGeos = wallRects(def, 0, STONE_TOP).map((r) => rectBoxGeo(r, 0.06, HALF_T + 0.03, M));

  // Decor (hidden while the wall is cut away)
  const decorParts: Part[] = [];
  for (const o of def.openings) {
    if (o.door) {
      decorParts.push(box(0.12, 2.75, WALL_T + 0.08, C.trim, [o.c - o.w / 2 - 0.04, 1.375, 0]));
      decorParts.push(box(0.12, 2.75, WALL_T + 0.08, C.trim, [o.c + o.w / 2 + 0.04, 1.375, 0]));
      decorParts.push(box(o.w + 0.36, 0.18, WALL_T + 0.08, C.trim, [o.c, o.t + 0.08, 0]));
      decorParts.push(box(0.24, 0.3, 0.06, C.trim, [o.c, o.t + 0.1, HALF_T + 0.06]));
      decorParts.push(box(o.w, 0.04, WALL_T + 0.06, '#8a7a66', [o.c, 0.15, 0]));
      // Double doors swung open into the hall
      decorParts.push(...place(doorLeaf(1), [o.c - o.w / 2 + 0.02, 0, -0.12], [0, 1.745, 0]));
      decorParts.push(...place(doorLeaf(-1), [o.c + o.w / 2 - 0.02, 0, -0.12], [0, -1.745, 0]));
      // Wall lanterns either side of the door
      decorParts.push(...lanternParts(o.c - o.w / 2 - 0.45));
      decorParts.push(...lanternParts(o.c + o.w / 2 + 0.45));
      // House number plaque
      decorParts.push(box(0.34, 0.2, 0.03, C.trim, [o.c + o.w / 2 + 0.45, 1.7, HALF_T + 0.04]));
      decorParts.push(box(0.05, 0.12, 0.034, C.walnut, [o.c + o.w / 2 + 0.38, 1.7, HALF_T + 0.042]));
      decorParts.push(box(0.05, 0.12, 0.034, C.walnut, [o.c + o.w / 2 + 0.5, 1.7, HALF_T + 0.042]));
    } else {
      decorParts.push(...windowParts(o));
    }
  }
  for (const p of def.pictures) decorParts.push(...pictureParts(p));
  if (def.corners) {
    for (const s of [-1, 1]) {
      decorParts.push(box(0.22, WALL_TOP + 0.02, 0.34, C.trim, [s * (X_OUT + 0.03), WALL_TOP / 2, 0.02]));
    }
  }
  place(decorParts, def.origin, [0, def.rotY, 0]);

  return {
    core: mergeParts(coreParts),
    decor: mergeParts(decorParts),
    siding: mergeWorldUV(sidingGeos, 1.6),
    stone: mergeWorldUV(stoneGeos, 1.2),
  };
}

// ---------------------------------------------------------------------------------------
// Static interior + exterior details (never cut away)
// ---------------------------------------------------------------------------------------
function staticParts(): Part[] {
  const parts: Part[] = [];
  const F = FLOOR_Y;

  // Skirting boards along the inner wall faces
  parts.push(box(12.7, 0.12, 0.03, C.walnut, [0, F + 0.06, -10.33]));
  parts.push(box(5.25, 0.12, 0.03, C.walnut, [-3.725, F + 0.06, -1.67]));
  parts.push(box(5.25, 0.12, 0.03, C.walnut, [3.725, F + 0.06, -1.67]));
  parts.push(box(0.03, 0.12, 8.7, C.walnut, [-6.33, F + 0.06, -6]));
  parts.push(box(0.03, 0.12, 8.7, C.walnut, [6.33, F + 0.06, -6]));

  // Round woven rug in the studio
  parts.push(cyl(1.7, 1.7, 0.012, '#b5523b', [-2.4, F + 0.006, -5.6], { seg: 40 }));
  parts.push(cyl(1.45, 1.45, 0.014, '#e8c37a', [-2.4, F + 0.007, -5.6], { seg: 40 }));
  parts.push(cyl(1.2, 1.2, 0.016, '#b5523b', [-2.4, F + 0.008, -5.6], { seg: 40 }));
  parts.push(cyl(0.55, 0.55, 0.018, '#2f5d57', [-2.4, F + 0.009, -5.6], { seg: 32 }));
  // Runner rug at the entrance
  parts.push(box(1.3, 0.012, 2.0, '#6f9a8d', [0, F + 0.006, -2.9]));
  parts.push(box(1.1, 0.014, 1.8, '#e9dcc0', [0, F + 0.007, -2.9]));
  parts.push(box(0.9, 0.016, 1.6, '#6f9a8d', [0, F + 0.008, -2.9]));

  // Slatted oak bedroom divider (matches collider x 2.2..6.2 @ z -6)
  parts.push(box(4.15, 0.1, 0.14, C.walnut, [4.275, F + 0.05, -6]));
  parts.push(box(4.15, 0.12, 0.18, C.walnut, [4.275, 2.62, -6]));
  parts.push(box(0.14, 2.5, 0.18, C.walnut, [2.27, F + 1.24, -6]));
  for (let i = 0; i < 14; i++) {
    const x = 2.5 + i * 0.27;
    parts.push(box(0.1, 2.36, 0.06, i % 2 ? C.oak : C.oakLight, [x, F + 1.24, -6 + (i % 2 ? 0.035 : -0.035)]));
  }

  // Tall potted fiddle-leaf plant in the front-left corner
  parts.push(cyl(0.22, 0.17, 0.42, C.terracotta, [-5.95, F + 0.21, -2.1], { seg: 12 }));
  parts.push(cyl(0.025, 0.025, 1.1, C.walnut, [-5.95, F + 0.9, -2.1], { seg: 6 }));
  const pr = rng(91);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const y = F + 0.75 + i * 0.12;
    parts.push(
      sph(0.16, i % 2 ? C.leaf : C.leafDark, [-5.95 + Math.cos(a) * 0.18, y, -2.1 + Math.sin(a) * 0.18], {
        s: [1, 0.55, 0.75],
        r: [pr() * 0.6, a, 0.4],
        seg: 7,
      })
    );
  }

  // ---------- Exterior: porch ----------
  parts.push(box(3.8, 0.12, 1.75, '#7a5233', [0, 0.06, -0.5]));
  for (let i = 0; i < 8; i++) {
    const z = -1.3 + i * 0.205;
    parts.push(box(3.7, 0.06, 0.19, i % 2 ? C.oak : C.oakLight, [0, 0.15, z]));
  }
  parts.push(box(2.4, 0.09, 0.4, '#8a6440', [0, 0.045, 0.55]));
  // Doormat
  parts.push(box(1.3, 0.02, 0.6, '#7b4a2a', [0, 0.19, -0.8]));
  parts.push(box(1.1, 0.024, 0.44, '#c08a4a', [0, 0.19, -0.8]));
  // Posts with stone plinths, braces
  for (const s of [-1, 1]) {
    const x = s * 1.6;
    parts.push(box(0.36, 0.45, 0.36, '#9a9184', [x, 0.4, 0.15]));
    parts.push(box(0.4, 0.05, 0.4, C.stoneCap, [x, 0.64, 0.15]));
    parts.push(box(0.2, 2.42, 0.2, C.trim, [x, 1.87, 0.15]));
    parts.push(box(0.07, 0.6, 0.07, C.trim, [x - s * 0.2, 2.72, 0.15], { r: [0, 0, s * -0.75] }));
    // Planters by the door
    const px = s * 1.3;
    parts.push(box(0.42, 0.42, 0.42, C.terracotta, [px, 0.39, -1.0]));
    parts.push(box(0.46, 0.05, 0.46, '#c97a5c', [px, 0.6, -1.0]));
    parts.push(sph(0.26, C.leafDark, [px, 0.8, -1.0], { seg: 8 }));
    parts.push(sph(0.18, C.leaf, [px + 0.08, 0.98, -0.95], { seg: 8 }));
    parts.push(sph(0.06, '#e85d75', [px - 0.12, 0.96, -0.85], { seg: 6 }));
    parts.push(sph(0.06, '#f7d35c', [px + 0.15, 0.9, -0.82], { seg: 6 }));
    parts.push(sph(0.06, '#ffffff', [px, 1.1, -0.9], { seg: 6 }));
  }
  parts.push(box(3.9, 0.22, 0.26, C.trim, [0, 3.0, 0.15]));

  return parts;
}

// ---------------------------------------------------------------------------------------
// Roof (main gable + porch gable + chimney + gutters)
// ---------------------------------------------------------------------------------------
function slabMatrix(side: number) {
  return composeMatrix([side * SLAB_CX, SLAB_CY, ROOF_ZC], [0, 0, -side * PITCH]);
}

function roofParts(): Part[] {
  const parts: Part[] = [];
  for (const s of [-1, 1]) {
    const local: Part[] = [
      box(SLAB_LEN, SLAB_T, ROOF_DEPTH, C.roofUnder, [0, 0, 0]),
      // Bargeboards on the gable ends
      box(SLAB_LEN, SLAB_T + 0.12, 0.07, C.trim, [0, -0.03, ROOF_DEPTH / 2 + 0.035]),
      box(SLAB_LEN, SLAB_T + 0.12, 0.07, C.trim, [0, -0.03, -ROOF_DEPTH / 2 - 0.035]),
      // Eave fascia
      box(0.07, SLAB_T + 0.1, ROOF_DEPTH, C.trim, [s * (SLAB_LEN / 2 + 0.035), -0.03, 0]),
    ];
    parts.push(...place(local, [s * SLAB_CX, SLAB_CY, ROOF_ZC], [0, 0, -s * PITCH]));
    // Gutter + downspouts
    parts.push(box(0.14, 0.1, ROOF_DEPTH, C.gutter, [s * (EAVE_X + 0.13), EAVE_Y - 0.1, ROOF_ZC], { m: 'metal' }));
    for (const z of [-1.05, -10.95]) {
      parts.push(cyl(0.045, 0.045, EAVE_Y - 0.2, C.gutter, [s * (EAVE_X + 0.13), (EAVE_Y - 0.2) / 2 + 0.05, z], { m: 'metal', seg: 8 }));
      parts.push(box(0.12, 0.06, 0.24, C.gutter, [s * (EAVE_X + 0.13), 0.06, z + (z > -5 ? 0.08 : -0.08)], { m: 'metal' }));
    }
  }
  // Ridge cap (diamond profile)
  parts.push(box(0.3, 0.3, ROOF_DEPTH + 0.14, C.ridge, [0, RIDGE_Y + SLAB_T / COS - 0.04, ROOF_ZC], { r: [0, 0, Math.PI / 4] }));

  // Front gable details: round attic vent
  parts.push(torus(0.34, 0.055, C.trim, [0, 5.5, -1.33], { seg: 20 }));
  parts.push(cyl(0.32, 0.32, 0.02, '#3a2a20', [0, 5.5, -1.345], { r: [Math.PI / 2, 0, 0], seg: 20 }));
  for (let i = -2; i <= 2; i++) {
    const hw = Math.sqrt(Math.max(0, 0.3 * 0.3 - (i * 0.11) ** 2));
    parts.push(box(hw * 2, 0.04, 0.03, C.trim, [0, 5.5 + i * 0.11, -1.32], { r: [-0.4, 0, 0] }));
  }

  // Chimney sitting on the left slope
  const [cx, , cz] = CHIMNEY;
  parts.push(box(0.9, 3.0, 0.9, C.brick, [cx, 6.4, cz]));
  for (const y of [5.9, 6.6, 7.3]) parts.push(box(0.94, 0.06, 0.94, C.brickDark, [cx, y, cz]));
  parts.push(box(1.1, 0.14, 1.1, '#6f6a64', [cx, 7.97, cz]));
  parts.push(cyl(0.13, 0.16, 0.36, C.terracotta, [cx, 8.21, cz], { seg: 10 }));

  // Porch gable roof
  const HS = 2.2;
  const PP = 0.55;
  const tp = Math.tan(PP);
  const PY = 3.11;
  const PLEN = HS / Math.cos(PP) + 0.05;
  const PT = 0.14;
  const pzc = -0.42;
  const pdepth = 1.95;
  for (const s of [-1, 1]) {
    const pcx = s * (HS / 2 + Math.sin(PP) * PT * 0.5);
    const pcy = PY + (HS / 2) * tp + Math.cos(PP) * PT * 0.5;
    const local: Part[] = [box(PLEN, PT, pdepth, C.roofUnder, [0, 0, 0])];
    for (let i = 0; i < 6; i++) {
      local.push(box(0.44, 0.05, pdepth + 0.06, i % 2 ? '#a8432f' : '#9c3b2b', [s * (PLEN / 2 - 0.2 - i * 0.4), PT / 2 + 0.03, 0], { r: [0, 0, s * 0.09] }));
    }
    local.push(box(PLEN, PT + 0.1, 0.06, C.trim, [0, -0.03, pdepth / 2 + 0.03]));
    parts.push(...place(local, [pcx, pcy, pzc], [0, 0, -s * PP]));
  }
  parts.push(box(0.24, 0.24, pdepth + 0.08, C.ridge, [0, PY + HS * tp + PT / Math.cos(PP) - 0.02, pzc], { r: [0, 0, Math.PI / 4] }));
  const porchTri = new THREE.Shape();
  porchTri.moveTo(-HS, PY);
  porchTri.lineTo(HS, PY);
  porchTri.lineTo(0, PY + HS * tp);
  porchTri.closePath();
  parts.push(part(new THREE.ExtrudeGeometry(porchTri, { depth: 0.08, bevelEnabled: false }), C.trim, [0, 0, 0.4]));
  parts.push(box(2 * HS, 0.04, pdepth - 0.1, C.oakLight, [0, PY + 0.02, pzc]));

  return parts;
}

function gableGeos(): THREE.BufferGeometry {
  const tri = new THREE.Shape();
  tri.moveTo(-X_OUT, WALL_TOP);
  tri.lineTo(X_OUT, WALL_TOP);
  tri.lineTo(0, RIDGE_Y);
  tri.closePath();
  const front = new THREE.ExtrudeGeometry(tri, { depth: WALL_T, bevelEnabled: false });
  front.translate(0, 0, -1.5 - HALF_T);
  const back = new THREE.ExtrudeGeometry(tri, { depth: WALL_T, bevelEnabled: false });
  back.translate(0, 0, -10.5 - HALF_T);
  return mergeWorldUV([front, back], 1.6);
}

function buildShingles(): THREE.InstancedMesh {
  const rows = Math.floor((SLAB_LEN - 0.42) / 0.34) + 1;
  const geo = new THREE.BoxGeometry(0.44, 0.05, ROOF_DEPTH + 0.08);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, rows * 2);
  const palette = ['#a8432f', '#9c3b2b', '#b5503a', '#8f3626', '#a3402c'].map((c) => new THREE.Color(c));
  const r = rng(5);
  let idx = 0;
  const M = new THREE.Matrix4();
  for (const s of [-1, 1]) {
    const S = slabMatrix(s);
    for (let i = 0; i < rows; i++) {
      const local = composeMatrix([s * (SLAB_LEN / 2 - 0.2 - i * 0.34), SLAB_T / 2 + 0.03, 0], [0, 0, s * 0.09]);
      M.multiplyMatrices(S, local);
      mesh.setMatrixAt(idx, M);
      mesh.setColorAt(idx, palette[Math.floor(r() * palette.length)]);
      idx++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.computeBoundingSphere();
  return mesh;
}

// ---------------------------------------------------------------------------------------
// Ceiling beams (each hides individually when it would block the camera's view of the player)
// ---------------------------------------------------------------------------------------
const BEAM_Y = 3.58;
const BEAMS: { z: number; pendantX?: number; shade?: string }[] = [
  { z: -3.2, pendantX: 4.2, shade: '#d9a441' },
  { z: -6.0, pendantX: -3.0, shade: '#2f5d57' },
  { z: -8.8 },
];

function beamParts(b: (typeof BEAMS)[number]): Part[] {
  const parts: Part[] = [
    box(12.7, 0.22, 0.24, C.beam, [0, BEAM_Y, b.z]),
    box(0.22, 0.34, 0.26, C.beam, [-6.24, BEAM_Y - 0.2, b.z]),
    box(0.22, 0.34, 0.26, C.beam, [6.24, BEAM_Y - 0.2, b.z]),
  ];
  if (b.pendantX !== undefined) {
    const x = b.pendantX;
    parts.push(cyl(0.012, 0.012, 0.5, C.iron, [x, BEAM_Y - 0.36, b.z], { seg: 5 }));
    parts.push(cone(0.3, 0.26, b.shade!, [x, BEAM_Y - 0.72, b.z], { seg: 16, m: 'satin' }));
    parts.push(cyl(0.05, 0.05, 0.05, C.brass, [x, BEAM_Y - 0.6, b.z], { m: 'metal', seg: 8 }));
    parts.push(sph(0.1, '#ffd89a', [x, BEAM_Y - 0.86, b.z], { m: 'glow', k: 2.6, seg: 10 }));
  }
  return parts;
}

// Scratch objects for useFrame (no per-frame allocations)
const _dir = new THREE.Vector3();

export const House: React.FC = () => {
  const { isInsideHouse } = useGame();
  const insideRef = useRef(isInsideHouse);
  insideRef.current = isInsideHouse;

  const wallGroups = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const decorGroups = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const beamGroups = useRef<(THREE.Group | null)[]>([null, null, null]);
  const roofRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Group>(null);
  const cutState = useRef<number[]>([1, 1, 1, 1]);
  const roofState = useRef(1);

  const built = useMemo(() => {
    const sidingMat = new THREE.MeshStandardMaterial({ map: sidingTexture(), roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.95 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.55, metalness: 0.02 });
    const smokeMat = new THREE.MeshBasicMaterial({ color: '#eef2f6', transparent: true, opacity: 0.38, depthWrite: false });
    const smokeGeo = new THREE.SphereGeometry(0.3, 8, 6);
    const walls = WALLS.map((w) => buildWall(w));
    const floor = mergeWorldUV([tBox(12.7, 0.04, 8.7, [0, FLOOR_Y - 0.02, -6])], 2.4);
    const foundation = mergeWorldUV([tBox(13.6, 0.14, 9.6, [0, 0.07, -6])], 1.2);
    return {
      sidingMat,
      stoneMat,
      floorMat,
      smokeMat,
      smokeGeo,
      walls,
      floor,
      foundation,
      statics: mergeParts(staticParts()),
      roof: mergeParts(roofParts()),
      gables: gableGeos(),
      shingles: buildShingles(),
      beams: BEAMS.map((b) => mergeParts(beamParts(b))),
    };
  }, []);

  useFrame((state, delta) => {
    const inside = insideRef.current;
    const cam = state.camera.position;
    const k = Math.min(1, delta * 8);

    // 1. Wall cutaway: only walls between camera and interior collapse to a stub.
    for (let i = 0; i < 4; i++) {
      const g = wallGroups.current[i];
      if (!g) continue;
      const between =
        i === 0 ? cam.z > -1.5 : i === 1 ? cam.z < -10.5 : i === 2 ? cam.x < -6.5 : cam.x > 6.5;
      const target = inside && between ? STUB : 1;
      let v = cutState.current[i];
      if (v !== target) {
        v += (target - v) * k;
        if (Math.abs(target - v) < 0.003) v = target;
        cutState.current[i] = v;
        g.scale.y = v;
        const d = decorGroups.current[i];
        if (d) d.visible = v > 0.985;
      }
    }

    // 2. Roof lifts off & hides while inside.
    const roof = roofRef.current;
    if (roof) {
      const target = inside ? 0 : 1;
      let r = roofState.current;
      if (r !== target) {
        r += (target - r) * Math.min(1, delta * 9);
        if (Math.abs(target - r) < 0.01) r = target;
        roofState.current = r;
        roof.position.y = (1 - r) * 2.5;
        roof.visible = r > 0.02;
      }
    }

    // 3. Ceiling beams: visible only inside, hidden when they cross the camera -> player sightline.
    state.camera.getWorldDirection(_dir);
    for (let i = 0; i < BEAMS.length; i++) {
      const g = beamGroups.current[i];
      if (!g) continue;
      let show = inside;
      if (show && Math.abs(_dir.z) > 1e-4) {
        const s = (BEAMS[i].z - cam.z) / _dir.z;
        if (s > 0 && s < 14) {
          const y = cam.y + _dir.y * s;
          const x = cam.x + _dir.x * s;
          if (y > BEAM_Y - 1.3 && y < BEAM_Y + 0.6 && x > -6.6 && x < 6.6) show = false;
        }
      }
      g.visible = show;
    }

    // 4. Chimney smoke (position/scale only; shared material is never touched).
    const smoke = smokeRef.current;
    if (smoke && roof && roof.visible) {
      const t = state.clock.elapsedTime;
      const puffs = smoke.children;
      for (let i = 0; i < puffs.length; i++) {
        const o = (t * 0.35 + i / puffs.length) % 1;
        const p = puffs[i];
        p.position.set(Math.sin(t * 1.3 + i * 1.7) * 0.18 * o + o * 0.6, o * 2.4, 0);
        const sc = (0.35 + o * 0.85) * (1 - o * o * o);
        p.scale.setScalar(sc);
      }
    }
  });

  return (
    <group>
      {/* Foundation + floor */}
      <mesh geometry={built.foundation} material={built.stoneMat} receiveShadow />
      <mesh geometry={built.floor} material={built.floorMat} receiveShadow />

      {/* Static interior / porch details */}
      <Merged set={built.statics} castShadow receiveShadow />

      {/* Walls (cutaway groups) */}
      {built.walls.map((w, i) => (
        <group key={i} ref={(el) => (wallGroups.current[i] = el)}>
          <Merged set={w.core} castShadow receiveShadow />
          <mesh geometry={w.siding} material={built.sidingMat} castShadow receiveShadow />
          <mesh geometry={w.stone} material={built.stoneMat} receiveShadow />
          <group ref={(el) => (decorGroups.current[i] = el)}>
            <Merged set={w.decor} receiveShadow />
          </group>
        </group>
      ))}

      {/* Ceiling beams with pendant lamps */}
      {built.beams.map((set, i) => (
        <group key={i} ref={(el) => (beamGroups.current[i] = el)} visible={false}>
          <Merged set={set} />
        </group>
      ))}

      {/* The only two point lights for the house + props (no shadows; everything else is emissive) */}
      <pointLight position={[-3.0, 2.55, -6.0]} color="#ffd9a0" intensity={4} distance={11} decay={1.5} />
      <pointLight position={[4.2, 2.55, -3.2]} color="#ffcf99" intensity={3} distance={9} decay={1.5} />

      {/* Roof group (lifts away while inside) */}
      <group ref={roofRef}>
        <Merged set={built.roof} castShadow receiveShadow />
        <mesh geometry={built.gables} material={built.sidingMat} castShadow receiveShadow />
        <primitive object={built.shingles} />
        <group ref={smokeRef} position={[CHIMNEY[0], 8.45, CHIMNEY[2]]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} geometry={built.smokeGeo} material={built.smokeMat} />
          ))}
        </group>
      </group>
    </group>
  );
};
