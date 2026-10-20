# 🧠 AI Architectural Specification & Codebase Working Guide
> **Target Audience**: AI Coding Assistants, LLM Agents, and Systems Engineers  
> **Repository**: `clumsy-3d-cv-game`  
> **Engine**: React 18 + Three.js / React Three Fiber + Rust WebAssembly (WASM) + Tailwind CSS  
> **Last Updated**: 2026-10-21  

---

## 1. Executive Summary & Architectural Overview

The **Clumsy 3D CV Game** is a hybrid high-performance WebGL portfolio engine. Unlike typical SaaS-style portfolio websites, this project integrates **bare-metal deterministic game physics** written in **Rust (compiled to WebAssembly)** with a declarative **Three.js / React Three Fiber (R3F)** 3D rendering pipeline and an artisan **Archival Scholar & Explorer Folio** UI system.

### Core Architectural Layers:
```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 18 Declarative Root (App.tsx)                   │
├──────────────────────────────────┬─────────────────────────────────────┤
│      3D WebGL Simulation Layer   │         2D Tactile UI & HUD         │
│  (React Three Fiber / Drei / 60 FPS)│      (Tailwind CSS & Canvas Confetti) │
│  - GameCanvas & Scene Controller │  - StartScreen & Chunky Play Button │
│  - Low-Poly Character Rig & Spgs │  - Warm Scholar Ivory Plaque HUD    │
│  - Modular Nordic Cottage House  │  - 8 Unified Dark Leather Modals    │
│  - Automaton Garden (TFWR Game)  │  - Python Code Editor & Terminal    │
│  - Instanced Foliage & Particles │  - 2D Recruiter Printable Dossier   │
├──────────────────────────────────┴─────────────────────────────────────┤
│                     Shared React Context (GameContext)                 │
│         [hasStarted, activeModal, nearbyZone, moveInput, teleport]      │
├──────────────────────────────────┬─────────────────────────────────────┤
│   Rust WebAssembly Physics Engine│     Zero-Asset Web Audio API Synth  │
│  (crates/game_engine_wasm via WASM)│       (src/utils/audio.ts)          │
│  - Clumsy Kinematics & Stumble   │  - Triangle Wave Footstep Pops      │
│  - Circle-to-AABB Collisions     │  - Comedic Boing Collision Bumps    │
│  - Discrete Steering Angle Buffer│  - 4-Note Chime Arpeggio Chords     │
│  - Spatial Interaction Zones     │  - Harvest Chimes & Seed Planting   │
│  - Autumn Leaves Wind Simulation │  - Pink/Brown Noise Breeze Ambience │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 2. Repository Layout & File Manifest

```
clumsy-3d-cv-game/
├── crates/
│   └── game_engine_wasm/             # Standalone Rust crate compiled to WASM
│       ├── Cargo.toml                # Rust dependencies (wasm-bindgen, js-sys)
│       └── src/lib.rs                # Physics engine, kinematics, colliders, particles
├── src/
│   ├── components/
│   │   ├── game/                     # 3D Scene Components (React Three Fiber)
│   │   │   ├── GameCanvas.tsx        # Canvas root, camera setup, shadows, lighting
│   │   │   ├── Character.tsx         # Clumsy guy mesh, secondary springs, walk cycle
│   │   │   ├── CameraController.tsx  # Smooth 3rd-person follow, orbit drag, lerp
│   │   │   ├── House.tsx             # Cottage model + smart camera-wall transparency
│   │   │   ├── Yard.tsx              # Fences, terrain, stepping stone paths, lanterns
│   │   │   ├── BadmintonCourt.tsx    # Automaton Garden 3D plot (TFWR drone, crops)
│   │   │   ├── Interactables.tsx     # 3D props (desk, books, bed, mailbox, bench)
│   │   │   ├── Grass.tsx             # Instanced grass tufts with boundary exclusions
│   │   │   ├── Scenery.tsx           # Pine trees, birch trees, rocks, shrubs
│   │   │   ├── Butterflies.tsx       # Procedural fluttering bezier flight paths
│   │   │   ├── Particles.tsx         # Instanced autumn leaves fed from Rust buffer
│   │   │   └── SkyDome.tsx           # Low-poly celestial dome & sun rotation
│   │   └── ui/                       # 2D Interface & Overlay Modals
│   │       ├── HUD.tsx               # Minimalist adventurer plaque, travel buttons
│   │       ├── StartScreen.tsx       # Establishing drift title screen with Play button
│   │       ├── MobileControls.tsx    # Virtual joystick & interaction touch overlay
│   │       ├── Modals.tsx            # Unified Dark Saddle Leather Folio modals
│   │       └── RecruiterCVModal.tsx  # Printable 2D Recruiter Dossier resume
│   ├── context/
│   │   └── GameContext.tsx           # Global state, modal router, teleportation
│   ├── data/
│   │   └── cvData.ts                 # Source-of-truth personal CV & portfolio data
│   ├── types/
│   │   └── game.ts                   # TypeScript interfaces (ModalType, GameContext)
│   ├── utils/
│   │   └── audio.ts                  # Pure Web Audio API sound effect synthesizer
│   ├── wasm/
│   │   ├── pkg/                      # wasm-pack generated JS bindings & WASM binary
│   │   └── game_engine_wasm.ts       # TypeScript loader & singleton wrapper
│   ├── App.tsx                       # React application container
│   ├── main.tsx                      # Vite React DOM entry point
│   └── index.css                     # Tailwind CSS styles & animations
├── AI_ARCHITECTURE_OVERVIEW.md       # THIS FILE: Exhaustive AI working documentation
└── package.json                      # Node dependencies & npm build scripts
```

---

## 3. Subsystem 1: Rust WASM Physics & Kinematics Engine

The core simulation is executed inside WebAssembly every frame via `crates/game_engine_wasm/src/lib.rs`.

### 3.1 Kinematics & The "Clumsy" Character Physics
- **Movement Acceleration & Damping**:
  ```rust
  let target_speed = if throttle > 0.0 {
      if is_running { RUN_SPEED } else { WALK_SPEED }
  } else if throttle < 0.0 {
      -WALK_SPEED * 0.5
  } else {
      0.0
  };
  self.player_speed += (target_speed - self.player_speed) * ACCELERATION * dt;
  ```
- **Discrete Tap Steering vs Continuous Hold**:
  To prevent oversteering (where a single key press rotates the character 90°+ degrees), the engine exposes:
  - `pub fn turn(&mut self, steer_angle: f32)`: Injects a calibrated discrete 10-degree step (`±0.174 rad`) per discrete key tap.
  - Continuous key hold applies smooth angular velocity with rotational inertia damping:
    `self.player_rotation += self.turn_velocity * dt;`
- **Clumsy Secondary Kinematics**:
  - `walk_cycle`: Accumulates proportional to speed; drives leg stride and footstep timing.
  - `bobbing`: `sin(walk_cycle * 2.0) * 0.06` creates a bouncy vertical step.
  - `wobble_x`: Torso tilt rolling side-to-side (`sin(walk_cycle) * 0.12`).
  - `stumble_intensity`: Spikes to `1.0` upon colliding with solid obstacles, decaying exponentially over time.
  - `footstep_trigger`: Returns `1` (left foot strike) or `2` (right foot strike) at the exact sinusoidal inflection point of the walk cycle, allowing React to trigger frame-perfect synthesized sound.

### 3.2 Continuous Collision Detection (Circle-to-AABB)
- The player is modeled as a bounding circle of radius `0.38m`.
- Solid obstacles (walls, fences, desks, planter boxes) are registered as axis-aligned bounding boxes (AABB) using min/max extents:
  ```rust
  pub struct AABBCollider {
      pub min_x: f32, pub min_z: f32,
      pub max_x: f32, pub max_z: f32,
  }
  ```
- Collision resolution computes the closest point on the AABB to the player circle center `(cx, cz)`. If penetration is detected, the player's position is projected out along the normal vector, preserving sliding along wall tangents.

### 3.3 Spatial Interaction Trigger Zones
The engine checks player proximity to key locations every tick:
- `projects` @ `(-1.8, -1.2)` (radius 1.8m)
- `skills` @ `(1.8, -2.5)` (radius 1.8m)
- `experience` @ `(2.2, 0.5)` (radius 1.8m)
- `bed` @ `(2.0, -1.2)` (radius 1.8m)
- `about` @ `(0.0, 4.2)` (radius 2.0m)
- `contact` @ `(-0.6, 6.2)` (radius 1.8m)
- `badminton` (Automaton Garden) @ `(6.8, 5.2)` (radius 2.4m)
When within range, `get_active_interaction()` returns the zone name, prompting the React UI to display the interaction key `[E]`.

### 3.4 Zero-Allocation Particle Simulation
The Rust engine simulates 45 floating autumn leaves and dust particles:
- Each particle has position `(x, y, z)`, velocity, rotation, and lifespan.
- Simulates gentle gravity, wind sinusoidal drift, and boundary wrapping.
- All particle transforms are written into a contiguous flat buffer (`Vec<f32>`: 5 floats per particle `[x, y, z, rot, scale]`), returned to JavaScript as a single typed array copy, eliminating garbage collection spikes.

---

## 4. Subsystem 2: Three.js / React Three Fiber 3D Scene

### 4.1 Rendering & Camera Controller (`CameraController.tsx`)
- Camera operates in an **Orbital Follow Mode**:
  - Targets `Vector3(player_x, player_y + 1.25, player_z)`.
  - Dynamically aligns azimuth behind the character (`idealBehindTheta = rot - Math.PI`).
  - Supports smooth mouse/touch orbit dragging with right-click / drag, double-click to snap reset.
  - When the game has not started yet (`!hasStarted`), enters a slow, majestic establishing pan (`userYawOffset += delta * 0.15`).

### 4.2 Smart Occlusion Wall Transparency (`House.tsx`)
When the player is indoors:
- Previous naive systems made all walls transparent, breaking immersion.
- The current implementation calculates the 2D segment between the camera position `(camX, camZ)` and the player position `(px, pz)`.
- **Only the wall that geometrically intersects the line of sight between the camera and the player** fades its opacity to `0.2` with `transparent: true`.
- All other walls (back walls, side walls, interior room dividers) remain fully solid and cast shadows.

### 4.3 3D Character Rig (`Character.tsx`)
- Low-poly stylized character comprised of:
  - Beanie hat with a secondary spring physics pom-pom (`pomPomSpring`).
  - Round head with glasses and ear details.
  - Torso wearing an oversized hoodie with dual dangling drawstring springs (`drawstringsSpring`).
  - Low-poly hands and sneaker shoes.
- **Dynamic Decal Shadow**:
  - Rather than expensive stencil shadow maps on complex terrain, the character casts a dedicated soft circular shadow disc onto the ground below (`y: 0.02`), with distance-based alpha fading and scale dilation.

### 4.4 The 3D Automaton Garden (`BadmintonCourt.tsx`)
Located at `[6.8, 0, 5.2]`:
- Replaced the previous badminton court with a full cottage garden.
- Raised cedar wood planter walls (`#854d0e`), dark compost soil (`#2c1810`), and raised furrow ridges.
- Rows of distinct 3D low-poly crops:
  - Row 0: Golden Wheat Stalks with ears (`#eab308`).
  - Row 1: Orange Carrots with green feathery foliage tops (`#ea580c` / `#16a34a`).
  - Row 2: Royal Pumpkins with green vines (`#f97316`).
  - Row 3: Fresh Green Seedling sprouts (`#4ade80`).
