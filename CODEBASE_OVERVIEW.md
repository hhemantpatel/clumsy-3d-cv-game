# Clumsy 3D CV Game — Complete Architecture & Codebase Guide for AI Agents

> **Audience**: AI Coding Agents, Systems Developers, and Maintainers  
> **Repository**: `clumsy-3d-cv-game`  
> **Primary Technologies**: Rust (WebAssembly), React 18, TypeScript, Three.js (@react-three/fiber, @react-three/drei, @react-three/postprocessing), Tailwind CSS, Web Audio API, Vite  
> **Author Portfolio**: Hemant Patel (IIT Jodhpur)

---

## 1. Executive Summary & Core Design Philosophy

`clumsy-3d-cv-game` is an interactive, browser-based 3D portfolio and coding mini-game. It reimagines traditional 2D static resumes as an atmospheric, low-poly 3D world exploring a cozy home, garden, and surrounding countryside.

### Key Architectural Pillars
1. **Hybrid Rust WASM + TypeScript Architecture**:
   - High-throughput physics calculations, collision detection, wall sliding, stumble impulse response, and particle simulation run compiled to WebAssembly from Rust (`crates/game_engine_wasm/`).
   - Scene composition, lighting, camera control, UI state, and user interactions run in React 18 and React Three Fiber.
2. **Zero-Asset Footprint**:
   - Zero heavy external `.gltf`/`.glb` 3D model downloads: all 3D geometries (character, house, trees, boat, windmill, crops, furniture) are procedurally constructed using Three.js primitives (`RoundedBox`, `CylinderGeometry`, `ExtrudeGeometry`).
   - Zero audio file downloads: all sound effects (footsteps, bumps, chords, harvest chimes, level-up fanfares, wind ambience) are synthesized in real-time via the browser's Web Audio API (`src/utils/audio.ts`).
   - Zero external textures: textures (grass, slate stone, water normals) are procedurally generated on HTML5 canvas elements (`src/utils/textures.ts`).
3. **Dual-Mode User Experience**:
   - **Gamer / Explorer View**: 3D third-person exploration with WASD/Arrows or mobile virtual joystick, discovering CV items scattered across the environment.
   - **Recruiter Fast-Track**: Instant 2D official dossier modal (`RecruiterCVModal.tsx`) with `@media print` CSS styling for 1-click PDF export or paper printing without entering the 3D world.
4. **Interactive Coding Mini-Game**:
   - A fully playable 3D automation puzzle ("The Farmer Was Replaced" inspired) embedded directly in the farm garden (`AutomatonGardenWindow.tsx`, `GardenContext.tsx`, `BadmintonCourt.tsx`), featuring a safe Python-to-JavaScript transpile engine and a reactive 3D Drone-Bot.

---

## 2. Directory Layout & Module Taxonomy

