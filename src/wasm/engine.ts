import init, { PhysicsEngine } from './pkg/game_engine_wasm.js';
import wasmUrl from './pkg/game_engine_wasm_bg.wasm?url';

let engineInstance: PhysicsEngine | null = null;
let initPromise: Promise<PhysicsEngine> | null = null;

export async function getPhysicsEngine(): Promise<PhysicsEngine> {
  if (engineInstance) return engineInstance;

  if (!initPromise) {
    initPromise = (async () => {
      await init(wasmUrl);
      engineInstance = new PhysicsEngine();
      return engineInstance;
    })();
  }

  return initPromise;
}
