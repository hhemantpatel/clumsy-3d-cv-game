/* tslint:disable */
/* eslint-disable */

export class PhysicsEngine {
    free(): void;
    [Symbol.dispose](): void;
    get_active_interaction(): string;
    get_bobbing(): number;
    get_footstep_trigger(): number;
    get_particle_count(): number;
    get_particles_data(): Float32Array;
    get_particles_len(): number;
    /**
     * Zero-allocation pointer to the linear memory particle buffer
     */
    get_particles_ptr(): number;
    get_player_rotation(): number;
    get_player_speed(): number;
    get_player_x(): number;
    get_player_y(): number;
    get_player_z(): number;
    get_skid_intensity(): number;
    get_stumble_intensity(): number;
    get_turn_velocity(): number;
    get_walk_cycle(): number;
    get_wobble_x(): number;
    get_wobble_z(): number;
    is_inside_house(): boolean;
    is_running(): boolean;
    is_walking(): boolean;
    constructor();
    /**
     * Teleport into house desk
     */
    teleport_to_desk(): void;
    /**
     * Reset character position to front gate
     */
    teleport_to_start(): void;
    /**
     * Turn character by incremental delta angle (positive = turn right, negative = turn left)
     */
    turn(steer_angle: number): void;
    /**
     * Advance game physics, character movement, collisions, stumbling, and particles by delta_time.
     * steer: -1.0 (turn left) to +1.0 (turn right)
     * throttle: +1.0 (walk forward) to -1.0 (backpedal)
     */
    update(steer: number, throttle: number, is_running: boolean, dt: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_physicsengine_free: (a: number, b: number) => void;
    readonly physicsengine_get_active_interaction: (a: number) => [number, number];
    readonly physicsengine_get_bobbing: (a: number) => number;
    readonly physicsengine_get_footstep_trigger: (a: number) => number;
    readonly physicsengine_get_particle_count: (a: number) => number;
    readonly physicsengine_get_particles_data: (a: number) => [number, number];
    readonly physicsengine_get_particles_len: (a: number) => number;
    readonly physicsengine_get_particles_ptr: (a: number) => number;
    readonly physicsengine_get_player_rotation: (a: number) => number;
    readonly physicsengine_get_player_speed: (a: number) => number;
    readonly physicsengine_get_player_x: (a: number) => number;
    readonly physicsengine_get_player_y: (a: number) => number;
    readonly physicsengine_get_player_z: (a: number) => number;
    readonly physicsengine_get_skid_intensity: (a: number) => number;
    readonly physicsengine_get_stumble_intensity: (a: number) => number;
    readonly physicsengine_get_turn_velocity: (a: number) => number;
    readonly physicsengine_get_walk_cycle: (a: number) => number;
    readonly physicsengine_get_wobble_x: (a: number) => number;
    readonly physicsengine_get_wobble_z: (a: number) => number;
    readonly physicsengine_is_inside_house: (a: number) => number;
    readonly physicsengine_is_running: (a: number) => number;
    readonly physicsengine_is_walking: (a: number) => number;
    readonly physicsengine_new: () => number;
    readonly physicsengine_teleport_to_desk: (a: number) => void;
    readonly physicsengine_teleport_to_start: (a: number) => void;
    readonly physicsengine_turn: (a: number, b: number) => void;
    readonly physicsengine_update: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
