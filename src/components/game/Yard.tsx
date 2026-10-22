import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Grass } from './Grass';
import { BadmintonCourt } from './BadmintonCourt';
import { GeoBuilder, PRIM, between, V3 } from './env/GeoBuilder';
import { PALETTE } from './env/palette';
import { GLSL_MEADOW, GLSL_NOISE, getGlowMaterial, makeEnvMesh, meadowUniforms } from './env/materials';
import { addDeciduousTree, addFlowerClump, addLantern, addRock, addShrub } from './env/builders';
import { FENCE, GATE_HALF, PATH_END_Z, PATH_START_Z, SHRUBS, YARD_TREES, isBlocked, pathX } from './env/layout';
import { WindDriver } from './env/WindDriver';

/**
 * The garden yard. Everything static (picket fence, gate, trees, shrubs, flowers, rocks,
 * stepping stones) is merged into ONE vertex-coloured mesh with vertex-shader wind,
 * plus one unlit glow mesh for the lanterns, the procedural meadow ground and the grass.
 */
export const Yard: React.FC = () => {
  const ground = useMemo(() => createGroundMaterial(), []);
  const { yardMesh, glowMesh } = useMemo(() => buildYard(), []);

  useEffect(() => () => {
    yardMesh.geometry.dispose();
    glowMesh.geometry.dispose();
    ground.dispose();
  }, [yardMesh, glowMesh, ground]);

  return (
    <group>
      <WindDriver />

      {/* Seamless procedural meadow ground (same world-space colour field as the grass roots) */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ground}>
        <planeGeometry args={[260, 260]} />
      </mesh>

      <primitive object={yardMesh} />
      <primitive object={glowMesh} />

      <Grass />
      <BadmintonCourt />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Ground: world-space meadow colour + worn dirt along the stepping-stone path.
// ---------------------------------------------------------------------------
function createGroundMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 });
  const uniforms = { ...meadowUniforms(), uDirt: { value: new THREE.Color(PALETTE.dirt) } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec2 vMeadowXZ;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvMeadowXZ = (modelMatrix * vec4(position, 1.0)).xz;',
    );
    shader.fragmentShader = 'varying vec2 vMeadowXZ;\nuniform vec3 uDirt;\n' + GLSL_NOISE + GLSL_MEADOW + shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec3 mc = meadowColor(vMeadowXZ);
       mc *= 0.86 + envNoise(vMeadowXZ * 3.3) * 0.16;
       float pd = abs(vMeadowXZ.x - sin(vMeadowXZ.y * 0.9) * 0.22);
       float worn = (1.0 - smoothstep(0.35, 0.85, pd + envNoise(vMeadowXZ * 4.0) * 0.25))
                    * smoothstep(0.4, 0.9, vMeadowXZ.y) * (1.0 - smoothstep(11.9, 12.4, vMeadowXZ.y));
       mc = mix(mc, uDirt * 0.8, worn * 0.6);
       vec4 diffuseColor = vec4( mc, opacity );`,
    );
  };
  mat.customProgramCacheKey = () => 'env-ground-v1';
  return mat;
}

// ---------------------------------------------------------------------------
// Merged yard geometry
// ---------------------------------------------------------------------------
function buildYard(): { yardMesh: THREE.Mesh; glowMesh: THREE.Mesh } {
  const b = new GeoBuilder(2024);
  const glow = new GeoBuilder(7);
  const r = b.rng;

  buildFence(b, glow);
  buildPath(b);

  // Trees (positions match engine colliders)
  addDeciduousTree(b, YARD_TREES.oak.x, YARD_TREES.oak.z, 1.2, {
    leaves: [PALETTE.leafDeep, PALETTE.leaf, PALETTE.leafLight, PALETTE.leafSun],
    canopyOffset: [-0.9, 0], canopyRadius: 1.35,
  });
  addDeciduousTree(b, YARD_TREES.maple.x, YARD_TREES.maple.z, 1.05, {
    leaves: [PALETTE.autumn[3], PALETTE.autumn[0], PALETTE.autumn[1], PALETTE.autumn[2]],
    canopyOffset: [0.6, 0], canopyRadius: 1.35,
  });
  addDeciduousTree(b, YARD_TREES.cherry.x, YARD_TREES.cherry.z, 1.0, {
    leaves: [PALETTE.blossom[3], PALETTE.blossom[0], PALETTE.blossom[1], PALETTE.blossom[2]],
    bark: '#5a3d2e', canopyRadius: 1.3, trunkHeight: 2.3,
  });

  // Shrubs with berries / blossoms
  for (const s of SHRUBS) addShrub(b, s.x, s.z, s.color, 0.95);
  // Climbing rose bushes flanking the gate
  addShrub(b, -1.75, 12.0, PALETTE.blossom[0], 0.7);
  addShrub(b, 1.75, 12.0, PALETTE.blossom[2], 0.7);

  // Rocks: hugging tree roots and fence corners (inside collider footprints)
  for (const t of Object.values(YARD_TREES)) {
    for (let i = 0; i < 3; i++) {
      const a = r() * Math.PI * 2;
      addRock(b, t.x + Math.cos(a) * 0.62, t.z + Math.sin(a) * 0.62, 0.12 + r() * 0.1);
    }
  }
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    for (let i = 0; i < 3; i++) {
      addRock(b, cx * (11.85 - r() * 0.5), cz * (11.85 - r() * 0.5), 0.14 + r() * 0.16);
    }
  }
  for (let i = 0; i < 10; i++) {
    const t = -11 + r() * 22;
    const side = Math.floor(r() * 3);
    const [x, z] = side === 0 ? [t, -12.05] : side === 1 ? [-12.05, t] : [12.05, t];
    if (!isBlocked(x, z, -0.4)) addRock(b, x, z, 0.1 + r() * 0.12);
  }

  // Flower clumps
  const clumps: [number, number][] = [
    // tree bases
    [-9.7, -2.9], [-7.4, -5.2], [-7.2, 10.5], [-4.8, 8.4], [10.5, -2.3], [8.0, -4.7],
    // bed along the front wall of the house
    [-5.8, -0.75], [-4.6, -0.7], [-3.3, -0.8], [3.0, -0.75], [4.3, -0.7], [5.6, -0.8],
    // front fence
    [-11.0, 11.7], [-9.0, 11.8], [-4.2, 11.7], [-2.9, 11.75], [3.6, 11.7], [6.0, 11.8], [8.6, 11.7], [11.0, 11.6],
    // side fences
    [-11.8, -10.0], [-11.7, -6.8], [-11.8, 0.4], [-11.7, 7.2], [11.8, -10.2], [11.7, -6.5], [11.7, 1.0], [11.8, 9.8],
    // beside the path
    [1.2, 2.9], [-1.15, 5.6], [1.15, 8.4],
  ];
  clumps.forEach(([x, z], i) => {
    if (isBlocked(x, z, 0.05)) return;
    addFlowerClump(b, x, z, PALETTE.flowers[i % PALETTE.flowers.length], 4 + Math.floor(r() * 3));
  });

  const yardMesh = makeEnvMesh(b.build(), { castShadow: true, receiveShadow: true });
  yardMesh.name = 'yard-static';
  const glowMesh = new THREE.Mesh(glow.build(), getGlowMaterial());
  glowMesh.name = 'yard-glow';
  glowMesh.matrixAutoUpdate = false;
  return { yardMesh, glowMesh };
}

/** Cream picket fence: posts every 2.5 m (deduplicated corners), two rails, pointed pickets and a gate. */
function buildFence(b: GeoBuilder, glow: GeoBuilder): void {
  const r = b.rng;
  const F = FENCE;
  const steps = (from: number, to: number) => {
    const out: number[] = [];
    for (let i = 0; i <= 10; i++) {
      const v = -F + i * 2.5;
      if (v >= from - 1e-6 && v <= to + 1e-6) out.push(v);
    }
    return out;
  };

  type Run = { pts: [number, number][]; out: [number, number] };
  const runs: Run[] = [
    { pts: steps(-F, F).map((x) => [x, -F]), out: [0, -1] },
    { pts: steps(-F, F).map((z) => [-F, z]), out: [-1, 0] },
    { pts: steps(-F, F).map((z) => [F, z]), out: [1, 0] },
    { pts: [...steps(-F, -2.5).map((x): [number, number] => [x, F]), [-GATE_HALF, F]], out: [0, 1] },
    { pts: [[GATE_HALF, F], ...steps(2.5, F).map((x): [number, number] => [x, F])], out: [0, 1] },
  ];

  const isGatePost = (x: number) => Math.abs(Math.abs(x) - GATE_HALF) < 1e-6;
  const seen = new Set<string>();
  const post = (x: number, z: number) => {
    const key = `${x.toFixed(2)}|${z.toFixed(2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    b.add(PRIM.box, { pos: [x, 0.53, z], scale: [0.15, 1.06, 0.15], color: PALETTE.picketShade, facetJitter: 0.03 });
    b.add(PRIM.box, { pos: [x, 1.07, z], scale: [0.19, 0.035, 0.19], color: PALETTE.picket });
    b.add(PRIM.cone4, { pos: [x, 1.15, z], scale: [0.13, 0.13, 0.13], color: PALETTE.picket });
  };

  const picket = (x: number, z: number, yaw: number, h: number) => {
    b.add(PRIM.box, { pos: [x, 0.06 + h / 2, z], rot: [0, yaw, (r() - 0.5) * 0.03], scale: [0.1, h, 0.03], color: PALETTE.picket, facetJitter: 0.035 });
    b.add(PRIM.cone4, { pos: [x, 0.06 + h + 0.055, z], rot: [0, yaw, 0], scale: [0.072, 0.11, 0.027], color: PALETTE.picket });
  };

  for (const run of runs) {
    const [ox, oz] = run.out;
    const alongX = oz !== 0;
    const yaw = alongX ? 0 : Math.PI / 2;
    for (let i = 0; i < run.pts.length; i++) {
      const [x, z] = run.pts[i];
      if (!isGatePost(alongX ? x : 99)) post(x, z);
      if (i === run.pts.length - 1) continue;
      const [x2, z2] = run.pts[i + 1];
      const len = Math.hypot(x2 - x, z2 - z);
      const mx = (x + x2) / 2;
      const mz = (z + z2) / 2;
      // Rails (slightly inside), pickets (slightly outside)
      for (const ry of [0.3, 0.72]) {
        b.add(PRIM.box, {
          pos: [mx - ox * 0.02, ry, mz - oz * 0.02],
          scale: alongX ? [len, 0.07, 0.035] : [0.035, 0.07, len],
          color: PALETTE.picketShade,
        });
      }
      const usable = len - 0.2;
      const n = Math.max(1, Math.round(usable / 0.26));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const px = x + (x2 - x) * (0.1 / len + t * usable / len);
        const pz = z + (z2 - z) * (0.1 / len + t * usable / len);
        picket(px + ox * 0.045, pz + oz * 0.045, yaw, 0.82 + (r() - 0.5) * 0.02);
      }
    }
  }

  // ---- Front gate: sturdy posts on stone footings, lanterns, two closed picket leaves ----
  for (const sx of [-1, 1]) {
    const x = sx * GATE_HALF;
    b.add(PRIM.box, { pos: [x, 0.16, F], scale: [0.36, 0.32, 0.36], color: PALETTE.stone, facetJitter: 0.06, wobble: 0.03 });
    b.add(PRIM.box, { pos: [x, 0.9, F], scale: [0.22, 1.2, 0.22], color: PALETTE.picketShade, facetJitter: 0.03 });
    b.add(PRIM.box, { pos: [x, 1.52, F], scale: [0.3, 0.05, 0.3], color: PALETTE.picket });
    addLantern(b, glow, x, 1.545, F, 1.05);

    // Gate leaf: hinged at the post, meeting in the middle
    const inner = sx * 0.03;
    const outer = sx * (GATE_HALF - 0.12);
    const w = Math.abs(outer - inner);
    const cx = (inner + outer) / 2;
    for (const ry of [0.24, 0.66]) {
      b.add(PRIM.box, { pos: [cx, ry, F - 0.03], scale: [w, 0.08, 0.04], color: PALETTE.woodLight, facetJitter: 0.04 });
    }
    const brace = between([outer, 0.26, F - 0.055], [inner, 0.64, F - 0.055]);
    b.add(PRIM.box, { pos: brace.pos, rot: brace.rot, scale: [0.06, brace.len, 0.03], color: PALETTE.woodLight });
    const n = 4;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const px = inner + (outer - inner) * t;
      // Scalloped top: pickets rise toward the posts
      const h = 0.68 + 0.16 * Math.pow(Math.abs(px) / GATE_HALF, 1.5);
      b.add(PRIM.box, { pos: [px, 0.1 + h / 2, F + 0.01], scale: [0.11, h, 0.03], color: PALETTE.picket, facetJitter: 0.03 });
      b.add(PRIM.cone4, { pos: [px, 0.1 + h + 0.055, F + 0.01], scale: [0.078, 0.11, 0.027], color: PALETTE.picket });
    }
    // Hinges + latch
    for (const hy of [0.24, 0.66]) {
      b.add(PRIM.box, { pos: [sx * (GATE_HALF - 0.1), hy, F + 0.035], scale: [0.12, 0.04, 0.015], color: PALETTE.lanternMetal });
    }
  }
  b.add(PRIM.box, { pos: [0, 0.5, F + 0.04], scale: [0.14, 0.05, 0.02], color: PALETTE.lanternMetal });
}

