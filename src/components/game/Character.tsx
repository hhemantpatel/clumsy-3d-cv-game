import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';
import { useGame } from '../../context/GameContext';
import { soundManager } from '../../utils/audio';
import { CharacterModel } from './character/CharacterModel';
import { createCharacterRig, disposeCharacterRig } from './character/rig';
import {
  ARM_LAG_LAMBDA,
  BODY_PIVOT_Y,
  BROW_Y,
  EYE_SCALE,
  FACE_LAMBDA,
  FIDGET_LEN,
  FIDGET_PERIOD,
  FIDGET_START,
  GLASSES_LAMBDA,
  INSIDE_FLOOR_Y,
  LOOK_LAMBDA,
  PIVOT_TO_SOLE,
  POM_BASE,
  SETTLE_LAMBDA,
  SHADOW_LIFT,
  SHADOW_OPACITY,
  SLEEPY_START,
  WAVE_DURATION,
  ZONE_POSITIONS,
} from './character/constants';

/** Natural warm skin tone for face, ears and hands. */
const SKIN_TONE = '#e8b48c';

const { damp, lerp, clamp, smoothstep } = THREE.MathUtils;

const wrapAngle = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

interface CharacterProps {
  engine: PhysicsEngine | null;
}

/** Mutable per-instance animation state (never re-created, never triggers renders). */
const createAnimState = () => ({
  // Secondary spring physics for the beanie pom-pom
  pomPos: new THREE.Vector3(POM_BASE[0], POM_BASE[1], POM_BASE[2]),
  pomVel: new THREE.Vector3(),
  // Secondary pendulum physics for hoodie drawstrings
  strRx: 0,
  strRz: 0,
  strVx: 0,
  strVz: 0,
  lastStumbleSound: -Infinity,
  idle: 0,
  land: 0,
  hadZone: false,
  waveT: -1,
  lookYaw: 0,
  lookPitch: 0,
  // Smoothed facial expression channels
  smile: 0.35,
  mouthOpen: 0,
  mouthWidth: 1,
  brow: 0,
  browAngle: 0,
  eyeOpen: 1,
});