```
clumsy-3d-cv-game/
├── crates/
│   └── game_engine_wasm/              # Rust WebAssembly physics & particle engine
│       ├── Cargo.toml                 # wasm-bindgen, js-sys, web-sys dependencies
│       └── src/
│           └── lib.rs                 # PhysicsEngine struct, collisions, particles
├── src/
│   ├── components/
│   │   ├── game/                      # React-Three-Fiber 3D scene components
│   │   │   ├── BadmintonCourt.tsx     # 3D Farm plot, soil furrows, Drone-Bot, 3D crops
│   │   │   ├── Butterflies.tsx        # Floating garden butterflies with wing flapping
│   │   │   ├── CameraController.tsx   # Third-person spherical follow camera
│   │   │   ├── Character.tsx          # Clumsy toon character, procedural gait, face, hoodie
│   │   │   ├── GameCanvas.tsx         # R3F Canvas, directional sun, post-processing
│   │   │   ├── Grass.tsx              # Instanced wind-swaying grass blades
│   │   │   ├── House.tsx              # Exterior/interior craftsman home, LOS wall fade
│   │   │   ├── Interactables.tsx      # Desk & monitors, open bookshelf, cat sanctuary
│   │   │   ├── Particles.tsx          # Zero-allocation autumn leaf particle renderer
│   │   │   ├── Scenery.tsx            # River, dock, rowboat, footbridge, windmill, balloon
│   │   │   ├── SkyDome.tsx            # Vertex-colored atmospheric sky & sun disc
│   │   │   └── Yard.tsx               # Fence perimeter, slate borders, stepping stones
│   │   └── ui/                        # 2D Tailwind CSS HUD, Modals, and Windows
│   │       ├── AutomatonGardenWindow.tsx # Draggable & resizable Python IDE window
│   │       ├── HUD.tsx                # On-screen controls, zone prompts, mute, recruiter CTA
│   │       ├── MobileControls.tsx     # Touch-detected virtual joystick & action buttons
│   │       ├── Modals.tsx             # Projects binder, skills folio, about me, cat sanctuary
│   │       └── RecruiterCVModal.tsx   # Printable official recruiter dossier & airmail stamp
│   ├── context/
│   │   ├── GameContext.tsx            # Global game state (activeModal, isInsideHouse, audio)
│   │   └── GardenContext.tsx          # Farm simulation engine, Python parser, mission state
│   ├── data/
│   │   └── cvData.ts                  # Hemant Patel verified resume data (projects, skills, etc.)
│   ├── types/
│   │   └── game.ts                    # TypeScript interface definitions
│   ├── utils/
│   │   ├── audio.ts                   # Web Audio API synthesizers
│   │   └── textures.ts                # Procedural HTML5 canvas texture generator
│   ├── wasm/
│   │   ├── engine.ts                  # Asynchronous singleton WASM loader
│   │   └── pkg/                       # Compiled wasm-bindgen output artifacts
│   ├── App.tsx                        # Root layout orchestrator
│   ├── index.css                      # Tailwind base + @media print styles
│   └── main.tsx                       # React DOM entry point
├── package.json                       # npm dependencies & build scripts
└── vite.config.ts                     # Vite build configuration (WASM support)
```

---

## 3. Rust WebAssembly Engine (`crates/game_engine_wasm/src/lib.rs`)

The physics simulation and particle system are implemented in Rust and compiled to WebAssembly via `wasm-pack`.

### 3.1 Memory Layout & Zero-Allocation Interop
To prevent JavaScript garbage collection pauses during 60–144 Hz gameplay:
- The `PhysicsEngine` maintains an internal `Vec<f32>` particle buffer (`particle_buffer`) storing 7 `f32` attributes per leaf: `[x, y, z, rot_x, rot_y, rot_z, scale]`.
- Instead of serializing vectors through serde or cloning arrays every frame, the engine exposes:
  ```rust
  pub fn get_particles_ptr(&self) -> *const f32;
  pub fn get_particles_len(&self) -> usize;
  ```
- In TypeScript (`src/components/game/Particles.tsx`), the client reads directly from WASM linear memory:
  ```ts
  const memory = (engine as any).__wbindgen_wasm_module.memory;
  const view = new Float32Array(memory.buffer, engine.get_particles_ptr(), engine.get_particles_len());
  ```

### 3.2 Physics Kinematics & Wall Sliding
- **Player State**: Position $(x, z)$, velocity $(v_x, v_z)$, facing angle $\theta$, stumble factor $[0, 1]$, and skid factor $[0, 1]$.
- **Exp-Decay Damping**: Frame-rate independent velocity deceleration using $e^{-k \cdot dt}$:
  ```rust
  let friction = (-9.0 * dt).exp();
  self.player_vx *= friction;
  self.player_vz *= friction;
  ```
- **Collision Resolution with Wall Sliding**:
  Colliders are registered as axis-aligned bounding boxes (AABBs) or circles:
  - Fences: outer perimeter at $x = \pm 12.5$, $z = \pm 12.5$ (with gate gap at $z = 12.5$).
  - House Walls: perimeter from $x \in [-6.8, 6.8]$, $z \in [-10.8, -1.2]$ (with door gap at $x \in [-1.2, 1.2]$).
  - Garden Planter Rims: perimeter surrounding the 5x5 farm plot.
  - Trees: circular colliders at specified coordinates.
- **Impact-Only Stumble**:
  Earlier versions triggered a stumble on any wall contact. The refined engine calculates the normal dot product:
  $$v_{\text{normal}} = -(v_x \cdot n_x + v_z \cdot n_z)$$
  Only when $v_{\text{normal}} > 2.2$ m/s does stumble activate. Furthermore, the normal component is stripped from the player's velocity while preserving the tangential component, enabling smooth, moonwalk-free sliding along fences and walls.

