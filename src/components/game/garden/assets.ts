// Shared, module-level geometries / materials / palette for the Automaton Garden.
// Everything here is created exactly once and shared by every garden component,
// so the whole garden compiles a handful of shader programs and allocates no
// GPU resources per render.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
// Layout (garden-local space; the garden group sits at world [6.8, 0, 5.2])
// ---------------------------------------------------------------------------
export const COLS = [-1.4, -0.7, 0, 0.7, 1.4];
export const ROWS = [-1.8, -0.9, 0, 0.9, 1.8];
/** Top of the soil bed box. */
export const BED_TOP = 0.22;
/** Top surface of each tilled tile mound — crops are planted exactly here. */
export const SOIL_Y = 0.27;
export const DRONE_BASE_Y = 1.1;
/** Sun-ish direction (matches the scene's directional light azimuth, tilted up so heads stay visible). */
export const SUN_DIR = new THREE.Vector3(0.45, 0.82, -0.35).normalize();

// ---------------------------------------------------------------------------
// Palette (one THREE.Color per tone, reused for lerps and instance colours)
// ---------------------------------------------------------------------------
export const PALETTE = {
  soilBed: new THREE.Color('#4a2e1c'),
  soilDry: new THREE.Color('#7a5034'),
  soilWet: new THREE.Color('#3a2213'),
  furrow: new THREE.Color('#5b3a24'),
  seedMound: new THREE.Color('#5e3b23'),
  sprout: new THREE.Color('#8bc34a'),
  leaf: new THREE.Color('#4f9d3a'),
  leafDark: new THREE.Color('#3d7f2e'),
  wheatStalk: new THREE.Color('#d7b25a'),
  wheatEarYoung: new THREE.Color('#a8c957'),
  wheatEarRipe: new THREE.Color('#e8b53a'),
  carrotFrond: new THREE.Color('#5fb548'),
  carrot: new THREE.Color('#f0802a'),
  pumpkinYoung: new THREE.Color('#7fae43'),
  pumpkinRipe: new THREE.Color('#f28b26'),
  vine: new THREE.Color('#5d8f2f'),
  pumpkinStem: new THREE.Color('#6b5a2a'),
  sunStem: new THREE.Color('#5a9a3a'),
  petalBud: new THREE.Color('#9bc24d'),
  petal: new THREE.Color('#ffc928'),
  sunDisk: new THREE.Color('#5b3517'),
  woodA: new THREE.Color('#b9783f'),
  woodB: new THREE.Color('#a86a35'),
  woodCap: new THREE.Color('#cf9254'),
  woodPost: new THREE.Color('#8a5a2c'),
  woodSeam: new THREE.Color('#4e2e16'),
  woodDark: new THREE.Color('#6e4422'),
  copper: new THREE.Color('#c27a3a'),
  canBlue: new THREE.Color('#3f8fb4'),
  burlap: new THREE.Color('#c9a878'),
  burlapDark: new THREE.Color('#a8865a'),
  rope: new THREE.Color('#e2cf9b'),
  white: new THREE.Color('#ffffff'),
  water: new THREE.Color('#8fd3ff'),
  seed: new THREE.Color('#d9b26a'),
  dust: new THREE.Color('#b38b62'),
};

// ---------------------------------------------------------------------------
// Materials — one per colour/role
// ---------------------------------------------------------------------------
/** White base so per-instance colours show through unmodified. */
export const MAT = {
  soilBed: new THREE.MeshStandardMaterial({ color: PALETTE.soilBed, roughness: 1 }),
  soilTinted: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true }),
  puddle: new THREE.MeshStandardMaterial({
    color: '#9cc9e6',
    roughness: 0.05,
    metalness: 0.35,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  }),
  plant: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true }),
  plantDouble: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65, flatShading: true, side: THREE.DoubleSide }),
  pumpkin: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45, flatShading: true }),
  carrot: new THREE.MeshStandardMaterial({ color: PALETTE.carrot, roughness: 0.5, flatShading: true }),
  sunDisk: new THREE.MeshStandardMaterial({ color: PALETTE.sunDisk, roughness: 0.9, flatShading: true }),
  sparkle: new THREE.MeshBasicMaterial({ color: '#fff4b8', toneMapped: false }),
  wood: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82, flatShading: true }),
  props: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, flatShading: true, vertexColors: true }),
  copper: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.7, roughness: 0.32, vertexColors: true }),
  nozzleGlass: new THREE.MeshStandardMaterial({ color: '#7cc8f2', transparent: true, opacity: 0.75, roughness: 0.1 }),
  pebble: new THREE.MeshStandardMaterial({ color: '#8d7a68', roughness: 1, flatShading: true }),
  bits: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, flatShading: true }),
  coin: new THREE.MeshStandardMaterial({
    color: '#f6c33c',
    metalness: 0.75,
    roughness: 0.25,
    emissive: '#8a5a00',
    emissiveIntensity: 0.35,
    flatShading: true,
  }),
  // Drone
  droneShell: new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.35, metalness: 0.1 }),
  droneAccent: new THREE.MeshStandardMaterial({ color: '#f2a93b', roughness: 0.35, metalness: 0.45 }),
  droneFrame: new THREE.MeshStandardMaterial({ color: '#7f8a99', roughness: 0.45, metalness: 0.6, flatShading: true }),
  droneRotor: new THREE.MeshStandardMaterial({ color: '#2b3442', roughness: 0.5, metalness: 0.3 }),
  droneVisor: new THREE.MeshStandardMaterial({ color: '#172033', roughness: 0.12, metalness: 0.5 }),
};

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
/** Unit cylinder with its base at y=0 (scale x/z = radius, y = height). */
const unitCylinder = (radial: number, topRatio = 1) => {
  const g = new THREE.CylinderGeometry(topRatio, 1, 1, radial, 1);
  g.translate(0, 0.5, 0);
  return g;
};

