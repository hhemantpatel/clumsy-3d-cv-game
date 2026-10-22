// Shared character geometries. Built lazily exactly once and reused by every
// render / instance, so the character never allocates GPU buffers per render.
// Static decorative parts (hair tufts, glasses, cheeks, ears, drawstrings,
// sneaker sole + toe cap + laces, hand + thumb) are merged into single
// geometries to keep the mesh / draw-call count low.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V3 = [number, number, number];

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();

/** Bake a transform into a geometry (used for static, merged decorative parts). */
function place<G extends THREE.BufferGeometry>(g: G, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale: V3 = [1, 1, 1]): G {
  _m.compose(_p.set(pos[0], pos[1], pos[2]), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2])), _s.set(scale[0], scale[1], scale[2]));
  g.applyMatrix4(_m);
  return g;
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // mergeGeometries needs every part to be indexed-or-not alike and to share the same
  // attribute set; RoundedBoxGeometry is non-indexed while Sphere/Box are indexed.
  const normalized = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    return g;
  });
  const merged = mergeGeometries(normalized, false);
  parts.forEach((p) => p.dispose());
  normalized.forEach((p) => p.dispose());
  if (!merged) throw new Error('Character: failed to merge geometries');
  return merged;
}

/**
 * Tapered capsule (lathe profile) — rounded ends hide the joint gaps at
 * shoulders / elbows / hips / knees and allow a slight jeans/sleeve taper.
 * Centered on the origin along Y.
 */
function taperedCapsule(rTop: number, rBottom: number, length: number, radial = 12, capSegs = 4): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const half = length / 2;
  for (let i = 0; i <= capSegs; i++) {
    const a = -Math.PI / 2 + (i / capSegs) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, rBottom * Math.cos(a)), -half + rBottom * Math.sin(a)));
  }
  for (let i = 0; i <= capSegs; i++) {
    const a = (i / capSegs) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, rTop * Math.cos(a)), half + rTop * Math.sin(a)));
  }
  return new THREE.LatheGeometry(pts, radial);
}

function buildHand(side: 1 | -1): THREE.BufferGeometry {
  // side = +1 for the arm on +x, thumb points toward the body front/inside
  return merge([
    new THREE.SphereGeometry(0.068, 14, 12),
    place(new THREE.CapsuleGeometry(0.023, 0.045, 3, 8), [-side * 0.042, 0.012, 0.03], [0.3, 0, side * 0.45]),
  ]);
}

function buildHair(): THREE.BufferGeometry {
  const tuft = () => new THREE.CapsuleGeometry(0.026, 0.04, 2, 6);
  return merge([
    // Fringe poking out under the beanie rim (asymmetric, cute)
    place(tuft(), [-0.185, 0.07, 0.195], [-0.35, 0, 0.35]),
    place(tuft(), [-0.15, 0.075, 0.203], [-0.4, 0, -0.2]),
    place(tuft(), [0.178, 0.072, 0.197], [-0.35, 0, -0.4]),
    // Sideburns
    place(tuft(), [-0.219, 0.045, 0.07], [0, 0, 0.1], [0.8, 1, 1]),
    place(tuft(), [0.219, 0.045, 0.07], [0, 0, -0.1], [0.8, 1, 1]),
    // Back of the neck
    place(tuft(), [-0.11, 0.07, -0.205], [0.35, 0, 0.25]),
    place(tuft(), [0, 0.06, -0.212], [0.4, 0, 0]),
    place(tuft(), [0.11, 0.07, -0.205], [0.35, 0, -0.25]),
  ]);
}

function buildGlasses(): THREE.BufferGeometry {
  const ring = () => new THREE.TorusGeometry(0.062, 0.0095, 8, 24);
  const bar = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  return merge([
    place(ring(), [-0.095, 0, 0]),
    place(ring(), [0.095, 0, 0]),
    place(bar(0.07, 0.012, 0.012), [0, 0.01, 0]), // bridge
    place(bar(0.07, 0.012, 0.012), [-0.19, 0.01, -0.004]), // hinge connectors
    place(bar(0.07, 0.012, 0.012), [0.19, 0.01, -0.004]),
    place(bar(0.012, 0.012, 0.22), [-0.226, 0.01, -0.115]), // temples
    place(bar(0.012, 0.012, 0.22), [0.226, 0.01, -0.115]),
  ]);
}

function buildShoeWhite(): THREE.BufferGeometry {
  return merge([
    // Chunky cushion sole
    place(new RoundedBoxGeometry(0.23, 0.075, 0.37, 2, 0.03), [0, -0.0075, 0]),
    // Rubber toe cap
    place(new THREE.SphereGeometry(0.085, 14, 10), [0, 0.04, 0.105], [0, 0, 0], [1.2, 0.7, 0.95]),
    // Lace stripes across the upper
    place(new THREE.BoxGeometry(0.1, 0.014, 0.022), [0, 0.132, 0.06], [-0.25, 0, 0]),
    place(new THREE.BoxGeometry(0.1, 0.014, 0.022), [0, 0.135, 0.015], [-0.15, 0, 0]),
    place(new THREE.BoxGeometry(0.1, 0.014, 0.022), [0, 0.136, -0.03], [-0.05, 0, 0]),
  ]);
}