### 3.3 Building the WASM Module
```bash
cd crates/game_engine_wasm
wasm-pack build --target web --out-dir ../../src/wasm/pkg
```

---

## 4. 3D Scene Architecture & Rendering Pipeline

### 4.1 Coordinate Space & World Landmarks
The world origin `[0, 0, 0]` is centered in the front lawn of the yard.
- **Center `[0, 0, 0]`**: Spawn point of the clumsy character, stepping stone path from gate to house porch.
- **North (`-Z`) `[0, 0, -6.0]`**: The Craftsman House (Front porch at $z = -1.2$, studio desk at `[-2.5, 0, -6.0]`, bookcase at `[-5.8, 0, -4.5]`, cat sanctuary at `[4.5, 0, -6.0]`).
- **East (`+X`, `+Z`) `[6.8, 0, 5.2]`**: The Automaton Garden & Potting Bench.
- **West (`-X`) `[-30, 0, 0]`**: The Countryside River, Wooden Dock with bobbing rowboat, and Arched Footbridge.
- **South (`+Z`) `[0, 0, 12.5]`**: Front picket gate leading out onto the country dirt road.

### 4.2 Camera Controller (`CameraController.tsx`)
- Follows the character in spherical coordinates $(r, \theta, \phi)$ with smooth exponential dampening:
  - Radius: $r = 6.8$ meters.
  - Default orientation: $\theta = 0$ (directly behind the character, looking forward over shoulders).
  - Elevation: $\phi = 53^\circ$ above ground.
- Supports pointer-drag 360° orbiting and mouse-wheel zoom (clamped between $2.5\text{m}$ and $18\text{m}$).
- Listens to the `reset-camera` custom event (triggered by pressing `[R]` or clicking the HUD button) to smoothly rotate back behind the character.

### 4.3 Clumsy Character Procedural Kinematics (`Character.tsx`)
- Constructed without imported skinned meshes using Three.js group hierarchies:
  - `characterRef` $\rightarrow$ `pelvisRef` $\rightarrow$ `torsoRef` $\rightarrow$ `headRef`, `leftArmRef`, `rightArmRef`.
  - Legs: `leftThighRef` $\rightarrow$ `leftCalfRef` $\rightarrow$ `leftFootRef`.
- **Gait Cycle**:
  - Sinusoidal stride timer running at frequency $\omega = 7.5 \cdot \text{speed}$.
  - Hips sway laterally and vertically with dual-peak bounce ($2\omega$).
  - Feet execute heel-strike dorsiflexion and toe-off extension.
  - Upper arms swing oppositely with wide clumsy elbow flairs; forearms flex up to $80^\circ$.
- **Secondary Spring & Pendulum Physics**:
  - Beanie pom-pom: simulated as a damped 3D spring attached to the crown of the beanie.
  - Hoodie drawstrings: simulated as dual pendulums with gravity and rotational inertia.
  - Glasses: tilt and wobble during stumble impacts.
  - Blinking eyes: procedural vertical scale pinching every 3.5 seconds.
  - Facial details: expressive dark pupils with white specular dots, glasses frames, blush cheeks, and a subtle smile arc.

### 4.4 House Line-of-Sight Fade (`House.tsx`)
- When the player is inside the house (`isInsideHouse === true`):
  - The gable roof (`roofRef`) smoothly fades to opacity `0.0` over 0.25 seconds, exposing the interior floor plan.
- When the camera orbits south of the house front wall:
  - The front wall group (`frontWallRef`) fades to opacity `0.1` so the player's view into the studio is never blocked.
  - **Important Design Rule**: The exterior porch landing, solid timber posts, and entrance lantern are kept in an independent group outside `frontWallRef`, ensuring the charming porch remains solid while the interior wall fades.

### 4.5 Lighting & Post-Processing (`GameCanvas.tsx`)
- **Sun Alignment**: Directional sunlight shines from `[26, 32, -24]` toward `[0, 0, 0]`, matching the visible golden solar disc in `SkyDome.tsx` (`[65, 80, -60]`).
- **Eliminated Point-Light Shadow Maps**: Scene point lights (porch lantern, interior desk lamp) do not cast shadow maps, avoiding 12 redundant shadow cube-map render passes per frame.
- **Eliminated Transmission Passes**: All window panes and river water use `meshStandardMaterial` with `transparent={true}` and `opacity={0.35..0.88}` rather than `meshPhysicalMaterial transmission`, eliminating full-screen scene background copy passes.
- **Post-Processing**: ACESFilmic tone mapping, Bloom (`luminanceThreshold={0.88}`, `intensity={0.45}`), Vignette, and HueSaturation.

