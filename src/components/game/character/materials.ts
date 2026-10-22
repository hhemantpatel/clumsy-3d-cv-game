// Shared cel-shaded (toon) materials for the player character.
// One 4-step gradient ramp is shared by every toon material; materials are
// created once per skin tone and cached at module level.
import * as THREE from 'three';
import { textureGen } from '../../../utils/textures';

export const OUTLINE_COLOR = '#2b1d16';
/** Object-space outline thickness (inverted hull). */
export const OUTLINE_THICKNESS = 0.016;

let gradient: THREE.DataTexture | null = null;

/** 4-step toon ramp: core shadow, soft shadow, mid-tone, lit. NearestFilter = crisp bands. */
export function getToonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const steps = [105, 150, 215, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => {
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  });
  gradient = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

function toon(color: string, extra: THREE.MeshToonMaterialParameters = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: getToonGradient(), ...extra });
}

function build(skinTone: string) {
  const fabricBump = textureGen.getFabricBump();
  return {
    // --- Core shared body materials ---
    skin: toon(skinTone),
    hoodie: toon('#4f46e5', { bumpMap: fabricBump, bumpScale: 0.02 }),
    hoodieDark: toon('#3730a3', { bumpMap: fabricBump, bumpScale: 0.015 }),
    jeans: toon('#3d5a8a', { bumpMap: fabricBump, bumpScale: 0.015 }),
    jeansLight: toon('#6b8cc0'),
    shoe: toon('#f8fafc'),
    accent: toon('#f97316'),
    accentDark: toon('#c2410c'),

    // --- Small detail materials ---
    hair: toon('#5b3a1e'),
    pomPom: toon('#fff7ed'),
    aglet: toon('#fbbf24'),
    glasses: toon('#2a2320'),
    cheek: toon('#f29a86'),
    eye: new THREE.MeshBasicMaterial({ color: '#1c1310' }),
    eyeHighlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    mouth: new THREE.MeshBasicMaterial({ color: '#5b2418' }),
    mouthInner: new THREE.MeshBasicMaterial({ color: '#6e1f22' }),
  };
}

export type CharacterMaterials = ReturnType<typeof build>;

const cache = new Map<string, CharacterMaterials>();

export function getCharacterMaterials(skinTone: string): CharacterMaterials {
  let m = cache.get(skinTone);
  if (!m) {
    m = build(skinTone);
    cache.set(skinTone, m);
  }
  return m;
}
