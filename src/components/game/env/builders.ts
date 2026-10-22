import * as THREE from 'three';
import { GeoBuilder, PRIM, taperedCyl, between, V3 } from './GeoBuilder';
import { PALETTE } from './palette';

const OCTA = new THREE.OctahedronGeometry(1, 0);
const BIRCH_TRUNK = new THREE.CylinderGeometry(0.75, 1, 1, 6, 7);

/** Darken the underside of a unit blob (fake ambient occlusion baked into vertex colours). */
const shadeUnderside = (amount: number) => (_x: number, y: number, _z: number, out: THREE.Color) => {
  if (y < -0.25) out.multiplyScalar(1 - amount * Math.min(1, (-y - 0.25) / 0.6 + 0.4));
  else if (y > 0.45) out.multiplyScalar(1.08);
};

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------
export interface DeciduousOptions {
  /** 4 colours ordered shadow -> sunlit. */
  leaves: readonly string[];
  bark?: string;
  canopyOffset?: [number, number];
  canopyRadius?: number;
  trunkHeight?: number;
}

/** Stylised broadleaf tree: flared roots, branching trunk and a layered, faceted canopy. */
export function addDeciduousTree(b: GeoBuilder, x: number, z: number, s: number, o: DeciduousOptions): void {
  const r = b.rng;
  const bark = o.bark ?? PALETTE.bark;
  const th = (o.trunkHeight ?? 2.5) * s;
  const [ox, oz] = o.canopyOffset ?? [0, 0];
  const cr = (o.canopyRadius ?? 1.45) * s;
  const top: V3 = [x + ox * 0.35, th, z + oz * 0.35];

  // Trunk (slightly leaning toward the canopy offset)
  const trunk = between([x, 0, z], top);
  b.add(taperedCyl(0.6, 7, 3), {
    pos: trunk.pos, rot: trunk.rot, scale: [0.3 * s, trunk.len, 0.3 * s],
    color: bark, facetJitter: 0.08, wobble: 0.05, wind: 0.5,
  });

  // Root flare
  const roots = 5;
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * Math.PI * 2 + r() * 0.5;
    const reach = (0.55 + r() * 0.25) * s;
    const seg = between(
      [x + Math.cos(a) * 0.08 * s, 0.5 * s, z + Math.sin(a) * 0.08 * s],
      [x + Math.cos(a) * reach, -0.02, z + Math.sin(a) * reach],
    );
    b.add(PRIM.cone5, {
      pos: seg.pos, rot: seg.rot, scale: [0.13 * s, seg.len, 0.13 * s],
      color: PALETTE.barkDark, facetJitter: 0.1, wind: 0,
    });
  }

  // Branches reaching into the canopy
  const branches = 3;
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + r() * 0.8;
    const y0 = th * (0.6 + r() * 0.2);
    const seg = between(
      [x + ox * 0.2, y0, z + oz * 0.2],
      [x + ox * 0.5 + Math.cos(a) * 0.95 * s, y0 + (0.8 + r() * 0.4) * s, z + oz * 0.5 + Math.sin(a) * 0.95 * s],
    );
    b.add(taperedCyl(0.5, 5), {
      pos: seg.pos, rot: seg.rot, scale: [0.085 * s, seg.len, 0.085 * s],
      color: bark, facetJitter: 0.08, wind: 0.8,
    });
  }

  // Layered canopy: a ring of lower blobs, a middle ring and a crown
  const cx = x + ox;
  const cz = z + oz;
  const cy = th + cr * 0.75;
  const blobs: { p: V3; rad: number; tone: number }[] = [];
  blobs.push({ p: [cx, cy, cz], rad: cr * 0.95, tone: 1 });
  const lower = 6;
  for (let i = 0; i < lower; i++) {
    const a = (i / lower) * Math.PI * 2 + r() * 0.6;
    const d = cr * (0.75 + r() * 0.25);
    blobs.push({ p: [cx + Math.cos(a) * d, cy - cr * (0.15 + r() * 0.2), cz + Math.sin(a) * d], rad: cr * (0.55 + r() * 0.15), tone: 0 });
  }
  const mid = 4;
  for (let i = 0; i < mid; i++) {
    const a = (i / mid) * Math.PI * 2 + 0.6 + r() * 0.5;
    const d = cr * (0.45 + r() * 0.2);
    blobs.push({ p: [cx + Math.cos(a) * d, cy + cr * (0.35 + r() * 0.15), cz + Math.sin(a) * d], rad: cr * (0.55 + r() * 0.12), tone: 2 });
  }
  blobs.push({ p: [cx + (r() - 0.5) * 0.3 * s, cy + cr * 0.85, cz + (r() - 0.5) * 0.3 * s], rad: cr * 0.5, tone: 3 });

  for (const bl of blobs) {
    b.add(PRIM.ico1, {
      pos: bl.p,
      rot: [r() * 3, r() * 3, r() * 3],
      scale: [bl.rad, bl.rad * 0.85, bl.rad],
      color: o.leaves[Math.min(bl.tone, o.leaves.length - 1)],
      facetJitter: 0.09, wobble: 0.13, wind: 1,
      colorFn: shadeUnderside(0.3),
    });
  }
}

