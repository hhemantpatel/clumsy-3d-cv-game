import * as THREE from 'three';

/** Deterministic PRNG (mulberry32) so procedural layouts are identical every load. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap deterministic hash of a 3D point -> [-1, 1]; identical inputs give identical outputs. */
function hash3(x: number, y: number, z: number, k: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + k * 19.19) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

export type V3 = [number, number, number];

export interface PartOptions {
  pos?: V3;
  rot?: V3;
  scale?: number | V3;
  color: THREE.ColorRepresentation;
  /** Per-triangle brightness variation (0.08 = +-8%) for a hand-painted low-poly look. */
  facetJitter?: number;
  /** Organic vertex displacement in local units (consistent for shared vertices, so no cracks). */
  wobble?: number;
  /** Wind sway weight consumed by the foliage shader (0 = rigid). */
  wind?: number;
  /** Optional per-triangle colour override from the triangle's local-space centroid. */
  colorFn?: (x: number, y: number, z: number, out: THREE.Color) => void;
  /** Multiplies the final colour (use > 1 for emissive/unlit glow geometry). */
  intensity?: number;
}

const nonIndexedCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
function nonIndexed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.index) return geo;
  let cached = nonIndexedCache.get(geo);
  if (!cached) {
    cached = geo.toNonIndexed();
    nonIndexedCache.set(geo, cached);
  }
  return cached;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _base = new THREE.Color();
const _c = new THREE.Color();

/**
 * Accumulates many small primitives into ONE flat-shaded, vertex-coloured BufferGeometry.
 * Everything static that shares a material collapses into a single draw call.
 */
export class GeoBuilder {
  private positions: number[] = [];
  private colors: number[] = [];
  private winds: number[] = [];
  readonly rng: () => number;

  constructor(seed = 1) {
    this.rng = makeRng(seed);
  }

  add(src: THREE.BufferGeometry, o: PartOptions): this {
    const geo = nonIndexed(src);
    const pa = geo.attributes.position as THREE.BufferAttribute;
    const sc = o.scale ?? 1;
    _p.set(...(o.pos ?? [0, 0, 0]));
    _e.set(...(o.rot ?? [0, 0, 0]));
    _q.setFromEuler(_e);
    if (typeof sc === 'number') _s.set(sc, sc, sc);
    else _s.set(sc[0], sc[1], sc[2]);
    _m.compose(_p, _q, _s);
    _base.set(o.color);
    const wind = o.wind ?? 0;
    const wob = o.wobble ?? 0;
    const jit = o.facetJitter ?? 0;
    const inten = o.intensity ?? 1;

    for (let i = 0; i < pa.count; i += 3) {
      if (o.colorFn) {
        const cx = (pa.getX(i) + pa.getX(i + 1) + pa.getX(i + 2)) / 3;
        const cy = (pa.getY(i) + pa.getY(i + 1) + pa.getY(i + 2)) / 3;
        const cz = (pa.getZ(i) + pa.getZ(i + 1) + pa.getZ(i + 2)) / 3;
        _c.copy(_base);
        o.colorFn(cx, cy, cz, _c);
      } else {
        _c.copy(_base);
      }
      const k = (jit > 0 ? 1 + (this.rng() * 2 - 1) * jit : 1) * inten;
      const r = _c.r * k;
      const g = _c.g * k;
      const b = _c.b * k;
      for (let j = 0; j < 3; j++) {
        const x = pa.getX(i + j);
        const y = pa.getY(i + j);
        const z = pa.getZ(i + j);
        _v.set(x, y, z);
        if (wob > 0) {
          _v.x += hash3(x, y, z, 1) * wob;
          _v.y += hash3(x, y, z, 2) * wob;
          _v.z += hash3(x, y, z, 3) * wob;
        }
        _v.applyMatrix4(_m);
        this.positions.push(_v.x, _v.y, _v.z);
        this.colors.push(r, g, b);
        this.winds.push(wind);
      }
    }
    return this;
  }

  /** Appends another builder's (local-space) content with a group transform, keeping its colours. */
  append(other: GeoBuilder, o: { pos?: V3; rot?: V3; scale?: number | V3 } = {}): this {
    const sc = o.scale ?? 1;
    _p.set(...(o.pos ?? [0, 0, 0]));
    _e.set(...(o.rot ?? [0, 0, 0]));
    _q.setFromEuler(_e);
    if (typeof sc === 'number') _s.set(sc, sc, sc);
    else _s.set(sc[0], sc[1], sc[2]);
    _m.compose(_p, _q, _s);
    const src = other.positions;
    for (let i = 0; i < src.length; i += 3) {
      _v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(_m);
      this.positions.push(_v.x, _v.y, _v.z);
    }
    for (let i = 0; i < other.colors.length; i++) this.colors.push(other.colors[i]);
    for (let i = 0; i < other.winds.length; i++) this.winds.push(other.winds[i]);
    return this;
  }

  get vertexCount(): number {
    return this.positions.length / 3;
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    g.setAttribute('windW', new THREE.Float32BufferAttribute(this.winds, 1));
    g.computeVertexNormals(); // non-indexed -> per-face normals = crisp low-poly facets
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/** Shared primitive geometries (created once per module, reused by every builder call). */
export const PRIM = {
  box: new THREE.BoxGeometry(1, 1, 1),
  ico0: new THREE.IcosahedronGeometry(1, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  ico2: new THREE.IcosahedronGeometry(1, 2),
  dodeca: new THREE.DodecahedronGeometry(1, 0),
  cyl5: new THREE.CylinderGeometry(1, 1, 1, 5, 1),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6, 1),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8, 1),
  cyl12: new THREE.CylinderGeometry(1, 1, 1, 12, 1),
  cone4: new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI / 4),
  cone5: new THREE.ConeGeometry(1, 1, 5, 1),
  cone7: new THREE.ConeGeometry(1, 1, 7, 3),
  plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
};

/** Tapered cylinder helper (unit cylinders can't taper, so cache by ratio). */
const taperCache = new Map<string, THREE.CylinderGeometry>();
export function taperedCyl(topRatio: number, sides: number, hSeg = 1): THREE.CylinderGeometry {
  const key = `${topRatio.toFixed(2)}_${sides}_${hSeg}`;
  let g = taperCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(topRatio, 1, 1, sides, hSeg);
    taperCache.set(key, g);
  }
  return g;
}

/** Orientation that points a +Y-aligned unit primitive from a to b. Returns pos/rot/len. */
const _up = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _qq = new THREE.Quaternion();
const _ee = new THREE.Euler();
export function between(a: V3, b: V3): { pos: V3; rot: V3; len: number } {
  _dir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _dir.length();
  _dir.divideScalar(len || 1);
  _qq.setFromUnitVectors(_up, _dir);
  _ee.setFromQuaternion(_qq);
  return {
    pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    rot: [_ee.x, _ee.y, _ee.z],
    len,
  };
}
