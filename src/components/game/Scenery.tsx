import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GeoBuilder, PRIM, between, makeRng, taperedCyl, V3 } from './env/GeoBuilder';
import { PALETTE } from './env/palette';
import { getEnvMaterial, getGlowMaterial, makeEnvMesh } from './env/materials';
import { addBirch, addDeciduousTree, addPine, addRock, addWillow, addFlowerClump } from './env/builders';
import { bindWaterTime, createWaterMaterial } from './env/water';

/**
 * Countryside around the yard: winding lane with split-rail fence and signpost, river with
 * pier, rowboat, lily pads and an arched footbridge, hay bales & cart, campsite, wishing well,
 * sheep, willows / birches / pine forest, rolling hills, mountains, windmill, cottages,
 * hot-air balloon and drifting clouds.
 *
 * Draw calls: near static (shadowed) + far static + water + fire glow + windmill sails
 * + boat + balloon + balloon glow + clouds = 9 (was ~450 separate meshes).
 */

// ---------------------------------------------------------------------------
// Shared layout curves
// ---------------------------------------------------------------------------
const RIVER_HALF = 6;
function riverX(z: number): number {
  return -30 + 0.182 * z + 1.6 * Math.sin(z * 0.045);
}
const ROAD_Z0 = 12.75;
function roadProgress(z: number): number {
  return (z - 12.8) / 39.2;
}
function roadX(z: number): number {
  return Math.sin(roadProgress(z) * Math.PI * 1.5) * 6.5;
}
function roadWidth(z: number): number {
  return 2.6 - Math.min(Math.max(roadProgress(z), 0), 1) * 0.4;
}
function slope(fn: (z: number) => number, z: number): number {
  return (fn(z + 0.01) - fn(z - 0.01)) / 0.02;
}

/**
 * Continuous ribbon along a centre-line x = cx(z), offsets measured perpendicular to the curve
 * (so curves are smooth, no notched segments). uv.x = 0..1 across, uv.y = metres along.
 */
