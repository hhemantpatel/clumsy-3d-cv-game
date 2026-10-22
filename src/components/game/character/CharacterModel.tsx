// Static scene graph of the stylised player character. All geometries and
// materials are shared module-level resources; every animated node is exposed
// through the `rig` refs. Props are stable, so this subtree renders once.
import React, { memo, RefObject } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { CharacterRig } from './rig';
import { getCharacterGeometries } from './geometries';
import { getCharacterMaterials, OUTLINE_COLOR, OUTLINE_THICKNESS, CURRENT_CHARACTER_STYLE } from './materials';
import { BODY_PIVOT_Y, BROW_Y, EYE_SCALE, EYE_X, EYE_Y, MOUTH_Y, POM_BASE, SHADOW_LIFT } from './constants';

// In 'toy' mode, the character is a tactile miniature figurine, so 2D cartoon outlines are omitted.
// In 'toon' mode, outlines provide the illustrated cel-shaded cartoon aesthetic.
const Outline: React.FC = () => {
  if (CURRENT_CHARACTER_STYLE === 'toy') return null;
  return <Outlines screenspace thickness={OUTLINE_THICKNESS} color={OUTLINE_COLOR} angle={0} />;
};

interface ArmProps {
  side: 1 | -1;
  armRef: RefObject<THREE.Group>;
  forearmRef: RefObject<THREE.Group>;
  skinTone: string;
}

const Arm: React.FC<ArmProps> = ({ side, armRef, forearmRef, skinTone }) => {
  const g = getCharacterGeometries();
  const m = getCharacterMaterials(skinTone);
  return (
    <group ref={armRef} position={[side * 0.34, 0.46, 0]}>
      {/* Upper sleeve */}
      <mesh geometry={g.upperArm} material={m.hoodie} position={[0, -0.11, 0]}>
        <Outline />
      </mesh>
      {/* Elbow */}
      <group ref={forearmRef} position={[0, -0.22, 0]}>
        <mesh geometry={g.forearm} material={m.hoodie} position={[0, -0.08, 0]}>
          <Outline />
        </mesh>
        {/* Ribbed sleeve cuff */}
        <mesh geometry={g.cuff} material={m.hoodieDark} position={[0, -0.165, 0]} />
        {/* Hand + thumb (merged) */}
        <mesh geometry={side === 1 ? g.handRight : g.handLeft} material={m.skin} position={[0, -0.215, 0]}>
          <Outline />
        </mesh>
      </group>
    </group>
  );
};

interface LegProps {
  side: 1 | -1;
  legRef: RefObject<THREE.Group>;
  kneeRef: RefObject<THREE.Group>;
  footRef: RefObject<THREE.Group>;
  skinTone: string;
}

const Leg: React.FC<LegProps> = ({ side, legRef, kneeRef, footRef, skinTone }) => {
  const g = getCharacterGeometries();
  const m = getCharacterMaterials(skinTone);
  return (
    <group ref={legRef} position={[side * 0.15, -0.06, 0]}>
      {/* Thigh (tapered jeans) */}
      <mesh geometry={g.thigh} material={m.jeans} position={[0, -0.11, 0]} castShadow>
        <Outline />
      </mesh>
      {/* Knee */}
      <group ref={kneeRef} position={[0, -0.22, 0]}>
        <mesh geometry={g.shin} material={m.jeans} position={[0, -0.09, 0]} castShadow>
          <Outline />
        </mesh>
        {/* Rolled denim hem */}
        <mesh geometry={g.hem} material={m.jeansLight} position={[0, -0.16, 0]} />
        {/* Ankle -> chunky sneaker */}
        <group ref={footRef} position={[0, -0.18, 0.04]}>
          {/* White sole + toe cap + laces (merged) */}
          <mesh geometry={g.shoeWhite} material={m.shoe} castShadow>
            <Outline />
          </mesh>
          {/* Coloured upper */}
          <mesh geometry={g.shoeUpper} material={m.accent} position={[0, 0.07, -0.015]} castShadow>
            <Outline />
          </mesh>
        </group>
      </group>
    </group>
  );
};

interface CharacterModelProps {
  rig: CharacterRig;
  skinTone: string;
}

