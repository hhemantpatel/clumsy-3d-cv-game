// Static garden scenery: chunky plank planter with corner posts + seams, soil
// bed, copper irrigation line, "DRONE-BOT FARM" sign and the potting bench with
// its props. Built from a few batched meshes (≈8 draw calls total) and never
// re-renders (memo, no props).
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BED_TOP, GEO, MAT, PALETTE, Part, ROWS, mergeParts, seeded } from './assets';

type V3 = [number, number, number];
interface BoxSpec {
  p: V3;
  s: V3;
  c: THREE.Color;
  ry?: number;
}

// Footprint must stay 4.2 x 6.2 (physics rim colliders at roughly x ±2.1, z ±3.1).
const WALL_X = 2.05;
const WALL_Z = 3.1;
const WALL_T = 0.16;
const PLANK_H = 0.16;
const SIGN_POST: V3 = [-WALL_X, 0, WALL_Z];

const BENCH_MATRIX = new THREE.Matrix4().compose(
  new THREE.Vector3(2.55, 0, 0),
  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2),
  new THREE.Vector3(1, 1, 1)
);

// ---------------------------------------------------------------------------
// All wooden boxes (planter planks, caps, posts, seams, bench, crate, sign board)
// -> ONE instanced mesh with per-instance colour.
// ---------------------------------------------------------------------------
const buildWoodBoxes = (): { planter: BoxSpec[]; bench: BoxSpec[] } => {
  const planter: BoxSpec[] = [];
  const seamT = WALL_T + 0.014;
  const longX = WALL_X * 2 + 0.1; // N/S walls span the full width
  const longZ = WALL_Z * 2 - WALL_T; // E/W walls sit between them
  // planks: two stacked boards per wall, alternating tone
  for (const sz of [-1, 1]) {
    planter.push({ p: [0, PLANK_H * 0.5, sz * WALL_Z], s: [longX, PLANK_H, WALL_T], c: PALETTE.woodA });
    planter.push({ p: [0, PLANK_H * 1.5, sz * WALL_Z], s: [longX, PLANK_H, WALL_T - 0.01], c: PALETTE.woodB });
    planter.push({ p: [0, PLANK_H, sz * WALL_Z], s: [longX, 0.012, seamT], c: PALETTE.woodSeam });
    // staggered butt joints
    planter.push({ p: [-0.9 * sz, PLANK_H * 0.5, sz * WALL_Z], s: [0.014, PLANK_H - 0.01, seamT], c: PALETTE.woodSeam });
    planter.push({ p: [0.6 * sz, PLANK_H * 1.5, sz * WALL_Z], s: [0.014, PLANK_H - 0.01, seamT], c: PALETTE.woodSeam });
    // cap rail
    planter.push({ p: [0, PLANK_H * 2 + 0.02, sz * WALL_Z], s: [longX + 0.08, 0.04, 0.24], c: PALETTE.woodCap });
  }
  for (const sx of [-1, 1]) {
    planter.push({ p: [sx * WALL_X, PLANK_H * 0.5, 0], s: [WALL_T, PLANK_H, longZ], c: PALETTE.woodB });
    planter.push({ p: [sx * WALL_X, PLANK_H * 1.5, 0], s: [WALL_T - 0.01, PLANK_H, longZ], c: PALETTE.woodA });
    planter.push({ p: [sx * WALL_X, PLANK_H, 0], s: [seamT, 0.012, longZ], c: PALETTE.woodSeam });
    for (const z of [-1.2, 1.9]) planter.push({ p: [sx * WALL_X, PLANK_H * 0.5, z * sx], s: [seamT, PLANK_H - 0.01, 0.014], c: PALETTE.woodSeam });
    for (const z of [0.4, -2.2]) planter.push({ p: [sx * WALL_X, PLANK_H * 1.5, z * sx], s: [seamT, PLANK_H - 0.01, 0.014], c: PALETTE.woodSeam });
    planter.push({ p: [sx * WALL_X, PLANK_H * 2 + 0.02, 0], s: [0.24, 0.04, longZ - 0.24], c: PALETTE.woodCap });
  }
  // corner posts (the south-west one is the tall sign post)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const isSign = sx === -1 && sz === 1;
      const h = isSign ? 1.12 : 0.46;
      planter.push({ p: [sx * WALL_X, h / 2, sz * WALL_Z], s: [0.21, h, 0.21], c: PALETTE.woodPost });
    }
  }
  // sign board
  planter.push({ p: [SIGN_POST[0] + 0.4, 0.88, SIGN_POST[2] + 0.125], s: [0.92, 0.3, 0.04], c: PALETTE.woodDark });

  // ---- potting bench (bench-local space; BENCH_MATRIX applied later) ----
  const bench: BoxSpec[] = [];
  [-0.2, 0, 0.2].forEach((z, i) =>
    bench.push({ p: [0, 0.45, z], s: [1.6, 0.05, 0.185], c: i % 2 ? PALETTE.woodB : PALETTE.woodA })
  );
  for (const x of [-0.72, 0.72]) {
    for (const z of [-0.22, 0.22]) bench.push({ p: [x, 0.215, z], s: [0.07, 0.43, 0.07], c: PALETTE.woodPost });
    bench.push({ p: [x, 0.7, -0.27], s: [0.06, 0.52, 0.05], c: PALETTE.woodPost });
  }
  bench.push({ p: [0, 0.94, -0.27], s: [1.58, 0.06, 0.05], c: PALETTE.woodCap });
  bench.push({ p: [0, 0.72, -0.285], s: [1.44, 0.03, 0.02], c: PALETTE.woodDark }); // tool rail
  for (const z of [-0.11, 0.11]) bench.push({ p: [0, 0.13, z], s: [1.5, 0.035, 0.2], c: PALETTE.woodB });
  // harvest crate on the bench top
  const cx = 0.35;
  const cy = 0.475;
  bench.push({ p: [cx, cy + 0.01, 0], s: [0.42, 0.02, 0.32], c: PALETTE.woodDark });
  for (const z of [-0.15, 0.15]) {
    bench.push({ p: [cx, cy + 0.05, z], s: [0.42, 0.06, 0.02], c: PALETTE.woodCap });
    bench.push({ p: [cx, cy + 0.14, z], s: [0.42, 0.06, 0.02], c: PALETTE.woodCap });
  }
  for (const x of [-0.2, 0.2]) bench.push({ p: [cx + x, cy + 0.1, 0], s: [0.02, 0.2, 0.32], c: PALETTE.woodA });
  return { planter, bench };
};