/** Ribbed, top-dimpled pumpkin (radius ≈1, base at y≈0, top ≈1.18). */
const makePumpkinGeometry = () => {
  const g = new THREE.SphereGeometry(1, 20, 12);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const a = Math.atan2(z, x);
    const rib = 0.88 + 0.12 * Math.pow(Math.abs(Math.sin(a * 4)), 0.55);
    x *= rib;
    z *= rib;
    const rxz = Math.min(1, Math.sqrt(x * x + z * z));
    y *= 0.68;
    y -= Math.sign(y) * 0.14 * Math.pow(1 - rxz, 3);
    p.setXYZ(i, x, y, z);
  }
  g.translate(0, 0.62, 0);
  g.computeVertexNormals();
  return g;
};

/** Pointed leaf lying flat along +Z (base at origin, length 0.2, slight V fold). */
const makeLeafGeometry = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.075, 0.07, 0, 0.2);
  s.quadraticCurveTo(-0.075, 0.07, 0, 0);
  const g = new THREE.ShapeGeometry(s, 4);
  g.rotateX(Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + Math.abs(p.getX(i)) * 0.45);
  g.computeVertexNormals();
  return g;
};

export const GEO = {
  unitBox: new THREE.BoxGeometry(1, 1, 1),
  // soil
  soilMound: (() => {
    const g = new THREE.CylinderGeometry(0.27, 0.31, 0.06, 8);
    g.rotateY(Math.PI / 8);
    g.translate(0, -0.03, 0);
    g.scale(1, 1, 1.22);
    return g;
  })(),
  furrow: (() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  })(),
  puddle: (() => {
    const g = new THREE.CircleGeometry(1, 10);
    g.rotateX(-Math.PI / 2);
    return g;
  })(),
  hemi: new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2),
  // plants
  stem: unitCylinder(5, 0.7),
  ear: new THREE.SphereGeometry(1, 5, 4),
  frond: (() => {
    const g = new THREE.ConeGeometry(1, 1, 4, 1);
    g.translate(0, 0.5, 0);
    return g;
  })(),
  shoulder: (() => {
    const g = new THREE.ConeGeometry(1, 1, 7, 1);
    g.rotateX(Math.PI);
    g.translate(0, -0.5, 0);
    return g;
  })(),
  pumpkin: makePumpkinGeometry(),
  leaf: makeLeafGeometry(),
  disk: new THREE.CylinderGeometry(1, 1, 1, 12),
  // fx
  octa: new THREE.OctahedronGeometry(1, 0),
  ico: new THREE.IcosahedronGeometry(1, 0),
  coin: (() => {
    const g = new THREE.CylinderGeometry(1, 1, 0.22, 10);
    g.rotateX(Math.PI / 2);
    return g;
  })(),
};

// ---------------------------------------------------------------------------
// Merge helper: bake several (geometry, transform, colour) parts into a single
// vertex-coloured BufferGeometry -> one draw call for static clutter.
// ---------------------------------------------------------------------------
export interface Part {
  geo: THREE.BufferGeometry;
  color: THREE.Color;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  /** Extra transform applied after the part's own TRS (e.g. a parent group). */
  parent?: THREE.Matrix4;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export const mergeParts = (parts: Part[]): THREE.BufferGeometry => {
  const prepared = parts.map(({ geo, color, position, rotation, scale, parent }) => {
    let g = geo.clone();
    if (g.index) g = g.toNonIndexed();
    // keep a consistent attribute set (position/normal/color) across parts
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    _p.set(...(position ?? [0, 0, 0]));
    _q.setFromEuler(_e.set(...(rotation ?? [0, 0, 0])));
    if (typeof scale === 'number') _s.setScalar(scale);
    else _s.set(...(scale ?? [1, 1, 1]));
    _m.compose(_p, _q, _s);
    if (parent) _m.premultiply(parent);
    g.applyMatrix4(_m);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  });
  const merged = mergeGeometries(prepared, false);
  prepared.forEach((g) => g.dispose());
  if (!merged) throw new Error('mergeParts: incompatible geometries');
  merged.computeBoundingSphere();
  return merged;
};

/** Create an InstancedMesh with instanceColor initialised (so the shader variant is compiled once). */
export const makeInstanced = (
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  capacity: number,
  opts: { castShadow?: boolean; receiveShadow?: boolean; colors?: boolean } = {}
): THREE.InstancedMesh => {
  const mesh = new THREE.InstancedMesh(geo, mat, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (opts.colors) {
    for (let i = 0; i < capacity; i++) mesh.setColorAt(i, PALETTE.white);
    mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage);
  }
  mesh.castShadow = !!opts.castShadow;
  mesh.receiveShadow = !!opts.receiveShadow;
  // Instances are spread over the whole plot; default culling uses the base geometry's bounds.
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.visible = false;
  return mesh;
};

/** Deterministic PRNG for layout jitter (stable between reloads). */
export const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Live drone position in garden-local space, written by the drone each frame and read by FX. */
export interface DroneLive {
  x: number;
  y: number;
  z: number;
}
