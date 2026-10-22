import React from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Tiny low-poly "kit" used by the house + interactable props.
 *
 * Static props are described as a list of primitive parts (box / cylinder / sphere ...)
 * with a colour and a transform, then baked ONCE into a single vertex-coloured
 * BufferGeometry per material class. A whole desk / bed / window set therefore costs
 * 1-3 draw calls instead of dozens, and every prop shares the same handful of materials.
 */

export type V3 = [number, number, number];
export type MatKey = 'matte' | 'satin' | 'metal' | 'glow' | 'glass';

/** Top of the interior floor boards. */
export const FLOOR_Y = 0.16;

export interface Part {
  g: THREE.BufferGeometry;
  c: string;
  /** colour multiplier (>1 for glow parts so bloom picks them up) */
  k: number;
  m: MatKey;
  M: THREE.Matrix4;
}

export interface PartOpts {
  r?: V3;
  s?: V3;
  m?: MatKey;
  k?: number;
  seg?: number;
}

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export function composeMatrix(p: V3, r?: V3, s?: V3): THREE.Matrix4 {
  _e.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0);
  _q.setFromEuler(_e);
  _p.set(p[0], p[1], p[2]);
  _s.set(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

/** Wrap any (fresh!) geometry as a part. The geometry is disposed after merging. */
export function part(g: THREE.BufferGeometry, c: string, p: V3, o: PartOpts = {}): Part {
  return { g, c, k: o.k ?? 1, m: o.m ?? 'matte', M: composeMatrix(p, o.r, o.s) };
}

export const box = (w: number, h: number, d: number, c: string, p: V3, o: PartOpts = {}) =>
  part(new THREE.BoxGeometry(w, h, d), c, p, o);

export const cyl = (rt: number, rb: number, h: number, c: string, p: V3, o: PartOpts = {}) =>
  part(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 12), c, p, o);

export const sph = (r: number, c: string, p: V3, o: PartOpts = {}) => {
  const seg = o.seg ?? 10;
  return part(new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))), c, p, o);
};

export const cone = (r: number, h: number, c: string, p: V3, o: PartOpts = {}) =>
  part(new THREE.ConeGeometry(r, h, o.seg ?? 10), c, p, o);

export const torus = (R: number, t: number, c: string, p: V3, o: PartOpts & { arc?: number } = {}) =>
  part(new THREE.TorusGeometry(R, t, 6, o.seg ?? 16, o.arc ?? Math.PI * 2), c, p, o);

/** Apply a parent transform to a list of parts (sub-assemblies built in local space). */
export function place(parts: Part[], p: V3, r?: V3, s?: V3): Part[] {
  const M = composeMatrix(p, r, s);
  for (const pt of parts) pt.M.premultiply(M);
  return parts;
}

export type MergedSet = Partial<Record<MatKey, THREE.BufferGeometry>>;

/** Bake parts into one vertex-coloured geometry per material class. */
export function mergeParts(parts: Part[]): MergedSet {
  const buckets: Partial<Record<MatKey, THREE.BufferGeometry[]>> = {};
  const col = new THREE.Color();
  for (const pt of parts) {
    const g = pt.g.index ? pt.g.toNonIndexed() : pt.g.clone();
    pt.g.dispose();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    g.clearGroups();
    g.applyMatrix4(pt.M);
    col.set(pt.c).multiplyScalar(pt.k);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = col.r;
      arr[i * 3 + 1] = col.g;
      arr[i * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    (buckets[pt.m] ??= []).push(g);
  }
  const out: MergedSet = {};
  (Object.keys(buckets) as MatKey[]).forEach((key) => {
    const list = buckets[key]!;
    const merged = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    if (merged) {
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      out[key] = merged;
    }
  });
  return out;
}

/**
 * Bake "world-space" UVs (tri-planar style, chosen per face normal) so a single texture
 * instance with repeat = 1 tiles consistently across many differently-sized boxes.
 * This avoids cloning textures / mutating .repeat on shared cached textures.
 */
export function applyWorldUV(g: THREE.BufferGeometry, tile: number): THREE.BufferGeometry {
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      u = x;
      v = z;
    } else if (ax >= az) {
      u = z;
      v = y;
    } else {
      u = x;
      v = y;
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Translated box geometry (for world-UV textured merges). */
export function tBox(w: number, h: number, d: number, p: V3, r?: V3): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.applyMatrix4(composeMatrix(p, r));
  return g;
}

/** Merge already-transformed geometries, baking world-space UVs. Inputs are disposed. */
export function mergeWorldUV(geos: THREE.BufferGeometry[], tile: number): THREE.BufferGeometry {
  const list = geos.map((g) => {
    const n = g.index ? g.toNonIndexed() : g.clone();
    g.dispose();
    for (const name of Object.keys(n.attributes)) {
      if (name !== 'position' && name !== 'normal') n.deleteAttribute(name);
    }
    n.clearGroups();
    return applyWorldUV(n, tile);
  });
  const merged = mergeGeometries(list, false)!;
  list.forEach((g) => g.dispose());
  merged.computeBoundingSphere();
  return merged;
}

/** Merge geometries keeping their own UVs (e.g. several copies of a textured plane). */
export function mergeKeepUV(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const list = geos.map((g) => {
    const n = g.index ? g.toNonIndexed() : g.clone();
    g.dispose();
    n.clearGroups();
    return n;
  });
  const merged = mergeGeometries(list, false)!;
  list.forEach((g) => g.dispose());
  merged.computeBoundingSphere();
  return merged;
}

// ---------------------------------------------------------------------------------------
// Shared materials (created lazily, once, never mutated per-frame)
// ---------------------------------------------------------------------------------------

let _mats: Record<MatKey, THREE.Material> | null = null;

export function kitMats(): Record<MatKey, THREE.Material> {
  if (!_mats) {
    _mats = {
      // Tactile painted miniature wood / porcelain finish with soft light response
      matte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48, metalness: 0.02 }),
      // Smooth molded toy lacquer / vinyl plastic
      satin: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.08 }),
      // Bright polished miniature brass / metal
      metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.16, metalness: 0.85 }),
      // Unlit, HDR (colour * k > 1) and not tone-mapped -> picked up by the Bloom pass.
      glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      // Crisp toy glass
      glass: new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        roughness: 0.04,
        metalness: 0.15,
        depthWrite: false,
      }),
    };
  }
  return _mats;
}

const MAT_ORDER: MatKey[] = ['matte', 'satin', 'metal', 'glow', 'glass'];

/** Renders a MergedSet: one mesh per material class present. */
export const Merged: React.FC<{ set: MergedSet; castShadow?: boolean; receiveShadow?: boolean }> = ({
  set,
  castShadow = false,
  receiveShadow = false,
}) => {
  const mats = kitMats();
  return (
    <>
      {MAT_ORDER.map((key) => {
        const g = set[key];
        if (!g) return null;
        const lit = key !== 'glow' && key !== 'glass';
        return (
          <mesh
            key={key}
            geometry={g}
            material={mats[key]}
            castShadow={castShadow && lit}
            receiveShadow={receiveShadow && lit}
            renderOrder={key === 'glass' ? 2 : 0}
          />
        );
      })}
    </>
  );
};

/** Deterministic PRNG so procedural props are identical every load. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
