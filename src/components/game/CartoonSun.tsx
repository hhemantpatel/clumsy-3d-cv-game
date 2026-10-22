import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SUN_POSITION_FAR } from './env/palette';

/**
 * Creates a procedural radial sunset gradient texture for the corona disc.
 */
function createCoronaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 256);
  grad.addColorStop(0.0, 'rgba(255, 255, 240, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 235, 130, 0.92)');
  grad.addColorStop(0.42, 'rgba(255, 160, 50, 0.65)');
  grad.addColorStop(0.68, 'rgba(240, 85, 30, 0.28)');
  grad.addColorStop(0.88, 'rgba(200, 45, 45, 0.08)');
  grad.addColorStop(1.0, 'rgba(180, 30, 40, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Stylized 3D Cartoon Sunset Sun in the sky:
 * - Radiant golden sun orb with intense emissive core (triggers bloom)
 * - Soft layered sunset corona halo disc
 * - 12 rotating stylized triangular sunburst rays with a gentle breathing pulse
 * - Perfectly aligned with the directional light and shadow vector.
 */
export const CartoonSun: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const raysRef = useRef<THREE.Group>(null);

  // Textures and geometries
  const coronaTex = useMemo(() => createCoronaTexture(), []);
  const orbGeo = useMemo(() => new THREE.SphereGeometry(6.2, 24, 16), []);
  const haloGeo = useMemo(() => new THREE.SphereGeometry(7.8, 24, 16), []);
  const coronaGeo = useMemo(() => new THREE.PlaneGeometry(42, 42), []);
  const rayGeoLong = useMemo(() => {
    const geo = new THREE.ConeGeometry(1.6, 22, 4);
    geo.translate(0, 11, 0);
    return geo;
  }, []);
  const rayGeoShort = useMemo(() => {
    const geo = new THREE.ConeGeometry(1.3, 15, 4);
    geo.translate(0, 7.5, 0);
    return geo;
  }, []);

  // Materials with fog: false so the sun radiates vividly across the horizon
  const orbMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fffde2',
        fog: false,
      }),
    []
  );

  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffb336',
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  const coronaMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: coronaTex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    [coronaTex]
  );

  const rayMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffa31a',
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    []
  );

  useFrame((state) => {
    // Billboard to face camera cleanly
    if (groupRef.current) {
      groupRef.current.quaternion.copy(state.camera.quaternion);
    }

    // Slowly rotate the sunburst rays with a gentle breathing pulse
    if (raysRef.current) {
      const t = state.clock.elapsedTime;
      raysRef.current.rotation.z = t * 0.038;
      const pulse = 1.0 + Math.sin(t * 1.4) * 0.04;
      raysRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} position={SUN_POSITION_FAR} renderOrder={-500}>
      {/* 1. Core Radiant Sun Orb */}
      <mesh geometry={orbGeo} material={orbMat} />

      {/* 2. Soft Golden Aura Shell */}
      <mesh geometry={haloGeo} material={haloMat} />

      {/* 3. Soft Sunset Corona Halo Billboard */}
      <mesh geometry={coronaGeo} material={coronaMat} position={[0, 0, -0.2]} />

      {/* 4. Rotating Stylized Sunburst Rays */}
      <group ref={raysRef} position={[0, 0, -0.1]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const isLong = i % 2 === 0;
          return (
            <mesh
              key={i}
              geometry={isLong ? rayGeoLong : rayGeoShort}
              material={rayMat}
              rotation={[0, 0, angle + Math.PI]}
            />
          );
        })}
      </group>
    </group>
  );
};
