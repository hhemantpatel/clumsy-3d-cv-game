import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Grass } from './Grass';
import { BadmintonCourt } from './BadmintonCourt';
import { GeoBuilder, PRIM, between, V3 } from './env/GeoBuilder';
import { PALETTE } from './env/palette';
import { GLSL_MEADOW, GLSL_NOISE, getGlowMaterial, makeEnvMesh, meadowUniforms, createTreeFoliageMaterial, getEnvDepthMaterial } from './env/materials';
import { addDeciduousTree, addFlowerClump, addLantern, addRock, addShrub } from './env/builders';
import { FENCE, GATE_HALF, PATH_END_Z, PATH_START_Z, SHRUBS, YARD_TREES, isBlocked, pathX } from './env/layout';
import { WindDriver } from './env/WindDriver';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';

function distToSegment(
  px: number, pz: number,
  ax: number, az: number,
  bx: number, bz: number
) {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-5) return { dist: Math.hypot(px - ax, pz - az), t: 0 };
  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projZ = az + t * dz;
  return { dist: Math.hypot(px - projX, pz - projZ), t };
}

interface TreeItem {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  geo: THREE.BufferGeometry;
  mat: THREE.MeshStandardMaterial;
}

interface YardProps {
  engine?: PhysicsEngine | null;
}

/**
 * The garden yard with dynamic line-of-sight occluding trees:
 * Trees that obstruct the camera view of the player smoothly fade down to 10% opacity.
 */
