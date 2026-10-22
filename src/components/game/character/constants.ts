// Layout + tuning constants shared by the character model and its animation.

/** Body pivot height (calibrated so the soles touch the ground). */
export const BODY_PIVOT_Y = 0.51;
/** Distance from the body pivot down to the shoe soles (used to squash from the floor). */
export const PIVOT_TO_SOLE = 0.5;

/** Top of the indoor floor slab; the blob shadow is lifted onto it while inside. */
export const INSIDE_FLOOR_Y = 0.16;
export const SHADOW_LIFT = 0.02;
export const SHADOW_OPACITY = 0.88;

export const POM_BASE: [number, number, number] = [0, 0.38, -0.04];

// Face layout (head-local)
export const EYE_Y = -0.015;
export const EYE_X = 0.095;
export const EYE_SCALE: [number, number, number] = [1, 1.2, 0.5];
export const BROW_Y = 0.064;
export const MOUTH_Y = -0.115;

// Timings (seconds)
export const FIDGET_START = 5;
export const FIDGET_PERIOD = 6;
export const FIDGET_LEN = 3.2;
export const SLEEPY_START = 8;
export const WAVE_DURATION = 1;

// Exponential smoothing rates for THREE.MathUtils.damp (equivalent to the old
// per-frame lerp factors at 60 fps: 0.16 -> ~10.5, 0.1 -> ~6.3).
export const SETTLE_LAMBDA = 10.5;
export const GLASSES_LAMBDA = 6.3;
export const ARM_LAG_LAMBDA = 20;
export const FACE_LAMBDA = 14;
export const LOOK_LAMBDA = 5;

/** Interaction trigger centres (mirrors TriggerZone list in crates/game_engine_wasm/src/lib.rs). */
export const ZONE_POSITIONS: Record<string, readonly [number, number]> = {
  projects: [-4.2, -7.4],
  skills: [-4.9, -4.5],
  experience: [4.5, -8.6],
  bed: [4.2, -2.2],
  contact: [1.6, 9.8],
  about: [-7.5, 5.8],
  badminton: [6.8, 5.2],
};