function ribbonGeometry(
  cx: (z: number) => number, off0: number, off1: number, z0: number, z1: number, step: number, y: number,
  widthScale: (z: number) => number = () => 1,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let n = 0;
  for (let z = z0; z <= z1 + 1e-6; z += step) {
    const s = slope(cx, z);
    const len = Math.hypot(1, s);
    const nx = 1 / len;
    const nz = -s / len;
    const ws = widthScale(z);
    const x = cx(z);
    pos.push(x + nx * off0 * ws, y, z + nz * off0 * ws, x + nx * off1 * ws, y, z + nz * off1 * ws);
    uv.push(0, z, 1, z);
    if (n > 0) {
      const a = (n - 1) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    n++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// Shared special geometries
const TENT = new THREE.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 2);
const HALF_LOG = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false, 0, Math.PI);
const WHEEL = new THREE.TorusGeometry(1, 0.12, 5, 12);
const BALLOON = new THREE.LatheGeometry(
  [
    [0.45, 0.0], [0.95, 0.6], [1.7, 1.7], [2.15, 2.8], [2.25, 3.4], [2.05, 4.1], [1.55, 4.7], [0.85, 5.05], [0.0, 5.2],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  12,
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const BALLOON_BASE: V3 = [42, 44, -22];
const WINDMILL_BASE: V3 = [62, 6.6, -35];
const WINDMILL_YAW = Math.atan2(-62, 35);
const WINDMILL_SCALE = 1.6;
const FIRE_POS: V3 = [32.6, 0.08, 16.5];

export const Scenery: React.FC = () => {
  const built = useMemo(() => buildScenery(), []);
  const sailsRef = useRef<THREE.Mesh>(null);
  const boatRef = useRef<THREE.Group>(null);
  const balloonRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const fireRef = useRef<THREE.Mesh>(null);

  useEffect(() => () => {
    built.near.geometry.dispose();
    built.far.geometry.dispose();
    built.waterGeo.dispose();
    built.waterMat.dispose();
    built.fireGeo.dispose();
    built.sailsGeo.dispose();
    built.boatGeo.dispose();
    built.balloonGeo.dispose();
    built.balloonGlowGeo.dispose();
    (built.clouds.material as THREE.Material).dispose();
  }, [built]);

  // Single animation hook for all scenery motion (no allocations)
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (sailsRef.current) sailsRef.current.rotation.z += delta * 0.9;
    if (boatRef.current) {
      boatRef.current.position.y = 0.04 + Math.sin(t * 1.8) * 0.025;
      boatRef.current.rotation.z = Math.sin(t * 1.4) * 0.04;
      boatRef.current.rotation.x = Math.cos(t * 1.2) * 0.03;
    }
    if (balloonRef.current) {
      balloonRef.current.position.y = BALLOON_BASE[1] + Math.sin(t * 0.5) * 1.2;
      balloonRef.current.position.x = BALLOON_BASE[0] + Math.cos(t * 0.2) * 2.5;
      balloonRef.current.rotation.y = t * 0.05;
    }
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.004;
    if (fireRef.current) {
      const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
      fireRef.current.scale.set(1 + (f - 1) * 0.5, f, 1 + (f - 1) * 0.5);
    }
  });

  const envMat = getEnvMaterial();
  const glowMat = getGlowMaterial();

  return (
    <group>
      <primitive object={built.near} />
      <primitive object={built.far} />
      <mesh geometry={built.waterGeo} material={built.waterMat} />
      <mesh ref={fireRef} geometry={built.fireGeo} material={glowMat} position={FIRE_POS} />

      {/* Windmill sails (body is part of the far mesh) */}
      <group
        position={[
          WINDMILL_BASE[0] + Math.sin(WINDMILL_YAW) * 1.2 * WINDMILL_SCALE,
          WINDMILL_BASE[1] + 4.6 * WINDMILL_SCALE,
          WINDMILL_BASE[2] + Math.cos(WINDMILL_YAW) * 1.2 * WINDMILL_SCALE,
        ]}
        rotation={[0, WINDMILL_YAW, 0]}
        scale={WINDMILL_SCALE}
      >
        <mesh ref={sailsRef} geometry={built.sailsGeo} material={envMat} />
      </group>

      <group ref={boatRef} position={built.boatPos} rotation={[0, 0.12, 0]}>
        <mesh geometry={built.boatGeo} material={envMat} />
      </group>

      <group ref={balloonRef} position={BALLOON_BASE} scale={1.8}>
        <mesh geometry={built.balloonGeo} material={envMat} />
        <mesh geometry={built.balloonGlowGeo} material={glowMat} />
      </group>

      <group ref={cloudsRef}>
        <primitive object={built.clouds} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------
function buildScenery() {
  const near = new GeoBuilder(11);
  const far = new GeoBuilder(23);
  const fire = new GeoBuilder(5);

  buildRoad(near);
  buildSignpost(near, 3.4, 14.6);
  const well = new GeoBuilder(31);
  buildWell(well);
  near.append(well, { pos: [-16, 0, 16], rot: [0, 0.5, 0] });

  buildRiverBanks(far);
  const boatPos = buildDock(far);
  const bridgeZ = -22;
  const bridge = new GeoBuilder(41);
  buildBridge(bridge);
  far.append(bridge, { pos: [riverX(bridgeZ), 0, bridgeZ], rot: [0, Math.atan(slope(riverX, bridgeZ)), 0] });

  const hay = new GeoBuilder(51);
  buildHayAndCart(hay);
  far.append(hay, { pos: [18, 0, 22] });

  const camp = new GeoBuilder(61);
  buildCampsite(camp, fire);
  far.append(camp, { pos: [30, 0, 16] });

  const sheep = new GeoBuilder(71);
  buildSheep(sheep, false);
  const sheepEating = new GeoBuilder(72);
  buildSheep(sheepEating, true);
  far.append(sheep, { pos: [-18, 0, 32], rot: [0, 0.6, 0], scale: 0.9 });
  far.append(sheepEating, { pos: [-15, 0, 35], rot: [0, -0.8, 0], scale: 0.9 });
  far.append(sheep, { pos: [24, 0, 36], rot: [0, -0.4, 0], scale: 0.9 });
  far.append(sheepEating, { pos: [27, 0, 33], rot: [0, 1.2, 0], scale: 0.9 });
  far.append(sheepEating, { pos: [21, 0, 39], rot: [0, 2.4, 0], scale: 0.8 });

  buildTrees(far);
  buildLandscape(far);

  const windmill = new GeoBuilder(81);
  buildWindmillBody(windmill);
  far.append(windmill, { pos: WINDMILL_BASE, rot: [0, WINDMILL_YAW, 0], scale: WINDMILL_SCALE });

  const cottages: [number, number, number, string, string][] = [
    [52, 42, 0.3, PALETTE.roofRed, PALETTE.cream],
    [59, 38, -0.2, PALETTE.roofBrown, '#eef0ec'],
    [56, 48, 0.6, PALETTE.roofBlue, '#f6e3e3'],
  ];
  for (const [x, z, yaw, roof, wall] of cottages) {
    const c = new GeoBuilder(Math.floor(x * 7 + z));
    buildCottage(c, roof, wall);
    far.append(c, { pos: [x, 0, z], rot: [0, yaw, 0], scale: 1.4 });
  }

  // Meshes
  const nearMesh = makeEnvMesh(near.build(), { castShadow: true, receiveShadow: true });
  nearMesh.name = 'scenery-near';
  const farMesh = makeEnvMesh(far.build());
  farMesh.name = 'scenery-far';

  const waterGeo = ribbonGeometry(riverX, -RIVER_HALF, RIVER_HALF, -110, 110, 2, 0.05);
  const waterMat = createWaterMaterial(RIVER_HALF * 2);
  bindWaterTime(waterMat);

  const sails = new GeoBuilder(91);
  buildSails(sails);
  const boat = new GeoBuilder(92);
  buildBoat(boat);
  const balloon = new GeoBuilder(93);
  const balloonGlow = new GeoBuilder(94);
  buildBalloon(balloon, balloonGlow);

  return {
    near: nearMesh,
    far: farMesh,
    waterGeo,
    waterMat,
    fireGeo: fire.build(),
    sailsGeo: sails.build(),
    boatGeo: boat.build(),
    boatPos,
    balloonGeo: balloon.build(),
    balloonGlowGeo: balloonGlow.build(),
    clouds: buildClouds(),
  };
}

// --- Lane ------------------------------------------------------------------
function buildRoad(b: GeoBuilder): void {
  const r = b.rng;
  const zEnd = 80;
  b.add(ribbonGeometry(roadX, -0.5, 0.5, ROAD_Z0, zEnd, 0.5, 0.02, roadWidth), {
    color: PALETTE.dirt, facetJitter: 0.07,
  });
  // Soft darker wheel ruts and a grassy crown down the middle
  for (const o of [-0.28, 0.28]) {
    b.add(ribbonGeometry(roadX, o - 0.06, o + 0.06, ROAD_Z0 + 0.4, zEnd, 0.5, 0.024, roadWidth), {
      color: PALETTE.dirtDark, facetJitter: 0.05,
    });
  }
  b.add(ribbonGeometry(roadX, -0.05, 0.05, ROAD_Z0 + 2.5, zEnd, 0.5, 0.028, roadWidth), {
    color: PALETTE.meadowB, facetJitter: 0.1,
  });
  // Pebbles along both verges
  for (let z = ROAD_Z0 + 0.6; z < 60; z += 0.9 + r() * 0.8) {
    const side = r() < 0.5 ? -1 : 1;
    const s = slope(roadX, z);
    const len = Math.hypot(1, s);
    const off = side * (roadWidth(z) / 2 + 0.12 + r() * 0.2);
    addRock(b, roadX(z) + off / len, z - (s * off) / len, 0.06 + r() * 0.08);
  }
  // Split-rail fence along the left verge
  const posts: V3[] = [];
  for (let z = 19; z <= 49; z += 3) {
    const s = slope(roadX, z);
    const len = Math.hypot(1, s);
    const off = -(roadWidth(z) / 2 + 0.9);
    posts.push([roadX(z) + off / len, 0, z - (s * off) / len]);
  }
  posts.forEach((p, i) => {
    b.add(taperedCyl(0.8, 6), { pos: [p[0], 0.5, p[2]], rot: [0, r(), 0], scale: [0.08, 1.0, 0.08], color: PALETTE.woodDark, facetJitter: 0.08 });
    if (i === 0) return;
    const q = posts[i - 1];
    for (const y of [0.42, 0.78]) {
      const seg = between([q[0], y + (r() - 0.5) * 0.04, q[2]], [p[0], y + (r() - 0.5) * 0.04, p[2]]);
      b.add(PRIM.cyl6, { pos: seg.pos, rot: seg.rot, scale: [0.045, seg.len + 0.2, 0.045], color: PALETTE.wood, facetJitter: 0.06 });
    }
  });
}

function buildSignpost(b: GeoBuilder, x: number, z: number): void {
  addRock(b, x, z, 0.28, 0.7);
  b.add(taperedCyl(0.85, 6), { pos: [x, 1.0, z], scale: [0.075, 2.0, 0.075], color: PALETTE.woodDark, facetJitter: 0.06 });
  b.add(PRIM.cone4, { pos: [x, 2.06, z], scale: [0.1, 0.12, 0.1], color: PALETTE.woodDark });
  const signs: [number, number, number, string][] = [
    [1.75, 0.95, Math.PI, PALETTE.woodLight], // toward the river / west
    [1.42, 0.85, 0.15, PALETTE.wood], // toward the campsite / east
    [1.12, 0.75, -Math.PI / 2 + 0.2, PALETTE.woodLight], // up the lane
  ];
  for (const [y, w, yaw, color] of signs) {
    const dx = Math.cos(yaw);
    const dz = -Math.sin(yaw);
    b.add(PRIM.box, { pos: [x + dx * (w / 2 + 0.05), y, z + dz * (w / 2 + 0.05)], rot: [0, yaw, 0], scale: [w, 0.19, 0.045], color, facetJitter: 0.05 });
    b.add(PRIM.cone4, {
      pos: [x + dx * (w + 0.1), y, z + dz * (w + 0.1)], rot: [0, yaw, -Math.PI / 2], scale: [0.135, 0.14, 0.032], color,
    });
  }
}

function buildWell(b: GeoBuilder): void {
  const r = b.rng;
  // Stacked river-stone wall
  for (let ring = 0; ring < 3; ring++) {
    const count = 11;
    for (let i = 0; i < count; i++) {
      const a = ((i + ring * 0.5) / count) * Math.PI * 2;
      b.add(PRIM.dodeca, {
        pos: [Math.cos(a) * 0.85, 0.15 + ring * 0.27, Math.sin(a) * 0.85], rot: [r(), -a, r()],
        scale: [0.2, 0.15, 0.27], color: [PALETTE.stone, PALETTE.stoneLight, PALETTE.stoneDark][(i + ring) % 3],
        facetJitter: 0.1, wobble: 0.12,
      });
    }
  }
  b.add(PRIM.cyl12, { pos: [0, 0.4, 0], scale: [0.8, 0.8, 0.8], color: PALETTE.stoneDark });
  b.add(PRIM.cyl12, { pos: [0, 0.6, 0], scale: [0.72, 0.02, 0.72], color: PALETTE.waterDeep });
  for (const sx of [-1, 1]) {
    b.add(PRIM.box, { pos: [sx * 0.85, 1.35, 0], scale: [0.12, 1.7, 0.12], color: PALETTE.wood, facetJitter: 0.06 });
  }
  b.add(PRIM.cyl6, { pos: [0, 1.65, 0], rot: [0, 0, Math.PI / 2], scale: [0.06, 1.7, 0.06], color: PALETTE.woodDark });
  b.add(PRIM.box, { pos: [-0.47, 2.4, 0], rot: [0, 0, Math.PI / 5], scale: [1.25, 0.08, 1.7], color: PALETTE.roofRed, facetJitter: 0.05 });
  b.add(PRIM.box, { pos: [0.47, 2.4, 0], rot: [0, 0, -Math.PI / 5], scale: [1.25, 0.08, 1.7], color: PALETTE.roofRed, facetJitter: 0.05 });
  b.add(PRIM.cyl6, { pos: [0, 1.3, 0], scale: [0.012, 0.7, 0.012], color: PALETTE.woodLight });
  b.add(taperedCyl(1.2, 8), { pos: [0, 0.85, 0], scale: [0.13, 0.24, 0.13], color: PALETTE.wood });
  addFlowerClump(b, 1.2, 0.6, PALETTE.flowers[3], 5);
  addFlowerClump(b, -1.1, -0.7, PALETTE.flowers[0], 4);
}

// --- River -----------------------------------------------------------------
function buildRiverBanks(b: GeoBuilder): void {
  const r = b.rng;
  b.add(ribbonGeometry(riverX, -RIVER_HALF - 2.4, -RIVER_HALF + 0.6, -110, 110, 2, 0.03), { color: PALETTE.sand, facetJitter: 0.06 });
  b.add(ribbonGeometry(riverX, RIVER_HALF - 0.6, RIVER_HALF + 2.4, -110, 110, 2, 0.03), { color: PALETTE.sand, facetJitter: 0.06 });
  for (let i = 0; i < 46; i++) {
    const z = -70 + r() * 140;
    const side = r() < 0.5 ? -1 : 1;
    addRock(b, riverX(z) + side * (RIVER_HALF + 0.3 + r() * 1.8), z, 0.15 + r() * 0.35);
  }
  // Reeds near the banks
  for (let i = 0; i < 40; i++) {
    const z = -40 + r() * 80;
    const side = r() < 0.5 ? -1 : 1;
    const x = riverX(z) + side * (RIVER_HALF + 0.2 + r() * 0.6);
    for (let k = 0; k < 4; k++) {
      const h = 0.7 + r() * 0.6;
      b.add(PRIM.cone5, {
        pos: [x + (r() - 0.5) * 0.4, h / 2, z + (r() - 0.5) * 0.4], rot: [(r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3],
        scale: [0.04, h, 0.04], color: PALETTE.willow[k % 3], wind: 5,
      });
    }
  }
}

/** Pier on the east bank near z=5; returns the rowboat's world position. */
function buildDock(b: GeoBuilder): V3 {
  const z = 5;
  const bank = riverX(z) + RIVER_HALF;
  const yDeck = 0.32;
  for (let k = 0; k < 9; k++) {
    const x = bank + 1.2 - 0.27 - k * 0.54;
    b.add(PRIM.box, {
      pos: [x, yDeck, z], rot: [0, (b.rng() - 0.5) * 0.03, 0], scale: [0.5, 0.09, 1.8],
      color: k % 2 ? PALETTE.wood : PALETTE.woodLight, facetJitter: 0.06,
    });
  }
  for (const px of [bank + 0.9, bank - 1.3, bank - 3.5]) {
    for (const pz of [-0.82, 0.82]) {
      b.add(PRIM.cyl6, { pos: [px, 0.15, z + pz], scale: [0.09, 0.9, 0.09], color: PALETTE.woodDark });
    }
  }
  b.add(PRIM.cyl8, { pos: [bank - 3.5, yDeck + 0.2, z - 0.82], scale: [0.09, 0.32, 0.09], color: PALETTE.charcoal });
  b.add(PRIM.cyl8, { pos: [bank - 3.5, yDeck + 0.2, z + 0.82], scale: [0.09, 0.32, 0.09], color: PALETTE.charcoal });
  b.add(taperedCyl(1.25, 10), { pos: [bank - 1.0, yDeck + 0.18, z + 0.55], scale: [0.12, 0.26, 0.12], color: PALETTE.balloon[3] });
  const rod = between([bank - 1.6, yDeck + 0.06, z + 0.6], [bank - 3.0, yDeck + 1.0, z + 1.3]);
  b.add(PRIM.cyl6, { pos: rod.pos, rot: rod.rot, scale: [0.018, rod.len, 0.018], color: PALETTE.woodLight });

  // Lily pads with lotus blossoms
  const pads: [number, number][] = [[2.2, 2.0], [2.9, 2.8], [3.8, -1.4], [1.6, 9.2], [2.4, 10.0], [4.2, 12.5], [1.8, -4.0]];
  pads.forEach(([dIn, pz], i) => {
    const x = riverX(pz) + RIVER_HALF - dIn;
    b.add(PRIM.cyl12, { pos: [x, 0.065, pz], scale: [0.36 + (i % 3) * 0.07, 0.02, 0.36 + (i % 3) * 0.07], color: PALETTE.leaf, facetJitter: 0.06 });
    if (i % 2 === 0) b.add(PRIM.ico1, { pos: [x + 0.05, 0.12, pz], scale: [0.11, 0.07, 0.11], color: PALETTE.blossom[1] });
  });
  return [bank - 2.4, 0.04, z + 1.75];
}

function buildBridge(b: GeoBuilder): void {
  const span = 8.4;
  const rise = 1.35;
  const archY = (x: number) => 0.25 + rise * (1 - (x / span) ** 2);
  const planks = 26;
  for (let k = 0; k < planks; k++) {
    const x = -span + 0.3 + k * ((2 * span - 0.6) / (planks - 1));
    const s = (-2 * rise * x) / (span * span);
    b.add(PRIM.box, {
      pos: [x, archY(x), 0], rot: [0, 0, Math.atan(s)], scale: [0.58, 0.1, 2.1],
      color: k % 3 === 0 ? PALETTE.woodLight : PALETTE.wood, facetJitter: 0.06,
    });
  }
  const steps = 12;
  for (const zz of [-0.95, 0.95]) {
    for (let k = 0; k < steps; k++) {
      const xa = -span + (k / steps) * 2 * span;
      const xb = -span + ((k + 1) / steps) * 2 * span;
      const beam = between([xa, archY(xa) - 0.18, zz], [xb, archY(xb) - 0.18, zz]);
      b.add(PRIM.box, { pos: beam.pos, rot: beam.rot, scale: [0.22, beam.len + 0.05, 0.16], color: PALETTE.woodDark });
    }
    const postsX = [-7.6, -5.2, -2.6, 0, 2.6, 5.2, 7.6];
    postsX.forEach((px, i) => {
      b.add(PRIM.box, { pos: [px, archY(px) + 0.45, zz * 1.04], scale: [0.11, 0.9, 0.11], color: PALETTE.woodDark });
      if (i === 0) return;
      const qx = postsX[i - 1];
      const rail = between([qx, archY(qx) + 0.86, zz * 1.04], [px, archY(px) + 0.86, zz * 1.04]);
      b.add(PRIM.cyl6, { pos: rail.pos, rot: rail.rot, scale: [0.05, rail.len + 0.08, 0.05], color: PALETTE.woodLight });
    });
  }
  for (const sx of [-1, 1]) {
    b.add(PRIM.box, { pos: [sx * 6.0, 0.2, 0], scale: [0.5, 1.0, 2.3], color: PALETTE.stoneDark, facetJitter: 0.08, wobble: 0.04 });
  }
}

// --- Farm & camp -------------------------------------------------------------
function buildHayAndCart(b: GeoBuilder): void {
  const bales: [number, number, number, number][] = [
    [0, 0.55, 0, 0], [1.8, 0.55, 0.4, 0.3], [-1.6, 0.55, -0.3, -0.2], [0.8, 1.5, 0.2, 0.1],
  ];
  for (const [x, y, z, yaw] of bales) {
    const bale = new GeoBuilder(3);
    bale.add(PRIM.cyl12, { rot: [0, 0, Math.PI / 2], scale: [0.55, 1.3, 0.55], color: '#d8b64c', facetJitter: 0.08 });
    bale.add(PRIM.cyl12, { pos: [0.66, 0, 0], rot: [0, 0, Math.PI / 2], scale: [0.5, 0.02, 0.5], color: '#e7cc6c' });
    bale.add(PRIM.cyl12, { pos: [-0.66, 0, 0], rot: [0, 0, Math.PI / 2], scale: [0.5, 0.02, 0.5], color: '#e7cc6c' });
    for (const bx of [-0.35, 0.35]) {
      bale.add(PRIM.cyl12, { pos: [bx, 0, 0], rot: [0, 0, Math.PI / 2], scale: [0.565, 0.05, 0.565], color: PALETTE.woodDark });
    }
    b.append(bale, { pos: [x, y, z], rot: [0, yaw, 0] });
  }
  const cart = new GeoBuilder(4);
  cart.add(PRIM.box, { pos: [0, 0.8, 0], scale: [1.8, 0.12, 1.1], color: PALETTE.wood, facetJitter: 0.06 });
  for (const sz of [-0.53, 0.53]) cart.add(PRIM.box, { pos: [0, 1.0, sz], scale: [1.8, 0.32, 0.05], color: PALETTE.woodLight, facetJitter: 0.06 });
  for (const sx of [-0.88, 0.88]) cart.add(PRIM.box, { pos: [sx, 1.0, 0], scale: [0.05, 0.32, 1.1], color: PALETTE.woodLight });
  for (const sz of [-0.65, 0.65]) {
    cart.add(WHEEL, { pos: [0.1, 0.45, sz], scale: 0.42, color: PALETTE.woodDark });
    for (let k = 0; k < 4; k++) {
      cart.add(PRIM.box, { pos: [0.1, 0.45, sz], rot: [0, 0, (k * Math.PI) / 4], scale: [0.05, 0.8, 0.04], color: PALETTE.woodDark });
    }
  }
  for (const sz of [-0.3, 0.3]) {
    const h = between([-0.9, 0.8, sz], [-2.0, 0.05, sz * 1.2]);
    cart.add(PRIM.box, { pos: h.pos, rot: h.rot, scale: [0.06, h.len, 0.06], color: PALETTE.wood });
  }
  cart.add(PRIM.ico1, { pos: [0.1, 1.05, 0], scale: [0.75, 0.25, 0.42], color: '#d8b64c', facetJitter: 0.1, wobble: 0.15 });
  b.append(cart, { pos: [-2.8, 0, 1.8], rot: [0, 0.6, 0] });
}

function buildCampsite(b: GeoBuilder, fire: GeoBuilder): void {
  const r = b.rng;
  const tent = new GeoBuilder(6);
  tent.add(TENT, { pos: [0, 0.75, 0], rot: [0, 0, Math.PI / 2], scale: [1.5, 2.6, 1.5], color: '#e9d7a3', facetJitter: 0.04 });
  tent.add(PRIM.box, { pos: [1.31, 0.45, 0], scale: [0.02, 0.9, 0.62], color: PALETTE.charcoal });
  tent.add(PRIM.cyl6, { pos: [0, 2.28, 0], rot: [0, 0, Math.PI / 2], scale: [0.03, 2.9, 0.03], color: PALETTE.woodDark });
  b.append(tent, { pos: [0, 0, 0], rot: [0, 0.4 + Math.PI, 0] });

  const fx = FIRE_POS[0] - 30;
  const fz = FIRE_POS[2] - 16;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    addRock(b, fx + Math.cos(a) * 0.55, fz + Math.sin(a) * 0.55, 0.13 + r() * 0.04, 0.8);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    const log = between([fx + Math.cos(a) * 0.4, 0.05, fz + Math.sin(a) * 0.4], [fx - Math.cos(a) * 0.05, 0.3, fz - Math.sin(a) * 0.05]);
    b.add(PRIM.cyl6, { pos: log.pos, rot: log.rot, scale: [0.06, log.len, 0.06], color: '#3b2a20' });
  }
  b.add(PRIM.cyl8, { pos: [fx, 0.03, fz], scale: [0.32, 0.04, 0.32], color: '#e0612e', intensity: 1.0 });
  // Flames (unlit emissive; flicker by scaling the fire mesh)
  fire.add(PRIM.cone5, { pos: [0, 0.32, 0], scale: [0.2, 0.55, 0.2], color: '#ff7a2f', intensity: 3.2 });
  fire.add(PRIM.cone5, { pos: [0.08, 0.24, 0.05], rot: [0, 1, 0.15], scale: [0.13, 0.38, 0.13], color: '#ffb347', intensity: 3.6 });
  fire.add(PRIM.cone5, { pos: [-0.07, 0.22, -0.04], rot: [0, 2, -0.15], scale: [0.11, 0.34, 0.11], color: '#ffd36b', intensity: 3.8 });

  b.add(HALF_LOG, { pos: [fx, 0.16, fz + 1.15], rot: [0, 0, Math.PI / 2], scale: [0.18, 1.4, 0.18], color: PALETTE.wood, facetJitter: 0.06 });
  b.add(HALF_LOG, { pos: [fx + 1.15, 0.16, fz], rot: [Math.PI / 2, 0, Math.PI / 2], scale: [0.18, 1.4, 0.18], color: PALETTE.wood, facetJitter: 0.06 });
}

function buildSheep(b: GeoBuilder, eating: boolean): void {
  b.add(PRIM.ico1, { pos: [0, 0.58, 0], scale: [0.52, 0.38, 0.36], color: PALETTE.wool, facetJitter: 0.06, wobble: 0.12 });
  b.add(PRIM.ico1, { pos: [0.08, 0.78, 0], scale: [0.3, 0.2, 0.26], color: PALETTE.wool, facetJitter: 0.06, wobble: 0.12 });
  const head: V3 = eating ? [0.5, 0.28, 0] : [0.48, 0.7, 0];
  const tilt = eating ? -0.7 : 0.15;
  b.add(PRIM.box, { pos: head, rot: [0, 0, tilt], scale: [0.26, 0.2, 0.18], color: PALETTE.charcoal });
  b.add(PRIM.ico0, { pos: [head[0] - 0.08, head[1] + 0.1, 0], scale: [0.11, 0.08, 0.12], color: PALETTE.wool });
  for (const s of [-1, 1]) {
    b.add(PRIM.box, { pos: [head[0] - 0.06, head[1] + 0.04, s * 0.13], rot: [s * 0.5, 0, 0], scale: [0.07, 0.04, 0.12], color: PALETTE.charcoal });
  }
  for (const [lx, lz] of [[-0.25, -0.16], [-0.25, 0.16], [0.24, -0.16], [0.24, 0.16]]) {
    b.add(PRIM.cyl6, { pos: [lx, 0.17, lz], scale: [0.045, 0.34, 0.045], color: PALETTE.charcoal });
  }
  b.add(PRIM.ico0, { pos: [-0.52, 0.66, 0], scale: 0.08, color: PALETTE.wool });
}

// --- Vegetation ----------------------------------------------------------------
function buildTrees(b: GeoBuilder): void {
  const rng = makeRng(99);
  // Willows along the river's east bank
  for (const z of [14, -12, 28, -38, 44]) addWillow(b, riverX(z) + RIVER_HALF + 3.2, z, 0.95 + rng() * 0.15);
  // Birches in the southern / eastern meadow
  for (const [x, z] of [[12, 34], [-8, 42], [28, 40], [38, 28], [20, 48], [14, 37]]) addBirch(b, x, z, 0.9 + rng() * 0.3);
  // Pines framing the yard
  const framing: [number, number][] = [
    [-15.5, -15], [-18.5, -10.5], [-14.8, -19.5], [15, -16.5], [18, -11.5], [16.5, -21], [19.5, -3.5], [-17.5, -3],
    [-21, -17], [21, -18], [-9, -18.5], [9.5, -19],
  ];
  for (const [x, z] of framing) addPine(b, x, z, 0.95 + rng() * 0.35);

  // Forest belt behind the house and along the sides
  const avoid: [number, number, number][] = [[30, 16, 6], [18, 22, 5], [-16, 16, 4], [62, -35, 12], [55, 43, 10]];
  let placed = 0;
  for (let tries = 0; tries < 400 && placed < 46; tries++) {
    const a = Math.PI * (0.05 + rng() * 1.25) + Math.PI * 0.85; // mostly the north half
    const d = 26 + rng() * 48;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.abs(x - riverX(z)) < RIVER_HALF + 5) continue;
    if (z > 10 && Math.abs(x - roadX(z)) < 5) continue;
    if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar)) continue;
    if (rng() < 0.75) addPine(b, x, z, 1.0 + rng() * 0.6);
    else addDeciduousTree(b, x, z, 1.0 + rng() * 0.4, { leaves: [PALETTE.leafDeep, PALETTE.leaf, PALETTE.leafLight, PALETTE.leafSun] });
    placed++;
  }
  // A few round meadow trees to the south
  const meadow: [number, number][] = [[-6, 27], [36, -6], [-24, 52], [40, 50], [-40, 30]];
  meadow.forEach(([x, z], i) => addDeciduousTree(b, x, z, 1.1, {
    leaves: i % 3 === 2
      ? [PALETTE.autumn[3], PALETTE.autumn[0], PALETTE.autumn[1], PALETTE.autumn[2]]
      : [PALETTE.leafDeep, PALETTE.leaf, PALETTE.leafLight, PALETTE.leafSun],
  }));
}

