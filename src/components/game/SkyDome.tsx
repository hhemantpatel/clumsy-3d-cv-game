import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE, SUN_DIRECTION } from './env/palette';
import { GLSL_NOISE, envUniforms } from './env/materials';

/**
 * Procedural sky in ONE draw call:
 * - smooth zenith -> horizon gradient whose horizon equals the scene fog colour,
 * - analytic sun disc + layered glow evaluated per view direction (always perfectly round),
 *   placed along the same direction as GameCanvas' shadow-casting light,
 * - soft, drifting high-altitude cirrus streaks from projected fbm noise.
 * The dome is re-centred on the camera every frame so it can never be reached or clipped.
 */
const RADIUS = 200; // < camera far (240)

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunCore;
uniform vec3 uSunGlow;
uniform float uTime;
varying vec3 vDir;
${GLSL_NOISE}

void main() {
  vec3 d = normalize(vDir);
  float y = d.y;

  // Gradient (everything at/below the horizon is exactly the fog colour)
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.32, y));
  col = mix(col, uZenith, smoothstep(0.3, 1.0, y));

  // Atmospheric sun glow: wide warm glow + horizon warmth on the sun side
  float sd = max(dot(d, uSunDir), 0.0);
  float glow = pow(sd, 900.0) * 1.2 + pow(sd, 48.0) * 0.45 + pow(sd, 6.0) * 0.18;
  col += uSunGlow * glow;
  col += uSunGlow * 0.12 * pow(sd, 2.0) * (1.0 - smoothstep(0.0, 0.35, y));

  // Cirrus wisps: stretched fbm projected onto a high cloud plane
  if (y > 0.015) {
    vec2 p = d.xz / (y + 0.12);
    p += vec2(uTime * 0.006, uTime * 0.0025);
    float c = 0.6;
    float sn = sin(c), cs = cos(c);
    p = mat2(cs, -sn, sn, cs) * p;
    float n = envFbm(vec2(p.x * 0.55, p.y * 2.6) * 1.4);
    float detail = envNoise(vec2(p.x * 2.0, p.y * 9.0));
    float wisp = smoothstep(0.52, 0.82, n + detail * 0.12);
    float fade = smoothstep(0.015, 0.22, y) * (1.0 - 0.5 * smoothstep(0.55, 1.0, y));
    col = mix(col, vec3(1.0), wisp * fade * 0.42);
  }

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const SkyDome: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.SphereGeometry(RADIUS, 32, 16);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uZenith: { value: new THREE.Color(PALETTE.skyZenith) },
        uMid: { value: new THREE.Color(PALETTE.skyMid) },
        uHorizon: { value: new THREE.Color(PALETTE.skyHorizon) },
        uSunDir: { value: SUN_DIRECTION.clone() },
        uSunCore: { value: new THREE.Color(PALETTE.sunCore) },
        uSunGlow: { value: new THREE.Color(PALETTE.sunGlow) },
        uTime: envUniforms.uTime,
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    return { geometry, material };
  }, []);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // Follow the camera (position only) so the sky is always "at infinity"
  useFrame(({ camera }) => {
    if (meshRef.current) meshRef.current.position.copy(camera.position);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={-1000} frustumCulled={false} />;
};