---

## 5. Automaton Garden Mini-Game ("The Farmer Was Replaced")

The garden provides a full Python automation puzzle inspired by the indie game *The Farmer Was Replaced*.

```
+-------------------------------------------------------------+
| AutomatonGardenWindow.tsx (Draggable / Resizable Window)    |
| +-------------------------+ +-----------------------------+ |
| | Mission Picker & Goals  | | Python Code Editor (Monaco) | |
| | - Badge Badges (Storage)| | def automate():             | |
| | - Speed: 1x, 2x, 5x, 10x| |   for y in range(5):        | |
| | - Inventory: 🌾 🥕 🎃   | |     for x in range(5):      | |
| +-------------------------+ |       move()                | |
| | Manual D-Pad + Seeds    | |       plant()               | |
| +-------------------------+ +-----------------------------+ |
+-------------------------------------------------------------+
                             |
                             v
+-------------------------------------------------------------+
| GardenContext.tsx (Interpreter & State Machine)             |
| - parsePythonToJS() Transpiler (injected _loopSafety tick)  |
| - Drone State: { x, y, dir, battery, fuel }                 |
| - 5x5 Grid State: FarmTile { crop, watered, growth }        |
| - Pure State Updates + SoundManager Callbacks               |
+-------------------------------------------------------------+
                             |
                             v
+-------------------------------------------------------------+
| BadmintonCourt.tsx (3D Visual Farm in R3F Yard)             |
| - 5 Furrow Rows & Soil Mounds                               |
| - Planted 3D Crops (Wheat, Carrot, Pumpkin Stages 1 & 2)    |
| - Watered Dark Discs & Dibble Dimples                       |
| - 3D Quadcopter Drone-Bot 01 with Spinning Rotors & Wash    |
+-------------------------------------------------------------+
```

### 5.1 Safe Python-to-JavaScript Transpiler (`GardenContext.tsx`)
Users write Python scripts into the editor. The transpiler converts Python idioms to valid browser JavaScript:
1. **Keyword Mapping**:
   - `True` $\rightarrow$ `true`, `False` $\rightarrow$ `false`, `None` $\rightarrow$ `null`
   - `and` $\rightarrow$ `&&`, `or` $\rightarrow$ `||`, `not ` $\rightarrow$ `! `
2. **Loop Transpilation**:
   - `for i in range(n):` $\rightarrow$ `for (let i = 0; i < n; i++) {`
   - `for i in range(start, end):` $\rightarrow$ `for (let i = start; i < end; i++) {`
   - `while condition:` $\rightarrow$ `while (condition) {`
3. **Infinite Loop Protection (Loop Bounding Tick)**:
   Any script running `while True:` or deeply nested loops could freeze the browser tab. The transpiler injects an iteration counter:
   ```js
   let _loopSafety = 10000;
   // Injected inside every for/while header:
   if (--_loopSafety <= 0) break;
   ```
4. **Action Queue Generation**:
   The generated JavaScript runs inside an isolated Function sandbox, accumulating sequential commands (`move`, `turn_left`, `turn_right`, `plant`, `water`, `harvest`) into an action queue executed asynchronously at user-selected speeds ($1\times$ to $10\times$).

### 5.2 3D Drone-Bot & Crop Visuals (`BadmintonCourt.tsx`)
- **Drone-Bot 01**: Features a sleek chassis, 4 carbon booms, counter-rotating quad rotors, animated tilt toward travel direction, and a downward spotlight simulating prop wash.
- **3D Crops**:
  - `wheat`: Sprouting green shoots (stage 1) $\rightarrow$ tall golden stalks with heavy grain heads (stage 2).
  - `carrot`: Fern foliage (stage 1) $\rightarrow$ lush bush with visible orange carrot crown (stage 2).
  - `pumpkin`: Creeping vine tendrils (stage 1) $\rightarrow$ ribbed orange pumpkin with coiled vine stem (stage 2).
- **Soil Alignment**: Crops and damp soil discs sit precisely on the surface of the soil ridges ($y = 0.082$), fully grounded without floating or clipping beneath the mounds.