/** Stylised conifer: stacked, slightly twisted cones. */
export function addPine(b: GeoBuilder, x: number, z: number, s: number): void {
  const r = b.rng;
  b.add(taperedCyl(0.55, 6), {
    pos: [x, 0.9 * s, z], scale: [0.2 * s, 1.8 * s, 0.2 * s], color: PALETTE.barkDark, facetJitter: 0.08, wind: 0.4,
  });
  const tiers = 4;
  const tones = [PALETTE.pineDeep, PALETTE.pine, PALETTE.pine, PALETTE.pineLight];
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const rad = (1.55 - t * 0.95) * s;
    const h = (1.9 - t * 0.5) * s;
    const y = (1.4 + i * 1.05) * s + h / 2;
    b.add(PRIM.cone7, {
      pos: [x, y, z], rot: [0, r() * Math.PI, 0], scale: [rad, h, rad],
      color: tones[i], facetJitter: 0.1, wobble: 0.06, wind: 0.8,
      colorFn: (_x, yy, _z, out) => { if (yy < -0.3) out.multiplyScalar(0.72); },
    });
  }
}

/** Slender white birch with dark bark marks and airy yellow-green leaf clusters. */
export function addBirch(b: GeoBuilder, x: number, z: number, s: number): void {
  const r = b.rng;
  const h = 4.4 * s;
  b.add(BIRCH_TRUNK, {
    pos: [x, h / 2, z], rot: [(r() - 0.5) * 0.08, 0, (r() - 0.5) * 0.08], scale: [0.15 * s, h, 0.15 * s],
    color: PALETTE.birchBark, wind: 0.6,
    colorFn: (cx, cy, cz, out) => {
      if (Math.sin(cy * 41 + cx * 9 + cz * 7) > 0.55) out.set(PALETTE.birchMark);
    },
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.6;
    const d = (0.35 + r() * 0.45) * s;
    const rad = (0.6 + r() * 0.3) * s;
    b.add(PRIM.ico1, {
      pos: [x + Math.cos(a) * d, h * (0.72 + r() * 0.28), z + Math.sin(a) * d],
      rot: [r() * 3, r() * 3, r() * 3], scale: [rad, rad * 1.25, rad],
      color: PALETTE.birchLeaf[i % PALETTE.birchLeaf.length], facetJitter: 0.1, wobble: 0.12, wind: 1.1,
      colorFn: shadeUnderside(0.25),
    });
  }
}

/** Weeping willow: domed crown with a curtain of drooping fronds. */
export function addWillow(b: GeoBuilder, x: number, z: number, s: number): void {
  const r = b.rng;
  const trunk = between([x, 0, z], [x + 0.3 * s, 3.0 * s, z - 0.2 * s]);
  b.add(taperedCyl(0.55, 7, 2), {
    pos: trunk.pos, rot: trunk.rot, scale: [0.45 * s, trunk.len, 0.45 * s], color: PALETTE.barkDark, facetJitter: 0.1, wobble: 0.08, wind: 0.4,
  });
  const cx = x + 0.3 * s;
  const cz = z - 0.2 * s;
  b.add(PRIM.ico1, {
    pos: [cx, 3.6 * s, cz], rot: [r(), r(), r()], scale: [2.2 * s, 1.4 * s, 2.2 * s],
    color: PALETTE.willow[0], facetJitter: 0.08, wobble: 0.1, wind: 0.9, colorFn: shadeUnderside(0.25),
  });
  b.add(PRIM.ico1, {
    pos: [cx, 4.5 * s, cz], rot: [r(), r(), r()], scale: [1.4 * s, 1.0 * s, 1.4 * s],
    color: PALETTE.willow[1], facetJitter: 0.08, wobble: 0.1, wind: 1,
  });
  const fronds = 16;
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + r() * 0.3;
    const d = (1.75 + r() * 0.35) * s;
    const len = (2.0 + r() * 0.8) * s;
    b.add(PRIM.cone5, {
      pos: [cx + Math.cos(a) * d, 3.4 * s - len / 2, cz + Math.sin(a) * d],
      rot: [Math.PI, a, 0], scale: [0.38 * s, len, 0.38 * s],
      color: PALETTE.willow[i % PALETTE.willow.length], facetJitter: 0.1, wind: 1.3,
    });
  }
}

