import * as THREE from 'three';
import { PALETTE } from './palette';

/**
 * Shared uniforms: ONE time value drives every wind/water/sky animation in the environment.
 * Updated once per frame by <WindDriver/> (mounted in Yard).
 */
export const envUniforms = {
  uTime: { value: 0 },
};

/** GLSL value noise + fbm helpers shared by grass, ground, water and sky shaders. */
export const GLSL_NOISE = /* glsl */ `
float envHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float envNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(envHash(i), envHash(i + vec2(1.0, 0.0)), u.x),
             mix(envHash(i + vec2(0.0, 1.0)), envHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float envFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * envNoise(p); p = p * 2.03 + 17.17; a *= 0.5; }
  return v;
}
`;

/** World-space meadow colour, used by BOTH the ground plane and grass-blade roots so they blend. */
export const GLSL_MEADOW = /* glsl */ `
uniform vec3 uMeadowA;
uniform vec3 uMeadowB;
uniform vec3 uMeadowDry;
vec3 meadowColor(vec2 p) {
  float n1 = envNoise(p * 0.085);
  float n2 = envNoise(p * 0.31 + 13.7);
  vec3 c = mix(uMeadowA, uMeadowB, smoothstep(0.25, 0.8, n1));
  c = mix(c, uMeadowDry, smoothstep(0.6, 0.95, n2) * 0.5);
  return c;
}
`;

export function meadowUniforms() {
  return {
    uMeadowA: { value: new THREE.Color(PALETTE.meadowA) },
    uMeadowB: { value: new THREE.Color(PALETTE.meadowB) },
    uMeadowDry: { value: new THREE.Color(PALETTE.meadowDry) },
  };
}

// ---------------------------------------------------------------------------
// Foliage material: vertex-coloured, flat low-poly, with vertex-shader wind sway.
// Geometry comes from GeoBuilder (world-space, windW attribute).
// ---------------------------------------------------------------------------
const WIND_VERTEX = /* glsl */ `
#include <begin_vertex>
{
  vec4 wPos = modelMatrix * vec4(transformed, 1.0);
  float hgt = max(wPos.y, 0.0);
  float ph = wPos.x * 0.23 + wPos.z * 0.19;
  float sway = sin(uTime * 1.25 + ph) * 0.65 + sin(uTime * 2.3 + ph * 1.7) * 0.35;
  float amt = windW * hgt * 0.018 * sway;
  transformed.x += amt;
  transformed.z += amt * 0.55;
  // subtle leaf shimmer on the canopy
  transformed.y += sin(uTime * 3.1 + ph * 6.0 + wPos.y * 2.0) * 0.012 * clamp(windW, 0.0, 1.0) * step(1.2, hgt);
}
`;

function patchWind(shader: { uniforms: Record<string, THREE.IUniform>; vertexShader: string }) {
  shader.uniforms.uTime = envUniforms.uTime;
  shader.vertexShader = 'attribute float windW;\nuniform float uTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', WIND_VERTEX);
}

let foliageMat: THREE.MeshStandardMaterial | null = null;
let foliageDepthMat: THREE.MeshDepthMaterial | null = null;

/** Shared low-poly material for every merged environment mesh (yard, trees, scenery). */
export function getEnvMaterial(): THREE.MeshStandardMaterial {
  if (!foliageMat) {
    // Tactile miniature model canopy finish with soft specular highlights
    foliageMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.52, metalness: 0.02 });
    foliageMat.onBeforeCompile = patchWind;
    foliageMat.customProgramCacheKey = () => 'env-wind-v1';
  }
  return foliageMat;
}

/** Depth material with the same sway so swaying canopies cast matching shadows. */
export function getEnvDepthMaterial(): THREE.MeshDepthMaterial {
  if (!foliageDepthMat) {
    foliageDepthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    foliageDepthMat.onBeforeCompile = patchWind;
    foliageDepthMat.customProgramCacheKey = () => 'env-wind-depth-v1';
  }
  return foliageDepthMat;
}

let glowMat: THREE.MeshBasicMaterial | null = null;
/** Unlit emissive glow (lantern cores, campfire, burner). Colours > 1 feed the Bloom pass. */
export function getGlowMaterial(): THREE.MeshBasicMaterial {
  if (!glowMat) {
    glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  }
  return glowMat;
}

/** Builds a mesh from a merged geometry with the shared env material. */
export function makeEnvMesh(geo: THREE.BufferGeometry, opts: { castShadow?: boolean; receiveShadow?: boolean } = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, getEnvMaterial());
  mesh.castShadow = !!opts.castShadow;
  mesh.receiveShadow = !!opts.receiveShadow;
  if (opts.castShadow) mesh.customDepthMaterial = getEnvDepthMaterial();
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}
