import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, HueSaturation } from '@react-three/postprocessing';
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
        camera={{ position: [0, 8, 16], fov: 42, near: 0.1, far: 240 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
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
          position={[26, 32, -24]}
          intensity={1.35}
          color="#fef9c3"
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

        {/* Balanced Ambient & Warm Hemisphere Lighting */}
        <ambientLight intensity={0.55} color="#ecfdf5" />
        <hemisphereLight args={['#60a5fa', '#15803d', 0.5]} />

        {/* 3. Soft Velvet Contact Shadows on the ground (Baked once at startup via frames={1} for maximum 60FPS performance) */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.35}
          scale={26}
          blur={2.0}
          far={4.5}
          frames={1}
          resolution={512}
          color="#020617"
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
        <House />
        <Interactables />
        <Particles engine={engine} />
        <Butterflies />
        <Character engine={engine} />
        <CameraController engine={engine} />

        {/* 7. Lightweight High-Performance Post-Processing */}
        <EffectComposer multisampling={4}>
          <Bloom
            luminanceThreshold={0.88}
            luminanceSmoothing={0.18}
            intensity={0.45}
            radius={0.5}
          />
          <HueSaturation saturation={0.15} />
          <Vignette eskil={false} offset={0.15} darkness={0.38} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
