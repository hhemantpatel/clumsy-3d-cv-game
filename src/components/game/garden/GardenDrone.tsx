// The farming drone: rounded shell, 4 arms with spinning rotors, cyan visor
// eyes that blink, antenna light, banks into its motion; plus its tool FX
// (water spray via the shared particle pool, harvest tractor beam).
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { DroneState } from '../../../garden/types';
import { COLS, ROWS, DRONE_BASE_Y, MAT, PALETTE, DroneLive, mergeParts } from './assets';
import type { ParticlePool } from './particles';

const DIR_YAW: Record<string, number> = { S: 0, W: -Math.PI / 2, N: Math.PI, E: Math.PI / 2 };
const ARM_ANGLES = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
const ARM_REACH = 0.36;
const ROTOR_Y = 0.07;

// ---- static drone geometry (built once) ----
const BODY_GEO = (() => {
  const g = new THREE.SphereGeometry(0.2, 22, 14);
  g.scale(1, 0.78, 1);
  return g;
})();
const BAND_GEO = (() => {
  const g = new THREE.TorusGeometry(0.2, 0.016, 8, 28);
  g.rotateX(Math.PI / 2);
  return g;
})();
const VISOR_GEO = (() => {
  // front (+Z) cap of a slightly larger sphere
  const g = new THREE.SphereGeometry(0.205, 18, 6, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.42, 0.68);
  g.scale(1, 0.78, 1);
  return g;
})();
const EYE_GEO = (() => {
  const g = new THREE.SphereGeometry(1, 10, 8);
  g.scale(0.024, 0.036, 0.012);
  return g;
})();
const FRAME_GEO = (() => {
  const parts = ARM_ANGLES.flatMap((a) => {
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    return [
      {
        geo: new THREE.BoxGeometry(0.24, 0.024, 0.036),
        color: PALETTE.white,
        position: [cx * 0.25, 0.02, cz * 0.25] as [number, number, number],
        rotation: [0, -a, 0] as [number, number, number],
      },
      {
        geo: new THREE.CylinderGeometry(0.026, 0.032, 0.055, 10),
        color: PALETTE.white,
        position: [cx * ARM_REACH, 0.035, cz * ARM_REACH] as [number, number, number],
      },
    ];
  });
  // landing skids
  parts.push(
    { geo: new THREE.BoxGeometry(0.02, 0.09, 0.02), color: PALETTE.white, position: [-0.1, -0.17, 0], rotation: [0, 0, 0.25] },
    { geo: new THREE.BoxGeometry(0.02, 0.09, 0.02), color: PALETTE.white, position: [0.1, -0.17, 0], rotation: [0, 0, -0.25] }
  );
  const g = mergeParts(parts);
  return g;
})();
const GUARD_GEO = (() =>
  mergeParts(
    ARM_ANGLES.map((a) => {
      const g = new THREE.TorusGeometry(0.115, 0.011, 6, 24);
      g.rotateX(Math.PI / 2);
      return { geo: g, color: PALETTE.white, position: [Math.cos(a) * ARM_REACH, ROTOR_Y - 0.005, Math.sin(a) * ARM_REACH] as [number, number, number] };
    })
  ))();
const ROTOR_GEO = (() =>
  mergeParts([
    { geo: new THREE.BoxGeometry(0.2, 0.006, 0.03), color: PALETTE.white },
    { geo: new THREE.BoxGeometry(0.03, 0.006, 0.2), color: PALETTE.white },
    { geo: new THREE.CylinderGeometry(0.014, 0.014, 0.02, 8), color: PALETTE.white },
  ]))();
const ANTENNA_GEO = (() => {
  const g = new THREE.CylinderGeometry(0.006, 0.008, 0.11, 6);
  g.translate(0, 0.055, 0);
  return g;
})();
const BULB_GEO = new THREE.SphereGeometry(0.022, 10, 8);
const NOZZLE_GEO = (() => {
  const g = new THREE.CylinderGeometry(0.03, 0.045, 0.06, 10);
  return g;
})();
const BEAM_GEO = (() => {
  const g = new THREE.CylinderGeometry(0.07, 0.3, 1, 18, 1, true);
  g.translate(0, -0.5, 0);
  return g;
})();
const BEAM_RING_GEO = (() => {
  const g = new THREE.TorusGeometry(1, 0.06, 4, 24);
  g.rotateX(Math.PI / 2);
  return g;
})();

// ---- per-action colours ----
const C_IDLE = new THREE.Color('#5eead4');
const C_WATER = new THREE.Color('#7dd3fc');
const C_PLANT = new THREE.Color('#86efac');
const C_HARVEST = new THREE.Color('#fcd34d');
const C_ANT_ON = new THREE.Color('#ff6b6b');
const C_ANT_RUN = new THREE.Color('#4ade80');
const _target = new THREE.Color();
const _antTarget = new THREE.Color();

