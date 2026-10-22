import React from 'react';
import { FLOOR_Y } from './props/kit';
import { ZonePrompt } from './props/ZonePrompt';
import { Desk } from './props/Desk';
import { Bookcase } from './props/Bookcase';
import { Certificates } from './props/Certificates';
import { Bed } from './props/Bed';
import { Mailbox, Bench } from './props/YardProps';

/**
 * CV interaction props. Group origins match the Rust engine's colliders / trigger zones
 * (crates/game_engine_wasm/src/lib.rs) — keep them in sync if anything moves.
 *
 * No point lights live here: screens, lamps and crystals are emissive (toneMapped=false) and are
 * picked up by the Bloom pass. The house provides the only two interior point lights.
 */
export const Interactables: React.FC = () => {
  return (
    <group>
      {/* Projects desk — collider x -5.4..-3.0, z -9.4..-7.6 */}
      <group position={[-4.2, FLOOR_Y, -8.5]}>
        <Desk />
        <ZonePrompt zone="projects" icon="💻" label="View Projects" position={[0, 2.4, 0]} />
      </group>

      {/* Skills bookcase — collider x -6.2..-5.0, z -5.6..-3.4 (back against the left wall) */}
      <group position={[-6.1, FLOOR_Y, -4.5]}>
        <Bookcase />
        <ZonePrompt zone="skills" icon="⚡" label="Skill Proficiencies" position={[0.6, 3.4, 0]} />
      </group>

      {/* Experience / certificates console — collider x 3.2..5.8, z -10.2..-9.2 */}
      <group position={[4.5, FLOOR_Y, -9.8]}>
        <Certificates />
        <ZonePrompt zone="experience" icon="🏆" label="Quest Timeline" position={[0, 3.0, 0.2]} />
      </group>

      {/* Bed + sleeping cat — collider x 2.8..5.8, z -5.2..-2.4 */}
      <group position={[4.2, FLOOR_Y, -3.8]}>
        <Bed />
        <ZonePrompt zone="bed" icon="🐱" label="Pet Byte The Cat" position={[0, 2.0, 0.6]} />
      </group>

      {/* Mailbox — collider x 1.2..2.0, z 10.4..11.2 */}
      <group position={[1.6, 0, 10.8]}>
        <Mailbox />
        <ZonePrompt zone="contact" icon="📫" label="Post Office & Mail" position={[0, 2.2, 0]} />
      </group>

      {/* Garden bench — collider x -8.8..-6.2, z 3.8..5.2 */}
      <group position={[-7.5, 0, 4.5]} rotation={[0, Math.PI / 4, 0]}>
        <Bench />
        <ZonePrompt zone="about" icon="☕" label="About Me & Log" position={[0, 1.8, 0]} />
      </group>
    </group>
  );
};