// ---------------------------------------------------------------------------
// Vertex-coloured merged props (one draw call): post caps, watering can,
// seed sacks, pots and the veg in the crate.
// ---------------------------------------------------------------------------
const lathe = (pts: [number, number][], seg = 12) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

const buildProps = (): THREE.BufferGeometry => {
  const planterParts: Part[] = [];
  const capGeo = new THREE.ConeGeometry(0.16, 0.09, 4);
  capGeo.rotateY(Math.PI / 4);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const h = sx === -1 && sz === 1 ? 1.12 : 0.46;
      planterParts.push({ geo: capGeo, color: PALETTE.woodCap, position: [sx * WALL_X, h + 0.045, sz * WALL_Z] });
    }
  }

  const b: Part[] = [];
  // watering can
  const can: V3 = [-0.45, 0.475, 0.02];
  const add = (o: V3, part: Part) => {
    const p = part.position ?? [0, 0, 0];
    b.push({ ...part, position: [o[0] + p[0], o[1] + p[1], o[2] + p[2]] });
  };
  add(can, { geo: lathe([[0, 0], [0.08, 0], [0.09, 0.02], [0.09, 0.15], [0.075, 0.18], [0.03, 0.19], [0, 0.19]], 14), color: PALETTE.canBlue });
  add(can, { geo: new THREE.CylinderGeometry(0.012, 0.022, 0.2, 8), color: PALETTE.canBlue, position: [0.15, 0.11, 0], rotation: [0, 0, -0.9] });
  add(can, { geo: new THREE.CylinderGeometry(0.032, 0.014, 0.035, 10), color: PALETTE.copper, position: [0.235, 0.18, 0], rotation: [0, 0, -0.9] });
  add(can, { geo: new THREE.TorusGeometry(0.07, 0.012, 6, 14, Math.PI), color: PALETTE.woodDark, position: [0, 0.185, 0] });
  add(can, { geo: new THREE.TorusGeometry(0.09, 0.008, 4, 18), color: PALETTE.copper, position: [0, 0.12, 0], rotation: [Math.PI / 2, 0, 0] });
  // terracotta pots with seedlings
  const terracotta = new THREE.Color('#c8693e');
  for (const [x, z] of [[-0.15, -0.12], [-0.02, -0.15]] as [number, number][]) {
    add([x, 0.475, z], { geo: lathe([[0, 0], [0.04, 0], [0.052, 0.075], [0.058, 0.08], [0.058, 0.09], [0, 0.09]], 10), color: terracotta });
    add([x, 0.475, z], { geo: GEO.hemi, color: PALETTE.soilBed, position: [0, 0.082, 0], scale: [0.048, 0.01, 0.048] });
    add([x, 0.475, z], { geo: GEO.leaf, color: PALETTE.sprout, position: [0, 0.088, 0], rotation: [-0.6, 0.5, 0], scale: 0.35 });
    add([x, 0.475, z], { geo: GEO.leaf, color: PALETTE.sprout, position: [0, 0.088, 0], rotation: [-0.6, 0.5 + Math.PI, 0], scale: 0.3 });
  }
  // seed sacks on the lower shelf + one leaning by the bench end
  const sackTied = lathe([[0, 0], [0.1, 0], [0.13, 0.05], [0.135, 0.12], [0.11, 0.19], [0.05, 0.225], [0.045, 0.24], [0.07, 0.28], [0, 0.28]], 9);
  const sackOpen = lathe([[0, 0], [0.1, 0], [0.13, 0.05], [0.135, 0.13], [0.12, 0.2], [0.105, 0.23], [0.09, 0.22], [0, 0.22]], 9);
  add([-0.45, 0.1475, 0.02], { geo: sackTied, color: PALETTE.burlap, scale: [1, 0.95, 0.9] });
  add([-0.45, 0.1475, 0.02], { geo: new THREE.TorusGeometry(0.05, 0.012, 5, 12), color: PALETTE.rope, position: [0, 0.228, 0], rotation: [Math.PI / 2, 0, 0] });
  add([-0.1, 0.1475, 0.0], { geo: sackOpen, color: PALETTE.burlapDark, scale: [0.95, 1, 0.9] });
  add([-0.1, 0.1475, 0.0], { geo: GEO.hemi, color: PALETTE.seed, position: [0, 0.205, 0], scale: [0.1, 0.035, 0.09] });
  add([0.98, 0, 0.05], { geo: sackTied, color: PALETTE.burlap, rotation: [0, 0.6, 0.12], scale: [1.1, 1.05, 1] });
  add([0.98, 0, 0.05], { geo: new THREE.TorusGeometry(0.055, 0.013, 5, 12), color: PALETTE.rope, position: [0.028, 0.25, 0], rotation: [Math.PI / 2, 0, 0.12] });
  // harvested veg in the crate
  const crate: V3 = [0.35, 0.495, 0];
  add(crate, { geo: GEO.pumpkin, color: PALETTE.pumpkinRipe, position: [0.09, 0, 0.04], scale: [0.075, 0.07, 0.075] });
  add(crate, { geo: GEO.stem, color: PALETTE.pumpkinStem, position: [0.09, 0.075, 0.04], scale: [0.008, 0.03, 0.008] });
  for (let i = 0; i < 3; i++) {
    const z = -0.1 + i * 0.045;
    add(crate, { geo: new THREE.ConeGeometry(0.022, 0.14, 6), color: PALETTE.carrot, position: [-0.08, 0.035 + i * 0.006, z], rotation: [0, 0.2 * i, Math.PI / 2 + 0.1] });
    add(crate, { geo: GEO.frond, color: PALETTE.carrotFrond, position: [-0.15, 0.04 + i * 0.006, z], rotation: [0, 0, Math.PI / 2 + 0.3], scale: [0.02, 0.08, 0.008] });
  }
  add(crate, { geo: GEO.stem, color: PALETTE.wheatEarRipe, position: [-0.17, 0.075, -0.1], rotation: [0.25, 0, -1.1], scale: [0.035, 0.26, 0.035] });
  add(crate, { geo: new THREE.TorusGeometry(0.038, 0.008, 4, 12), color: PALETTE.rope, position: [-0.04, 0.12, -0.1], rotation: [0, Math.PI / 2, 0.47] });
  // sunflower head leaning on the crate rim
  add(crate, { geo: GEO.disk, color: PALETTE.petal, position: [0.05, 0.15, -0.14], rotation: [-1.2, 0, 0], scale: [0.085, 0.008, 0.085] });
  add(crate, { geo: GEO.disk, color: PALETTE.sunDisk, position: [0.05, 0.154, -0.132], rotation: [-1.2, 0, 0], scale: [0.05, 0.014, 0.05] });

  return mergeParts([...planterParts, ...b.map((part) => ({ ...part, parent: BENCH_MATRIX }))]);
};