const MOUNTAIN_TOP = new THREE.Color(PALETTE.mountainTop);
function buildLandscape(b: GeoBuilder): void {
  const r = b.rng;
  // Rolling hills (half-buried faceted domes)
  const hills: [number, number, number, number, number, string][] = [
    [-65, -70, 35, 12, 35, PALETTE.hillA], [70, -75, 40, 14, 40, PALETTE.hillB], [-75, 20, 38, 11, 38, PALETTE.hillA],
    [78, 30, 42, 13, 42, PALETTE.hillB], [-50, 80, 36, 10, 36, PALETTE.hillC], [55, 82, 38, 11, 38, PALETTE.hillB],
    [0, -85, 45, 15, 45, PALETTE.hillC], [0, 88, 42, 12, 42, PALETTE.hillA], [-82, -30, 36, 10, 36, PALETTE.hillB],
    [85, -25, 40, 12, 40, PALETTE.hillA], [62, -35, 16, 8.5, 16, PALETTE.hillB],
  ];
  for (const [x, z, sx, sy, sz, color] of hills) {
    const isWindmillHill = sx === 16;
    b.add(PRIM.ico2, {
      pos: [x, isWindmillHill ? -1.2 : sy / 2 - 4, z], rot: [0, r() * 3, 0], scale: [sx, sy, sz],
      color, facetJitter: 0.05, wobble: 0.04,
    });
  }
  // Mountain ring with snowy caps
  const count = 22;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const d = 98 + ((i * 37) % 25);
    const h = 26 + ((i * 23) % 20);
    const w = 24 + ((i * 19) % 16);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const base = i % 2 === 0 ? PALETTE.mountainA : PALETTE.mountainB;
    b.add(PRIM.cone7, {
      pos: [x, h / 2 - 3, z], rot: [0, a + (i % 4) * 0.25, 0], scale: [w, h, w],
      color: base, facetJitter: 0.07, wobble: 0.05,
      colorFn: (_x, y, _z, out) => {
        if (y > 0.22) out.set(PALETTE.snow);
        else if (y > -0.05) out.lerp(MOUNTAIN_TOP, 0.6);
      },
    });
    b.add(PRIM.cone7, {
      pos: [x + Math.cos(a + 1.2) * w * 0.45, h * 0.32 - 3, z + Math.sin(a + 1.2) * w * 0.45], rot: [0, a, 0],
      scale: [w * 0.6, h * 0.65, w * 0.6], color: PALETTE.mountainB, facetJitter: 0.07, wobble: 0.05,
    });
  }
}

