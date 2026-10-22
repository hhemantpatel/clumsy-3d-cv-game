// The 5x5 field: tilled soil patches + every crop, drawn with a fixed set of
// shared InstancedMeshes (≈12 draw calls for the whole field, independent of
// how many crops are planted). Per-tile animation state lives in a ref array
// and is advanced in a single useFrame, so grid updates never re-create meshes.
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { CropType, DroneState, FarmTile } from '../../../garden/types';
import { WATER_DURATION_TICKS } from '../../../garden/types';
import {
  COLS,
  ROWS,
  SOIL_Y,
  SUN_DIR,
  GEO,
  MAT,
  PALETTE,
  DroneLive,
  makeInstanced,
  smoothstep,
} from './assets';
import type { ParticlePool } from './particles';

const N_TILES = ROWS.length * COLS.length;
const HARVEST_DURATION = 0.75;
const damp = THREE.MathUtils.damp;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface TileAnim {
  /** Crop currently drawn (lags the grid while a harvest animation plays). */
  crop: 'none' | CropType;
  g: number; // smoothed growth 0..1
  wet: number; // smoothed wetness 0..1
  empty: number; // 1 = bare raked soil, 0 = planted
  mature: number; // smoothed "ready to harvest" factor
  removing: boolean;
  t: number; // removal progress 0..1
  fly: boolean; // removal flies the crop up into the drone (real harvest)
  phase: number;
}

// ---------------------------------------------------------------------------
// Instance batch writer + module-level scratch objects (no per-frame allocation)
// ---------------------------------------------------------------------------
interface Batch {
  mesh: THREE.InstancedMesh;
  cap: number;
  n: number;
  colors: boolean;
}

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _tip = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qHead = new THREE.Quaternion();
const _qL = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const Q_ID = new THREE.Quaternion();

/** Current tile transform: origin + uniform scale applied to every part offset/size. */
const T = { x: 0, y: 0, z: 0, s: 1 };

const put = (
  b: Batch,
  ox: number,
  oy: number,
  oz: number,
  q: THREE.Quaternion,
  sx: number,
  sy: number,
  sz: number,
  col?: THREE.Color
) => {
  if (b.n >= b.cap) return;
  _p.set(T.x + ox * T.s, T.y + oy * T.s, T.z + oz * T.s);
  _s.set(sx * T.s, sy * T.s, sz * T.s);
  b.mesh.setMatrixAt(b.n, _m.compose(_p, q, _s));
  if (col && b.colors) b.mesh.setColorAt(b.n, col);
  b.n++;
};

const finish = (b: Batch) => {
  b.mesh.count = b.n;
  b.mesh.visible = b.n > 0;
  if (b.n > 0) {
    b.mesh.instanceMatrix.needsUpdate = true;
    if (b.colors && b.mesh.instanceColor) b.mesh.instanceColor.needsUpdate = true;
  }
};

// Wheat bundle layout: one centre stalk + 6 around it (offset x, offset z, height factor)
const WHEAT_STALKS: [number, number, number][] = [[0, 0, 1]];
for (let k = 0; k < 6; k++) {
  const a = (k / 6) * Math.PI * 2 + 0.3;
  const r = 0.065 + (k % 2) * 0.02;
  WHEAT_STALKS.push([Math.cos(a) * r, Math.sin(a) * r, 0.84 + ((k * 37) % 13) / 100]);
}
const SPARKLE_TOP: Record<CropType, number> = { wheat: 0.52, carrot: 0.32, pumpkin: 0.36, sunflower: 0.78 };
const PETALS = 10;

const tileGrowth = (tile: FarmTile | undefined) => clamp01(tile?.growth ?? 0);
const tileWetTarget = (tile: FarmTile | undefined) => {
  if (!tile) return 0;
  const ticks = typeof tile.waterTicks === 'number' ? tile.waterTicks : tile.watered ? WATER_DURATION_TICKS : 0;
  return ticks > 0 ? 0.45 + 0.55 * clamp01(ticks / WATER_DURATION_TICKS) : 0;
};

// ---------------------------------------------------------------------------
// FX emitters
// ---------------------------------------------------------------------------
const rand = (a: number, b: number) => a + Math.random() * (b - a);

