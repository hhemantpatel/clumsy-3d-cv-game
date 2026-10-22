// Stable bag of object refs for every animated node of the character.
// Created once per Character instance (via useState lazy init) and handed to
// the static <CharacterModel/> so the model subtree never re-renders.
import { createRef, RefObject } from 'react';
import * as THREE from 'three';
import { textureGen } from '../../../utils/textures';

export interface CharacterRig {
  group: RefObject<THREE.Group>;
  body: RefObject<THREE.Group>;
  torso: RefObject<THREE.Group>;
  head: RefObject<THREE.Group>;
  pomPom: RefObject<THREE.Mesh>;
  drawstrings: RefObject<THREE.Group>;
  glasses: RefObject<THREE.Group>;

  leftLeg: RefObject<THREE.Group>;
  leftKnee: RefObject<THREE.Group>;
  leftFoot: RefObject<THREE.Group>;
  rightLeg: RefObject<THREE.Group>;
  rightKnee: RefObject<THREE.Group>;
  rightFoot: RefObject<THREE.Group>;

  leftArm: RefObject<THREE.Group>;
  leftForearm: RefObject<THREE.Group>;
  rightArm: RefObject<THREE.Group>;
  rightForearm: RefObject<THREE.Group>;

  leftEye: RefObject<THREE.Mesh>;
  rightEye: RefObject<THREE.Mesh>;
  leftHighlight: RefObject<THREE.Mesh>;
  rightHighlight: RefObject<THREE.Mesh>;
  leftBrow: RefObject<THREE.Mesh>;
  rightBrow: RefObject<THREE.Mesh>;
  mouthArc: RefObject<THREE.Mesh>;
  mouthOpen: RefObject<THREE.Mesh>;

  shadow: RefObject<THREE.Mesh>;
  /** Per-instance (opacity is animated with jump/bob height). */
  shadowMaterial: THREE.MeshBasicMaterial;
}

export function createCharacterRig(): CharacterRig {
  return {
    group: createRef<THREE.Group>(),
    body: createRef<THREE.Group>(),
    torso: createRef<THREE.Group>(),
    head: createRef<THREE.Group>(),
    pomPom: createRef<THREE.Mesh>(),
    drawstrings: createRef<THREE.Group>(),
    glasses: createRef<THREE.Group>(),
    leftLeg: createRef<THREE.Group>(),
    leftKnee: createRef<THREE.Group>(),
    leftFoot: createRef<THREE.Group>(),
    rightLeg: createRef<THREE.Group>(),
    rightKnee: createRef<THREE.Group>(),
    rightFoot: createRef<THREE.Group>(),
    leftArm: createRef<THREE.Group>(),
    leftForearm: createRef<THREE.Group>(),
    rightArm: createRef<THREE.Group>(),
    rightForearm: createRef<THREE.Group>(),
    leftEye: createRef<THREE.Mesh>(),
    rightEye: createRef<THREE.Mesh>(),
    leftHighlight: createRef<THREE.Mesh>(),
    rightHighlight: createRef<THREE.Mesh>(),
    leftBrow: createRef<THREE.Mesh>(),
    rightBrow: createRef<THREE.Mesh>(),
    mouthArc: createRef<THREE.Mesh>(),
    mouthOpen: createRef<THREE.Mesh>(),
    shadow: createRef<THREE.Mesh>(),
    shadowMaterial: new THREE.MeshBasicMaterial({
      map: textureGen.getSoftContactShadow(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      opacity: 0.88,
    }),
  };
}

export function disposeCharacterRig(rig: CharacterRig): void {
  rig.shadowMaterial.dispose();
}