export const CharacterModel: React.FC<CharacterModelProps> = memo(({ rig, skinTone }) => {
  const g = getCharacterGeometries();
  const m = getCharacterMaterials(skinTone);

  return (
    <group ref={rig.group} position={[0, 0, 8]}>
      {/* Soft blob contact shadow (kept on the floor by the animation loop) */}
      <mesh ref={rig.shadow} geometry={g.shadow} material={rig.shadowMaterial} position={[0, SHADOW_LIFT, 0.02]} />

      {/* Main body pivot */}
      <group ref={rig.body} position={[0, BODY_PIVOT_Y, 0]}>
        <group ref={rig.torso}>
          {/* Hoodie torso */}
          <mesh geometry={g.torso} material={m.hoodie} position={[0, 0.32, 0]} castShadow>
            <Outline />
          </mesh>
          {/* Ribbed waistband */}
          <mesh geometry={g.waistband} material={m.hoodieDark} position={[0, 0.045, 0]} />
          {/* Kangaroo pocket */}
          <mesh geometry={g.pocket} material={m.hoodieDark} position={[0, 0.17, 0.18]} />
          {/* Hood bunched behind the neck + collar ring */}
          <mesh geometry={g.hood} material={m.hoodie} position={[0, 0.6, -0.15]} rotation={[0.25, 0, 0]}>
            <Outline />
          </mesh>
          <mesh geometry={g.collar} material={m.hoodieDark} position={[0, 0.625, 0]} scale={[1, 1, 0.9]} />

          {/* Drawstrings with pendulum physics */}
          <group ref={rig.drawstrings} position={[0, 0.59, 0.2]}>
            <mesh geometry={g.strings} material={m.shoe} />
            <mesh geometry={g.aglets} material={m.aglet} />
          </group>

          {/* Head */}
          <group ref={rig.head} position={[0, 0.86, 0]}>
            <mesh geometry={g.head} material={m.skin} castShadow>
              <Outline />
            </mesh>
            <mesh geometry={g.ears} material={m.skin} />
            <mesh geometry={g.hair} material={m.hair} />

            {/* Beanie */}
            <mesh geometry={g.beanie} material={m.accent} position={[0, 0.225, 0]} castShadow>
              <Outline />
            </mesh>
            <mesh geometry={g.beanieRim} material={m.accentDark} position={[0, 0.125, 0]}>
              <Outline />
            </mesh>
            <mesh ref={rig.pomPom} geometry={g.pomPom} material={m.pomPom} position={POM_BASE}>
              <Outline />
            </mesh>

            {/* Eyes (highlights are children so they squash with blinks) */}
            <mesh ref={rig.leftEye} geometry={g.eye} material={m.eye} position={[-EYE_X, EYE_Y, 0.2]} scale={EYE_SCALE}>
              <mesh ref={rig.leftHighlight} geometry={g.eyeHighlight} material={m.eyeHighlight} position={[0.013, 0.016, 0.034]} />
            </mesh>
            <mesh ref={rig.rightEye} geometry={g.eye} material={m.eye} position={[EYE_X, EYE_Y, 0.2]} scale={EYE_SCALE}>
              <mesh ref={rig.rightHighlight} geometry={g.eyeHighlight} material={m.eyeHighlight} position={[0.013, 0.016, 0.034]} />
            </mesh>

            {/* Eyebrows */}
            <mesh ref={rig.leftBrow} geometry={g.brow} material={m.hair} position={[-EYE_X, BROW_Y, 0.222]} />
            <mesh ref={rig.rightBrow} geometry={g.brow} material={m.hair} position={[EYE_X, BROW_Y, 0.222]} />

            {/* Nose bump */}
            <mesh geometry={g.nose} material={m.skin} position={[0, -0.065, 0.212]} />

            {/* Mouth: smile arc + open "O" mouth */}
            <mesh ref={rig.mouthArc} geometry={g.mouthArc} material={m.mouth} position={[0, MOUTH_Y, 0.212]} />
            <mesh
              ref={rig.mouthOpen}
              geometry={g.mouthOpen}
              material={m.mouthInner}
              position={[0, MOUTH_Y - 0.02, 0.205]}
              scale={[0.7, 0.2, 0.35]}
              visible={false}
            />

            {/* Blush (volumetric, slightly embedded -> no z-fighting) */}
            <mesh geometry={g.cheeks} material={m.cheek} position={[0, -0.095, 0.2]} />

            {/* Glasses */}
            <group ref={rig.glasses} position={[0, EYE_Y, 0.232]}>
              <mesh geometry={g.glasses} material={m.glasses} />
            </group>
          </group>
        </group>

        <Arm side={-1} armRef={rig.leftArm} forearmRef={rig.leftForearm} skinTone={skinTone} />
        <Arm side={1} armRef={rig.rightArm} forearmRef={rig.rightForearm} skinTone={skinTone} />
        <Leg side={-1} legRef={rig.leftLeg} kneeRef={rig.leftKnee} footRef={rig.leftFoot} skinTone={skinTone} />
        <Leg side={1} legRef={rig.rightLeg} kneeRef={rig.rightKnee} footRef={rig.rightFoot} skinTone={skinTone} />
      </group>
    </group>
  );
});

CharacterModel.displayName = 'CharacterModel';