function build() {
  return {
    // Torso / hoodie
    torso: new RoundedBoxGeometry(0.54, 0.6, 0.38, 3, 0.1),
    waistband: new RoundedBoxGeometry(0.56, 0.08, 0.4, 2, 0.035),
    pocket: new RoundedBoxGeometry(0.36, 0.17, 0.05, 2, 0.022),
    hood: place(new THREE.SphereGeometry(0.16, 16, 10), [0, 0, 0], [0, 0, 0], [1.3, 0.62, 0.8]),
    collar: place(new THREE.TorusGeometry(0.165, 0.045, 8, 24), [0, 0, 0], [Math.PI / 2, 0, 0]),
    strings: merge([
      place(new THREE.CylinderGeometry(0.011, 0.011, 0.2, 6), [-0.065, -0.1, 0]),
      place(new THREE.CylinderGeometry(0.011, 0.011, 0.17, 6), [0.065, -0.085, 0]),
    ]),
    aglets: merge([
      place(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 8), [-0.065, -0.21, 0]),
      place(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 8), [0.065, -0.18, 0]),
    ]),

    // Head
    head: new RoundedBoxGeometry(0.44, 0.44, 0.42, 3, 0.1),
    beanie: new RoundedBoxGeometry(0.47, 0.22, 0.46, 3, 0.09),
    beanieRim: new RoundedBoxGeometry(0.49, 0.075, 0.48, 2, 0.035),
    pomPom: new THREE.SphereGeometry(0.085, 14, 12),
    hair: buildHair(),
    ears: merge([
      place(new THREE.SphereGeometry(0.05, 12, 10), [-0.222, -0.03, 0], [0, 0, 0], [0.45, 1, 0.75]),
      place(new THREE.SphereGeometry(0.05, 12, 10), [0.222, -0.03, 0], [0, 0, 0], [0.45, 1, 0.75]),
    ]),
    nose: place(new THREE.SphereGeometry(0.034, 12, 10), [0, 0, 0], [0, 0, 0], [1.1, 0.85, 0.85]),
    eye: new THREE.SphereGeometry(0.04, 16, 12),
    eyeHighlight: new THREE.SphereGeometry(0.012, 8, 6),
    brow: place(new THREE.CapsuleGeometry(0.011, 0.05, 3, 8), [0, 0, 0], [0, 0, Math.PI / 2]),
    // Smile arc: lower half-ring; mesh scale.y controls curvature (flat line -> big grin)
    mouthArc: place(new THREE.TorusGeometry(0.038, 0.009, 6, 16, Math.PI), [0, 0, 0], [0, 0, Math.PI]),
    // Open mouth ("O" / yawn): dark ellipse scaled per-frame
    mouthOpen: new THREE.SphereGeometry(0.04, 14, 10),
    cheeks: merge([
      place(new THREE.SphereGeometry(0.034, 12, 8), [-0.15, 0, 0], [0, -0.35, 0], [1, 0.7, 0.45]),
      place(new THREE.SphereGeometry(0.034, 12, 8), [0.15, 0, 0], [0, 0.35, 0], [1, 0.7, 0.45]),
    ]),
    glasses: buildGlasses(),

    // Arms
    upperArm: taperedCapsule(0.078, 0.072, 0.14),
    forearm: taperedCapsule(0.072, 0.066, 0.11),
    cuff: place(new THREE.TorusGeometry(0.07, 0.022, 6, 16), [0, 0, 0], [Math.PI / 2, 0, 0]),
    handLeft: buildHand(-1),
    handRight: buildHand(1),

    // Legs
    thigh: taperedCapsule(0.094, 0.086, 0.14),
    shin: taperedCapsule(0.086, 0.074, 0.11),
    hem: place(new THREE.TorusGeometry(0.08, 0.022, 6, 16), [0, 0, 0], [Math.PI / 2, 0, 0]),
    shoeWhite: buildShoeWhite(),
    shoeUpper: new RoundedBoxGeometry(0.2, 0.12, 0.3, 3, 0.045),

    // Blob shadow
    shadow: place(new THREE.PlaneGeometry(1.05, 1.05), [0, 0, 0], [-Math.PI / 2, 0, 0]),
  };
}

export type CharacterGeometries = ReturnType<typeof build>;

let cache: CharacterGeometries | null = null;

export function getCharacterGeometries(): CharacterGeometries {
  if (!cache) cache = build();
  return cache;
}