// --- Landmarks -------------------------------------------------------------------
function buildWindmillBody(b: GeoBuilder): void {
  b.add(taperedCyl(0.68, 8, 2), { pos: [0, 2.5, 0], scale: [1.5, 5.0, 1.5], color: '#f1ece2', facetJitter: 0.04 });
  b.add(PRIM.cone7, { pos: [0, 5.65, 0], scale: [1.25, 1.4, 1.25], color: PALETTE.roofRed, facetJitter: 0.06 });
  b.add(PRIM.box, { pos: [0, 0.6, 1.36], scale: [0.6, 1.2, 0.1], color: PALETTE.woodDark });
  b.add(PRIM.box, { pos: [0, 3.2, 1.08], scale: [0.4, 0.5, 0.1], color: '#5c7aa0' });
  b.add(PRIM.cyl8, { pos: [0, 4.6, 0.85], rot: [Math.PI / 2, 0, 0], scale: [0.2, 0.7, 0.2], color: PALETTE.woodDark });
}

function buildCottage(b: GeoBuilder, roof: string, wall: string): void {
  b.add(PRIM.box, { pos: [0, 0.8, 0], scale: [2.0, 1.6, 1.6], color: wall, facetJitter: 0.03 });
  b.add(PRIM.cone4, { pos: [0, 2.15, 0], scale: [1.75, 1.1, 1.45], color: roof, facetJitter: 0.05 });
  b.add(PRIM.box, { pos: [0, 0.45, 0.81], scale: [0.4, 0.7, 0.04], color: PALETTE.woodDark });
  for (const sx of [-0.6, 0.6]) b.add(PRIM.box, { pos: [sx, 1.0, 0.81], scale: [0.36, 0.36, 0.04], color: '#f7d98b', intensity: 1.2 });
  b.add(PRIM.box, { pos: [0.6, 2.6, -0.2], scale: [0.3, 0.7, 0.3], color: PALETTE.stoneDark });
}