export const Character: React.FC<CharacterProps> = ({ engine }) => {
  const [rig] = useState(createCharacterRig);
  const [anim] = useState(createAnimState);

  useEffect(() => () => disposeCharacterRig(rig), [rig]);

  const { hasStarted, activeModal, setIsInsideHouse, setNearbyZone, moveInput, teleportTarget, clearTeleport } = useGame();

  const keysRef = useRef<{ [key: string]: boolean }>({});

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

  useFrame((state, delta) => {
    const group = rig.group.current;
    if (!engine || !group) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

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

    const hasZone = activeZone.length > 0;
    setIsInsideHouse(isInside);
    setNearbyZone(hasZone ? activeZone : null);

    // Synchronized footstep audio on exact heel strike from Rust engine
    if (footTrigger === 1) {
      soundManager.playStep(true);
    } else if (footTrigger === 2) {
      soundManager.playStep(false);
    }
    if (footTrigger !== 0) anim.land = 1;

    if (stumble > 0.7 && t - anim.lastStumbleSound > 0.5) {
      soundManager.playBump();
      anim.lastStumbleSound = t;
    }

    const moving = isWalking && speed > 0.12;
    const isSprinting = isRunning && speed > 2.5;

    // Idle timer (drives fidgets + sleepy face)
    if (moving || stumble > 0.05 || skid > 0.06) anim.idle = 0;
    else anim.idle += dt;

    // Wave when a zone becomes available (null -> zone)
    if (hasZone && !anim.hadZone) anim.waveT = 0;
    anim.hadZone = hasZone;
    if (anim.waveT >= 0) {
      anim.waveT += dt;
      if (anim.waveT > WAVE_DURATION) anim.waveT = -1;
    }

    // Idle fidget cycle: look around -> stretch -> yawn
    let fLook = 0;
    let fStretch = 0;
    let fYawn = 0;
    let fLocal = 0;
    if (!moving && anim.idle > FIDGET_START) {
      const ft = anim.idle - FIDGET_START;
      const slot = Math.floor(ft / FIDGET_PERIOD) % 3;
      fLocal = ft % FIDGET_PERIOD;
      const env = fLocal < FIDGET_LEN ? Math.sin((Math.PI * fLocal) / FIDGET_LEN) : 0;
      if (slot === 0) fLook = env;
      else if (slot === 1) fStretch = env;
      else fYawn = env;
    }

    const body = rig.body.current;
    const torso = rig.torso.current;
    const head = rig.head.current;
    const leftLeg = rig.leftLeg.current;
    const leftKnee = rig.leftKnee.current;
    const leftFoot = rig.leftFoot.current;
    const rightLeg = rig.rightLeg.current;
    const rightKnee = rig.rightKnee.current;
    const rightFoot = rig.rightFoot.current;
    const leftArm = rig.leftArm.current;
    const leftForearm = rig.leftForearm.current;
    const rightArm = rig.rightArm.current;
    const rightForearm = rig.rightForearm.current;
    const glasses = rig.glasses.current;

    // 1. Root Position & Rotation
    group.position.set(px, py, pz);
    group.rotation.y = rot;

    // Blob shadow stays glued to the floor (counteracts bob), shrinking/fading with height
    const shadow = rig.shadow.current;
    if (shadow) {
      const floorY = isInside ? INSIDE_FLOOR_Y : 0;
      const h = Math.max(0, py - floorY);
      const s = 1 / (1 + h * 1.6);
      shadow.position.y = floorY + SHADOW_LIFT - py;
      shadow.scale.setScalar(s);
      rig.shadowMaterial.opacity = SHADOW_OPACITY * s;
    }

    // 2. Pelvis & Torso Dynamics (Wobble, banking, forward lean) + landing squash & stretch
    anim.land *= Math.exp(-dt * 12);
    if (body) {
      body.rotation.z = wobbleX * 1.15;
      body.rotation.x = wobbleZ * 1.15 - fStretch * 0.12;
      const squash = anim.land * (isSprinting ? 0.07 : 0.045);
      const sy = 1 - squash;
      const sxz = 1 + squash * 0.5;
      body.scale.set(sxz, sy, sxz);
      // Squash from the soles so the feet stay planted
      body.position.y = BODY_PIVOT_Y - PIVOT_TO_SOLE * (1 - sy);
    }

    // 3. Head Kinematics: gaze (zone / camera / fidget), compensation, stumble recoil
    let lookYawT = 0;
    let lookPitchT = 0;
    const zonePos = hasZone ? ZONE_POSITIONS[activeZone] : undefined;
    if (zonePos) {
      const yaw = wrapAngle(Math.atan2(zonePos[0] - px, zonePos[1] - pz) - rot);
      lookYawT = clamp(yaw, -0.7, 0.7) * (moving ? 0.5 : 0.85);
    } else if (!moving) {
      const cam = state.camera.position;
      const dx = cam.x - px;
      const dz = cam.z - pz;
      const yaw = wrapAngle(Math.atan2(dx, dz) - rot);
      if (Math.abs(yaw) < 1.75) {
        lookYawT = clamp(yaw, -0.6, 0.6) * 0.7;
        lookPitchT = -clamp(Math.atan2(cam.y - (py + 1.45), Math.sqrt(dx * dx + dz * dz)), -0.35, 0.35) * 0.45;
      }
    }
    lookYawT += Math.sin(fLocal * 2.2) * 0.65 * fLook;
    lookPitchT += -0.28 * fYawn - 0.15 * fStretch;
    if (stumble > 0.05) {
      lookYawT = 0;
      lookPitchT = 0;
    }
    anim.lookYaw = damp(anim.lookYaw, lookYawT, LOOK_LAMBDA, dt);
    anim.lookPitch = damp(anim.lookPitch, lookPitchT, LOOK_LAMBDA, dt);

    if (head) {
      head.rotation.z = -wobbleX * 0.75;
      head.rotation.x = -wobbleZ * 0.5 + stumble * 0.38 - skid * 0.2 + anim.lookPitch;
      head.rotation.y = anim.lookYaw;
    }

    // 4. Secondary Spring Motion for Beanie Pom-Pom
    const pPos = anim.pomPos;
    const pVel = anim.pomVel;
    const targetPomX = POM_BASE[0] - wobbleX * 0.18;
    const targetPomY = POM_BASE[1] - py * 0.35;
    const targetPomZ = POM_BASE[2] - wobbleZ * 0.18;

    pVel.x += (targetPomX - pPos.x) * 130.0 * dt - pVel.x * 14.0 * dt;
    pVel.y += (targetPomY - pPos.y) * 130.0 * dt - pVel.y * 14.0 * dt;
    pVel.z += (targetPomZ - pPos.z) * 130.0 * dt - pVel.z * 14.0 * dt;
    pPos.addScaledVector(pVel, dt);
    rig.pomPom.current?.position.copy(pPos);

    // 5. Secondary Pendulum Sway for Hoodie Drawstrings
    const targetDx = -wobbleZ * 0.45 + (isRunning && speed > 2.0 ? -0.25 : -0.08);
    const targetDz = wobbleX * 0.35;
    anim.strVx += (targetDx - anim.strRx) * 65.0 * dt - anim.strVx * 8.5 * dt;
    anim.strVz += (targetDz - anim.strRz) * 65.0 * dt - anim.strVz * 8.5 * dt;
    anim.strRx += anim.strVx * dt;
    anim.strRz += anim.strVz * dt;

    const drawstrings = rig.drawstrings.current;
    if (drawstrings) {
      drawstrings.rotation.x = anim.strRx;
      drawstrings.rotation.z = anim.strRz;
    }

    // 6. Articulated Procedural Limb Kinematics
    // Arm conventions: left arm sits on -x, right arm on +x. Outward flare is
    // -z rotation for the left arm and +z for the right; elbow flexion (forearm
    // swinging forward) is negative x.
    if (moving) {
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

      if (leftLeg) {
        leftLeg.rotation.x = leftHipX;
        leftLeg.rotation.z = -0.05 + waddleRoll;
        leftLeg.rotation.y = -0.08; // toe out
      }
      if (leftKnee) leftKnee.rotation.x = leftKneeX;
      if (leftFoot) leftFoot.rotation.x = leftAnkleX;

      if (rightLeg) {
        rightLeg.rotation.x = rightHipX;
        rightLeg.rotation.z = 0.05 + waddleRoll;
        rightLeg.rotation.y = 0.08; // toe out
      }
      if (rightKnee) rightKnee.rotation.x = rightKneeX;
      if (rightFoot) rightFoot.rotation.x = rightAnkleX;

      // Arms: Swing opposite to legs (Left arm swings with Right leg), with a slight follow-through lag
      const armAmp = isSprinting ? 0.88 : 0.5;
      const leftArmX = Math.sin(rightPhase) * armAmp;
      const rightArmX = Math.sin(leftPhase) * armAmp;

      // Elbow Flexion: bends further when the arm swings forward
      const elbowBase = isSprinting ? 0.78 : 0.32;
      const leftElbowX = -(elbowBase + Math.max(0, -Math.sin(rightPhase)) * (isSprinting ? 0.72 : 0.5));
      const rightElbowX = -(elbowBase + Math.max(0, -Math.sin(leftPhase)) * (isSprinting ? 0.72 : 0.5));

      const armFlare = isSprinting ? 0.26 : 0.16;

      if (leftArm) {
        leftArm.rotation.x = damp(leftArm.rotation.x, leftArmX, ARM_LAG_LAMBDA, dt);
        leftArm.rotation.z = -(armFlare + Math.abs(Math.sin(rightPhase)) * 0.09);
      }
      if (leftForearm) leftForearm.rotation.x = damp(leftForearm.rotation.x, leftElbowX, ARM_LAG_LAMBDA, dt);

      if (rightArm) {
        rightArm.rotation.x = damp(rightArm.rotation.x, rightArmX, ARM_LAG_LAMBDA, dt);
        rightArm.rotation.z = armFlare + Math.abs(Math.sin(leftPhase)) * 0.09;
      }
      if (rightForearm) rightForearm.rotation.x = damp(rightForearm.rotation.x, rightElbowX, ARM_LAG_LAMBDA, dt);

      // Torso Counter-Torsion
      if (torso) torso.rotation.y = -Math.sin(walkCycle) * (isSprinting ? 0.15 : 0.1);
    } else {
      // Idle Breathing & Natural Settling Stance (+ fidget poses blended in)
      const breath = Math.sin(t * 2.2 * 2.2);
      const k = SETTLE_LAMBDA;

      if (leftLeg) {
        leftLeg.rotation.x = damp(leftLeg.rotation.x, 0, k, dt);
        leftLeg.rotation.z = damp(leftLeg.rotation.z, -0.04, k, dt);
        leftLeg.rotation.y = -0.06;
      }
      if (leftKnee) leftKnee.rotation.x = damp(leftKnee.rotation.x, 0.04, k, dt);
      if (leftFoot) leftFoot.rotation.x = damp(leftFoot.rotation.x, 0, k, dt);

      if (rightLeg) {
        rightLeg.rotation.x = damp(rightLeg.rotation.x, 0, k, dt);
        rightLeg.rotation.z = damp(rightLeg.rotation.z, 0.04, k, dt);
        rightLeg.rotation.y = 0.06;
      }
      if (rightKnee) rightKnee.rotation.x = damp(rightKnee.rotation.x, 0.04, k, dt);
      if (rightFoot) rightFoot.rotation.x = damp(rightFoot.rotation.x, 0, k, dt);

      // Stretch: arms overhead; yawn: arms open a little
      const armUp = fStretch * 2.75 + fYawn * 0.45;
      const elbowRelax = 1 - fStretch;

      if (leftArm) {
        leftArm.rotation.x = damp(leftArm.rotation.x, breath * 0.04 * elbowRelax, k, dt);
        leftArm.rotation.z = damp(leftArm.rotation.z, -(0.09 + breath * 0.02) - armUp, k, dt);
      }
      if (leftForearm) leftForearm.rotation.x = damp(leftForearm.rotation.x, -0.15 * elbowRelax, k, dt);

      if (rightArm) {
        rightArm.rotation.x = damp(rightArm.rotation.x, -breath * 0.04 * elbowRelax, k, dt);
        rightArm.rotation.z = damp(rightArm.rotation.z, 0.09 + breath * 0.02 + armUp, k, dt);
      }
      if (rightForearm) rightForearm.rotation.x = damp(rightForearm.rotation.x, -0.15 * elbowRelax, k, dt);

      if (torso) torso.rotation.y = damp(torso.rotation.y, 0, k, dt);
    }

    // 7. Comedic Skid / Brake Reaction
    if (skid > 0.06) {
      if (body) body.rotation.x -= skid * 0.3;
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = -0.32 * skid;
        rightLeg.rotation.x = -0.22 * skid;
      }
      if (leftFoot && rightFoot) {
        leftFoot.rotation.x = 0.32 * skid;
        rightFoot.rotation.x = 0.32 * skid;
      }
      if (leftArm && rightArm) {
        leftArm.rotation.x -= skid * 0.55;
        rightArm.rotation.x -= skid * 0.55;
        leftArm.rotation.z -= skid * 0.28;
        rightArm.rotation.z += skid * 0.28;
      }
    }

    // 7b. Friendly wave (right arm) when arriving at an interaction zone
    if (rightForearm) rightForearm.rotation.z = 0;
    if (anim.waveT >= 0 && rightArm && rightForearm) {
      const wt = anim.waveT;
      const w = smoothstep(wt, 0, 0.18) * (1 - smoothstep(wt, WAVE_DURATION - 0.25, WAVE_DURATION));
      rightArm.rotation.z = lerp(rightArm.rotation.z, 2.55, w);
      rightArm.rotation.x = lerp(rightArm.rotation.x, -0.25, w);
      rightForearm.rotation.x = lerp(rightForearm.rotation.x, -0.3, w);
      rightForearm.rotation.z = w * Math.sin(wt * 16) * 0.5;
    }

    // 8. Comedic Stumble / Wall Impact Reaction
    if (stumble > 0.05) {
      const flailTime = t * 25;
      const sMix = Math.min(1, stumble * 5);
      if (leftArm) {
        leftArm.rotation.x = Math.sin(flailTime) * 1.3 * stumble;
        leftArm.rotation.z = -(0.55 * sMix + Math.cos(flailTime) * 0.45 * stumble);
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.sin(flailTime) * 1.3 * stumble;
        rightArm.rotation.z = 0.55 * sMix + Math.cos(flailTime) * 0.45 * stumble;
      }
      if (head) {
        head.rotation.x = Math.sin(flailTime * 0.8) * 0.35 * stumble;
        // Added on top of the (re-assigned every frame) gaze yaw, so it always settles back
        head.rotation.y = anim.lookYaw + Math.cos(flailTime * 0.5) * 0.4 * stumble;
      }
      if (glasses) glasses.rotation.z = Math.sin(flailTime * 0.6) * 0.16 * stumble;
    } else if (glasses) {
      glasses.rotation.z = damp(glasses.rotation.z, 0, GLASSES_LAMBDA, dt);
    }

    // 9. Facial expression targets
    let smileT = 0.35;
    let openT = 0;
    let widthT = 1;
    let browT = 0;
    let browAngleT = 0;
    let eyeOpenT = 1;
    if (hasZone) {
      // Happy
      smileT = 1;
      browT = 0.35;
      eyeOpenT = 0.82;
      widthT = 1.15;
    } else if (moving && isRunning && speed > 2.0) {
      // Determined
      smileT = 0.1;
      browT = -0.45;
      browAngleT = 1;
      widthT = 0.75;
    } else if (anim.idle > SLEEPY_START) {
      // Sleepy squint
      smileT = 0.2;
      browT = -0.35;
      eyeOpenT = 0.42;
    }
    if (anim.waveT >= 0) smileT = 1.1;
    if (fYawn > 0) {
      openT = Math.max(openT, fYawn);
      widthT = lerp(widthT, 0.75, fYawn);
      browT = lerp(browT, 0.6, fYawn);
      eyeOpenT = lerp(eyeOpenT, 0.12, fYawn);
    }
    if (fStretch > 0) {
      openT = Math.max(openT, 0.3 * fStretch);
      eyeOpenT = lerp(eyeOpenT, 0.2, fStretch);
    }
    if (stumble > 0.05) {
      // Surprised "O"
      const s = Math.min(1, stumble * 1.6);
      openT = lerp(openT, 0.75, s);
      widthT = lerp(widthT, 0.6, s);
      browT = lerp(browT, 1, s);
      browAngleT = lerp(browAngleT, -0.6, s);
      eyeOpenT = lerp(eyeOpenT, 1.2, s);
    }

    anim.smile = damp(anim.smile, smileT, FACE_LAMBDA, dt);
    anim.mouthOpen = damp(anim.mouthOpen, openT, FACE_LAMBDA, dt);
    anim.mouthWidth = damp(anim.mouthWidth, widthT, FACE_LAMBDA, dt);
    anim.brow = damp(anim.brow, browT, FACE_LAMBDA, dt);
    anim.browAngle = damp(anim.browAngle, browAngleT, FACE_LAMBDA, dt);
    anim.eyeOpen = damp(anim.eyeOpen, eyeOpenT, FACE_LAMBDA, dt);

    // Eyes: expression openness x natural blink. Highlights are children of the
    // eyes (so they squash with them) and are hidden when nearly closed.
    const blinkCycle = (Math.sin(t * 0.5) + Math.sin(t * 1.3)) * 0.5;
    const isBlinking = blinkCycle > 0.92;
    const open = Math.max(0.06, anim.eyeOpen * (isBlinking ? 0.1 : 1));
    const leftEye = rig.leftEye.current;
    const rightEye = rig.rightEye.current;
    if (leftEye && rightEye) {
      leftEye.scale.y = EYE_SCALE[1] * open;
      rightEye.scale.y = EYE_SCALE[1] * open;
    }
    const highlightsVisible = open > 0.35;
    if (rig.leftHighlight.current) rig.leftHighlight.current.visible = highlightsVisible;
    if (rig.rightHighlight.current) rig.rightHighlight.current.visible = highlightsVisible;

    // Brows: raise/lower + tilt (positive browAngle = determined, inner ends down)
    const leftBrow = rig.leftBrow.current;
    const rightBrow = rig.rightBrow.current;
    if (leftBrow && rightBrow) {
      const by = BROW_Y + anim.brow * 0.016;
      const tilt = -anim.browAngle * 0.38 + Math.max(0, anim.brow) * 0.08;
      leftBrow.position.y = by;
      rightBrow.position.y = by;
      leftBrow.rotation.z = tilt;
      rightBrow.rotation.z = -tilt;
    }

    // Mouth: arc (flat line -> grin) or open ellipse ("O" / yawn)
    const mouthArc = rig.mouthArc.current;
    const mouthOpenMesh = rig.mouthOpen.current;
    const isOpen = anim.mouthOpen > 0.12;
    if (mouthArc) {
      mouthArc.visible = !isOpen;
      mouthArc.scale.set(anim.mouthWidth, 0.15 + anim.smile * 0.85, 1);
    }
    if (mouthOpenMesh) {
      mouthOpenMesh.visible = isOpen;
      mouthOpenMesh.scale.set(0.15 + 0.55 * anim.mouthWidth, 0.2 + Math.min(anim.mouthOpen, 1) * 0.6, 0.35);
    }
  });

  return <CharacterModel rig={rig} skinTone={SKIN_TONE} />;
};