const emitPlant = (bits: ParticlePool, x: number, z: number, dropFromY: number) => {
  for (let i = 0; i < 6; i++) {
    bits.emit(x + rand(-0.04, 0.04), dropFromY, z + rand(-0.04, 0.04), rand(-0.25, 0.25), rand(-0.6, -0.2), rand(-0.25, 0.25), {
      life: 1.2,
      size: 0.014,
      gravity: -5,
      color: PALETTE.seed,
      spin: 6,
    });
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    bits.emit(x + Math.cos(a) * 0.05, SOIL_Y + 0.03, z + Math.sin(a) * 0.05, Math.cos(a) * 0.45, rand(0.1, 0.3), Math.sin(a) * 0.45, {
      life: 0.8,
      size: 0.028,
      gravity: 0.1,
      drag: 3.5,
      grow: 2.4,
      color: PALETTE.dust,
      bounce: 0,
    });
  }
};

const emitPoof = (bits: ParticlePool, x: number, z: number) => {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    bits.emit(x, SOIL_Y + 0.05, z, Math.cos(a) * 0.5, rand(0.2, 0.5), Math.sin(a) * 0.5, {
      life: 0.7,
      size: 0.03,
      gravity: 0.2,
      drag: 3,
      grow: 2.2,
      color: PALETTE.dust,
      bounce: 0,
    });
  }
};