function buildSails(b: GeoBuilder): void {
  b.add(PRIM.cyl8, { rot: [Math.PI / 2, 0, 0], scale: [0.25, 0.3, 0.25], color: PALETTE.woodDark });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // spar
    b.add(PRIM.box, { pos: [-s * 1.6, c * 1.6, 0.06], rot: [0, 0, a], scale: [0.1, 3.2, 0.06], color: PALETTE.woodDark });
    // canvas panel offset to one side of the spar
    b.add(PRIM.box, { pos: [-s * 1.85 + c * 0.24, c * 1.85 + s * 0.24, 0.04], rot: [0, 0, a], scale: [0.42, 2.4, 0.02], color: '#f4ead2', facetJitter: 0.04 });
  }
}

function buildBoat(b: GeoBuilder): void {
  b.add(PRIM.box, { pos: [0, 0.06, 0], scale: [2.5, 0.1, 0.86], color: PALETTE.woodDark });
  for (const sz of [-0.46, 0.46]) {
    b.add(PRIM.box, { pos: [0, 0.22, sz], rot: [sz > 0 ? -0.18 : 0.18, 0, 0], scale: [2.5, 0.34, 0.07], color: '#4f86c6', facetJitter: 0.04 });
    b.add(PRIM.box, { pos: [0, 0.4, sz * 1.08], scale: [2.55, 0.05, 0.08], color: PALETTE.cream });
  }
  b.add(PRIM.box, { pos: [-1.27, 0.22, 0], scale: [0.07, 0.34, 1.0], color: '#4f86c6' });
  b.add(PRIM.cone4, { pos: [1.55, 0.22, 0], rot: [0, 0, -Math.PI / 2], scale: [0.25, 0.62, 0.65], color: '#4f86c6' });
  for (const tx of [-0.6, 0.55]) b.add(PRIM.box, { pos: [tx, 0.3, 0], scale: [0.26, 0.04, 0.88], color: PALETTE.woodLight });
  for (const sz of [-0.18, 0.18]) {
    b.add(PRIM.cyl6, { pos: [0.05, 0.36, sz], rot: [0.05, 0, Math.PI / 2 + 0.06], scale: [0.025, 2.0, 0.025], color: PALETTE.woodLight });
  }
}

