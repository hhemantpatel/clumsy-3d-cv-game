import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { makeRng } from './env/GeoBuilder';
import { GLSL_MEADOW, GLSL_NOISE, envUniforms, meadowUniforms } from './env/materials';
import { PALETTE } from './env/palette';
import { FENCE, isBlocked } from './env/layout';

/**
 * ~20k instanced, wind-swept grass blades in a single draw call.
 * - Tapered, slightly curved blade geometry (9 verts).
 * - Root colour sampled from the same world-space meadow field as the ground plane, so the lawn
 *   blends seamlessly; tips fade to a sunlit yellow-green.
 * - Wind sway + travelling gusts in the vertex shader (shared uTime uniform, no CPU work per frame).
 * - Lambert lighting with up-facing normals (no dark back faces), receives shadows, fog included.
 * - Excludes house, porch, path, planter, benches, mailbox, trees and shrubs (env/layout.ts).
 */
export const Grass: React.FC = () => {
  const mesh = useMemo(() => buildGrass(), []);
  useEffect(() => () => {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    mesh.dispose();
  }, [mesh]);
  return <primitive object={mesh} />;
};

/** Unit blade: height 1, base width 1 (scaled per instance), gentle forward curve. */
function createBladeGeometry(): THREE.BufferGeometry {
  const levels = [0, 0.3, 0.58, 0.82];
  const pos: number[] = [];
  const nrm: number[] = [];
  for (const h of levels) {
    const w = 0.5 * (1 - Math.pow(h, 1.4) * 0.85);
    const bend = h * h * 0.28;
    pos.push(-w, h, bend, w, h, bend);
    nrm.push(0, 1, 0, 0, 1, 0);
  }
  pos.push(0, 1, 0.28); // tip
  nrm.push(0, 1, 0);
  const idx: number[] = [];
  for (let i = 0; i < levels.length - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const last = (levels.length - 1) * 2;
  idx.push(last, last + 1, last + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

function createGrassMaterial(): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const uniforms = {
    ...meadowUniforms(),
    uTip: { value: new THREE.Color(PALETTE.bladeTip) },
    uBase: { value: new THREE.Color(PALETTE.bladeBase) },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.uniforms.uTime = envUniforms.uTime;
    shader.vertexShader =
      'uniform float uTime;\nuniform vec3 uTip;\nuniform vec3 uBase;\nvarying vec3 vGrassColor;\n' +
      GLSL_NOISE + GLSL_MEADOW +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        /* glsl */ `
        vec4 mvPosition = instanceMatrix * vec4( transformed, 1.0 );
        vec2 root = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        float h = clamp(position.y, 0.0, 1.0);
        // Wind: steady sway + slow travelling gusts sweeping across the lawn
        float gust = envNoise(root * 0.12 + vec2(uTime * 0.45, uTime * 0.18));
        float sway = sin(uTime * 2.1 + root.x * 0.7 + root.y * 0.45) * 0.3 + (gust - 0.35) * 1.3;
        float bladeH = length(instanceMatrix[1].xyz);
        float bend = h * h * sway * 0.16 * (0.6 + bladeH * 1.6);
        mvPosition.x += bend;
        mvPosition.z += bend * 0.45;
        mvPosition.y -= abs(bend) * 0.35 * h;
        // Colour: meadow root -> sunlit tip, with patchy variation and gust highlights
        vec3 meadow = meadowColor(root);
        vec3 baseC = mix(uBase, meadow, 0.55) * 0.82;
        vec3 tipC = mix(meadow * 1.25, uTip, 0.45 + envNoise(root * 0.6) * 0.3);
        vGrassColor = mix(baseC, tipC, smoothstep(0.0, 1.0, h));
        vGrassColor *= 1.0 + gust * 0.12 * h;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
        `,
      );
    shader.fragmentShader = 'varying vec3 vGrassColor;\n' + shader.fragmentShader
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vGrassColor, opacity );')
      // Keep the up-facing normal on back faces too (blades light like the lawn, never go black)
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize( vNormal );');
  };
  mat.customProgramCacheKey = () => 'env-grass-v1';
  return mat;
}

function buildGrass(): THREE.InstancedMesh {
  const rng = makeRng(42);
  const cell = 0.155;
  const span = FENCE - 0.25;
  const cells = Math.floor((span * 2) / cell);
  const matrices: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  for (let ix = 0; ix < cells; ix++) {
    for (let iz = 0; iz < cells; iz++) {
      const x = -span + (ix + rng()) * cell;
      const z = -span + (iz + rng()) * cell;
      if (isBlocked(x, z)) {
        rng();
        rng();
        rng();
        continue;
      }
      // Taller, shaggier grass toward the fence and around trees; shorter near the path edges
      const edge = Math.max(Math.abs(x), Math.abs(z));
      const shaggy = 1 + 0.55 * THREE.MathUtils.smoothstep(edge, 10.2, 12.2);
      const nearZone = isBlocked(x, z, 0.35) ? 0.72 : 1;
      const height = (0.2 + rng() * 0.2) * shaggy * nearZone;
      const width = 0.06 + rng() * 0.035;
      dummy.position.set(x, 0, z);
      dummy.rotation.set((rng() - 0.5) * 0.3, rng() * Math.PI * 2, (rng() - 0.5) * 0.3);
      dummy.scale.set(width, height, height);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
  }

  const mesh = new THREE.InstancedMesh(createBladeGeometry(), createGrassMaterial(), matrices.length);
  for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.computeBoundingSphere();
  mesh.name = 'grass';
  return mesh;
}
