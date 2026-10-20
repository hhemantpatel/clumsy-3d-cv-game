import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';
import { useGame } from '../../context/GameContext';
import { soundManager } from '../../utils/audio';
import { textureGen } from '../../utils/textures';

interface CharacterProps {
  engine: PhysicsEngine | null;
}

export const Character: React.FC<CharacterProps> = ({ engine }) => {
  const fabricBump = useMemo(() => {
    return textureGen.getFabricBump();
  }, []);

  const shadowTexture = useMemo(() => {
    return textureGen.getSoftContactShadow();
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const pomPomRef = useRef<THREE.Mesh>(null);
  const drawstringsRef = useRef<THREE.Group>(null);
  const glassesRef = useRef<THREE.Group>(null);

  // Articulated Legs (Hip -> Knee -> Foot)
  const leftLegRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Group>(null);

  const rightLegRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const rightFootRef = useRef<THREE.Group>(null);

  // Articulated Arms (Shoulder -> Forearm -> Hand)
  const leftArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);

  const rightArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  // Eyes
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  const { hasStarted, activeModal, setIsInsideHouse, setNearbyZone, moveInput, teleportTarget, clearTeleport } = useGame();

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastStumbleSound = useRef<number>(0);

  // Secondary Spring physics for beanie pom-pom
  const pomPomSpring = useRef({
    pos: new THREE.Vector3(0, 0.34, -0.04),
    vel: new THREE.Vector3(0, 0, 0),
  });

  // Secondary Pendulum physics for hoodie drawstrings
  const drawstringsSpring = useRef({
    rx: 0,
    rz: 0,
    vx: 0,
    vz: 0,
  });

  // Single-tap incremental turn buffer (10 degrees per discrete key tap)
  const tapTurnRef = useRef<number>(0);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!target) return false;
      const el = target as HTMLElement;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore character movement when any modal is open or user is typing
      if (activeModal || isTypingTarget(e.target)) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      const isA = code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft';
      const isD = code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright';

      // On fresh key press (initial tap), queue a clean 10° (0.174 rad) incremental turn
      if (!keysRef.current[code] && !keysRef.current[key]) {
        if (isA) {
          tapTurnRef.current -= 0.174; // -10 degrees per click
        } else if (isD) {
          tapTurnRef.current += 0.174; // +10 degrees per click
        }
      }
      keysRef.current[code] = true;
      keysRef.current[key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key.toLowerCase()] = false;
    };

    // Reset keys on window blur so keys don't stick during Alt-Tab
    const handleBlur = () => {
      keysRef.current = {};
      tapTurnRef.current = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeModal]);

  useFrame(({ camera }, delta) => {
    if (!engine || !groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    if (teleportTarget === 'spawn') {
      engine.teleport_to_start();
      clearTeleport();
    } else if (teleportTarget === 'desk') {
      engine.teleport_to_desk();
      clearTeleport();
    }

    let throttle = 0;
    let steer = 0;

    if (hasStarted && !activeModal) {
      const keys = keysRef.current;
      if (keys['KeyW'] || keys['w'] || keys['ArrowUp'] || keys['arrowup']) throttle += 1;
      if (keys['KeyS'] || keys['s'] || keys['ArrowDown'] || keys['arrowdown']) throttle -= 1;
      if (keys['KeyA'] || keys['a'] || keys['ArrowLeft'] || keys['arrowleft']) steer -= 1;
      if (keys['KeyD'] || keys['d'] || keys['ArrowRight'] || keys['arrowright']) steer += 1;

      // Mobile touch input integration (x: steer left/right, z: forward/backward)
      steer += moveInput.x;
      throttle -= moveInput.z;
    } else {
      tapTurnRef.current = 0;
    }

    const isRunning = keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'] || keysRef.current['shift'] === true;

    // Apply any 10-degree tap turn impulse from keyboard click
    if (tapTurnRef.current !== 0) {
      engine.turn(tapTurnRef.current);
      tapTurnRef.current = 0;
    }

    // Advance Rust WASM Physics & Kinematics Engine with steer & throttle
    engine.update(steer, throttle, isRunning, dt);

    const px = engine.get_player_x();
    const py = engine.get_player_y();
    const pz = engine.get_player_z();
    const rot = engine.get_player_rotation();
    const speed = engine.get_player_speed();
    const walkCycle = engine.get_walk_cycle();
    const wobbleX = engine.get_wobble_x();
    const wobbleZ = engine.get_wobble_z();
    const isWalking = engine.is_walking();
    const isInside = engine.is_inside_house();
    const activeZone = engine.get_active_interaction();
    const stumble = engine.get_stumble_intensity();
    const skid = engine.get_skid_intensity();
    const footTrigger = engine.get_footstep_trigger();

    setIsInsideHouse(isInside);
    setNearbyZone(activeZone.length > 0 ? activeZone : null);

    // Synchronized footstep audio on exact heel strike from Rust engine
    if (footTrigger === 1) {
      soundManager.playStep(true);
    } else if (footTrigger === 2) {
      soundManager.playStep(false);
    }

    if (stumble > 0.7 && performance.now() - lastStumbleSound.current > 500) {
      soundManager.playBump();
      lastStumbleSound.current = performance.now();
    }

    // 1. Root Position & Rotation
    groupRef.current.position.set(px, py, pz);
    groupRef.current.rotation.y = rot;

    // 2. Pelvis & Torso Dynamics (Wobble, banking, forward lean)
    if (bodyRef.current) {
      bodyRef.current.rotation.z = wobbleX * 1.15;
      bodyRef.current.rotation.x = wobbleZ * 1.15;
    }

    // 3. Head Kinematics: Natural gaze compensation, delay, and stumble recoil
    if (headRef.current) {
      headRef.current.rotation.z = -wobbleX * 0.75;
      headRef.current.rotation.x = -wobbleZ * 0.5 + (stumble * 0.38) - (skid * 0.2);
    }

    // 4. Secondary Spring Motion for Beanie Pom-Pom
    const pSpring = pomPomSpring.current;
    const targetPomX = -wobbleX * 0.18;
    const targetPomY = 0.34 - (py * 0.35);
    const targetPomZ = -0.04 - (wobbleZ * 0.18);

    pSpring.vel.x += (targetPomX - pSpring.pos.x) * 130.0 * dt - pSpring.vel.x * 14.0 * dt;
    pSpring.vel.y += (targetPomY - pSpring.pos.y) * 130.0 * dt - pSpring.vel.y * 14.0 * dt;
    pSpring.vel.z += (targetPomZ - pSpring.pos.z) * 130.0 * dt - pSpring.vel.z * 14.0 * dt;
    pSpring.pos.x += pSpring.vel.x * dt;
    pSpring.pos.y += pSpring.vel.y * dt;
    pSpring.pos.z += pSpring.vel.z * dt;

    if (pomPomRef.current) {
      pomPomRef.current.position.set(pSpring.pos.x, pSpring.pos.y, pSpring.pos.z);
    }

    // 5. Secondary Pendulum Sway for Hoodie Drawstrings
    const dStr = drawstringsSpring.current;
    const targetDx = -wobbleZ * 0.45 + (isRunning && speed > 2.0 ? -0.25 : -0.08);
    const targetDz = wobbleX * 0.35;
    dStr.vx += (targetDx - dStr.rx) * 65.0 * dt - dStr.vx * 8.5 * dt;
    dStr.vz += (targetDz - dStr.rz) * 65.0 * dt - dStr.vz * 8.5 * dt;
    dStr.rx += dStr.vx * dt;
    dStr.rz += dStr.vz * dt;

    if (drawstringsRef.current) {
      drawstringsRef.current.rotation.x = dStr.rx;
      drawstringsRef.current.rotation.z = dStr.rz;
    }

    // 6. Articulated Procedural Limb Kinematics
    if (isWalking && speed > 0.12) {
      const isSprinting = isRunning && speed > 2.5;
      const strideAmp = isSprinting ? 0.75 : 0.52;

      const leftPhase = walkCycle;
      const rightPhase = walkCycle + Math.PI;

      // Leg Hip Swing
      const leftHipX = Math.sin(leftPhase) * strideAmp;
      const rightHipX = Math.sin(rightPhase) * strideAmp;

      // Knee Bend: Flexes backwards during forward swing to prevent ground clipping
      const kneeBendMax = isSprinting ? 1.25 : 0.82;
      const leftKneeX = Math.max(0, Math.cos(leftPhase)) * kneeBendMax + (isSprinting ? 0.16 : 0.06);
      const rightKneeX = Math.max(0, Math.cos(rightPhase)) * kneeBendMax + (isSprinting ? 0.16 : 0.06);

      // Foot Ankle Pitch: Dorsiflexion on heel strike, plantarflexion on toe push
      const leftAnkleX = -Math.sin(leftPhase) * 0.3 - Math.max(0, -Math.cos(leftPhase)) * 0.24;
      const rightAnkleX = -Math.sin(rightPhase) * 0.3 - Math.max(0, -Math.cos(rightPhase)) * 0.24;

      // Comedic clumsy waddle roll
      const waddleRoll = Math.sin(walkCycle) * 0.06;

      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = leftHipX;
        leftLegRef.current.rotation.z = -0.05 + waddleRoll;
        leftLegRef.current.rotation.y = -0.08; // toe out
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = leftKneeX;
      }
      if (leftFootRef.current) {
        leftFootRef.current.rotation.x = leftAnkleX;
      }

      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = rightHipX;
        rightLegRef.current.rotation.z = 0.05 + waddleRoll;
        rightLegRef.current.rotation.y = 0.08; // toe out
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = rightKneeX;
      }
      if (rightFootRef.current) {
        rightFootRef.current.rotation.x = rightAnkleX;
      }

      // Arms: Swing opposite to legs (Left arm swings with Right leg)
      const armAmp = isSprinting ? 0.88 : 0.50;
      const leftArmX = Math.sin(rightPhase) * armAmp;
      const rightArmX = Math.sin(leftPhase) * armAmp;

      // Elbow Flexion: Bends inward when swinging forward
      const elbowBase = isSprinting ? 0.78 : 0.32;
      const leftElbowX = elbowBase + Math.max(0, -Math.sin(rightPhase)) * (isSprinting ? 0.72 : 0.5);
      const rightElbowX = elbowBase + Math.max(0, -Math.sin(leftPhase)) * (isSprinting ? 0.72 : 0.5);

      const armFlare = isSprinting ? 0.26 : 0.16;

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = leftArmX;
        leftArmRef.current.rotation.z = armFlare + Math.abs(Math.sin(rightPhase)) * 0.09;
      }
      if (leftForearmRef.current) {
        leftForearmRef.current.rotation.x = leftElbowX;
      }

      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = rightArmX;
        rightArmRef.current.rotation.z = -armFlare - Math.abs(Math.sin(leftPhase)) * 0.09;
      }
      if (rightForearmRef.current) {
        rightForearmRef.current.rotation.x = rightElbowX;
      }

      // Torso Counter-Torsion
      if (torsoRef.current) {
        torsoRef.current.rotation.y = -Math.sin(walkCycle) * (isSprinting ? 0.15 : 0.10);
      }
    } else {
      // Idle Breathing & Natural Settling Stance
      const idleTime = performance.now() * 0.0022;
      const breath = Math.sin(idleTime * 2.2);

      const lerpSpeed = 0.16;

      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpSpeed);
        leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, -0.04, lerpSpeed);
        leftLegRef.current.rotation.y = -0.06;
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = THREE.MathUtils.lerp(leftKneeRef.current.rotation.x, 0.04, lerpSpeed);
      }
      if (leftFootRef.current) {
        leftFootRef.current.rotation.x = THREE.MathUtils.lerp(leftFootRef.current.rotation.x, 0, lerpSpeed);
      }

      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpSpeed);
        rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0.04, lerpSpeed);
        rightLegRef.current.rotation.y = 0.06;
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = THREE.MathUtils.lerp(rightKneeRef.current.rotation.x, 0.04, lerpSpeed);
      }
      if (rightFootRef.current) {
        rightFootRef.current.rotation.x = THREE.MathUtils.lerp(rightFootRef.current.rotation.x, 0, lerpSpeed);
      }

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, breath * 0.04, lerpSpeed);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.09 + breath * 0.02, lerpSpeed);
      }
      if (leftForearmRef.current) {
        leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, 0.15, lerpSpeed);
      }

      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -breath * 0.04, lerpSpeed);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.09 - breath * 0.02, lerpSpeed);
      }
      if (rightForearmRef.current) {
        rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, 0.15, lerpSpeed);
      }

      if (torsoRef.current) {
        torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, 0, lerpSpeed);
      }
    }

    // 7. Comedic Skid / Brake Reaction
    if (skid > 0.06) {
      if (bodyRef.current) {
        bodyRef.current.rotation.x -= skid * 0.3;
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = -0.32 * skid;
        rightLegRef.current.rotation.x = -0.22 * skid;
      }
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.rotation.x = 0.32 * skid;
        rightFootRef.current.rotation.x = 0.32 * skid;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x -= skid * 0.55;
        rightArmRef.current.rotation.x -= skid * 0.55;
        leftArmRef.current.rotation.z += skid * 0.28;
        rightArmRef.current.rotation.z -= skid * 0.28;
      }
    }

    // 8. Comedic Stumble / Wall Impact Reaction
    if (stumble > 0.05) {
      const flailTime = performance.now() * 0.025;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(flailTime) * 1.3 * stumble;
        leftArmRef.current.rotation.z = 0.55 + Math.cos(flailTime) * 0.45 * stumble;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.sin(flailTime) * 1.3 * stumble;
        rightArmRef.current.rotation.z = -0.55 - Math.cos(flailTime) * 0.45 * stumble;
      }
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(flailTime * 0.8) * 0.35 * stumble;
        headRef.current.rotation.y = Math.cos(flailTime * 0.5) * 0.4 * stumble;
      }
      if (glassesRef.current) {
        glassesRef.current.rotation.z = Math.sin(flailTime * 0.6) * 0.16 * stumble;
      }
    } else if (glassesRef.current) {
      glassesRef.current.rotation.z = THREE.MathUtils.lerp(glassesRef.current.rotation.z, 0, 0.1);
    }

    // 9. Natural Blinking
    const now = performance.now() * 0.001;
    const blinkCycle = (Math.sin(now * 0.5) + Math.sin(now * 1.3)) * 0.5;
    const isBlinking = blinkCycle > 0.92;
    if (leftEyeRef.current && rightEyeRef.current) {
      const scaleY = isBlinking ? 0.1 : 1.0;
      leftEyeRef.current.scale.y = scaleY;
      rightEyeRef.current.scale.y = scaleY;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 8]}>
      {/* Soft Feathered Contact Ambient Occlusion beneath shoes */}
      <mesh position={[0, 0.035, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.05, 1.05]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
          opacity={0.88}
        />
      </mesh>

      {/* Main Body Pivot (calibrated so soles firmly contact ground) */}
      <group ref={bodyRef} position={[0, 0.51, 0]}>
        {/* Torso Group (includes hoodie, pocket, drawstrings, head) */}
        <group ref={torsoRef}>
          {/* Torso: High-Fidelity Beveled Hoodie */}
          <RoundedBox
            args={[0.54, 0.62, 0.38]}
            radius={0.08}
            smoothness={4}
            castShadow
            position={[0, 0.32, 0]}
          >
            <meshStandardMaterial
              color="#4338ca"
              bumpMap={fabricBump}
              bumpScale={0.03}
              roughness={0.7}
              metalness={0.05}
            />
          </RoundedBox>

          {/* Kangaroo Hoodie Front Pocket */}
          <RoundedBox
            args={[0.38, 0.2, 0.08]}
            radius={0.03}
            smoothness={4}
            castShadow
            position={[0, 0.16, 0.17]}
          >
            <meshStandardMaterial color="#3730a3" roughness={0.75} />
          </RoundedBox>

          {/* Hoodie Drawstrings with Pendulum Physics */}
          <group ref={drawstringsRef} position={[0, 0.44, 0.2]}>
            <mesh position={[-0.07, -0.12, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
              <meshStandardMaterial color="#e0e7ff" />
            </mesh>
            <mesh position={[-0.07, -0.24, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.07, -0.1, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color="#e0e7ff" />
            </mesh>
            <mesh position={[0.07, -0.2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          {/* Head Group: Stylized, Beveled, Charming Proportions */}
          <group ref={headRef} position={[0, 0.86, 0]}>
            {/* Rounded Head */}
            <RoundedBox
              args={[0.44, 0.44, 0.42]}
              radius={0.09}
              smoothness={4}
              castShadow
              position={[0, 0, 0]}
            >
              <meshStandardMaterial color="#fcd34d" roughness={0.45} />
            </RoundedBox>

            {/* Cozy Ribbed Beanie */}
            <RoundedBox
              args={[0.47, 0.24, 0.46]}
              radius={0.08}
              smoothness={4}
              castShadow
              position={[0, 0.18, 0]}
            >
              <meshStandardMaterial color="#ea580c" roughness={0.65} />
            </RoundedBox>

            {/* Beanie Folded Rim */}
            <mesh position={[0, 0.08, 0]} castShadow>
              <torusGeometry args={[0.24, 0.035, 12, 24]} />
              <meshStandardMaterial color="#c2410c" roughness={0.7} />
            </mesh>

            {/* Beanie Fluffy Pom-Pom with Spring Dynamics */}
            <mesh ref={pomPomRef} position={[0, 0.34, -0.04]} castShadow>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>

            {/* Hair Tufts peeking under beanie */}
            <mesh position={[0, 0.06, 0.22]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.16, 0.06, 0.04]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>

            {/* Expressive Glossy Eyes with Highlights */}
            <group position={[0, 0.02, 0.22]}>
              {/* Left Eye */}
              <mesh ref={leftEyeRef} position={[-0.11, 0, 0]}>
                <sphereGeometry args={[0.048, 16, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} />
              </mesh>
              <mesh position={[-0.1, 0.02, 0.04]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>

              {/* Right Eye */}
              <mesh ref={rightEyeRef} position={[0.11, 0, 0]}>
                <sphereGeometry args={[0.048, 16, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} />
              </mesh>
              <mesh position={[0.12, 0.02, 0.04]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>

              {/* Glasses Group */}
              <group ref={glassesRef}>
                <mesh position={[-0.11, 0, 0.03]}>
                  <torusGeometry args={[0.07, 0.012, 8, 20]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0.11, 0, 0.03]}>
                  <torusGeometry args={[0.07, 0.012, 8, 20]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.01, 0.03]}>
                  <boxGeometry args={[0.09, 0.012, 0.01]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                </mesh>
              </group>

              {/* Cheerful Blush Cheeks */}
              <mesh position={[-0.16, -0.06, -0.01]}>
                <circleGeometry args={[0.035, 16]} />
                <meshBasicMaterial color="#f87171" transparent opacity={0.45} />
              </mesh>
              <mesh position={[0.16, -0.06, -0.01]}>
                <circleGeometry args={[0.035, 16]} />
                <meshBasicMaterial color="#f87171" transparent opacity={0.45} />
              </mesh>

              {/* Subtle Warm Smile */}
              <mesh position={[0, -0.07, 0.02]} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.035, 0.008, 6, 12, Math.PI * 0.7]} />
                <meshStandardMaterial color="#7c2d12" roughness={0.6} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Left Arm: Shoulder -> Upper Arm -> Forearm -> Hand */}
        <group ref={leftArmRef} position={[-0.34, 0.46, 0]}>
          {/* Upper Arm Sleeve */}
          <mesh castShadow position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.078, 0.072, 0.22, 16]} />
            <meshStandardMaterial color="#4338ca" roughness={0.7} />
          </mesh>

          {/* Elbow Joint */}
          <group ref={leftForearmRef} position={[0, -0.22, 0]}>
            {/* Forearm Sleeve */}
            <mesh castShadow position={[0, -0.09, 0]}>
              <cylinderGeometry args={[0.072, 0.066, 0.18, 16]} />
              <meshStandardMaterial color="#4338ca" roughness={0.7} />
            </mesh>

            {/* Hand with Cute Thumb */}
            <group position={[0, -0.20, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" roughness={0.45} />
              </mesh>
              <mesh position={[0.04, 0.01, 0.02]} rotation={[0, 0, -0.4]}>
                <capsuleGeometry args={[0.024, 0.05, 4, 8]} />
                <meshStandardMaterial color="#fcd34d" roughness={0.45} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right Arm: Shoulder -> Upper Arm -> Forearm -> Hand */}
        <group ref={rightArmRef} position={[0.34, 0.46, 0]}>
          {/* Upper Arm Sleeve */}
          <mesh castShadow position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.078, 0.072, 0.22, 16]} />
            <meshStandardMaterial color="#4338ca" roughness={0.7} />
          </mesh>

          {/* Elbow Joint */}
          <group ref={rightForearmRef} position={[0, -0.22, 0]}>
            {/* Forearm Sleeve */}
            <mesh castShadow position={[0, -0.09, 0]}>
              <cylinderGeometry args={[0.072, 0.066, 0.18, 16]} />
              <meshStandardMaterial color="#4338ca" roughness={0.7} />
            </mesh>

            {/* Hand with Cute Thumb */}
            <group position={[0, -0.20, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" roughness={0.45} />
              </mesh>
              <mesh position={[-0.04, 0.01, 0.02]} rotation={[0, 0, 0.4]}>
                <capsuleGeometry args={[0.024, 0.05, 4, 8]} />
                <meshStandardMaterial color="#fcd34d" roughness={0.45} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Left Leg: Hip -> Knee -> Foot */}
        <group ref={leftLegRef} position={[-0.16, -0.06, 0]}>
          {/* Thigh / Upper Jeans */}
          <mesh castShadow position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.088, 0.082, 0.22, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>

          {/* Knee Joint */}
          <group ref={leftKneeRef} position={[0, -0.22, 0]}>
            {/* Shin / Lower Jeans */}
            <mesh castShadow position={[0, -0.09, 0]}>
              <cylinderGeometry args={[0.082, 0.076, 0.18, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.85} />
            </mesh>

            {/* Cuffed Hem Ring */}
            <mesh position={[0, -0.17, 0]}>
              <torusGeometry args={[0.085, 0.018, 8, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.9} />
            </mesh>

            {/* Ankle / Chunky Sneaker */}
            <group ref={leftFootRef} position={[0, -0.18, 0.05]}>
              {/* Cushion Sole */}
              <RoundedBox args={[0.21, 0.09, 0.34]} radius={0.035} smoothness={4} castShadow>
                <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
              </RoundedBox>
              {/* Sneaker Upper Body */}
              <RoundedBox args={[0.19, 0.11, 0.30]} radius={0.03} smoothness={4} position={[0, 0.065, -0.01]} castShadow>
                <meshStandardMaterial color="#f97316" roughness={0.5} />
              </RoundedBox>
              {/* Sneaker White Toe Cap */}
              <mesh position={[0, 0.055, 0.11]} castShadow>
                <sphereGeometry args={[0.085, 12, 12]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              {/* Sneaker Tongue / Laces */}
              <mesh position={[0, 0.11, 0.02]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.11, 0.06, 0.12]} />
                <meshStandardMaterial color="#ea580c" roughness={0.6} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right Leg: Hip -> Knee -> Foot */}
        <group ref={rightLegRef} position={[0.16, -0.06, 0]}>
          {/* Thigh / Upper Jeans */}
          <mesh castShadow position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.088, 0.082, 0.22, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>

          {/* Knee Joint */}
          <group ref={rightKneeRef} position={[0, -0.22, 0]}>
            {/* Shin / Lower Jeans */}
            <mesh castShadow position={[0, -0.09, 0]}>
              <cylinderGeometry args={[0.082, 0.076, 0.18, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.85} />
            </mesh>

            {/* Cuffed Hem Ring */}
            <mesh position={[0, -0.17, 0]}>
              <torusGeometry args={[0.085, 0.018, 8, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.9} />
            </mesh>

            {/* Ankle / Chunky Sneaker */}
            <group ref={rightFootRef} position={[0, -0.18, 0.05]}>
              {/* Cushion Sole */}
              <RoundedBox args={[0.21, 0.09, 0.34]} radius={0.035} smoothness={4} castShadow>
                <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
              </RoundedBox>
              {/* Sneaker Upper Body */}
              <RoundedBox args={[0.19, 0.11, 0.30]} radius={0.03} smoothness={4} position={[0, 0.065, -0.01]} castShadow>
                <meshStandardMaterial color="#f97316" roughness={0.5} />
              </RoundedBox>
              {/* Sneaker White Toe Cap */}
              <mesh position={[0, 0.055, 0.11]} castShadow>
                <sphereGeometry args={[0.085, 12, 12]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              {/* Sneaker Tongue / Laces */}
              <mesh position={[0, 0.11, 0.02]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.11, 0.06, 0.12]} />
                <meshStandardMaterial color="#ea580c" roughness={0.6} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
