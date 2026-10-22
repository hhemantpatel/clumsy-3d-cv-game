import * as THREE from 'three';

/**
 * Cohesive "cozy storybook" outdoor palette shared by the yard, grass, scenery and sky.
 * Keep colours here instead of sprinkling raw hexes through the components so the
 * whole environment can be re-tuned in one place.
 */
export const PALETTE = {
  // Meadow / lawn: vibrant lush emerald & sunny chartreuse
  meadowA: '#48a832',
  meadowB: '#6ec238',
  meadowDry: '#a3d944',
  bladeTip: '#d9f99d',
  bladeBase: '#22541d',

  // Foliage
  leafDeep: '#2f6532',
  leaf: '#3f7d3a',
  leafLight: '#5f9a45',
  leafSun: '#86b552',
  pineDeep: '#21503a',
  pine: '#2c6346',
  pineLight: '#3d7a52',
  blossom: ['#e58fb2', '#f0a9c4', '#f6c5d7', '#dc7ba3'],
  autumn: ['#cf5a2c', '#e07a36', '#eda047', '#bf4b2b'],
  birchLeaf: ['#b9c64c', '#d3d86f', '#a7b845'],
  willow: ['#7fa94a', '#93b957', '#6a9640'],

  // Wood & bark: warm rich cedar & amber
  bark: '#6b4a33',
  barkDark: '#4c3324',
  birchBark: '#ece6da',
  birchMark: '#3d3631',
  wood: '#b45309',
  woodDark: '#78350f',
  woodLight: '#d97706',
  picket: '#fef3c7',
  picketShade: '#fde68a',

  // Stone, soil, water
  stone: '#99958b',
  stoneDark: '#76736c',
  stoneLight: '#b0ab9f',
  dirt: '#a98b62',
  dirtDark: '#8a6e4e',
  sand: '#ab9f7b',
  waterDeep: '#2b6f8f',
  waterShallow: '#4fa2b5',
  foam: '#eaf5f2',

  // Accents
  flowers: ['#f6f1e4', '#f5d25a', '#ee8db0', '#b48ae0', '#f08d5c', '#86b3ea'],
  berry: '#c43a4c',
  roofRed: '#c2410c',
  roofBrown: '#92400e',
  roofBlue: '#4d5b8a',
  cream: '#f4ead2',
  wool: '#f3f0ea',
  charcoal: '#2d2a28',
  lanternMetal: '#2e3436',
  balloon: ['#d9503f', '#f2d27a', '#f4ead2', '#4f86c6'],

  // Distant landscape (slightly desaturated so fog layers them nicely)
  hillA: '#4e8638',
  hillB: '#5f9443',
  hillC: '#3f7433',
  mountainA: '#557a68',
  mountainB: '#4a6d61',
  mountainTop: '#7d9a8d',
  snow: '#eef2f2',

  // Sky: rich storybook sunset gradient (horizon matches GameCanvas fog colour)
  skyZenith: '#3a4b6e',
  skyMid: '#df6d4e',
  skyHorizon: '#ffaa5b',
  sunCore: '#fff8b8',
  sunGlow: '#ff7824',
  cloud: '#fff5ea',
  cloudShade: '#f3c4a8',
} as const;

/**
 * GameCanvas places its shadow-casting directional light at this position (target at origin).
 * Low-angle golden sunset position (~21° elevation) in the western-northwestern sky.
 * The visible sun in the sky and water specular use the exact same direction so shadows
 * always point away from the sun the player sees.
 */
export const SUN_POSITION: [number, number, number] = [-45, 22, -35];
export const SUN_DIRECTION = new THREE.Vector3(...SUN_POSITION).normalize();
export const SUN_DISTANCE_FAR = 135;
export const SUN_POSITION_FAR: [number, number, number] = [
  SUN_DIRECTION.x * SUN_DISTANCE_FAR,
  SUN_DIRECTION.y * SUN_DISTANCE_FAR,
  SUN_DIRECTION.z * SUN_DISTANCE_FAR,
];
