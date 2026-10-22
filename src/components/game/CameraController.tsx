import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';
import { useGame } from '../../context/GameContext';

// Reusable module-level scratch objects to guarantee ZERO heap allocations in useFrame
const GARDEN_TARGET = new THREE.Vector3(6.8, 0.45, 5.2);
const _charTarget = new THREE.Vector3();

interface CameraControllerProps {
  engine: PhysicsEngine | null;
}

/**
 * Standard 3D Third-Person Follow Camera.
 * Always sits behind the player's back and smoothly turns with the player as they turn.
 * Allows free manual orbit via mouse drag and zoom via scroll wheel, with smooth auto-realign behind the character when moving.
 */
const DIORAMA_RADIUS = 9.2;
const DIORAMA_PHI = Math.PI / 2.7; // ~66.7° elevated tabletop diorama angle

export const CameraController: React.FC<CameraControllerProps> = ({ engine }) => {
  const { camera, gl } = useThree();
  const { activeModal, hasStarted } = useGame();

  const orbitState = useRef({
    radius: DIORAMA_RADIUS,
    targetRadius: DIORAMA_RADIUS,
    theta: 0, // Current world azimuth
    userYawOffset: 0, // Manual user orbit offset from player back
    phi: DIORAMA_PHI,
    targetPhi: DIORAMA_PHI,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    targetPos: new THREE.Vector3(0, 1.2, 8),
  });

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      // Don't drag if modal is open (except badminton garden window) or clicking UI buttons
      if (
        (activeModal && activeModal !== 'badminton') ||
        (e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('.garden-window-drag')
      ) {
        return;
      }
      orbitState.current.isDragging = true;
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!orbitState.current.isDragging) return;

      const dx = e.clientX - orbitState.current.lastMouseX;
      const dy = e.clientY - orbitState.current.lastMouseY;

      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;

      const rotSpeed = 0.0025;
      orbitState.current.userYawOffset -= dx * rotSpeed;
      orbitState.current.targetPhi = THREE.MathUtils.clamp(
        orbitState.current.targetPhi - dy * rotSpeed,
        0.12, // Don't flip over top
        Math.PI / 2.08 // Don't dip beneath ground
      );
    };

    const handlePointerUp = () => {
      orbitState.current.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      if (activeModal && activeModal !== 'badminton') return;
      e.preventDefault();
      const zoomSpeed = 0.006;
      orbitState.current.targetRadius = THREE.MathUtils.clamp(
        orbitState.current.targetRadius + e.deltaY * zoomSpeed,
        3.5, // Close inspection zoom
        18.0 // Wide yard bird's-eye zoom
      );
    };

    // 'R' key resets camera directly behind player's back
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'r' || e.key === 'R') {
        orbitState.current.userYawOffset = 0;
        orbitState.current.targetRadius = DIORAMA_RADIUS;
        orbitState.current.targetPhi = DIORAMA_PHI;
      }
    };

    // Double-click canvas to reset camera behind player
    const handleDblClick = () => {
      orbitState.current.userYawOffset = 0;
      orbitState.current.targetRadius = DIORAMA_RADIUS;
      orbitState.current.targetPhi = DIORAMA_PHI;
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    const handleResetEvent = () => {
      orbitState.current.userYawOffset = 0;
      orbitState.current.targetRadius = DIORAMA_RADIUS;
      orbitState.current.targetPhi = DIORAMA_PHI;
    };

    window.addEventListener('reset-camera', handleResetEvent);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('dblclick', handleDblClick);

    return () => {
      window.removeEventListener('reset-camera', handleResetEvent);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('dblclick', handleDblClick);
    };
  }, [gl, activeModal]);

  useFrame((_, delta) => {
    if (!engine) return;

    const state = orbitState.current;

    if (activeModal === 'badminton') {
      // Smoothly focus camera on the 3D Automaton Garden bed
      // If camera was far away (e.g. inside cottage), transition cleanly to the garden yard
      if (state.targetPos.distanceTo(GARDEN_TARGET) > 4.0) {
        state.targetPos.copy(GARDEN_TARGET);
        state.theta = -Math.PI * 0.68;
        state.phi = Math.PI / 3.2;
        state.radius = 6.5;
        state.targetRadius = 6.5;
        state.targetPhi = Math.PI / 3.2;
      } else {
        state.targetPos.lerp(GARDEN_TARGET, delta * 6.0);
      }

      const idealGardenTheta = -Math.PI * 0.68 + state.userYawOffset;
      let diff = idealGardenTheta - state.theta;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      if (state.isDragging) {
        state.theta += diff;
      } else {
        state.targetPhi = THREE.MathUtils.lerp(state.targetPhi, Math.PI / 3.2, delta * 5.0);
        state.targetRadius = THREE.MathUtils.lerp(state.targetRadius, 6.5, delta * 5.0);
        state.theta += diff * Math.min(delta * 4.0, 1.0);
      }
    } else {
      // Smoothly track character's position
      const px = engine.get_player_x();
      const py = engine.get_player_y();
      const pz = engine.get_player_z();
      const rot = engine.get_player_rotation();
      const isWalking = engine.is_walking();
      const speed = engine.get_player_speed();

      _charTarget.set(px, py + 1.25, pz);
      if (state.targetPos.distanceTo(_charTarget) > 3.5) {
        state.targetPos.copy(_charTarget);
        state.theta = rot - Math.PI;
      } else {
        state.targetPos.lerp(_charTarget, delta * 6.0);
      }

      // Ideal camera angle directly behind the player's back
      const idealBehindTheta = rot - Math.PI;

      // When game hasn't started yet, gently sway in a bounded cinematic establishing shot
      if (!hasStarted && !state.isDragging) {
        // Smooth bounded sway (+/- 14°) keeping the yard, cottage, and character always in beautiful view (never rotating into walls)
        const t = performance.now() * 0.001;
        state.userYawOffset = Math.sin(t * 0.28) * 0.24;
      } else if (isWalking && speed > 0.15 && !state.isDragging) {
        // When walking and not actively dragging, gently realign manual offset back to behind the player
        state.userYawOffset = THREE.MathUtils.lerp(state.userYawOffset, 0, delta * 1.2);
      }

      // Target azimuth is behind the player + any manual user offset
      const targetTheta = idealBehindTheta + state.userYawOffset;

      // Shortest-arc angular difference to prevent 360° spinning
      let diff = targetTheta - state.theta;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Camera smoothly turns: immediate 1:1 response during manual drag, smooth follow when moving
      if (state.isDragging) {
        state.theta += diff;
      } else {
        const turnFollowSpeed = isWalking ? 3.8 : 2.6;
        state.theta += diff * Math.min(delta * turnFollowSpeed, 1.0);
      }
    }

    state.phi = THREE.MathUtils.lerp(state.phi, state.targetPhi, delta * 8.0);
    state.radius = THREE.MathUtils.lerp(state.radius, state.targetRadius, delta * 6.0);

    // Convert spherical coordinates to Cartesian camera position
    const sinPhi = Math.sin(state.phi);
    const cosPhi = Math.cos(state.phi);
    const sinTheta = Math.sin(state.theta);
    const cosTheta = Math.cos(state.theta);

    const camX = state.targetPos.x + state.radius * sinPhi * sinTheta;
    const camY = state.targetPos.y + state.radius * cosPhi;
    const camZ = state.targetPos.z + state.radius * sinPhi * cosTheta;

    camera.position.set(camX, camY, camZ);
    camera.lookAt(state.targetPos);

    (window as any).__camera = camera;
    (window as any).__cameraState = state;
  });

  return null;
};
