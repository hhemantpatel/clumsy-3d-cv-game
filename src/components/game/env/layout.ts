/**
 * Yard layout shared by Yard, Grass and Butterflies. Coordinates mirror the collider list in
 * crates/game_engine_wasm/src/lib.rs, so anything solid lines up with what the player bumps into.
 */

export const FENCE = 12.5;
export const GATE_HALF = 1.2;

/** Trees that have engine colliders (1.4 m boxes centred on these points). */
export const YARD_TREES = {
  oak: { x: -8.5, z: -4.0 },
  maple: { x: 9.2, z: -3.5 },
  cherry: { x: -6.0, z: 9.5 },
} as const;

/** Small walk-through shrubs (no colliders; kept tiny and away from walk lines). */
export const SHRUBS: { x: number; z: number; color: string }[] = [
  { x: -3.5, z: 2.5, color: '#e0546a' },
  { x: 3.6, z: 1.2, color: '#f2c14e' },
  { x: -2.8, z: 8.5, color: '#9c6ad6' },
  { x: -7.6, z: 2.1, color: '#e66fa4' },
];

export const MAILBOX = { x: 1.6, z: 10.8 };

/** Stepping-stone path from the porch (z ~0.9) to the front gate (z ~11.8). */
export const PATH_START_Z = 0.95;
export const PATH_END_Z = 11.85;
export function pathX(z: number): number {
  return Math.sin(z * 0.9) * 0.22;
}

/** True where nothing grass-like / decorative should be placed. `pad` grows every zone. */
export function isBlocked(x: number, z: number, pad = 0): boolean {
  // Outside / on the fence line
  if (Math.abs(x) > FENCE - 0.2 - pad || Math.abs(z) > FENCE - 0.2 - pad) return true;
  // House footprint (walls -6.8..6.8, -10.8..-1.2)
  if (x > -6.9 - pad && x < 6.9 + pad && z > -10.9 - pad && z < -1.1 + pad) return true;
  // Porch deck + posts
  if (x > -2.0 - pad && x < 2.0 + pad && z > -1.6 - pad && z < 0.55 + pad) return true;
  // Stepping-stone path
  if (z > PATH_START_Z - 0.5 && z < FENCE && Math.abs(x - pathX(z)) < 0.62 + pad) return true;
  // Automaton Garden planter + potting bench
  if (x > 4.55 - pad && x < 9.1 + pad && z > 1.85 - pad && z < 8.6 + pad) return true;
  if (x > 8.9 - pad && x < 9.85 + pad && z > 4.0 - pad && z < 6.4 + pad) return true;
  // Garden bench (Interactables, collider -8.8..-6.2 x 3.8..5.2)
  if (x > -8.9 - pad && x < -6.1 + pad && z > 3.7 - pad && z < 5.3 + pad) return true;
  // Mailbox
  if (Math.hypot(x - MAILBOX.x, z - MAILBOX.z) < 0.42 + pad) return true;
  // Tree trunks / roots
  for (const k in YARD_TREES) {
    const t = YARD_TREES[k as keyof typeof YARD_TREES];
    if (Math.hypot(x - t.x, z - t.z) < 0.75 + pad) return true;
  }
  // Shrubs
  for (const s of SHRUBS) {
    if (Math.hypot(x - s.x, z - s.z) < 0.5 + pad) return true;
  }
  return false;
}