function buildBalloon(b: GeoBuilder, glow: GeoBuilder): void {
  const cols = PALETTE.balloon;
  b.add(BALLOON, {
    pos: [0, 0.75, 0], scale: 1, color: cols[0], facetJitter: 0.03,
    colorFn: (x, y, z, out) => {
      const seg = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 12) % 12;
      out.set(seg % 2 === 0 ? cols[0] : cols[2]);
      if (y > 2.5 && y < 3.2) out.set(cols[1]);
      if (y < 0.7) out.set(cols[3]);
    },
  });
  b.add(PRIM.box, { pos: [0, -0.45, 0], scale: [0.7, 0.5, 0.7], color: '#a77a45', facetJitter: 0.08 });
  b.add(PRIM.box, { pos: [0, -0.18, 0], scale: [0.74, 0.06, 0.74], color: PALETTE.woodDark });
  for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) {
    const rope = between([x, -0.2, z], [x * 1.25, 0.8, z * 1.25]);
    b.add(PRIM.cyl6, { pos: rope.pos, rot: rope.rot, scale: [0.015, rope.len, 0.015], color: PALETTE.woodDark });
  }
  glow.add(PRIM.cone5, { pos: [0, 0.32, 0], scale: [0.14, 0.4, 0.14], color: '#ff9a3d', intensity: 3.5 });
}

