// Shared materials for the player character with instant style switching.
// Supports:
// - 'toy' (Option 2): Tactile miniature vinyl/diorama toy figurine with soft PBR
//   specular sheen, glossy bead eyes, and clean physical forms.
// - 'toon': Original cel-shaded cartoon with 4-step stepped gradient ramps and outlines.
import * as THREE from 'three';
import { textureGen } from '../../../utils/textures';

export const OUTLINE_COLOR = '#2b1d16';
/** Object-space outline thickness (inverted hull). */
export const OUTLINE_THICKNESS = 0.016;

export type CharacterStyle = 'toy' | 'toon';

/**
 * Visual Style Configuration:
 * Change to 'toon' to revert back to original cel-shaded cartoon styling anytime.
 */
export let CURRENT_CHARACTER_STYLE: CharacterStyle = 'toy';

export function setCharacterStyle(style: CharacterStyle) {
  CURRENT_CHARACTER_STYLE = style;
  cache.clear();
}

// Global browser window hook for instant live testing: window.__setCharacterStyle('toy' | 'toon')
if (typeof window !== 'undefined') {
  (window as any).__setCharacterStyle = setCharacterStyle;
}

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

function buildToon(skinTone: string) {
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

function buildToy(skinTone: string) {
  const fabricBump = textureGen.getFabricBump();
  return {
    // --- Option 2: Miniature Diorama Toy / Vinyl Figurine Materials ---
    skin: new THREE.MeshStandardMaterial({
      color: skinTone,
      roughness: 0.38,
      metalness: 0.04,
    }),
    hoodie: new THREE.MeshStandardMaterial({
      color: '#4338ca',
      roughness: 0.62,
      metalness: 0.02,
      bumpMap: fabricBump,
      bumpScale: 0.015,
    }),
    hoodieDark: new THREE.MeshStandardMaterial({
      color: '#312e81',
      roughness: 0.66,
      metalness: 0.02,
      bumpMap: fabricBump,
      bumpScale: 0.012,
    }),
    jeans: new THREE.MeshStandardMaterial({
      color: '#2563eb',
      roughness: 0.58,
      metalness: 0.04,
      bumpMap: fabricBump,
      bumpScale: 0.015,
    }),
    jeansLight: new THREE.MeshStandardMaterial({
      color: '#60a5fa',
      roughness: 0.52,
      metalness: 0.02,
    }),
    shoe: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.22,
      metalness: 0.05,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#f97316',
      roughness: 0.48,
      metalness: 0.03,
    }),
    accentDark: new THREE.MeshStandardMaterial({
      color: '#c2410c',
      roughness: 0.54,
      metalness: 0.03,
    }),

    // --- Miniature Toy Face & Accessory Details ---
    hair: new THREE.MeshStandardMaterial({
      color: '#452b14',
      roughness: 0.32,
      metalness: 0.06,
    }),
    pomPom: new THREE.MeshStandardMaterial({
      color: '#fef3c7',
      roughness: 0.88,
      metalness: 0.0,
    }),
    aglet: new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.2,
      metalness: 0.75,
    }),
    glasses: new THREE.MeshStandardMaterial({
      color: '#18181b',
      roughness: 0.12,
      metalness: 0.25,
    }),
    cheek: new THREE.MeshStandardMaterial({
      color: '#fb7185',
      roughness: 0.42,
      metalness: 0.0,
    }),
    eye: new THREE.MeshStandardMaterial({
      color: '#09090b',
      roughness: 0.08,
      metalness: 0.3,
    }),
    eyeHighlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    mouth: new THREE.MeshStandardMaterial({
      color: '#881337',
      roughness: 0.28,
    }),
    mouthInner: new THREE.MeshStandardMaterial({
      color: '#9f1239',
      roughness: 0.35,
    }),
  };
}

export type CharacterMaterials = {
  skin: THREE.Material;
  hoodie: THREE.Material;
  hoodieDark: THREE.Material;
  jeans: THREE.Material;
  jeansLight: THREE.Material;
  shoe: THREE.Material;
  accent: THREE.Material;
  accentDark: THREE.Material;
  hair: THREE.Material;
  pomPom: THREE.Material;
  aglet: THREE.Material;
  glasses: THREE.Material;
  cheek: THREE.Material;
  eye: THREE.Material;
  eyeHighlight: THREE.Material;
  mouth: THREE.Material;
  mouthInner: THREE.Material;
};

function build(skinTone: string): CharacterMaterials {
  return CURRENT_CHARACTER_STYLE === 'toy' ? buildToy(skinTone) : buildToon(skinTone);
}

const cache = new Map<string, CharacterMaterials>();

export function getCharacterMaterials(skinTone: string): CharacterMaterials {
  let m = cache.get(skinTone);
  if (!m) {
    m = build(skinTone);
    cache.set(skinTone, m);
  }
  return m;
}
