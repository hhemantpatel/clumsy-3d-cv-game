# 🎮 Clumsy Guy 3D Interactive CV Game

A personal 3D low-poly interactive CV and portfolio website where visitors control a clumsy character walking around a house and enclosed yard. The character features procedural wobbly walking, humorous physical collision stumbles, seamless indoor/outdoor exploration with dynamic camera occlusion cutaways, tactile CV inspection zones, an interactive code-driven farming mini-game ("The Farmer Was Replaced"), and an instant 2D "Recruiter Mode" resume view.

> 📖 **AI & Systems Architecture Guide**: For an exhaustive, deep technical breakdown of the Rust WASM engine, 3D rendering pipeline, Python interpreter mini-game, and unified archival UI system written for AI assistants and developers, see [AI_ARCHITECTURE_OVERVIEW.md](./AI_ARCHITECTURE_OVERVIEW.md).

---

## ⚡ High-Performance Architecture

- **Physics & Simulation Engine**: **Written in Rust** and compiled to **WebAssembly (WASM)** (`crates/game_engine_wasm/`).
  - Continuous circle-AABB collision detection for all fences, house walls, and furniture.
  - Procedural clumsy kinematics (wobble tilt, head bob, stumbling impulse recoil).
  - 45+ floating autumn leaves & ambient dust wind particle physics simulated in Rust every frame.
- **Rendering**: **Three.js** via **React Three Fiber (R3F)** and `@react-three/drei`.
- **UI & Modals**: **Tailwind CSS** + **Lucide Icons** with glassmorphism overlays.
- **Audio**: Embedded zero-asset **Web Audio API** sound synthesizer (footsteps, collision bumps, interaction chimes, gentle breeze ambience).

---

## 🚀 Quick Start

### 1. Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
```
The optimized bundle will be generated in `dist/`.

### 3. Rebuilding the Rust WASM Engine (Optional)
If you edit the Rust code in `crates/game_engine_wasm/src/lib.rs`:
```bash
cd crates/game_engine_wasm
wasm-pack build --target web --out-dir ../../src/wasm/pkg
```

---

## 📁 Project Structure

```
├── crates/
│   └── game_engine_wasm/       # Rust physics & particle simulation crate
│       ├── Cargo.toml
│       └── src/lib.rs          # Colliders, kinematics, stumble math, particle wind
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── Character.tsx   # Low-poly clumsy guy with procedural animations
│   │   │   ├── House.tsx       # House model + dynamic roof/wall fading
│   │   │   ├── Yard.tsx        # Fenced yard perimeter, paths, trees, flowers
│   │   │   ├── Interactables.tsx# Desk, Bookshelf, Timeline, Bed, Mailbox, Bench
│   │   │   ├── Particles.tsx   # Instanced leaves rendered from Rust WASM buffer
│   │   │   ├── CameraController.tsx # Smooth 3rd-person follow camera
│   │   │   └── GameCanvas.tsx  # Main R3F Canvas
│   │   └── ui/
│   │       ├── HUD.tsx         # Header, mute toggle, quick teleports, control hints
│   │       ├── Modals.tsx      # Projects, Skills, Timeline, Contact, About, Easter Egg
│   │       ├── RecruiterCVModal.tsx # Instant 2D printable resume
│   │       └── MobileControls.tsx # Touch joystick for mobile
│   ├── data/
│   │   └── cvData.ts           # Central personal CV data (easy to customize!)
│   ├── utils/
│   │   └── audio.ts            # Web Audio API sound generator
│   ├── wasm/                   # Compiled WASM package and TypeScript loader
│   ├── App.tsx
│   └── main.tsx
```

---

## ✏️ How to Customize Your CV

Open `src/data/cvData.ts` to update your information:
- **`name` & `title`**: Your name and professional headline.
- **`projects`**: Add or modify projects, live links, GitHub repos, and tech tags.
- **`skillCategories`**: Update languages, frameworks, cloud tools, and proficiencies.
- **`timeline`**: Add your work history, education, or achievements.
- **`email`, `github`, `linkedin`**: Your direct links.
