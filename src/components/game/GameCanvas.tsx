import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, HueSaturation } from '@react-three/postprocessing';
import { SUN_POSITION, PALETTE } from './env/palette';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { getPhysicsEngine } from '../../wasm/engine';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';
import { CameraController } from './CameraController';
import { Yard } from './Yard';
import { House } from './House';
import { Interactables } from './Interactables';
import { Character } from './Character';
import { Particles } from './Particles';
import { Scenery } from './Scenery';
import { SkyDome } from './SkyDome';
import { CartoonSun } from './CartoonSun';
import { Butterflies } from './Butterflies';

export const GameCanvas: React.FC = () => {
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);
  const { activeModal } = useGame();

  useEffect(() => {
    let mounted = true;
    getPhysicsEngine().then((eng) => {
      if (mounted) {
        setEngine(eng);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows="soft"
        frameloop={activeModal && activeModal !== 'badminton' ? 'demand' : 'always'}
        dpr={[1, 1.5]}
        camera={{ position: [0, 11, 16], fov: 28, near: 0.1, far: 240 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.18,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        className="w-full h-full"
      >
        <fog attach="fog" args={[PALETTE.skyHorizon, 45, 180]} />

        {/* 0. Procedural Gradient Sky Dome & 3D Cartoon Sunset Sun */}
        <SkyDome />
        <CartoonSun />

        {/* 1. Natural Garden Environment Lighting */}
        <Environment preset="forest" environmentIntensity={0.22} />

        {/* 2. Low-Angle Golden Sunset Sunlight & Shadows (Aligned with 3D CartoonSun) */}
        <directionalLight
          castShadow
          position={SUN_POSITION}
          intensity={2.2}
          color="#ffad5c"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1.0}
          shadow-camera-far={120}
          shadow-camera-left={-28}
          shadow-camera-right={28}
          shadow-camera-top={28}
          shadow-camera-bottom={-28}
          shadow-bias={-0.0001}
          shadow-normalBias={0.035}
        />

        {/* Balanced Ambient & Warm Hemisphere Lighting for cozy diorama golden hour */}
        <ambientLight intensity={0.45} color="#ffb380" />
        <hemisphereLight args={['#f472b6', '#78350f', 0.55]} />

        {/* 3. Soft Velvet Contact Shadows on the ground */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.68}
          scale={32}
          blur={2.0}
          far={5.0}
          frames={1}
          resolution={512}
          color="#3b1d11"
        />

        {/* 4. Ambient Floating Golden-Peach Sparkles */}
        <Sparkles
          count={35}
          scale={[24, 8, 24]}
          position={[0, 3, 0]}
          size={2.2}
          speed={0.3}
          color="#fed7aa"
          opacity={0.65}
        />

        {/* 5. Majestic Outside Scenery (Forest Hills, Winding River, Countryside) */}
        <Scenery />

        {/* 6. 3D Yard & House Meshes */}
        <Yard engine={engine} />
        <House engine={engine} />
        <Interactables />
        <Particles engine={engine} />
        <Butterflies />
        <Character engine={engine} />
        <CameraController engine={engine} />

        {/* 7. Clean High-Performance Post-Processing (multisampling={0} avoids 4x MSAA bandwidth overhead) */}
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.85}
            luminanceSmoothing={0.18}
            intensity={0.45}
            radius={0.5}
          />
          <HueSaturation saturation={0.28} />
          <Vignette eskil={false} offset={0.18} darkness={0.32} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