---

## 6. Input Systems, Keyboard Focus, and Accessibility

### 6.1 Keyboard Bubbling & Typing Target Isolation
To avoid the common WebGL bug where pressing `W`, `A`, `S`, `D`, `Space`, or `Escape` while typing inside a text editor or form also walks the character or closes windows:
- `Character.tsx`, `CameraController.tsx`, and `GameContext.tsx` inspect the event target:
  ```ts
  const isTypingTarget = (target: EventTarget | null) => {
    if (!target) return false;
    const el = target as HTMLElement;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
  };
  ```
- If `isTypingTarget(e.target)` is true, or if any modal is active, all character movement and camera shortcuts are ignored.

### 6.2 Window Blur Safety (No Stuck Keys on Alt-Tab)
A `blur` event listener on `window` immediately resets `keysRef.current = {}`. Switching windows or Alt-Tabbing while holding `W` will never leave the character running infinitely into walls.

### 6.3 Touch Device Detection (`MobileControls.tsx`)
Rather than relying on screen width CSS classes (`md:hidden`), the joystick checks hardware touch support:
```ts
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```
This ensures iPads, tablets, and touchscreen laptops receive the virtual joystick, while mouse-only desktop displays remain completely uncluttered.

---

## 7. Procedural Web Audio Engine (`src/utils/audio.ts`)

All audio is generated via the Web Audio API without downloading external `.mp3` or `.wav` files:
- **Footsteps (`playStep(isLeft)`)**: Triangle wave frequency drop ($140\text{Hz} \rightarrow 45\text{Hz}$) with fast decay.
- **Wall Bump (`playBump()`)**: Sine wave boing ($260\text{Hz} \rightarrow 80\text{Hz}$) with tactile gain drop.
- **Interact Chime (`playInteract()`)**: Four-note arpeggio ($C_5, E_5, G_5, C_6$).
- **Harvest (`playHarvest()`)**: Crisp three-note triangle chord ($E_5, A_5, D_6$).
- **Planting (`playPlant()`)**: Low earthy pop ($240\text{Hz} \rightarrow 120\text{Hz}$).
- **Level-Up Fanfare (`playLevelUp()`)**: Triumphant five-note arpeggio ($C_5, E_5, G_5, C_6, E_6$).
- **Garden Breeze (`startAmbient()`)**: Continuous pink/brown noise algorithm passed through a $400\text{Hz}$ lowpass filter at gentle volume.

---

## 8. Common Maintenance & Extension Guides

### 8.1 Adding a New CV Project
1. Open `src/data/cvData.ts`.
2. Add a new object to the `featuredProjects` array:
   ```ts
   {
     id: 'project-slug',
     title: 'Project Title',
     subtitle: 'Category • Stack',
     description: 'Detailed description of architecture and results.',
     highlights: ['Bullet point 1', 'Bullet point 2'],
     tags: ['Tag 1', 'Tag 2'],
     github: 'https://github.com/...',
     liveUrl: 'https://...',
     stars: 42,
     forks: 10,
     icon: '💻',
     badge: 'Featured',
     color: '#indigo-600',
   }
   ```
3. The Projects Binder modal (`Modals.tsx`) and Recruiter Dossier (`RecruiterCVModal.tsx`) will automatically render the new entry with category filters.

### 8.2 Adding a New Interactive Zone
1. Define the zone name in `src/types/game.ts` under `ModalType`.
2. In `crates/game_engine_wasm/src/lib.rs`, add an interaction coordinate check in `PhysicsEngine::get_nearby_zone`:
   ```rust
   if (px - target_x).hypot(pz - target_z) < 2.5 {
       return 7; // zone index
   }
   ```
3. In `src/components/game/Interactables.tsx`, place the 3D visual object and the floating `<Html>` interaction badge.
4. In `src/components/ui/Modals.tsx`, add the corresponding modal component and mount it when `activeModal === 'your_zone'`.

### 8.3 Compiling and Verifying
```bash
# 1. Compile Rust WASM engine
cd crates/game_engine_wasm
cargo test
wasm-pack build --target web --out-dir ../../src/wasm/pkg

# 2. Type-check and production build
cd ../..
npm run build
```

---

*Document compiled and verified for Antigravity AI Agents & Engineering Collaborators.*