const wrapAngle = (a: number) => {
  while (a < -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
};
const damp = THREE.MathUtils.damp;

interface DroneProps {
  drone: DroneState;
  isRunning: boolean;
  live: DroneLive;
  bits: ParticlePool;
}

export const GardenDrone: React.FC<DroneProps> = React.memo(({ drone, isRunning, live, bits }) => {
  const droneRef = useRef(drone);
  droneRef.current = drone;
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;

  const root = useRef<THREE.Group>(null); // position + world-space bank/tilt
  const yawGroup = useRef<THREE.Group>(null);
  const rotors = useRef<(THREE.Mesh | null)[]>([]);
  const eyes = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Group>(null);
  const ring0 = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  // Per-drone animated materials (colour/opacity change at runtime).
  const mats = useMemo(
    () => ({
      eye: new THREE.MeshBasicMaterial({ color: C_IDLE.clone(), toneMapped: false }),
      bulb: new THREE.MeshBasicMaterial({ color: C_ANT_ON.clone(), toneMapped: false }),
      beam: new THREE.MeshBasicMaterial({
        color: C_HARVEST.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    }),
    []
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const sim = useRef({ prevX: 0, prevZ: 0, tiltX: 0, tiltZ: 0, nextBlink: 2, blinkT: -1, sprayAcc: 0, beam: 0, init: false });

  useFrame((state, rawDelta) => {
    const g = root.current;
    const yg = yawGroup.current;
    if (!g || !yg) return;
    const dt = Math.min(rawDelta, 0.05);
    const time = state.clock.elapsedTime;
    const d = droneRef.current;
    const s = sim.current;

    const tx = COLS[d.x] ?? 0;
    const tz = ROWS[d.y] ?? 0;
    if (!s.init) {
      g.position.set(tx, DRONE_BASE_Y, tz);
      yg.rotation.y = DIR_YAW[d.dir] ?? 0;
      s.prevX = tx;
      s.prevZ = tz;
      s.init = true;
    }

    // ---- movement ----
    const dip = d.isHarvesting || d.isPlanting ? -0.24 : d.isWatering ? -0.1 : 0;
    const bob = Math.sin(time * 2.2) * 0.035 + Math.sin(time * 3.7) * 0.012;
    g.position.x = damp(g.position.x, tx, 6, dt);
    g.position.z = damp(g.position.z, tz, 6, dt);
    g.position.y = damp(g.position.y, DRONE_BASE_Y + dip + bob, 7, dt);
    yg.rotation.y += wrapAngle((DIR_YAW[d.dir] ?? 0) - yg.rotation.y) * (1 - Math.exp(-9 * dt));

    // bank into the direction of travel (world space, so independent of yaw)
    const vx = dt > 0 ? (g.position.x - s.prevX) / dt : 0;
    const vz = dt > 0 ? (g.position.z - s.prevZ) / dt : 0;
    s.prevX = g.position.x;
    s.prevZ = g.position.z;
    s.tiltX = damp(s.tiltX, THREE.MathUtils.clamp(vz * 0.16, -0.35, 0.35), 8, dt);
    s.tiltZ = damp(s.tiltZ, THREE.MathUtils.clamp(-vx * 0.16, -0.35, 0.35), 8, dt);
    g.rotation.x = s.tiltX + Math.sin(time * 1.9) * 0.025;
    g.rotation.z = s.tiltZ + Math.cos(time * 2.3) * 0.025;

    live.x = g.position.x;
    live.y = g.position.y;
    live.z = g.position.z;

    // ---- rotors ----
    const spin = (d.isMoving ? 48 : 30) * dt;
    for (let i = 0; i < rotors.current.length; i++) {
      const m = rotors.current[i];
      if (m) m.rotation.y += i % 2 ? -spin : spin;
    }

    // ---- face ----
    _target.copy(d.isHarvesting ? C_HARVEST : d.isPlanting ? C_PLANT : d.isWatering ? C_WATER : C_IDLE);
    mats.eye.color.lerp(_target, 1 - Math.exp(-8 * dt));
    if (eyes.current) {
      if (s.blinkT < 0 && time > s.nextBlink) s.blinkT = 0;
      let sy = 1;
      if (s.blinkT >= 0) {
        s.blinkT += dt;
        const k = s.blinkT / 0.16;
        sy = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1;
        if (k >= 1) {
          s.blinkT = -1;
          s.nextBlink = time + 2.2 + Math.random() * 3;
        }
      }
      // happy squint while harvesting
      eyes.current.scale.y = sy * (d.isHarvesting ? 0.55 : 1);
    }

    // ---- antenna light: slow red pulse idle, fast green blink while a script runs ----
    _antTarget.copy(runningRef.current ? C_ANT_RUN : C_ANT_ON);
    const pulse = runningRef.current ? (Math.sin(time * 10) > 0 ? 1 : 0.25) : 0.55 + 0.45 * Math.sin(time * 2.5);
    mats.bulb.color.copy(_antTarget).multiplyScalar(0.4 + 0.9 * pulse);

    // ---- harvest tractor beam ----
    s.beam = damp(s.beam, d.isHarvesting ? 1 : d.isPlanting ? 0.45 : 0, 6, dt);
    mats.beam.color.copy(d.isPlanting && !d.isHarvesting ? C_PLANT : C_HARVEST);
    mats.beam.opacity = 0.32 * s.beam;
    if (beam.current) {
      beam.current.visible = s.beam > 0.01;
      const len = Math.max(0.05, g.position.y - 0.12 - 0.27);
      beam.current.scale.set(1, len, 1);
      // rings travel upward (pulling the crop in)
      const r0 = ring0.current;
      const r1 = ring1.current;
      if (r0 && r1) {
        const p0 = (time * 1.6) % 1;
        const p1 = (time * 1.6 + 0.5) % 1;
        r0.position.y = -(1 - p0);
        r1.position.y = -(1 - p1);
        const rad0 = 0.07 + 0.23 * (1 - p0);
        const rad1 = 0.07 + 0.23 * (1 - p1);
        r0.scale.set(rad0, 1 / len, rad0);
        r1.scale.set(rad1, 1 / len, rad1);
      }
    }

    // ---- water spray (pooled droplets) ----
    if (d.isWatering) {
      s.sprayAcc += dt * 70;
      while (s.sprayAcc >= 1) {
        s.sprayAcc -= 1;
        const a = Math.random() * Math.PI * 2;
        const sp = 0.15 + Math.random() * 0.45;
        bits.emit(
          g.position.x + Math.cos(a) * 0.04,
          g.position.y - 0.22,
          g.position.z + Math.sin(a) * 0.04,
          Math.cos(a) * sp,
          -0.4 - Math.random() * 0.6,
          Math.sin(a) * sp,
          { life: 1.2, size: 0.016 + Math.random() * 0.008, gravity: -7, color: PALETTE.water }
        );
      }
    } else {
      s.sprayAcc = 0;
    }

    // ---- single work light ----
    if (light.current) {
      const busy = d.isHarvesting || d.isPlanting || d.isWatering;
      light.current.intensity = damp(light.current.intensity, busy ? 2.2 : 0.7, 5, dt);
      light.current.color.copy(mats.eye.color);
    }
  });

  return (
    <group ref={root} position={[0, DRONE_BASE_Y, 0]}>
      <group ref={yawGroup}>
        <mesh geometry={BODY_GEO} material={MAT.droneShell} castShadow />
        <mesh geometry={BAND_GEO} material={MAT.droneAccent} />
        <mesh geometry={VISOR_GEO} material={MAT.droneVisor} />
        <group ref={eyes} position={[0, 0.025, 0.198]}>
          <mesh geometry={EYE_GEO} material={mats.eye} position={[-0.055, 0, 0]} />
          <mesh geometry={EYE_GEO} material={mats.eye} position={[0.055, 0, 0]} />
        </group>
        <mesh geometry={FRAME_GEO} material={MAT.droneFrame} castShadow />
        <mesh geometry={GUARD_GEO} material={MAT.droneAccent} />
        {ARM_ANGLES.map((a, i) => (
          <mesh
            key={i}
            ref={(m) => {
              rotors.current[i] = m;
            }}
            geometry={ROTOR_GEO}
            material={MAT.droneRotor}
            position={[Math.cos(a) * ARM_REACH, ROTOR_Y, Math.sin(a) * ARM_REACH]}
          />
        ))}
        <group position={[0.04, 0.14, -0.04]} rotation={[-0.25, 0, 0.15]}>
          <mesh geometry={ANTENNA_GEO} material={MAT.droneFrame} />
          <mesh geometry={BULB_GEO} material={mats.bulb} position={[0, 0.12, 0]} />
        </group>
        <mesh geometry={NOZZLE_GEO} material={MAT.droneFrame} position={[0, -0.16, 0]} />
      </group>

      {/* Tractor beam (not yawed; unit length scaled to reach the soil) */}
      <group ref={beam} position={[0, -0.12, 0]} visible={false}>
        <mesh geometry={BEAM_GEO} material={mats.beam} />
        <mesh ref={ring0} geometry={BEAM_RING_GEO} material={mats.beam} />
        <mesh ref={ring1} geometry={BEAM_RING_GEO} material={mats.beam} />
      </group>

      <pointLight ref={light} position={[0, -0.25, 0]} distance={1.8} decay={2} intensity={0.7} color={C_IDLE} />
    </group>
  );
});
GardenDrone.displayName = 'GardenDrone';