// ---------------------------------------------------------------------------
// Small props
// ---------------------------------------------------------------------------
export function addShrub(b: GeoBuilder, x: number, z: number, berry: string, s = 1): void {
  const r = b.rng;
  const blobs: V3[] = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.7;
    const d = i === 0 ? 0 : 0.22 * s;
    const rad = (i === 0 ? 0.42 : 0.3 + r() * 0.06) * s;
    const p: V3 = [x + Math.cos(a) * d, rad * 0.85, z + Math.sin(a) * d];
    blobs.push(p);
    b.add(PRIM.ico1, {
      pos: p, rot: [r() * 3, r() * 3, r() * 3], scale: [rad, rad * 0.85, rad],
      color: i === 0 ? PALETTE.leaf : PALETTE.leafLight, facetJitter: 0.1, wobble: 0.12, wind: 1.5,
      colorFn: shadeUnderside(0.3),
    });
  }
  // Berries / blossoms dotted over the upper surface
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const el = 0.35 + r() * 0.9;
    const rad = 0.4 * s;
    b.add(PRIM.ico0, {
      pos: [x + Math.cos(a) * Math.cos(el) * rad, 0.34 * s + Math.sin(el) * rad * 0.9, z + Math.sin(a) * Math.cos(el) * rad],
      scale: 0.055 * s, color: berry, facetJitter: 0.12, wind: 1.5,
    });
  }
}

export function addRock(b: GeoBuilder, x: number, z: number, size: number, flat = 0.6): void {
  const r = b.rng;
  const tones = [PALETTE.stone, PALETTE.stoneDark, PALETTE.stoneLight];
  b.add(PRIM.dodeca, {
    pos: [x, size * flat * 0.35, z], rot: [r() * 0.4, r() * Math.PI * 2, r() * 0.4],
    scale: [size, size * flat, size * (0.75 + r() * 0.25)],
    color: tones[Math.floor(r() * tones.length)], facetJitter: 0.1, wobble: 0.16,
    colorFn: (_x, y, _z, out) => { if (y > 0.3) out.multiplyScalar(1.1); },
  });
}

/** A clump of small wildflowers (stems, leaves, five-petal heads). */
export function addFlowerClump(b: GeoBuilder, x: number, z: number, color: string, count: number, spread = 0.32): void {
  const r = b.rng;
  const centre = color === PALETTE.flowers[1] ? PALETTE.woodDark : '#f6cf4a';
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * spread;
    const fx = x + Math.cos(a) * d;
    const fz = z + Math.sin(a) * d;
    const h = 0.2 + r() * 0.16;
    b.add(taperedCyl(1, 3), { pos: [fx, h / 2, fz], scale: [0.012, h, 0.012], color: PALETTE.leaf, wind: 7 });
    b.add(OCTA, {
      pos: [fx + 0.03, 0.05, fz], rot: [0, r() * 3, 0.5], scale: [0.06, 0.012, 0.022], color: PALETTE.leafLight, wind: 3,
    });
    const spin = r() * Math.PI;
    for (let p = 0; p < 5; p++) {
      const pa = spin + (p / 5) * Math.PI * 2;
      b.add(OCTA, {
        pos: [fx + Math.cos(pa) * 0.035, h + 0.005, fz + Math.sin(pa) * 0.035],
        rot: [0, -pa, 0], scale: [0.04, 0.01, 0.022], color, facetJitter: 0.06, wind: 7,
      });
    }
    b.add(OCTA, { pos: [fx, h + 0.012, fz], scale: 0.018, color: centre, wind: 7 });
  }
}

/** Glass lantern on a post top / bracket: housing into `b`, glowing core into `glow`. */
export function addLantern(b: GeoBuilder, glow: GeoBuilder, x: number, y: number, z: number, s = 1): void {
  const m = PALETTE.lanternMetal;
  b.add(PRIM.box, { pos: [x, y + 0.02 * s, z], scale: [0.2 * s, 0.04 * s, 0.2 * s], color: m });
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    b.add(PRIM.box, { pos: [x + dx * 0.075 * s, y + 0.15 * s, z + dz * 0.075 * s], scale: [0.025 * s, 0.24 * s, 0.025 * s], color: m });
  }
  b.add(PRIM.cone4, { pos: [x, y + 0.33 * s, z], scale: [0.16 * s, 0.13 * s, 0.16 * s], color: m });
  b.add(PRIM.ico0, { pos: [x, y + 0.42 * s, z], scale: 0.025 * s, color: m });
  glow.add(PRIM.box, { pos: [x, y + 0.15 * s, z], scale: [0.11 * s, 0.2 * s, 0.11 * s], color: '#ffc46b', intensity: 2.6 });
}