function buildClouds(): THREE.InstancedMesh {
  const rng = makeRng(321);
  const mats: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();
  const clusters = 12;
  for (let c = 0; c < clusters; c++) {
    const a = (c / clusters) * Math.PI * 2 + rng() * 0.4;
    const d = 62 + rng() * 50;
    const cx = Math.cos(a) * d;
    const cz = Math.sin(a) * d;
    const cy = 26 + rng() * 14;
    const s = 1.6 + rng() * 1.2;
    const puffs = 6 + Math.floor(rng() * 4);
    for (let p = 0; p < puffs; p++) {
      const t = puffs === 1 ? 0 : p / (puffs - 1) - 0.5;
      const rad = (1.4 + rng() * 1.3) * (1 - Math.abs(t) * 0.8) * s;
      dummy.position.set(cx + t * 7 * s + (rng() - 0.5) * s, cy + rad * 0.25 + (rng() - 0.3) * 0.6 * s, cz + (rng() - 0.5) * 2.4 * s);
      dummy.rotation.set(0, a, 0);
      dummy.scale.set(rad * 1.15, rad * 0.78, rad);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
    }
  }
  const mat = new THREE.MeshLambertMaterial({ color: PALETTE.cloud, emissive: PALETTE.cloudShade, emissiveIntensity: 0.7 });
  const mesh = new THREE.InstancedMesh(PRIM.ico2, mat, mats.length);
  mats.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.name = 'clouds';
  return mesh;
}