- Copper irrigation pipeline with brass sprinkler nozzles along the furrow border.
- Cedar potting work bench with vintage blue watering can and vegetable crate.
- Hovering **Drone-Bot 01** with spinning twin rotor blades and glowing cyan visor screen.

---

## 5. Subsystem 3: Game State Architecture (`GameContext.tsx`)

Global application state is managed cleanly with zero boilerplate:

```typescript
interface GameContextType {
  hasStarted: boolean;
  startGame: () => void;
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  nearbyZone: string | null;
  setNearbyZone: (zone: string | null) => void;
  isInsideHouse: boolean;
  setIsInsideHouse: (inside: boolean) => void;
  moveInput: { x: number; z: number };
  setMoveInput: (input: { x: number; z: number }) => void;
  teleportTarget: 'spawn' | 'desk' | null;
  triggerTeleport: (target: 'spawn' | 'desk') => void;
  clearTeleport: () => void;
}
```

### Global Testing Hooks:
For automated, headless, or remote testing, `GameContext` mounts clean debug handlers to `window`:
- `(window as any).__openModal(name: string)`
- `(window as any).__closeModal()`

---

## 6. Subsystem 4: UI System & Unified Archival Folio Theme

Every modal strictly adheres to the exact same visual design language:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Dark Saddle Leather Casing (bg-[#2a170e] border-4 border-[#5c2b14])   │
│  ┌─┐                                                              ┌─┐  │
│  │Brass Bracket (Amber 500)         Crimson Wax Seal Close Button (X)  │
│  └─┘                                                              └─┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Stamped Leather Banner Plate (Gradient #381e12 to #4a2617)       │  │
│  │ [Golden Medallion Icon]  TITLE • SCHOLAR DISPATCH • IIT JODHPUR  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Cream Drafting Parchment Interior (bg-[#fbf7ee] dot pattern)     │  │
│  │                                                                  │  │
│  │  [Two-Column Content / Interactive Grid / Code Terminal]         │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌─┐                                                              ┌─┐  │
│  │Brass Bracket                                        Brass Bracket│  │
│  └─┘                                                              └─┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### The 8 Modals:
1. **About Field Journal (`AboutFieldJournalModal`)**:
   - Artist sketchbook style. Plate #14 isometric cottage drawing study with graphite swatches.
   - Curiosities list: Drawing & Sketching, Table Tennis, Badminton, Media & Filmmaking.
2. **Experience Expedition Passport (`ExperiencePassportModal`)**:
   - Topographic route trail map with connected dashed trail lines and milestone waypoint pins:
     - Checkpoint 03 Basecamp (CoralDune Systems Engineer)
     - Checkpoint 02 Academic Citadel (IIT Jodhpur B.Tech)
     - Checkpoint 01 Origin (CBSE Class XII)
     - Leadership Outposts (FrameX Media Head, Festival Coordination)
3. **Projects Engineering Binder (`ProjectsBinderModal`)**:
   - Two-page blueprint spread with spiral ring spine.
   - Filter pills integrated directly into the leather header (`All`, `AI & ML`, `Rust WASM`, `Vision`, `Chemistry`).
   - Project roster index on the left; detailed dossier, architecture specs, and live demo / source code buttons on the right.
4. **Skills Grimoire Codex (`SkillsGrimoireModal`)**:
   - 3-column discipline scrolls:
     - *Machine Intelligence*: PyTorch, RL, Computer Vision, Molecular GNNs, Python.
     - *Systems & Core Engine*: Rust & WASM, C/C++, Linux POSIX, Physics Sim, Docker.
     - *3D & Full-Stack*: TypeScript, React, Three.js/R3F, Node.js, Tailwind, SQL.
   - Signature Perk Banner: *Cross-Stack Synthesis*.
5. **Postal Mailbox Dispatch (`ContactPostcardModal`)**:
   - Vintage airmail postcard with diagonal cancellation stamp, direct email copy button with clipboard feedback, and academic coordinates.
6. **Byte's Feline Sanctuary (`CatSanctuaryModal`)**:
   - Replaced old comic hot pink styling with the dark leather folio.
   - Hearth duvet with animated sleeping cat (`(=^･ω･^=)`), happiness meter, and 3 interactive pet buttons (*Feed Treat*, *Toss Yarn*, *Pet Byte*).
7. **Automaton Garden ("The Farmer Was Replaced") Mini-Game (`AutomatonGardenModal`)**:
   - Described in full detail in Section 7 below.
8. **2D Recruiter CV Dossier (`RecruiterCVModal`)**:
   - Single-source-of-truth printable CV pulling directly from `cvData.ts`.
   - Includes full experience, education, skills, projects, and leadership.
   - Features `window.print()` action bar with dedicated print stylesheets.

---

## 7. Subsystem 5: The "The Farmer Was Replaced" 3D Mini-Game Engine

The Automaton Garden mini-game is an authentic, educational coding game embedded directly into the 3D portfolio world. Visitors can program a flying drone robot using Python commands and watch it physically fly, rotate, irrigate, and harvest 3D crops across the cedar planter garden plot in real-time WebGL.

### 7.1 Architecture of the 3D Mini-Game
```
User Python Code (Floating Resizable Editor Window)
           │
           ▼
[parsePythonToJS] ─────────► Converts Indentation to JS Braces,
           │                 Rewrites loops (for i in range -> for let i)
           ▼
[Virtual Simulator] ───────► Sandboxed Function scope dry-run with
           │                 cloned 5x5 grid state. Max 220 safety ticks.
           ▼
[Action Queue] ────────────► Array<{ type: 'move'|'plant'|'water'|'harvest', x, y, dir }>
           │
           ▼
[GardenContext Provider] ──► Central reactive simulation state
           │
           ├─► [3D R3F Viewport: BadmintonCourt.tsx]
           │    ├─► Lerps 3D Drone robot mesh to local [x, y, z] with bank tilt & rotor spin
           │    ├─► Downward light cone (amber harvest beam, crystal water spray, emerald seed scan)
           │    ├─► Dynamically renders 3D crops (golden wheat stalks, crunchy carrots, royal pumpkins)
           │    └─► Renders moist soil patches upon irrigation
           │
           ├─► [CameraController.tsx]
           │    └─► Elevates camera to isometric overview [6.8, 0.45, 5.2] with mouse drag orbit enabled
           │
           ├─► [AutomatonGardenWindow.tsx]
           │    ├─► Floating draggable desktop window overlaying 3D scene (no dark fullscreen backdrop)
           │    ├─► Bottom-right corner resize handle (380x280 min to full screen)
           │    ├─► Minimize button collapsing console to compact floating HUD widget
           │    ├─► Python code editor with Tab key support & syntax layout
           │    ├─► Terminal execution trace log & speed selector (1x, 2x, 5x)
           │    └─► Manual D-Pad drive controls & quick action buttons
           │
           └─► [audio.ts]: Web Audio synthesizers (harvest chimes, planting rustle, step pops)
```

### 7.2 The 5x5 Grid State & 3D Coordinates
- **World Coordinate Transform**:
  - Garden center in yard: `[6.8, 0, 5.2]`
  - Columns X (0..4): `[-1.4, -0.7, 0, 0.7, 1.4]`
  - Rows Z (0..4): `[-1.8, -0.9, 0, 0.9, 1.8]`
  - Drone base height: `y = 1.1` (dips to `y = 0.88` when harvesting or planting)
- **Toroidal Wrapping**: Moving past column 4 wraps to column 0; moving past row 4 wraps to row 0.
- **Tile Structure**:
  ```typescript
  interface FarmTile {
    crop: 'none' | 'wheat' | 'carrot' | 'pumpkin';
    watered: boolean;
    growth: number; // 0=seed/empty, 1=sprout, 2=mature
  }
  ```
- **Yields & Scoring**:
  - Golden Wheat 🌾: +10 pts
  - Crunchy Carrot 🥕: +25 pts
  - Royal Pumpkin 🎃: +50 pts

### 7.3 Built-in Commands & Supported Python Syntax
- `move()` / `move(north | east | south | west)`: Moves drone 1 tile forward or in specified direction.
- `turn_left()`, `turn_right()`: Rotates drone orientation (`N`, `E`, `S`, `W`).
- `plant("wheat" | "carrot" | "pumpkin")`: Tills soil and plants seeds.
- `water()`: Irrigates current tile; immediately matures crops to harvestable state.
- `harvest()`: Harvests ripe crop, increments score and inventory, plays sound.
- `can_harvest()`: Returns `true` if current tile has a mature crop.
- `is_empty()`: Returns `true` if current tile is unplanted.
- Control Flow:
  - `for i in range(N):`
  - `while <condition>:`
  - `if <condition>:` / `elif <condition>:` / `else:`
  - Python ternary: `east if y % 2 == 0 else west`

### 7.4 Missions & Challenges
- **Mission 1: Wheat Harvest** (Tutorial): Move across row 0 and harvest 3 ripe wheat tiles (Goal: 30 pts).
- **Mission 2: Carrot Furrow**: Move to row 1, plant, irrigate, and harvest carrots in a row (Goal: 100 pts).
- **Mission 3: Serpentine Loop**: Full-field 5x5 snake traversal automation (Goal: 180 pts).
- **Mission 4: Pumpkin Tycoon**: High-yield pumpkin farming down the columns (Goal: 250 pts).
- **Mission 5: Sandbox**: Open programming playground.

---

## 8. Subsystem 6: Zero-Asset Web Audio Synthesizer (`src/utils/audio.ts`)

To guarantee zero network overhead, zero latency, and 100% offline functionality, all audio is generated algorithmically via the Web Audio API:

1. **Footstep Clicks (`playStep(isLeft: boolean)`)**:
   - Triangle wave oscillator ramping from 140Hz (left) or 160Hz (right) down to 45Hz over 80ms.
2. **Collision Bumps (`playBump()`)**:
   - Sine wave oscillator starting at 260Hz and exponentially decaying to 80Hz over 250ms with higher gain.
3. **Interaction Chimes (`playInteract()`)**:
   - 4-note ascending chord arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz).
4. **Harvest Chimes (`playHarvest()`)**:
   - Cheerful bright arpeggio: E5 (659Hz), A5 (880Hz), D6 (1175Hz) with triangle wave harmonic overtones.
5. **Seed Planting Thud (`playPlant()`)**:
   - Sine wave earthy pop starting at 240Hz and dropping to 120Hz over 100ms.
6. **Procedural Wind Ambience (`startAmbient()`)**:
   - Real-time pink/brown noise algorithm filtered through a 400Hz lowpass filter with low gain (`0.03`), creating a soothing garden breeze.

---

## 9. Compilation, Building & Testing Commands

### Standard Development
```bash
cd /home/hemant/personal_projects/clumsy-3d-cv-game
npm run dev -- --host 0.0.0.0 --port 3000
```

### Production Build & Type Verification
```bash
npm run build
```
Runs `tsc` (TypeScript compiler) followed by `vite build`. Outputs minified production assets to `dist/`.

### Rebuilding the Rust WASM Engine
```bash
cd /home/hemant/personal_projects/clumsy-3d-cv-game/crates/game_engine_wasm
wasm-pack build --target web --out-dir ../../src/wasm/pkg
```

### Headless Verification & Testing
Scripts located in `scratch/` use headless Chrome with DevTools Protocol over WebSockets to capture screenshot artifacts and verify UI modals without opening a GUI browser:
- `scratch/capture_tests.mjs`: Tests start screen, Play button, and About modal.
- `scratch/capture_all_modals.mjs`: Captures all 8 modals to confirm unified leather casing.
- `scratch/capture_garden_game.mjs`: Tests code execution, playback, score updates, and 3D garden plot view.