export const Yard: React.FC<YardProps> = ({ engine }) => {
  const ground = useMemo(() => createGroundMaterial(), []);
  const { yardMesh, glowMesh } = useMemo(() => buildYard(), []);

  // 3 prominent yard trees built as separate meshes with dynamic transparency fading
  const trees = useMemo<TreeItem[]>(() => {
    // 1. Oak tree
    const bOak = new GeoBuilder(2024);
    addDeciduousTree(bOak, YARD_TREES.oak.x, YARD_TREES.oak.z, 1.2, {
      leaves: [PALETTE.leafDeep, PALETTE.leaf, PALETTE.leafLight, PALETTE.leafSun],
      canopyOffset: [-0.9, 0], canopyRadius: 1.35,
    });
    const oakGeo = bOak.build();

    // 2. Maple tree
    const bMaple = new GeoBuilder(2025);
    addDeciduousTree(bMaple, YARD_TREES.maple.x, YARD_TREES.maple.z, 1.05, {
      leaves: [PALETTE.autumn[3], PALETTE.autumn[0], PALETTE.autumn[1], PALETTE.autumn[2]],
      canopyOffset: [0.6, 0], canopyRadius: 1.35,
    });
    const mapleGeo = bMaple.build();

    // 3. Cherry blossom tree
    const bCherry = new GeoBuilder(2026);
    addDeciduousTree(bCherry, YARD_TREES.cherry.x, YARD_TREES.cherry.z, 1.0, {
      leaves: [PALETTE.blossom[3], PALETTE.blossom[0], PALETTE.blossom[1], PALETTE.blossom[2]],
      bark: '#5a3d2e', canopyRadius: 1.3, trunkHeight: 2.3,
    });
    const cherryGeo = bCherry.build();

    return [
      {
        id: 'oak',
        name: 'Oak Tree',
        x: YARD_TREES.oak.x - 0.9,
        z: YARD_TREES.oak.z,
        radius: 2.4,
        geo: oakGeo,
        mat: createTreeFoliageMaterial(),
      },
      {
        id: 'maple',
        name: 'Maple Tree',
        x: YARD_TREES.maple.x + 0.6,
        z: YARD_TREES.maple.z,
        radius: 2.3,
        geo: mapleGeo,
        mat: createTreeFoliageMaterial(),
      },
      {
        id: 'cherry',
        name: 'Cherry Blossom Tree',
        x: YARD_TREES.cherry.x,
        z: YARD_TREES.cherry.z,
        radius: 2.1,
        geo: cherryGeo,
        mat: createTreeFoliageMaterial(),
      },
    ];
  }, []);

  useEffect(() => () => {
    yardMesh.geometry.dispose();
    glowMesh.geometry.dispose();
    ground.dispose();
    trees.forEach((t) => {
      t.geo.dispose();
      t.mat.dispose();
    });
  }, [yardMesh, glowMesh, ground, trees]);

  // Dynamic tree transparency: fades opacity down to 10% (0.10) whenever a tree obstructs the character
  useFrame(({ camera }, delta) => {
    const px = engine ? engine.get_player_x() : 0;
    const py = engine ? engine.get_player_y() + 1.2 : 1.2;
    const pz = engine ? engine.get_player_z() : 8;
    const cam = camera.position;

    trees.forEach((tree) => {
      const { dist, t } = distToSegment(tree.x, tree.z, cam.x, cam.z, px, pz);
      const rayY = cam.y + t * (py - cam.y);

      // Check if tree is strictly between camera and player along the ray and intersects canopy volume
      const isOccluding = t > 0.05 && t < 0.95 && dist < tree.radius && rayY >= 0.2 && rayY <= 7.5;

      const targetOpacity = isOccluding ? 0.10 : 1.0;
      tree.mat.opacity = THREE.MathUtils.lerp(tree.mat.opacity, targetOpacity, Math.min(1, delta * 9));
      tree.mat.depthWrite = tree.mat.opacity > 0.92;
    });
  });

  return (
    <group>
      <WindDriver />

      {/* Seamless procedural meadow ground (same world-space colour field as the grass roots) */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ground}>
        <planeGeometry args={[260, 260]} />
      </mesh>

      <primitive object={yardMesh} />
      <primitive object={glowMesh} />

      {/* Dynamic line-of-sight occluding trees */}
      {trees.map((t) => (
        <mesh
          key={t.id}
          geometry={t.geo}
          material={t.mat}
          castShadow
          receiveShadow
          customDepthMaterial={getEnvDepthMaterial()}
        />
      ))}

      <Grass />
      <BadmintonCourt engine={engine} />
      <Fireflies />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Floating garden fireflies with breathing luminescence (batched in 1 draw call)
// ---------------------------------------------------------------------------
const FIREFLY_SEEDS: { x0: number; y0: number; z0: number; speed: number; phase: number }[] = [
  // Trellis gate cluster
  { x0: -0.8, y0: 1.4, z0: 11.5, speed: 1.1, phase: 0.2 },
  { x0: 0.8, y0: 1.8, z0: 11.7, speed: 0.9, phase: 1.8 },

  // Porch & front garden cluster
  { x0: -2.2, y0: 1.1, z0: -0.2, speed: 1.2, phase: 0.5 },
  { x0: 2.3, y0: 1.3, z0: -0.4, speed: 0.8, phase: 2.2 },

  // Cherry tree & flowers cluster
  { x0: -5.8, y0: 1.4, z0: 9.2, speed: 1.05, phase: 3.4 },
  { x0: -8.5, y0: 1.5, z0: -3.5, speed: 1.15, phase: 4.8 },
];

const _fireflyMatrix = new THREE.Matrix4();
const _fireflyPos = new THREE.Vector3();
const _fireflyScale = new THREE.Vector3();
const _fireflyQuat = new THREE.Quaternion();

export const Fireflies: React.FC = () => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.045, 6, 5), []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fff677', transparent: true, opacity: 0.88, depthWrite: false }),
    []
  );

  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const count = FIREFLY_SEEDS.length;

    for (let i = 0; i < count; i++) {
      const s = FIREFLY_SEEDS[i];
      const time = t * s.speed + s.phase;

      // 3D gentle Lissajous drift
      const x = s.x0 + Math.sin(time * 0.8) * 0.35 + Math.cos(time * 0.3) * 0.15;
      const y = s.y0 + Math.sin(time * 1.2) * 0.22 + Math.cos(time * 0.6) * 0.12;
      const z = s.z0 + Math.cos(time * 0.7) * 0.35 + Math.sin(time * 0.4) * 0.15;
      _fireflyPos.set(x, y, z);

      // Breathing luminescence / pulse
      const pulse = Math.pow(Math.sin(time * 1.8), 4);
      const sc = 0.5 + 0.9 * pulse;
      _fireflyScale.set(sc, sc, sc);

      _fireflyMatrix.compose(_fireflyPos, _fireflyQuat, _fireflyScale);
      mesh.setMatrixAt(i, _fireflyMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, FIREFLY_SEEDS.length]}
      frustumCulled={false}
    />
  );
};

