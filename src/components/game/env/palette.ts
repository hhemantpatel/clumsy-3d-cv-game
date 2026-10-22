import * as THREE from 'three';

/**
 * Cohesive "cozy storybook" outdoor palette shared by the yard, grass, scenery and sky.
 * Keep colours here instead of sprinkling raw hexes through the components so the
 * whole environment can be re-tuned in one place.
 */
export const PALETTE = {
  // Meadow / lawn (ground and grass blades share these so they blend seamlessly)
  meadowA: '#528334',
  meadowB: '#6b983f',
  meadowDry: '#a3ad4c',
  bladeTip: '#c5d77a',
  bladeBase: '#355f25',

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

  // Wood & bark
  bark: '#6b4a33',
  barkDark: '#4c3324',
  birchBark: '#ece6da',
  birchMark: '#3d3631',
  wood: '#9a6a43',
  woodDark: '#6b4730',
  woodLight: '#c49563',
  picket: '#f2eadb',
  picketShade: '#e0d3ba',

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
  roofRed: '#b1503d',
  roofBrown: '#7a5236',
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

  // Sky (horizon matches GameCanvas fog colour so the dome melts into fog)
  skyZenith: '#4d8bd8',
  skyMid: '#92c3f0',
  skyHorizon: '#bfdbfe',
  sunCore: '#fff6dc',
  sunGlow: '#ffe3a3',
  cloud: '#ffffff',
  cloudShade: '#dfe8f2',
} as const;

/**
 * GameCanvas places its shadow-casting directional light at this position (target at origin).
 * The visible sun in the sky dome and the water specular use the same direction so shadows
 * always point away from the sun the player sees.
 */
export const SUN_POSITION: [number, number, number] = [-14, 24, 18];
export const SUN_DIRECTION = new THREE.Vector3(...SUN_POSITION).normalize();
