// Pooled, allocation-free particle system rendered as a single InstancedMesh.
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { makeInstanced } from './assets';

export interface EmitOptions {
  life: number;
  size: number;
  gravity?: number;
  drag?: number;
  /** Size multiplier reached at end of life (1 = constant, >1 = puff that grows). */
  grow?: number;
  /** Bounce restitution when hitting the floor; <0 kills the particle on contact. */
  bounce?: number;
  color?: THREE.Color;
  spin?: number;
}

/** Fixed-capacity ring buffer of particles. All storage is preallocated. */
export class ParticlePool {
  readonly cap: number;
  readonly pos: Float32Array;
  readonly vel: Float32Array;
  readonly col: Float32Array;
  readonly life: Float32Array;
  readonly maxLife: Float32Array;
  readonly size: Float32Array;
  readonly gravity: Float32Array;
  readonly drag: Float32Array;
  readonly grow: Float32Array;
  readonly bounce: Float32Array;
  readonly spin: Float32Array;
  readonly rot: Float32Array;
  private next = 0;

  constructor(cap: number) {
    this.cap = cap;
    this.pos = new Float32Array(cap * 3);
    this.vel = new Float32Array(cap * 3);
    this.col = new Float32Array(cap * 3).fill(1);
    this.life = new Float32Array(cap);
    this.maxLife = new Float32Array(cap).fill(1);
    this.size = new Float32Array(cap);
    this.gravity = new Float32Array(cap);
    this.drag = new Float32Array(cap);
    this.grow = new Float32Array(cap).fill(1);
    this.bounce = new Float32Array(cap);
    this.spin = new Float32Array(cap);
    this.rot = new Float32Array(cap);
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, o: EmitOptions) {
    const i = this.next;
    this.next = (this.next + 1) % this.cap;
    const i3 = i * 3;
    this.pos[i3] = x;
    this.pos[i3 + 1] = y;
    this.pos[i3 + 2] = z;
    this.vel[i3] = vx;
    this.vel[i3 + 1] = vy;
    this.vel[i3 + 2] = vz;
    this.life[i] = o.life;
    this.maxLife[i] = o.life;
    this.size[i] = o.size;
    this.gravity[i] = o.gravity ?? -6;
    this.drag[i] = o.drag ?? 0;
    this.grow[i] = o.grow ?? 1;
    this.bounce[i] = o.bounce ?? -1;
    this.spin[i] = o.spin ?? 0;
    this.rot[i] = Math.random() * Math.PI * 2;
    if (o.color) {
      this.col[i3] = o.color.r;
      this.col[i3 + 1] = o.color.g;
      this.col[i3 + 2] = o.color.b;
    }
  }
}

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();

interface LayerProps {
  pool: ParticlePool;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  floorY: number;
  colors?: boolean;
  castShadow?: boolean;
}

/** Simulates + draws one pool. One draw call regardless of particle count. */
export const ParticleLayer: React.FC<LayerProps> = React.memo(({ pool, geometry, material, floorY, colors, castShadow }) => {
  const mesh = useMemo(
    () => makeInstanced(geometry, material, pool.cap, { colors, castShadow }),
    [geometry, material, pool, colors, castShadow]
  );
  useEffect(() => () => mesh.dispose(), [mesh]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    let n = 0;
    const { pos, vel, life } = pool;
    for (let i = 0; i < pool.cap; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      if (life[i] <= 0) continue;
      const i3 = i * 3;
      const drag = Math.exp(-pool.drag[i] * dt);
      vel[i3] *= drag;
      vel[i3 + 2] *= drag;
      vel[i3 + 1] = vel[i3 + 1] * drag + pool.gravity[i] * dt;
      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;
      if (pos[i3 + 1] < floorY && vel[i3 + 1] < 0) {
        if (pool.bounce[i] < 0) {
          life[i] = 0;
          continue;
        }
        pos[i3 + 1] = floorY;
        vel[i3 + 1] *= -pool.bounce[i];
        vel[i3] *= 0.6;
        vel[i3 + 2] *= 0.6;
      }
      pool.rot[i] += pool.spin[i] * dt;
      const t = 1 - life[i] / pool.maxLife[i]; // 0 -> 1 over lifetime
      const fadeIn = Math.min(1, t * 8);
      const fadeOut = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      const sc = pool.size[i] * fadeIn * fadeOut * (1 + (pool.grow[i] - 1) * t);
      _p.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
      _q.setFromEuler(_e.set(pool.rot[i] * 0.6, pool.rot[i], 0));
      _s.setScalar(sc);
      mesh.setMatrixAt(n, _m.compose(_p, _q, _s));
      if (colors) mesh.setColorAt(n, _c.setRGB(pool.col[i3], pool.col[i3 + 1], pool.col[i3 + 2]));
      n++;
    }
    mesh.count = n;
    mesh.visible = n > 0;
    if (n > 0) {
      mesh.instanceMatrix.needsUpdate = true;
      if (colors && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return <primitive object={mesh} />;
});
ParticleLayer.displayName = 'ParticleLayer';