// ---------------------------------------------------------------------------
// Ground: world-space meadow colour + foundation mulch + worn dirt path.
// ---------------------------------------------------------------------------
function createGroundMaterial(): THREE.MeshStandardMaterial {
  // Rich velvety lawn response for diorama lighting
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62, metalness: 0.02 });
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

       // 1. Natural worn earth path
       float pd = abs(vMeadowXZ.x - sin(vMeadowXZ.y * 0.9) * 0.22);
       float worn = (1.0 - smoothstep(0.32, 0.88, pd + envNoise(vMeadowXZ * 4.0) * 0.25))
                    * smoothstep(0.4, 0.9, vMeadowXZ.y) * (1.0 - smoothstep(11.9, 12.4, vMeadowXZ.y));

       // 2. Foundation garden soil / mulch skirt around the cottage
       vec2 houseHalf = vec2(6.85, 4.85);
       vec2 houseCenter = vec2(0.0, -6.0);
       vec2 dHouse = abs(vMeadowXZ - houseCenter) - houseHalf;
       float houseDist = length(max(dHouse, 0.0)) + min(max(dHouse.x, dHouse.y), 0.0);
       float mulch = (1.0 - smoothstep(0.02, 0.62, houseDist + envNoise(vMeadowXZ * 3.8) * 0.22))
                     * smoothstep(-0.25, 0.04, houseDist);

       // 3. Perimeter fence subtle earth contact rim
       float fenceBorder = smoothstep(11.9, 12.45, max(abs(vMeadowXZ.x), abs(vMeadowXZ.y)));

       // Blend grounding tones
       vec3 darkMulch = uDirt * vec3(0.62, 0.52, 0.44);
       mc = mix(mc, darkMulch, mulch * 0.78);
       mc = mix(mc, uDirt * 0.82, worn * 0.65);
       mc = mix(mc, uDirt * 0.72, fenceBorder * 0.35);

       vec4 diffuseColor = vec4( mc, opacity );`,
    );
  };
  mat.customProgramCacheKey = () => 'env-ground-v2';
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

  // Note: Yard trees are now rendered dynamically in <Yard> with line-of-sight 10% opacity fading

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

/** Storybook cream picket fence: scalloped catenary bays and timber gate archway with climbing roses. */
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
    b.add(PRIM.box, { pos: [x, 0.53, z], scale: [0.16, 1.06, 0.16], color: PALETTE.picketShade, facetJitter: 0.03 });
    b.add(PRIM.box, { pos: [x, 1.07, z], scale: [0.20, 0.04, 0.20], color: PALETTE.picket });
    b.add(PRIM.cone4, { pos: [x, 1.15, z], scale: [0.14, 0.14, 0.14], color: PALETTE.picket });
  };

  const picket = (x: number, z: number, yaw: number, h: number) => {
    b.add(PRIM.box, { pos: [x, 0.06 + h / 2, z], rot: [0, yaw, (r() - 0.5) * 0.035], scale: [0.105, h, 0.032], color: PALETTE.picket, facetJitter: 0.035 });
    b.add(PRIM.cone4, { pos: [x, 0.06 + h + 0.055, z], rot: [0, yaw, 0], scale: [0.076, 0.11, 0.028], color: PALETTE.picket });
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

      // Rails (slightly inside)
      for (const ry of [0.28, 0.70]) {
        b.add(PRIM.box, {
          pos: [mx - ox * 0.02, ry, mz - oz * 0.02],
          scale: alongX ? [len, 0.07, 0.035] : [0.035, 0.07, len],
          color: PALETTE.picketShade,
        });
      }

      const usable = len - 0.2;
      const n = Math.max(1, Math.round(usable / 0.25));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const px = x + (x2 - x) * (0.1 / len + t * usable / len);
        const pz = z + (z2 - z) * (0.1 / len + t * usable / len);

        // Storybook concave scalloped bay: pickets dip gracefully in the center
        const scallopDip = 0.18 * 4 * t * (1 - t);
        const h = 0.94 - scallopDip + (r() - 0.5) * 0.02;

        picket(px + ox * 0.045, pz + oz * 0.045, yaw, h);
      }
    }
  }

  // ---- Front Garden Trellis Arch & Gate ----
  buildGateTrellis(b, glow);
}

/** Front gate: sturdy pergola arbor arch with climbing rose vines, hanging carriage lantern, and arched gate leaves. */
function buildGateTrellis(b: GeoBuilder, glow: GeoBuilder): void {
  const r = b.rng;
  const F = FENCE;
  const gh = GATE_HALF; // 1.2
  const postH = 2.45;

  // 1. Two sturdy wooden pergola columns on stone footings
  for (const sx of [-1, 1]) {
    const x = sx * gh;
    // Molded stone footing
    b.add(PRIM.box, { pos: [x, 0.18, F], scale: [0.38, 0.36, 0.38], color: PALETTE.stone, facetJitter: 0.06, wobble: 0.03 });
    b.add(PRIM.box, { pos: [x, 0.38, F], scale: [0.42, 0.05, 0.42], color: PALETTE.stoneLight });

    // Main timber upright column
    b.add(PRIM.box, { pos: [x, 0.4 + (postH - 0.4) / 2, F], scale: [0.22, postH - 0.4, 0.22], color: PALETTE.woodLight, facetJitter: 0.04 });
    // Decorative collar trim near top
    b.add(PRIM.box, { pos: [x, postH - 0.08, F], scale: [0.28, 0.06, 0.28], color: PALETTE.wood });

    // Climbing rose vine wrapping around the upright post
    const turns = 5;
    for (let i = 0; i < turns; i++) {
      const a = i * 1.3 + (sx === 1 ? 0 : Math.PI);
      const vy = 0.45 + i * 0.38;
      const vx = x + Math.cos(a) * 0.14;
      const vz = F + Math.sin(a) * 0.14;
      b.add(PRIM.ico1, { pos: [vx, vy, vz], scale: 0.14 + r() * 0.04, color: i % 2 === 0 ? PALETTE.leaf : PALETTE.leafDeep, facetJitter: 0.08 });
      // Rosebud
      if (i % 2 === 1) {
        b.add(PRIM.ico0, { pos: [vx + Math.cos(a) * 0.06, vy + 0.05, vz + Math.sin(a) * 0.06], scale: 0.065, color: PALETTE.blossom[i % 3] });
      }
    }
  }

  // 2. Curved Pergola Arch Beam spanning between the posts
  const span = gh * 2 + 0.6; // 3.0m
  for (const zOff of [-0.08, 0.08]) {
    // Main arch beam
    b.add(PRIM.box, { pos: [0, postH + 0.06, F + zOff], scale: [span, 0.12, 0.07], color: PALETTE.wood });
    // Scrolled decorative bracket ends projecting past the posts
    for (const sx of [-1, 1]) {
      b.add(PRIM.box, { pos: [sx * (span / 2 + 0.08), postH + 0.09, F + zOff], scale: [0.18, 0.08, 0.07], color: PALETTE.woodLight, rot: [0, 0, sx * 0.4] });
      // Angle support brace
      const brace = between([sx * (gh - 0.12), postH - 0.45, F + zOff], [sx * (gh * 0.45), postH, F + zOff]);
      b.add(PRIM.box, { pos: brace.pos, rot: brace.rot, scale: [0.06, brace.len, 0.05], color: PALETTE.woodLight });
    }
  }

  // 3. Pergola transverse cross-rafters across the top
  const rafterCount = 6;
  for (let i = 0; i < rafterCount; i++) {
    const rx = -gh * 0.95 + (i / (rafterCount - 1)) * (gh * 1.9);
    b.add(PRIM.box, { pos: [rx, postH + 0.18, F], scale: [0.065, 0.08, 0.52], color: PALETTE.wood, facetJitter: 0.03 });
    // Vine leaves draping over cross-rafters
    if (i === 1 || i === 4) {
      b.add(PRIM.ico1, { pos: [rx, postH + 0.22, F + 0.12], scale: [0.18, 0.12, 0.18], color: PALETTE.leafLight, facetJitter: 0.08 });
      b.add(PRIM.ico0, { pos: [rx + 0.04, postH + 0.24, F + 0.18], scale: 0.06, color: PALETTE.blossom[0] });
    }
  }

  // 4. Center Hanging Carriage Lantern with warm glowing amber light
  // Suspension chain
  b.add(PRIM.cyl8, { pos: [0, postH - 0.1, F], scale: [0.015, 0.24, 0.015], color: PALETTE.lanternMetal });
  addLantern(b, glow, 0, postH - 0.35, F, 1.25);

  // 5. Arched Gate Leaves: two swinging doors with arched top profile
  for (const sx of [-1, 1]) {
    const inner = sx * 0.03;
    const outer = sx * (gh - 0.12);
    const w = Math.abs(outer - inner);
    const cx = (inner + outer) / 2;

    for (const ry of [0.24, 0.68]) {
      b.add(PRIM.box, { pos: [cx, ry, F - 0.03], scale: [w, 0.08, 0.04], color: PALETTE.woodLight, facetJitter: 0.04 });
    }
    const brace = between([outer, 0.26, F - 0.055], [inner, 0.66, F - 0.055]);
    b.add(PRIM.box, { pos: brace.pos, rot: brace.rot, scale: [0.06, brace.len, 0.03], color: PALETTE.woodLight });

    const n = 5;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const px = inner + (outer - inner) * t;
      // Arched crest profile: sweeps up towards the center
      const archFactor = 1.0 - Math.pow(Math.abs(px) / gh, 1.4);
      const h = 0.72 + 0.22 * archFactor;

      b.add(PRIM.box, { pos: [px, 0.1 + h / 2, F + 0.01], scale: [0.095, h, 0.03], color: PALETTE.picket, facetJitter: 0.03 });
      b.add(PRIM.cone4, { pos: [px, 0.1 + h + 0.055, F + 0.01], scale: [0.072, 0.11, 0.026], color: PALETTE.picket });
    }

    // Wrought-iron strap hinges + latch
    for (const hy of [0.24, 0.68]) {
      b.add(PRIM.box, { pos: [sx * (gh - 0.1), hy, F + 0.035], scale: [0.14, 0.045, 0.018], color: PALETTE.lanternMetal });
    }
  }
  // Iron thumb latch at center
  b.add(PRIM.box, { pos: [0, 0.54, F + 0.04], scale: [0.15, 0.055, 0.025], color: PALETTE.lanternMetal });
}

/** Handcrafted organic flagstone stepping stones, 3D clovers, and river pebble scatter. */
function buildPath(b: GeoBuilder): void {
  const r = b.rng;
  const stoneTones = [PALETTE.stone, PALETTE.stoneLight, PALETTE.stoneDark];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const z = PATH_START_Z + (PATH_END_Z - PATH_START_Z) * t;

    // Natural alternating human footstep cadence (left / right step sway)
    const stepSide = i % 2 === 0 ? -0.11 : 0.11;
    const x = pathX(z) + stepSide * (0.8 + r() * 0.4);

    // Diverse stone dimensions (some wide slabs, some compact stepping stones)
    const isSlab = i % 4 === 0;
    const sx = (isSlab ? 0.54 : 0.42) + r() * 0.08;
    const sz = (isSlab ? 0.44 : 0.34) + r() * 0.06;
    const rotY = r() * Math.PI;

    // Organic rounded flagstone
    b.add(PRIM.cyl8, {
      pos: [x, 0.018, z],
      rot: [0, rotY, 0],
      scale: [sx, 0.065, sz],
      color: stoneTones[i % 3],
      facetJitter: 0.06,
      wobble: 0.07,
      colorFn: (_x, y, _z, out) => {
        if (y > 0.4) out.multiplyScalar(1.06);
        else out.multiplyScalar(0.78);
      },
    });

    // 3D Miniature Clover Clumps & Moss in Stone Gaps
    if (i > 0 && i < count - 1 && r() > 0.25) {
      const cx = (x + pathX(z)) * 0.5 + (r() - 0.5) * 0.16;
      const cz = z + (r() - 0.5) * 0.22;
      const cloverColor = r() > 0.3 ? PALETTE.leafLight : PALETTE.leafSun;

      // 3 clover leaves arranged in a triad (shamrock)
      const leafCount = r() > 0.85 ? 4 : 3; // occasional 4-leaf clover!
      for (let l = 0; l < leafCount; l++) {
        const la = (l / leafCount) * Math.PI * 2;
        const lx = cx + Math.cos(la) * 0.04;
        const lz = cz + Math.sin(la) * 0.04;
        b.add(PRIM.ico0, {
          pos: [lx, 0.025, lz],
          scale: [0.038, 0.008, 0.038],
          color: cloverColor,
          facetJitter: 0.06,
        });
      }
    }
  }

  // Smooth river pebble clusters hugging the flagstone path
  for (let z = PATH_START_Z - 0.2; z < PATH_END_Z + 0.3; z += 0.24) {
    for (const side of [-1, 1]) {
      if (r() < 0.35) continue;
      const off = 0.65 + r() * 0.18;
      const x = pathX(z) + side * off;

      // Cluster of 2-3 pebbles
      const clusterSize = 1 + Math.floor(r() * 2.5);
      for (let c = 0; c < clusterSize; c++) {
        const px = x + (r() - 0.5) * 0.12;
        const pz = z + (r() - 0.5) * 0.12;
        const s = 0.038 + r() * 0.035;
        b.add(PRIM.ico0, {
          pos: [px, 0.012, pz],
          rot: [r() * 2, r() * 3, r() * 2],
          scale: [s, s * 0.6, s * (0.8 + r() * 0.4)],
          color: stoneTones[Math.floor(r() * stoneTones.length)],
          facetJitter: 0.08,
        });
      }
    }
  }
}
