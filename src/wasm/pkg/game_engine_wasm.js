/* @ts-self-types="./game_engine_wasm.d.ts" */

export class PhysicsEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PhysicsEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_physicsengine_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get_active_interaction() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.physicsengine_get_active_interaction(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get_bobbing() {
        const ret = wasm.physicsengine_get_bobbing(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_footstep_trigger() {
        const ret = wasm.physicsengine_get_footstep_trigger(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_particle_count() {
        const ret = wasm.physicsengine_get_particle_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Float32Array}
     */
    get_particles_data() {
        const ret = wasm.physicsengine_get_particles_data(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    get_particles_len() {
        const ret = wasm.physicsengine_get_particles_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Zero-allocation pointer to the linear memory particle buffer
     * @returns {number}
     */
    get_particles_ptr() {
        const ret = wasm.physicsengine_get_particles_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_player_rotation() {
        const ret = wasm.physicsengine_get_player_rotation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_player_speed() {
        const ret = wasm.physicsengine_get_player_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_player_x() {
        const ret = wasm.physicsengine_get_player_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_player_y() {
        const ret = wasm.physicsengine_get_player_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_player_z() {
        const ret = wasm.physicsengine_get_player_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_skid_intensity() {
        const ret = wasm.physicsengine_get_skid_intensity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_stumble_intensity() {
        const ret = wasm.physicsengine_get_stumble_intensity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_turn_velocity() {
        const ret = wasm.physicsengine_get_turn_velocity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_walk_cycle() {
        const ret = wasm.physicsengine_get_walk_cycle(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_wobble_x() {
        const ret = wasm.physicsengine_get_wobble_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_wobble_z() {
        const ret = wasm.physicsengine_get_wobble_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_inside_house() {
        const ret = wasm.physicsengine_is_inside_house(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    is_running() {
        const ret = wasm.physicsengine_is_running(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    is_walking() {
        const ret = wasm.physicsengine_is_walking(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.physicsengine_new();
        this.__wbg_ptr = ret;
        PhysicsEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Teleport into house desk
     */
    teleport_to_desk() {
        wasm.physicsengine_teleport_to_desk(this.__wbg_ptr);
    }
    /**
     * Reset character position to front gate
     */
    teleport_to_start() {
        wasm.physicsengine_teleport_to_start(this.__wbg_ptr);
    }
    /**
     * Turn character by incremental delta angle (positive = turn right, negative = turn left)
     * @param {number} steer_angle
     */
    turn(steer_angle) {
        wasm.physicsengine_turn(this.__wbg_ptr, steer_angle);
    }
    /**
     * Advance game physics, character movement, collisions, stumbling, and particles by delta_time.
     * steer: -1.0 (turn left) to +1.0 (turn right)
     * throttle: +1.0 (walk forward) to -1.0 (backpedal)
     * @param {number} steer
     * @param {number} throttle
     * @param {boolean} is_running
     * @param {number} dt
     */
    update(steer, throttle, is_running, dt) {
        wasm.physicsengine_update(this.__wbg_ptr, steer, throttle, is_running, dt);
    }
}
if (Symbol.dispose) PhysicsEngine.prototype[Symbol.dispose] = PhysicsEngine.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./game_engine_wasm_bg.js": import0,
    };
}

const PhysicsEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_physicsengine_free(ptr, 1));

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('game_engine_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