/** Irregular flagstone stepping stones from the porch to the gate, edged with pebbles. */
function buildPath(b: GeoBuilder): void {
  const r = b.rng;
  const stoneTones = [PALETTE.stone, PALETTE.stoneLight, PALETTE.stoneDark];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const z = PATH_START_Z + ((PATH_END_Z - PATH_START_Z) * i) / (count - 1);
    const x = pathX(z) + (r() - 0.5) * 0.08;
    const sx = 0.4 + r() * 0.08;
    const sz = 0.32 + r() * 0.06;
    b.add(PRIM.cyl8, {
      pos: [x, 0.015, z], rot: [0, r() * Math.PI, 0], scale: [sx, 0.07, sz],
      color: stoneTones[i % 3], facetJitter: 0.05, wobble: 0.06,
      colorFn: (_x, y, _z, out) => { if (y > 0.4) out.multiplyScalar(1.06); else out.multiplyScalar(0.8); },
    });
  }
  // Pebble borders
  for (let z = PATH_START_Z - 0.2; z < PATH_END_Z + 0.3; z += 0.2) {
    for (const side of [-1, 1]) {
      if (r() < 0.3) continue;
      const off = 0.68 + r() * 0.14;
      const x = pathX(z) + side * off;
      const pebble: V3 = [x, 0.012, z + (r() - 0.5) * 0.1];
      const s = 0.045 + r() * 0.04;
      b.add(PRIM.ico0, {
        pos: pebble, rot: [r(), r() * 3, r()], scale: [s, s * 0.55, s * (0.8 + r() * 0.3)],
        color: stoneTones[Math.floor(r() * 3)], facetJitter: 0.1,
      });
    }
  }
}