const emitHarvest = (coins: ParticlePool, stars: ParticlePool, x: number, z: number) => {
  const nCoins = 9;
  for (let i = 0; i < nCoins; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = rand(0.35, 0.85);
    coins.emit(x, SOIL_Y + 0.12, z, Math.cos(a) * sp, rand(1.6, 2.5), Math.sin(a) * sp, {
      life: rand(1.1, 1.5),
      size: 0.038,
      gravity: -6.5,
      bounce: 0.35,
      spin: rand(6, 12),
    });
  }
  const nStars = 14;
  for (let i = 0; i < nStars; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = rand(0.5, 1.2);
    stars.emit(x, SOIL_Y + 0.2, z, Math.cos(a) * sp, rand(0.6, 1.6), Math.sin(a) * sp, {
      life: rand(0.6, 1.0),
      size: 0.026,
      gravity: -1.2,
      drag: 1.6,
      spin: 7,
    });
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface FieldProps {
  grid: FarmTile[][];
  drone: DroneState;
  live: DroneLive;
  bits: ParticlePool;
  coins: ParticlePool;
  stars: ParticlePool;
}

export const FieldCrops: React.FC<FieldProps> = React.memo(({ grid, drone, live, bits, coins, stars }) => {
  // Latest props for the frame loop (component itself renders only static primitives).
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const droneRef = useRef(drone);
  droneRef.current = drone;

  const anims = useRef<TileAnim[]>(null as unknown as TileAnim[]);
  if (!anims.current) {
    anims.current = Array.from({ length: N_TILES }, (_, i) => {
      const r = Math.floor(i / COLS.length);
      const c = i % COLS.length;
      const tile = grid[r]?.[c];
      const crop = tile?.crop ?? 'none';
      const g = crop === 'none' ? 0 : tileGrowth(tile);
      return {
        crop,
        g,
        wet: tileWetTarget(tile),
        empty: crop === 'none' ? 1 : 0,
        mature: g >= 0.97 ? 1 : 0,
        removing: false,
        t: 0,
        fly: false,
        phase: ((i * 7919) % 628) / 100,
      };
    });
  }

  const batches = useMemo(() => {
    const mk = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      cap: number,
      colors: boolean,
      shadow?: { cast?: boolean; receive?: boolean }
    ): Batch => ({
      mesh: makeInstanced(geo, mat, cap, { colors, castShadow: shadow?.cast, receiveShadow: shadow?.receive }),
      cap,
      n: 0,
      colors,
    });
    return {
      soil: mk(GEO.soilMound, MAT.soilTinted, N_TILES, true, { receive: true }),
      furrows: mk(GEO.furrow, MAT.soilTinted, N_TILES * 3, true, { receive: true }),
      puddles: mk(GEO.puddle, MAT.puddle, N_TILES, false),
      mounds: mk(GEO.hemi, MAT.soilTinted, N_TILES, true, { receive: true }),
      stems: mk(GEO.stem, MAT.plant, N_TILES * WHEAT_STALKS.length, true),
      ears: mk(GEO.ear, MAT.plant, N_TILES * WHEAT_STALKS.length, true),
      fronds: mk(GEO.frond, MAT.plant, N_TILES * 6, true),
      shoulders: mk(GEO.shoulder, MAT.carrot, N_TILES, false),
      leaves: mk(GEO.leaf, MAT.plantDouble, N_TILES * (2 + PETALS), true),
      fruit: mk(GEO.pumpkin, MAT.pumpkin, N_TILES, true, { cast: true, receive: true }),
      disks: mk(GEO.disk, MAT.sunDisk, N_TILES, false),
      sparkles: mk(GEO.octa, MAT.sparkle, N_TILES * 2, false),
    };
  }, []);
  const batchList = useMemo(() => Object.values(batches), [batches]);
  useEffect(() => () => batchList.forEach((b) => b.mesh.dispose()), [batchList]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const time = state.clock.elapsedTime;
    const B = batches;
    for (const b of batchList) b.n = 0;

    for (let r = 0; r < ROWS.length; r++) {
      for (let c = 0; c < COLS.length; c++) {
        const i = r * COLS.length + c;
        const a = anims.current[i];
        const tile = gridRef.current[r]?.[c];
        const tCrop = tile?.crop ?? 'none';
        const bx = COLS[c];
        const bz = ROWS[r];

        // ---- state transitions (grid -> visuals) ----
        if (tCrop !== a.crop) {
          if (tCrop === 'none') {
            if (!a.removing && a.crop !== 'none') {
              const d = droneRef.current;
              a.removing = true;
              a.t = 0;
              const atDrone = d.x === c && d.y === r;
              // ripe harvest: crop flies up into the drone + coin burst; spoiled/reset: shrink with a dust poof
              a.fly = atDrone && a.g >= 0.97;
              if (a.fly) emitHarvest(coins, stars, bx, bz);
              else if (atDrone) emitPoof(bits, bx, bz);
            }
          } else {
            const d = droneRef.current;
            const atDrone = d.x === c && d.y === r;
            a.crop = tCrop;
            a.g = 0;
            a.removing = false;
            a.t = 0;
            emitPlant(bits, bx, bz, atDrone ? live.y - 0.2 : SOIL_Y + 0.35);
          }
        }

        // ---- smoothing ----
        let S = 1;
        let px = bx;
        let py = SOIL_Y;
        let pz = bz;
        if (a.removing) {
          a.t = Math.min(1, a.t + dt / HARVEST_DURATION);
          if (a.fly) {
            const e = smoothstep(0.12, 1, a.t);
            px = THREE.MathUtils.lerp(bx, live.x, e);
            pz = THREE.MathUtils.lerp(bz, live.z, e);
            py = SOIL_Y + (live.y - 0.25 - SOIL_Y) * e + Math.sin(Math.min(a.t / 0.25, 1) * Math.PI) * 0.06;
            S = a.t < 0.15 ? 1 + a.t * 1.2 : 1.18 * (1 - smoothstep(0.15, 1, a.t));
          } else {
            S = 1 - smoothstep(0, 1, a.t);
          }
          if (a.t >= 1) {
            a.removing = false;
            a.crop = 'none';
            a.g = 0;
            a.mature = 0;
          }
        } else if (a.crop !== 'none') {
          a.g = damp(a.g, tileGrowth(tile), 2.2, dt);
        }
        a.wet = damp(a.wet, tileWetTarget(tile), 2.5, dt);
        a.empty = damp(a.empty, tCrop === 'none' ? 1 : 0, 3, dt);
        a.mature = damp(a.mature, !a.removing && a.crop !== 'none' && a.g >= 0.97 ? 1 : 0, 3, dt);

        // ---- soil ----
        T.x = bx;
        T.y = SOIL_Y;
        T.z = bz;
        T.s = 1;
        _c.copy(PALETTE.soilDry).lerp(PALETTE.soilWet, a.wet);
        put(B.soil, 0, 0, 0, Q_ID, 1, 1, 1, _c);
        if (a.wet > 0.02) {
          const w = a.wet * (1 + 0.04 * Math.sin(time * 2 + a.phase));
          put(B.puddles, 0.05 * Math.sin(a.phase), 0.002, 0.06 * Math.cos(a.phase), Q_ID, 0.19 * w, 1, 0.13 * w);
        }
        if (a.empty > 0.02) {
          _c.copy(PALETTE.furrow).lerp(PALETTE.soilWet, a.wet * 0.85);
          for (let k = -1; k <= 1; k++) put(B.furrows, k * 0.13, -0.006, 0, Q_ID, 0.04, 0.02 * a.empty, 0.52, _c);
        }
        const planted = 1 - a.empty;
        if (planted > 0.02) {
          _c.copy(PALETTE.seedMound).lerp(PALETTE.soilWet, a.wet * 0.7);
          put(B.mounds, 0, -0.006, 0, Q_ID, 0.1 * planted, 0.035 * planted, 0.1 * planted, _c);
        }

        if (a.crop === 'none') continue;

        // ---- crop ----
        const g = a.g;
        const gh = 1 - (1 - g) * (1 - g); // fast early, eases into maturity
        const breathe = a.mature * Math.sin(time * 2.6 + a.phase);
        T.x = px;
        T.y = py + a.mature * 0.008 * (0.5 + 0.5 * breathe);
        T.z = pz;
        T.s = S * (1 + 0.025 * breathe);
        if (T.s < 0.001) continue;
        const wind = Math.sin(time * 1.6 + bx * 1.1 + bz * 0.7) * 0.6 + Math.sin(time * 2.7 + a.phase) * 0.25;

        switch (a.crop) {
          case 'wheat': {
            const es = smoothstep(0.4, 0.85, g);
            const ripe = smoothstep(0.7, 1, g);
            const amp = 0.04 + 0.14 * g;
            for (let k = 0; k < WHEAT_STALKS.length; k++) {
              const [ox, oz, hf] = WHEAT_STALKS[k];
              const h = (0.035 + 0.38 * gh) * hf;
              const w = wind + Math.sin(time * 3.1 + k * 1.7) * 0.15;
              _q.setFromEuler(_e.set(oz * 1.4 + w * amp * 0.3, 0, -ox * 1.4 - w * amp, 'XYZ'));
              _c.copy(PALETTE.sprout).lerp(PALETTE.wheatStalk, ripe);
              put(B.stems, ox, 0, oz, _q, 0.008 * (0.6 + 0.4 * g), h, 0.008 * (0.6 + 0.4 * g), _c);
              if (es > 0.01) {
                _tip.set(0, h + 0.05 * es, 0).applyQuaternion(_q);
                _c.copy(PALETTE.wheatEarYoung).lerp(PALETTE.wheatEarRipe, ripe);
                put(B.ears, ox + _tip.x, _tip.y, oz + _tip.z, _q, 0.02 * es, 0.065 * es, 0.02 * es, _c);
              }
            }
            break;
          }
          case 'carrot': {
            const reveal = smoothstep(0.5, 1, g);
            const crownY = reveal * 0.035;
            const sz = 0.35 + 0.65 * g;
            if (g > 0.12) put(B.shoulders, 0, crownY, 0, Q_ID, 0.045 * sz, 0.16 * sz, 0.045 * sz);
            _c.copy(PALETTE.sprout).lerp(PALETTE.carrotFrond, g);
            for (let k = 0; k < 6; k++) {
              const yaw = (k * Math.PI) / 3 + a.phase;
              const sway = Math.sin(time * 2.1 + k + bx) * 0.07 * g + wind * 0.04;
              const h = (0.03 + 0.22 * gh) * (k % 2 ? 0.82 : 1);
              _q.setFromEuler(_e.set(0.22 + 0.32 * g + sway, yaw, 0, 'YXZ'));
              put(B.fronds, Math.sin(yaw) * 0.012, crownY, Math.cos(yaw) * 0.012, _q, 0.026 * (0.5 + 0.5 * g), h, 0.01, _c);
            }
            break;
          }
          case 'pumpkin': {
            _c.copy(PALETTE.vine);
            for (let j = 0; j < 2; j++) {
              const yaw = a.phase + j * 2.5;
              _q.setFromEuler(_e.set(0, yaw, -Math.PI / 2, 'YXZ'));
              put(B.stems, 0, 0.01, 0, _q, 0.009, 0.05 + 0.22 * gh, 0.009, _c);
            }
            for (let j = 0; j < 3; j++) {
              const yaw = a.phase + j * 2.1 + 0.4;
              const lift = 0.35 + Math.sin(time * 1.5 + j + a.phase) * 0.06 * g;
              _q.setFromEuler(_e.set(-lift, yaw, 0, 'YXZ'));
              const ls = 0.3 + 1.0 * gh;
              put(B.leaves, Math.sin(yaw) * 0.05, 0.01, Math.cos(yaw) * 0.05, _q, ls, ls, ls, PALETTE.leafDark);
            }
            if (g > 0.08) {
              const fs = 0.025 + 0.135 * Math.pow(smoothstep(0.08, 1, g), 1.3);
              _q.setFromAxisAngle(UP, a.phase);
              _c.copy(PALETTE.pumpkinYoung).lerp(PALETTE.pumpkinRipe, smoothstep(0.55, 0.95, g));
              put(B.fruit, 0.02, -0.012, 0, _q, fs, fs * 0.92, fs, _c);
              const k = fs / 0.16;
              _q.setFromEuler(_e.set(0.15, 0, 0.2));
              put(B.stems, 0.02, fs * 1.08 - 0.012, 0, _q, 0.013 * k, 0.07 * k, 0.013 * k, PALETTE.pumpkinStem);
            }
            break;
          }
          case 'sunflower': {
            const H = 0.05 + 0.58 * gh;
            const sway = Math.sin(time * 1.3 + bx + bz) * 0.035 * g + wind * 0.015;
            _q.setFromEuler(_e.set(sway * 0.5, 0, sway));
            put(B.stems, 0, 0, 0, _q, 0.014 * (0.5 + 0.5 * g), H, 0.014 * (0.5 + 0.5 * g), PALETTE.sunStem);
            // leaves
            for (let j = 0; j < 2; j++) {
              _v.set(0, H * (0.32 + j * 0.24), 0).applyQuaternion(_q);
              const yaw = a.phase + j * Math.PI;
              _qL.setFromEuler(_e.set(0.2 - 0.15 * j, yaw, 0, 'YXZ'));
              const ls = 0.35 + 0.75 * gh;
              put(B.leaves, _v.x, _v.y, _v.z, _qL, ls, ls, ls, PALETTE.leaf);
            }
            // head
            const hs = smoothstep(0.3, 0.8, g);
            if (hs > 0.01) {
              const open = smoothstep(0.78, 1, g);
              _tip.set(0, H, 0).applyQuaternion(_q);
              _dir.copy(UP).lerp(SUN_DIR, 0.15 + 0.85 * open);
              _dir.x += sway * 0.5;
              _dir.normalize();
              _qHead.setFromUnitVectors(UP, _dir);
              const rDisk = (0.03 + 0.04 * open) * hs;
              put(B.disks, _tip.x + _dir.x * 0.012, _tip.y + _dir.y * 0.012, _tip.z + _dir.z * 0.012, _qHead, rDisk, 0.028 * hs, rDisk);
              _c.copy(PALETTE.petalBud).lerp(PALETTE.petal, open);
              const fold = (1 - open) * 1.25;
              const pl = (0.25 + 0.2 * open) * hs;
              for (let k = 0; k < PETALS; k++) {
                const yaw = (k / PETALS) * Math.PI * 2 + a.phase;
                _qL.setFromEuler(_e.set(-fold, yaw, 0, 'YXZ'));
                _q2.copy(_qHead).multiply(_qL);
                _v.set(Math.sin(yaw) * rDisk * 0.85, 0.004, Math.cos(yaw) * rDisk * 0.85).applyQuaternion(_qHead);
                put(B.leaves, _tip.x + _v.x, _tip.y + _v.y, _tip.z + _v.z, _q2, pl * 0.7, pl * 0.5, pl, _c);
              }
            }
            break;
          }
        }

        // ---- "ready to harvest" sparkles ----
        if (a.mature > 0.02 && !a.removing) {
          const top = SPARKLE_TOP[a.crop];
          T.s = 1;
          for (let k = 0; k < 2; k++) {
            const ang = time * 1.4 + a.phase + k * Math.PI;
            const sc = 0.016 * a.mature * (0.55 + 0.45 * Math.sin(time * 6 + k * 3 + a.phase));
            _q.setFromEuler(_e.set(time * 2, time * 3 + k, 0));
            put(B.sparkles, Math.cos(ang) * 0.2, top + 0.05 * Math.sin(time * 2 + k * 2), Math.sin(ang) * 0.2, _q, sc, sc * 1.6, sc);
          }
        }
      }
    }

    for (const b of batchList) finish(b);
  });

  return (
    <group>
      {batchList.map((b) => (
        <primitive key={b.mesh.uuid} object={b.mesh} />
      ))}
    </group>
  );
});
FieldCrops.displayName = 'FieldCrops';
