import * as THREE from 'three';
import { GLSL_NOISE, envUniforms } from './materials';
import { PALETTE, SUN_DIRECTION } from './palette';

/**
 * Cheap opaque stylised river water (no transmission / transparency):
 * scrolling procedural ripples -> fake normal for fresnel sky tint + sun glints,
 * depth tint from bank to channel centre, and animated foam along both banks.
 * Expects uv.x = 0..1 across the river, uv.y = metres along it.
 */
export function createWaterMaterial(widthMetres: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uDeep: { value: new THREE.Color(PALETTE.waterDeep) },
        uShallow: { value: new THREE.Color(PALETTE.waterShallow) },
        uFoam: { value: new THREE.Color(PALETTE.foam) },
        uSky: { value: new THREE.Color(PALETTE.skyMid) },
        uSunDir: { value: SUN_DIRECTION.clone() },
        uWidth: { value: widthMetres },
        uTime: { value: 0 },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform vec3 uSky;
      uniform vec3 uSunDir;
      uniform float uWidth;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}

      float ripples(vec2 q) {
        float flow = uTime * 0.9;
        return envNoise(q * vec2(1.6, 0.55) + vec2(0.0, flow))
             + 0.5 * envNoise(q * vec2(3.1, 1.3) + vec2(uTime * 0.2, flow * 1.6));
      }

      void main() {
        vec2 q = vec2(vUv.x * uWidth, vUv.y);
        float h0 = ripples(q);
        float hx = ripples(q + vec2(0.08, 0.0));
        float hz = ripples(q + vec2(0.0, 0.08));
        vec3 N = normalize(vec3((h0 - hx) * 2.2, 1.0, (h0 - hz) * 2.2));
        vec3 V = normalize(cameraPosition - vWorldPos);

        float centre = 1.0 - abs(vUv.x * 2.0 - 1.0); // 0 at banks, 1 mid-channel
        vec3 col = mix(uShallow, uDeep, smoothstep(0.05, 0.7, centre));
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        col = mix(col, uSky, fres * 0.55);
        col *= 0.92 + h0 * 0.12;

        vec3 H = normalize(uSunDir + V);
        col += pow(max(dot(N, H), 0.0), 160.0) * 1.4;

        // Foam: broken band hugging both banks, drifting downstream
        float fn = envNoise(q * vec2(2.2, 0.9) + vec2(0.0, uTime * 1.2));
        float foam = 1.0 - smoothstep(0.03, 0.16, centre + (fn - 0.5) * 0.08);
        foam *= smoothstep(0.35, 0.55, fn + 0.25);
        col = mix(col, uFoam, foam * 0.85);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    fog: true,
  });
}

/** Binds the material's time uniform to the shared environment clock (no per-frame work). */
export function bindWaterTime(mat: THREE.ShaderMaterial): void {
  mat.uniforms.uTime = envUniforms.uTime;
}