// Irrigation: copper pipe + nozzles (one mesh) and glass drip bulbs (one mesh)
const PIPE_X = -1.86;
const PIPE_Y = 0.27;
const buildIrrigation = () => {
  const copper: Part[] = [
    { geo: new THREE.CylinderGeometry(0.018, 0.018, 5.9, 8), color: PALETTE.copper, position: [PIPE_X, PIPE_Y, 0], rotation: [Math.PI / 2, 0, 0] },
    // riser up and over the wall to the "tap" outside
    { geo: new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), color: PALETTE.copper, position: [PIPE_X, PIPE_Y + 0.1, -2.95] },
    { geo: new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), color: PALETTE.canBlue, position: [PIPE_X, PIPE_Y + 0.22, -2.95] },
  ];
  const glass: Part[] = [];
  for (const z of [-2.2, -1.1, 0, 1.1, 2.2]) {
    copper.push({ geo: new THREE.CylinderGeometry(0.011, 0.018, 0.07, 8), color: PALETTE.copper, position: [PIPE_X, PIPE_Y + 0.045, z] });
    glass.push({ geo: new THREE.SphereGeometry(0.016, 8, 6), color: PALETTE.white, position: [PIPE_X, PIPE_Y + 0.09, z] });
  }
  return { copper: mergeParts(copper), glass: mergeParts(glass) };
};

