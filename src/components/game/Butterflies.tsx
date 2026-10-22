import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './env/palette';

/**
 * Butterflies fluttering around the garden.
 * - 2 draw calls total (instanced wings + instanced bodies), one useFrame, zero allocations per frame.
 * - Body points along the direction of flight; wings hinge on the body's long axis and flap up/down.
 * - Every flight path is a lazy figure-8 whose bounding box stays outside the house footprint
 *   (x -6.9..6.9, z -10.9..-1.1), the planter and the fence.
 */

interface Flight {
  cx: number;
  cz: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
  flap: number;
  color: string;
}

// Hand-placed so that [cx +- radius] x [cz +- radius/2] never touches the house or planter.
const FLIGHTS: Flight[] = [
  { cx: -4.0, cz: 5.0, radius: 2.4, height: 1.3, speed: 0.55, phase: 0.0, flap: 13, color: PALETTE.flowers[2] },
  { cx: 2.4, cz: 7.2, radius: 1.9, height: 1.1, speed: 0.7, phase: 1.3, flap: 15, color: PALETTE.flowers[1] },
  { cx: -9.6, cz: -6.2, radius: 1.8, height: 1.5, speed: 0.6, phase: 2.1, flap: 12, color: PALETTE.flowers[5] },
  { cx: 9.8, cz: -8.0, radius: 1.6, height: 1.2, speed: 0.75, phase: 0.7, flap: 16, color: PALETTE.flowers[3] },
  { cx: -9.6, cz: 7.0, radius: 1.9, height: 1.0, speed: 0.5, phase: 3.0, flap: 14, color: PALETTE.flowers[4] },
  { cx: 6.6, cz: 10.4, radius: 2.4, height: 1.4, speed: 0.62, phase: 4.2, flap: 13, color: '#7fd1b9' },
  { cx: 0.0, cz: 4.2, radius: 2.8, height: 1.7, speed: 0.45, phase: 5.1, flap: 12, color: PALETTE.flowers[2] },
  { cx: -2.2, cz: 10.4, radius: 1.8, height: 1.2, speed: 0.68, phase: 2.6, flap: 15, color: PALETTE.flowers[1] },
];

const SCALE = 0.21;

function createWingGeometry(): THREE.BufferGeometry {
  // Right wing outline in the XY plane (x = span outward, y = forward), hinge along x = 0.
  const s = new THREE.Shape();
  s.moveTo(0, 0.12);
  s.bezierCurveTo(0.35, 0.55, 0.95, 0.75, 1.0, 0.35); // forewing
  s.bezierCurveTo(1.02, 0.1, 0.75, 0.02, 0.55, -0.02);
  s.bezierCurveTo(0.85, -0.2, 0.75, -0.62, 0.42, -0.6); // hindwing
  s.bezierCurveTo(0.2, -0.58, 0.05, -0.35, 0, -0.18);
  s.lineTo(0, 0.12);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(Math.PI / 2); // lie flat: shape-y becomes +z (forward), wings in the XZ plane
  return g;
}

function createBodyGeometry(): THREE.BufferGeometry {
  const g = new THREE.CapsuleGeometry(0.07, 0.75, 3, 6);
  g.rotateX(Math.PI / 2); // long axis along +z (direction of flight)
  return g;
}

export const Butterflies: React.FC = () => {
  const wingsRef = useRef<THREE.InstancedMesh>(null);
  const bodiesRef = useRef<THREE.InstancedMesh>(null);

  const { wingGeo, bodyGeo, wingMat, bodyMat } = useMemo(() => ({
    wingGeo: createWingGeometry(),
    bodyGeo: createBodyGeometry(),
    wingMat: new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: '#2a2a2a' }),
    bodyMat: new THREE.MeshLambertMaterial({ color: PALETTE.charcoal }),
  }), []);

  useEffect(() => () => {
    wingGeo.dispose();
    bodyGeo.dispose();
    wingMat.dispose();
    bodyMat.dispose();
  }, [wingGeo, bodyGeo, wingMat, bodyMat]);

  // Per-instance wing colours (each butterfly's two wings share its colour)
  useEffect(() => {
    const wings = wingsRef.current;
    if (!wings) return;
    const c = new THREE.Color();
    FLIGHTS.forEach((f, i) => {
      c.set(f.color);
      wings.setColorAt(i * 2, c);
      wings.setColorAt(i * 2 + 1, c);
    });
    if (wings.instanceColor) wings.instanceColor.needsUpdate = true;
  }, []);

  // Scratch objects reused every frame
  const tmp = useMemo(() => ({
    body: new THREE.Matrix4(),
    wing: new THREE.Matrix4(),
    hinge: new THREE.Matrix4(),
    mirror: new THREE.Matrix4().makeScale(-1, 1, 1),
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
    scale: new THREE.Vector3(SCALE, SCALE, SCALE),
  }), []);

  useFrame(({ clock }) => {
    const wings = wingsRef.current;
    const bodies = bodiesRef.current;
    if (!wings || !bodies) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < FLIGHTS.length; i++) {
      const f = FLIGHTS[i];
      const th = t * f.speed + f.phase;
      // Lemniscate path + gentle bobbing
      const x = f.cx + Math.sin(th) * f.radius;
      const z = f.cz + Math.sin(th * 2) * f.radius * 0.5;
      const y = f.height + Math.sin(th * 1.5) * 0.35 + Math.sin(t * f.flap * 0.5) * 0.04;
      // Velocity (analytic derivative) -> heading + bank
      const dx = Math.cos(th) * f.radius;
      const dz = Math.cos(th * 2) * f.radius;
      const dy = Math.cos(th * 1.5) * 0.35 * 1.5;
      const heading = Math.atan2(dx, dz);
      const pitch = -Math.atan2(dy, Math.hypot(dx, dz)) * 0.6;
      const turn = -Math.sin(th * 2) * 0.25;

      tmp.pos.set(x, y, z);
      tmp.euler.set(pitch, heading, turn);
      tmp.quat.setFromEuler(tmp.euler);
      tmp.body.compose(tmp.pos, tmp.quat, tmp.scale);
      bodies.setMatrixAt(i, tmp.body);

      // Wing flap around the body's forward (z) axis: fast down-stroke, occasional glide
      const glide = Math.sin(t * 0.7 + f.phase) > 0.85 ? 0.25 : 1;
      const flap = 0.35 + Math.sin(t * f.flap) * 0.85 * glide;

      tmp.hinge.makeRotationZ(flap);
      tmp.wing.multiplyMatrices(tmp.body, tmp.hinge);
      wings.setMatrixAt(i * 2, tmp.wing);

      tmp.hinge.makeRotationZ(-flap).multiply(tmp.mirror);
      tmp.wing.multiplyMatrices(tmp.body, tmp.hinge);
      wings.setMatrixAt(i * 2 + 1, tmp.wing);
    }
    wings.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={wingsRef} args={[wingGeo, wingMat, FLIGHTS.length * 2]} frustumCulled={false} />
      <instancedMesh ref={bodiesRef} args={[bodyGeo, bodyMat, FLIGHTS.length]} frustumCulled={false} />
    </group>
  );
};
