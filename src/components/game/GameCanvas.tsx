import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, HueSaturation } from '@react-three/postprocessing';
import { SUN_POSITION } from './env/palette';
import * as THREE from 'three';
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
import { Butterflies } from './Butterflies';

export const GameCanvas: React.FC = () => {
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);

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
        <fog attach="fog" args={['#bfdbfe', 45, 175]} />

        {/* 0. Procedural Gradient Sky Dome */}
        <SkyDome />

        {/* 1. Natural Garden Environment Lighting */}
        <Environment preset="forest" environmentIntensity={0.25} />

        {/* 2. Soft Natural Warm Sunlight & Shadows (Sun direction aligned with SkyDome visible sun [65, 80, -60]) */}
        <directionalLight
          castShadow
          position={SUN_POSITION}
          intensity={1.75}
          color="#fff7ed"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1.0}
          shadow-camera-far={75}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-bias={-0.0001}
          shadow-normalBias={0.035}
        />

        {/* Balanced Ambient & Warm Hemisphere Lighting for cozy miniature diorama */}
        <ambientLight intensity={0.65} color="#fef3c7" />
        <hemisphereLight args={['#38bdf8', '#22c55e', 0.65]} />

        {/* 3. Soft Velvet Contact Shadows on the ground */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.65}
          scale={32}
          blur={2.2}
          far={5.0}
          frames={1}
          resolution={512}
          color="#0f172a"
        />

        {/* 4. Ambient Floating Golden Sparkles */}
        <Sparkles
          count={35}
          scale={[24, 8, 24]}
          position={[0, 3, 0]}
          size={2.0}
          speed={0.3}
          color="#fef08a"
          opacity={0.6}
        />

        {/* 5. Majestic Outside Scenery (Forest Hills, Winding River, Countryside) */}
        <Scenery />

        {/* 6. 3D Yard & House Meshes */}
        <Yard />
        <House engine={engine} />
        <Interactables />
        <Particles engine={engine} />
        <Butterflies />
        <Character engine={engine} />
        <CameraController engine={engine} />

        {/* 7. Clean High-Performance Post-Processing (100% Sharp) */}
        <EffectComposer multisampling={4}>
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