const buildPebbles = () => {
  const rnd = seeded(1337);
  const specs: { p: V3; s: V3; r: number }[] = [];
  const gapsX = [-1.75, -1.05, -0.35, 0.35, 1.05, 1.75];
  for (let i = 0; i < 30; i++) {
    const x = gapsX[Math.floor(rnd() * gapsX.length)] + (rnd() - 0.5) * 0.06;
    const z = ROWS[0] - 0.45 + rnd() * (ROWS[4] - ROWS[0] + 0.9);
    const s = 0.014 + rnd() * 0.022;
    specs.push({ p: [x, BED_TOP, z], s: [s, s * 0.6, s * (0.8 + rnd() * 0.4)], r: rnd() * Math.PI });
  }
  return specs;
};

// ---------------------------------------------------------------------------
// Sign face (canvas texture; drei Text isn't used elsewhere in the codebase)
// ---------------------------------------------------------------------------
const makeSignTexture = (): THREE.CanvasTexture | null => {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 160;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#f3e2bd';
  ctx.fillRect(0, 0, 512, 160);
  // wood grain streaks
  ctx.strokeStyle = 'rgba(150,100,50,0.18)';
  ctx.lineWidth = 2;
  for (let y = 14; y < 160; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(140, y + 6, 340, y - 6, 512, y + 3);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);
  // sprout icon
  ctx.fillStyle = '#4f9d3a';
  ctx.beginPath();
  ctx.ellipse(52, 70, 18, 9, -0.6, 0, Math.PI * 2);
  ctx.ellipse(76, 66, 18, 9, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(62, 72, 5, 40);
  // drone icon
  ctx.fillStyle = '#3f8fb4';
  ctx.beginPath();
  ctx.arc(458, 86, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5eead4';
  ctx.fillRect(448, 80, 6, 8);
  ctx.fillRect(462, 80, 6, 8);
  ctx.strokeStyle = '#3f8fb4';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(428, 60);
  ctx.lineTo(488, 60);
  ctx.moveTo(458, 60);
  ctx.lineTo(458, 70);
  ctx.stroke();
  // lettering
  ctx.fillStyle = '#5b3417';
  ctx.font = 'bold 54px "Trebuchet MS", "Verdana", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DRONE-BOT', 256, 62);
  ctx.font = 'bold 40px "Trebuchet MS", "Verdana", sans-serif';
  ctx.fillStyle = '#b45309';
  ctx.fillText('FARM', 256, 114);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};

const SIGN_FACE_GEO = new THREE.PlaneGeometry(0.86, 0.26);

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export const Planter: React.FC = React.memo(() => {
  const built = useMemo(() => {
    const { planter, bench } = buildWoodBoxes();
    const all = planter.length + bench.length;
    const wood = new THREE.InstancedMesh(GEO.unitBox, MAT.wood, all);
    let i = 0;
    for (const spec of planter) {
      _m.compose(_p.set(...spec.p), _q.setFromEuler(_e.set(0, spec.ry ?? 0, 0)), _s.set(...spec.s));
      wood.setMatrixAt(i, _m);
      wood.setColorAt(i++, spec.c);
    }
    for (const spec of bench) {
      _m.compose(_p.set(...spec.p), _q.setFromEuler(_e.set(0, spec.ry ?? 0, 0)), _s.set(...spec.s));
      _m.premultiply(BENCH_MATRIX);
      wood.setMatrixAt(i, _m);
      wood.setColorAt(i++, spec.c);
    }
    wood.castShadow = true;
    wood.receiveShadow = true;
    wood.computeBoundingSphere();

    const pebbleSpecs = buildPebbles();
    const pebbles = new THREE.InstancedMesh(GEO.ico, MAT.pebble, pebbleSpecs.length);
    pebbleSpecs.forEach((sp, k) => {
      _m.compose(_p.set(...sp.p), _q.setFromEuler(_e.set(0, sp.r, 0)), _s.set(...sp.s));
      pebbles.setMatrixAt(k, _m);
    });
    pebbles.receiveShadow = true;
    pebbles.computeBoundingSphere();

    const props = buildProps();
    const irrigation = buildIrrigation();
    const signTex = makeSignTexture();
    const signMat = new THREE.MeshStandardMaterial({ color: signTex ? '#ffffff' : '#f3e2bd', map: signTex, roughness: 0.85 });
    return { wood, pebbles, props, irrigation, signTex, signMat };
  }, []);

  useEffect(
    () => () => {
      built.wood.dispose();
      built.pebbles.dispose();
      built.props.dispose();
      built.irrigation.copper.dispose();
      built.irrigation.glass.dispose();
      built.signTex?.dispose();
      built.signMat.dispose();
    },
    [built]
  );

  const signX = SIGN_POST[0] + 0.4;
  const signZ = SIGN_POST[2] + 0.125;

  return (
    <group>
      {/* Soil bed */}
      <mesh position={[0, BED_TOP / 2, 0]} material={MAT.soilBed} receiveShadow>
        <boxGeometry args={[3.96, BED_TOP, 6.06]} />
      </mesh>
      <primitive object={built.pebbles} />

      {/* Planks, seams, caps, posts, bench and crate: one instanced draw */}
      <primitive object={built.wood} />
      {/* Post caps + bench props: one merged draw */}
      <mesh geometry={built.props} material={MAT.props} castShadow receiveShadow />

      {/* Irrigation line */}
      <mesh geometry={built.irrigation.copper} material={MAT.copper} />
      <mesh geometry={built.irrigation.glass} material={MAT.nozzleGlass} />

      {/* Sign faces (front + back) */}
      <mesh geometry={SIGN_FACE_GEO} material={built.signMat} position={[signX, 0.88, signZ + 0.021]} />
      <mesh geometry={SIGN_FACE_GEO} material={built.signMat} position={[signX, 0.88, signZ - 0.021]} rotation={[0, Math.PI, 0]} />
    </group>
  );
});
Planter.displayName = 'Planter';
