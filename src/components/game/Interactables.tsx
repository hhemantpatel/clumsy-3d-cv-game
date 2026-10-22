import React from 'react';
import { FLOOR_Y } from './props/kit';
import { ZonePrompt } from './props/ZonePrompt';
import { Desk } from './props/Desk';
import { Bookcase } from './props/Bookcase';
import { Certificates } from './props/Certificates';
import { Bed } from './props/Bed';
import { Mailbox, Bench } from './props/YardProps';
import { PhysicsEngine } from '../../wasm/pkg/game_engine_wasm';

interface InteractablesProps {
  engine?: PhysicsEngine | null;
}

/**
 * CV interaction props. Group origins match the Rust engine's colliders / trigger zones.
 * Signs only appear when the player is nearby AND looking directly toward the prop.
 */
export const Interactables: React.FC<InteractablesProps> = ({ engine }) => {
  return (
    <group>
      {/* Projects desk — collider x -5.4..-3.0, z -9.4..-7.6 */}
      <group position={[-4.2, FLOOR_Y, -8.5]}>
        <Desk />
        <ZonePrompt
          zone="projects"
          icon="💻"
          label="Projects"
          position={[0, 2.2, 0]}
          engine={engine}
          groundRadius={1.1}
        />
      </group>

      {/* Skills bookcase — collider x -6.2..-5.0, z -5.6..-3.4 (back against the left wall) */}
      <group position={[-6.1, FLOOR_Y, -4.5]}>
        <Bookcase />
        <ZonePrompt
          zone="skills"
          icon="⚡"
          label="Skills"
          position={[0.6, 3.2, 0]}
          engine={engine}
          groundRadius={1.0}
          groundOffset={[0.6, 0, 0]}
        />
      </group>

      {/* Experience / certificates console — collider x 3.2..5.8, z -10.2..-9.2 */}
      <group position={[4.5, FLOOR_Y, -9.8]}>
        <Certificates />
        <ZonePrompt
          zone="experience"
          icon="🏆"
          label="Experience"
          position={[0, 2.8, 0.2]}
          engine={engine}
          groundRadius={1.1}
          groundOffset={[0, 0, 0.4]}
        />
      </group>

      {/* Bed + sleeping cat — collider x 2.8..5.8, z -5.2..-2.4 */}
      <group position={[4.2, FLOOR_Y, -3.8]}>
        <Bed />
        <ZonePrompt
          zone="bed"
          icon="🐱"
          label="Pet Byte"
          position={[0, 1.9, 0.6]}
          engine={engine}
          groundRadius={1.1}
          groundOffset={[0, 0, 0.6]}
        />
      </group>

      {/* Mailbox — collider x 1.2..2.0, z 10.4..11.2 */}
      <group position={[1.6, 0, 10.8]}>
        <Mailbox />
        <ZonePrompt
          zone="contact"
          icon="📫"
          label="Post & Mail"
          position={[0, 2.0, 0]}
          engine={engine}
          groundRadius={0.9}
        />
      </group>

      {/* Garden bench — collider x -8.8..-6.2, z 3.8..5.2 */}
      <group position={[-7.5, 0, 4.5]} rotation={[0, Math.PI / 4, 0]}>
        <Bench />
        <ZonePrompt
          zone="about"
          icon="☕"
          label="About Me"
          position={[0, 1.7, 0]}
          engine={engine}
          groundRadius={1.0}
        />
      </group>
    </group>
  );
};
