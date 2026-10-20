import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { textureGen } from '../../utils/textures';

/**
 * Rich, alive countryside landscape with winding country road, river dock & rowboat,
 * arched footbridge, wooden farm cart & hay bales, cozy campsite, stone wishing well,
 * grazing sheep, weeping willows, birch trees, and drifting hot air balloon.
 */
export const Scenery: React.FC = () => {
  const cloudsRef = useRef<THREE.Group>(null);
  const windmillRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.MeshStandardMaterial>(null);
  const boatRef = useRef<THREE.Group>(null);
  const balloonRef = useRef<THREE.Group>(null);

  const waterNormal = useMemo(() => {
    return textureGen.getWaterNormal();
  }, []);

  // Animate drifting clouds, windmill, water, boat bobbing, and hot air balloon
  useFrame((_, delta) => {
    const t = performance.now() * 0.001;

    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((cloud, i) => {
        cloud.position.x += delta * (0.8 + (i % 3) * 0.35);
        if (cloud.position.x > 110) {
          cloud.position.x = -110;
        }
      });
    }

    if (windmillRef.current) {
      windmillRef.current.rotation.z += delta * 1.2;
    }

    if (waterNormal) {
      waterNormal.offset.y += delta * 0.10;
      waterNormal.offset.x += delta * 0.03;
    }

    // Gentle boat bobbing in water
    if (boatRef.current) {
      boatRef.current.position.y = 0.06 + Math.sin(t * 1.8) * 0.025;
      boatRef.current.rotation.z = Math.sin(t * 1.4) * 0.04;
      boatRef.current.rotation.x = Math.cos(t * 1.2) * 0.03;
    }

    // Gentle hot air balloon drift
    if (balloonRef.current) {
      balloonRef.current.position.y = 44 + Math.sin(t * 0.5) * 1.2;
      balloonRef.current.position.x = 42 + Math.cos(t * 0.2) * 2.5;
    }
  });

  // Distant mountain ridges
  const mountains = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: number }[] = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 95 + ((i * 37) % 25);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const height = 22 + ((i * 23) % 18);
      const width = 24 + ((i * 19) % 16);
      list.push({
        pos: [x, height / 2 - 3, z],
        scale: [width, height, width],
        rot: angle + ((i % 4) * 0.25),
      });
    }
    return list;
  }, []);

  // Middle-distance rolling hills
  const rollingHills = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; color: string }[] = [];
    const hillData: [number, number, number, number, number, string][] = [
      [-65, -70, 35, 12, 35, '#166534'],
      [70, -75, 40, 14, 40, '#15803d'],
      [-75, 20, 38, 11, 38, '#166534'],
      [78, 30, 42, 13, 42, '#15803d'],
      [-50, 80, 36, 10, 36, '#166534'],
      [55, 82, 38, 11, 38, '#15803d'],
      [0, -85, 45, 15, 45, '#14532d'],
      [0, 88, 42, 12, 42, '#166534'],
      [-82, -30, 36, 10, 36, '#15803d'],
      [85, -25, 40, 12, 40, '#166534'],
    ];
    hillData.forEach(([x, z, sx, sy, sz, color]) => {
      list.push({ pos: [x, sy / 2 - 4, z], scale: [sx, sy, sz], color });
    });
    return list;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Natural Flowing River with Pebble Banks */}
      <mesh receiveShadow position={[-30, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[16, 180]} />
        <meshStandardMaterial color="#57534e" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh receiveShadow position={[-23, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[4.5, 180]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh receiveShadow position={[-37, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[4.5, 180]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh receiveShadow position={[-30, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[12, 175]} />
        <meshStandardMaterial
          ref={waterRef}
          color="#0284c7"
          normalMap={waterNormal}
          roughness={0.08}
          metalness={0.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 2. Country Road from Front Gate winding into the Hills */}
      <CountryRoad />

      {/* 3. Wooden Fingerpost / Road Signpost */}
      <RoadSignpost position={[2.4, 0, 14.5]} />

      {/* 4. River Wooden Pier with Moored Rowboat & Fishing Rod */}
      <RiverDock boatRef={boatRef} />

      {/* 5. Arched Wooden Footbridge across the River */}
      <RiverBridge position={[-30, 0.2, -22]} rotation={[0, 0.18, 0]} />

      {/* 6. Countryside Hay Bales & Antique Wooden Cart */}
      <HayBalesAndCart position={[18, 0, 22]} />

      {/* 7. Cozy Meadow Campsite with Canvas Tent & Campfire */}
      <MeadowCampsite position={[30, 0, 16]} />

      {/* 8. Rustic Stone Wishing Well with Wooden Canopy */}
      <WishingWell position={[-16, 0, 16]} />

      {/* 9. Peaceful Grazing Sheep in the Pasture */}
      <GrazingSheep position={[-18, 0, 32]} rotation={[0, 0.6, 0]} />
      <GrazingSheep position={[-15, 0, 35]} rotation={[0, -0.8, 0]} isEating />
      <GrazingSheep position={[24, 0, 36]} rotation={[0, -0.4, 0]} />
      <GrazingSheep position={[27, 0, 33]} rotation={[0, 1.2, 0]} isEating />

      {/* 10. Floating Colorful Hot Air Balloon in the Sky */}
      <HotAirBalloon ref={balloonRef} position={[42, 44, -22]} />

      {/* 11. Countryside Trees (Weeping Willows by River & Birch Trees in Meadow) */}
      <CountrysideTrees />

      {/* 12. Rolling Countryside Hills */}
      {rollingHills.map((hill, i) => (
        <mesh key={i} receiveShadow position={hill.pos} scale={hill.scale}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color={hill.color} roughness={0.95} metalness={0.0} />
        </mesh>
      ))}

      {/* 13. Distant Mountain Peaks on Horizon */}
      {mountains.map((m, i) => (
        <group key={i} position={m.pos} scale={m.scale} rotation={[0, m.rot, 0]}>
          <mesh  receiveShadow>
            <coneGeometry args={[1, 1, 7]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#14532d' : '#0f3d21'}
              roughness={0.95}
              metalness={0.0}
            />
          </mesh>
          <mesh position={[0, 0.3, 0]} scale={[0.55, 0.45, 0.55]}>
            <coneGeometry args={[1, 1, 7]} />
            <meshStandardMaterial color="#064e3b" roughness={0.95} metalness={0.0} />
          </mesh>
        </group>
      ))}

      {/* 14. East Hill Windmill */}
      <group position={[62, 7, -35]} scale={[1.6, 1.6, 1.6]}>
        <mesh  receiveShadow position={[0, 2.5, 0]}>
          <cylinderGeometry args={[1.0, 1.5, 5.0, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.75} />
        </mesh>
        <mesh  position={[0, 5.6, 0]}>
          <coneGeometry args={[1.2, 1.3, 8]} />
          <meshStandardMaterial color="#991b1b" roughness={0.6} />
        </mesh>
        <group ref={windmillRef} position={[0, 4.6, 1.15]}>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.25, 8]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((bladeRot, bIdx) => (
            <mesh key={bIdx} position={[0, 0, 0]} rotation={[0, 0, bladeRot]}>
              <boxGeometry args={[0.24, 3.2, 0.04]} />
              <meshStandardMaterial color="#fde68a" roughness={0.6} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 15. Distant Village Cottages */}
      <group position={[52, 0, 42]}>
        <DistantCottage position={[0, 0, 0]} roofColor="#991b1b" wallColor="#fef3c7" />
        <DistantCottage position={[7, 0, -4]} roofColor="#713f12" wallColor="#f1f5f9" />
        <DistantCottage position={[4, 0, 6]} roofColor="#312e81" wallColor="#fce7f3" />
      </group>

      {/* 16. Drifting Clouds */}
      <group ref={cloudsRef}>
        <CloudItem position={[-65, 24, -40]} scale={1.9} />
        <CloudItem position={[-25, 30, -70]} scale={2.5} />
        <CloudItem position={[40, 26, -50]} scale={2.1} />
        <CloudItem position={[-50, 28, 30]} scale={2.0} />
        <CloudItem position={[55, 27, 35]} scale={2.3} />
        <CloudItem position={[15, 34, 70]} scale={2.6} />
        <CloudItem position={[-75, 22, 55]} scale={2.8} />
        <CloudItem position={[70, 32, -25]} scale={2.2} />
      </group>
    </group>
  );
};

// Curving Country Dirt Road leading away from front gate
const CountryRoad: React.FC = () => {
  const roadSegments = useMemo(() => {
    const list: { pos: [number, number, number]; rot: number; width: number }[] = [];
    for (let z = 12.8; z <= 52; z += 2.2) {
      const progress = (z - 12.8) / 39.2;
      const x = Math.sin(progress * Math.PI * 1.5) * 6.5;
      const nextX = Math.sin(((progress + 0.05) * Math.PI * 1.5)) * 6.5;
      const rot = Math.atan2(nextX - x, 2.2);
      list.push({ pos: [x, 0.015, z], rot, width: 2.6 - progress * 0.4 });
    }
    return list;
  }, []);

  return (
    <group>
      {roadSegments.map((seg, idx) => (
        <group key={idx} position={seg.pos} rotation={[0, seg.rot, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[seg.width, 2.4]} />
            <meshStandardMaterial color="#a88b68" roughness={0.95} />
          </mesh>
          {/* Subtle roadside pebbles */}
          {idx % 3 === 0 && (
            <mesh position={[seg.width / 2 + 0.15, 0.03, 0]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color="#78716c" roughness={0.9} />
            </mesh>
          )}
        </group>
      ))}

      {/* Rustic Split-Rail Fencing along road edge */}
      {[16, 22, 28, 34, 40].map((fz, i) => (
        <group key={i} position={[-2.2 - Math.sin(i * 0.5) * 1.5, 0, fz]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.9, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0.8, 0.65, 0.8]} rotation={[0, 0.6, 0]}>
            <boxGeometry args={[1.8, 0.08, 0.06]} />
            <meshStandardMaterial color="#92400e" roughness={0.85} />
          </mesh>
          <mesh position={[0.8, 0.35, 0.8]} rotation={[0, 0.6, 0]}>
            <boxGeometry args={[1.8, 0.08, 0.06]} />
            <meshStandardMaterial color="#92400e" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Wooden Fingerpost / Road Signpost outside gate
const RoadSignpost: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Vertical Post */}
      <mesh  position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 1.8, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Stone base footing */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Sign 1: IIT Jodhpur (Pointing Left) */}
      <group position={[-0.4, 1.55, 0]} rotation={[0, 0.25, 0]}>
        <mesh >
          <boxGeometry args={[0.9, 0.2, 0.04]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.14, 0.14, 0.04]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
      </group>
      {/* Sign 2: River Pier (Pointing Right) */}
      <group position={[0.4, 1.25, 0]} rotation={[0, -0.4, 0]}>
        <mesh >
          <boxGeometry args={[0.85, 0.18, 0.04]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.13, 0.13, 0.04]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
      </group>
      {/* Sign 3: Windmill Ridge (Pointing South) */}
      <group position={[0.35, 0.95, 0.05]} rotation={[0, 0.8, 0]}>
        <mesh >
          <boxGeometry args={[0.8, 0.16, 0.04]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// River Wooden Pier with Moored Rowboat, Fishing Bucket, and Water Lilies
const RiverDock: React.FC<{ boatRef: React.RefObject<THREE.Group> }> = ({ boatRef }) => {
  return (
    <group position={[-23.5, 0, 5]}>
      {/* Wooden Plank Pier / Jetty */}
      <group position={[-2.2, 0.2, 0]}>
        {/* Pier Deck Planks */}
        <RoundedBox args={[4.8, 0.12, 1.8]} radius={0.03} smoothness={3}  receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </RoundedBox>
        {/* Supporting Timber Pilings in Water */}
        {[[-2.1, -0.8], [-2.1, 0.8], [0, -0.8], [0, 0.8], [2.1, -0.8], [2.1, 0.8]].map(([px, pz], idx) => (
          <mesh key={idx} position={[px, -0.35, pz]} >
            <cylinderGeometry args={[0.09, 0.09, 0.8, 8]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        ))}
        {/* Mooring Bollards */}
        <mesh position={[-2.2, 0.2, -0.7]} >
          <cylinderGeometry args={[0.08, 0.09, 0.35, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-2.2, 0.2, 0.7]} >
          <cylinderGeometry args={[0.08, 0.09, 0.35, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Fisherman's Bucket & Fishing Rod */}
        <group position={[-1.2, 0.2, 0.6]}>
          <mesh >
            <cylinderGeometry args={[0.14, 0.11, 0.26, 12]} />
            <meshStandardMaterial color="#0284c7" roughness={0.5} />
          </mesh>
          <mesh position={[0.3, 0.45, 0]} rotation={[0, 0, -0.6]} >
            <cylinderGeometry args={[0.015, 0.025, 1.4, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Moored Wooden Rowboat gently bobbing in water */}
      <group ref={boatRef} position={[-5.4, 0.06, 0]} rotation={[0, 0.15, 0]}>
        {/* Boat Hull Outer */}
        <RoundedBox args={[3.2, 0.42, 1.2]} radius={0.12} smoothness={4} >
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </RoundedBox>
        {/* Boat Interior Cavity */}
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[2.8, 0.3, 0.95]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Wooden Seating Thwarts */}
        <mesh position={[-0.7, 0.15, 0]}>
          <boxGeometry args={[0.3, 0.05, 0.95]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        <mesh position={[0.7, 0.15, 0]}>
          <boxGeometry args={[0.3, 0.05, 0.95]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        {/* Pair of Wooden Oars inside boat */}
        <mesh position={[0.1, 0.2, -0.2]} rotation={[0.1, 0.3, 0.05]}>
          <cylinderGeometry args={[0.02, 0.02, 2.0, 8]} />
          <meshStandardMaterial color="#fde68a" roughness={0.6} />
        </mesh>
        <mesh position={[0.1, 0.2, 0.2]} rotation={[-0.1, -0.3, 0.05]}>
          <cylinderGeometry args={[0.02, 0.02, 2.0, 8]} />
          <meshStandardMaterial color="#fde68a" roughness={0.6} />
        </mesh>
      </group>

      {/* Floating Water Lily Pads with Pink Lotus Flowers */}
      {[[ -3.5, 2.2 ], [ -4.8, 2.8 ], [ -6.2, -2.4 ], [ -3.8, -2.8 ]].map(([lx, lz], idx) => (
        <group key={idx} position={[lx, 0.05, lz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35 + (idx % 2) * 0.1, 16]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          {idx % 2 === 0 && (
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#f472b6" roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

// Arched Wooden Footbridge across the River
const RiverBridge: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
  position, rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Arched Bridge Deck */}
      <group position={[0, 0.9, 0]}>
        <mesh  receiveShadow rotation={[0, 0, 0]}>
          <boxGeometry args={[13.5, 0.25, 2.2]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Arched Under-Support Stringers */}
        <mesh position={[0, -0.4, -0.9]} >
          <cylinderGeometry args={[6.8, 6.8, 0.2, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.4, 0.9]} >
          <cylinderGeometry args={[6.8, 6.8, 0.2, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} />
        </mesh>
        {/* Bridge Side Railings */}
        {[-5.5, -3.0, 0, 3.0, 5.5].map((rx, idx) => (
          <group key={idx}>
            <mesh position={[rx, 0.55, -1.05]} >
              <cylinderGeometry args={[0.06, 0.06, 0.85, 8]} />
              <meshStandardMaterial color="#92400e" roughness={0.7} />
            </mesh>
            <mesh position={[rx, 0.55, 1.05]} >
              <cylinderGeometry args={[0.06, 0.06, 0.85, 8]} />
              <meshStandardMaterial color="#92400e" roughness={0.7} />
            </mesh>
          </group>
        ))}
        {/* Top Handrail Bars */}
        <mesh position={[0, 0.95, -1.05]} >
          <boxGeometry args={[13.6, 0.1, 0.12]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.95, 1.05]} >
          <boxGeometry args={[13.6, 0.1, 0.12]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// Countryside Hay Bales & Farm Cart
const HayBalesAndCart: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* 4 Golden Cylindrical Straw Bales with Twine */}
      {[
        [0, 0.5, 0, 0],
        [1.8, 0.5, 0.4, 0.3],
        [-1.6, 0.5, -0.3, -0.2],
        [0.8, 1.4, 0.2, 0.1], // Stacked bale on top
      ].map(([hx, hy, hz, hrot], idx) => (
        <group key={idx} position={[hx, hy, hz]} rotation={[0, hrot, 0]}>
          <mesh  rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.55, 0.55, 1.3, 16]} />
            <meshStandardMaterial color="#eab308" roughness={0.9} />
          </mesh>
          {/* Tied Twine Bands */}
          <mesh position={[0, -0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.56, 0.56, 0.05, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.56, 0.56, 0.05, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Antique Two-Wheeled Wooden Farm Cart */}
      <group position={[-2.8, 0.45, 1.6]} rotation={[0, 0.6, 0]}>
        {/* Cart Wooden Box Bed */}
        <mesh  position={[0, 0.35, 0]}>
          <boxGeometry args={[1.8, 0.4, 1.1]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Spoked Left Wheel */}
        <mesh position={[0, 0.1, -0.65]} rotation={[Math.PI / 2, 0, 0]} >
          <torusGeometry args={[0.42, 0.05, 8, 16]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        {/* Spoked Right Wheel */}
        <mesh position={[0, 0.1, 0.65]} rotation={[Math.PI / 2, 0, 0]} >
          <torusGeometry args={[0.42, 0.05, 8, 16]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        {/* Cart Pulling Handles Resting on Ground */}
        <mesh position={[-1.3, -0.15, -0.3]} rotation={[0, 0, 0.3]} >
          <boxGeometry args={[1.2, 0.06, 0.06]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
        <mesh position={[-1.3, -0.15, 0.3]} rotation={[0, 0, 0.3]} >
          <boxGeometry args={[1.2, 0.06, 0.06]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
      </group>
    </group>
  );
};

// Cozy Campsite with Triangular Canvas Tent & Log Campfire
const MeadowCampsite: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Triangular Canvas A-Frame Tent */}
      <group position={[0, 0.9, 0]} rotation={[0, 0.4, 0]}>
        <mesh >
          <coneGeometry args={[1.8, 1.8, 3]} />
          <meshStandardMaterial color="#fef08a" roughness={0.8} />
        </mesh>
        {/* Tent Dark Entrance Flap */}
        <mesh position={[0, -0.2, 0.72]}>
          <planeGeometry args={[0.9, 1.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* Campfire Ring of River Stones & Embers */}
      <group position={[2.6, 0.08, 0.5]}>
        {/* Stone Ring */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((sIdx) => {
          const sAngle = (sIdx / 8) * Math.PI * 2;
          return (
            <mesh key={sIdx} position={[Math.cos(sAngle) * 0.55, 0, Math.sin(sAngle) * 0.55]} >
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color="#57534e" roughness={0.9} />
            </mesh>
          );
        })}
        {/* Charred Wood Logs */}
        <mesh rotation={[0, 0.4, 0.2]}  position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, -0.5, -0.2]}  position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        {/* Warm Embers Glow */}
        <pointLight color="#f97316" intensity={0.9} distance={4} decay={2} />
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#fb923c" />
        </mesh>
      </group>

      {/* Split Log Benches */}
      <mesh position={[2.6, 0.16, 1.6]} rotation={[0, 0, Math.PI / 2]} >
        <cylinderGeometry args={[0.16, 0.16, 1.4, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[3.6, 0.16, 0.4]} rotation={[Math.PI / 2, 0, 0]} >
        <cylinderGeometry args={[0.16, 0.16, 1.4, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Rustic Stone Wishing Well
const WishingWell: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Round River-Stone Base */}
      <mesh  receiveShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.9, 0.95, 0.9, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Dark Well Water Inside */}
      <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} />
      </mesh>
      {/* Timber Roof Posts */}
      <mesh position={[-0.8, 1.25, 0]} >
        <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0.8, 1.25, 0]} >
        <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Pitched Wooden Canopy Roof */}
      <group position={[0, 2.1, 0]}>
        <mesh position={[-0.45, 0.2, 0]} rotation={[0, 0, Math.PI / 5]} >
          <boxGeometry args={[1.2, 0.08, 1.6]} />
          <meshStandardMaterial color="#991b1b" roughness={0.6} />
        </mesh>
        <mesh position={[0.45, 0.2, 0]} rotation={[0, 0, -Math.PI / 5]} >
          <boxGeometry args={[1.2, 0.08, 1.6]} />
          <meshStandardMaterial color="#991b1b" roughness={0.6} />
        </mesh>
      </group>
      {/* Suspended Wooden Bucket with Rope */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <mesh position={[0, 0.7, 0]} >
        <cylinderGeometry args={[0.14, 0.11, 0.24, 10]} />
        <meshStandardMaterial color="#92400e" roughness={0.7} />
      </mesh>
    </group>
  );
};

// Cute Low-Poly Fluffy Sheep Grazing in the Meadow
const GrazingSheep: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; isEating?: boolean }> = ({
  position, rotation = [0, 0, 0], isEating = false,
}) => {
  return (
    <group position={position} rotation={rotation} scale={[0.85, 0.85, 0.85]}>
      {/* Fluffy Woolly Body */}
      <RoundedBox args={[0.9, 0.65, 0.65]} radius={0.16} smoothness={4} position={[0, 0.55, 0]} >
        <meshStandardMaterial color="#f8fafc" roughness={0.95} />
      </RoundedBox>
      {/* Black Head & Ears */}
      <group position={[isEating ? 0.45 : 0.4, isEating ? 0.25 : 0.6, 0]} rotation={[0, 0, isEating ? -0.4 : 0]}>
        <RoundedBox args={[0.34, 0.32, 0.3]} radius={0.08} smoothness={3} >
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </RoundedBox>
        {/* Left Ear */}
        <mesh position={[0, 0.05, -0.18]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Right Ear */}
        <mesh position={[0, 0.05, 0.18]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
      {/* 4 Little Black Legs */}
      {[[-0.25, -0.2], [-0.25, 0.2], [0.25, -0.2], [0.25, 0.2]].map(([lx, lz], idx) => (
        <mesh key={idx} position={[lx, 0.15, lz]} >
          <cylinderGeometry args={[0.045, 0.045, 0.3, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}
      {/* Tiny Woolly Tail */}
      <mesh position={[-0.48, 0.6, 0]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Picturesque Hot Air Balloon Drifting in Sunny Sky
const HotAirBalloon = React.forwardRef<THREE.Group, { position: [number, number, number] }>(
  ({ position }, ref) => {
    return (
      <group ref={ref} position={position} scale={[1.8, 1.8, 1.8]}>
        {/* Teardrop Balloon Envelope */}
        <mesh  position={[0, 2.5, 0]}>
          <sphereGeometry args={[2.2, 24, 24]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        {/* Colorful Striped Rings */}
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[2.22, 2.22, 0.8, 24]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[2.24, 2.24, 0.3, 24]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.6} />
        </mesh>
        {/* Tapered Lower Skirt */}
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[1.1, 1.2, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.6} />
        </mesh>
        {/* Burner Flame Glow */}
        <pointLight color="#f97316" intensity={1.2} distance={8} decay={2} position={[0, 0.2, 0]} />
        {/* Rigging Ropes */}
        {[-0.35, 0.35].map((rx, idx) => (
          <mesh key={idx} position={[rx, -0.1, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        ))}
        {/* Wicker Passenger Basket */}
        <RoundedBox args={[0.7, 0.5, 0.7]} radius={0.06} smoothness={3} position={[0, -0.5, 0]} >
          <meshStandardMaterial color="#b45309" roughness={0.9} />
        </RoundedBox>
      </group>
    );
  }
);
HotAirBalloon.displayName = 'HotAirBalloon';

// Countryside Trees (Weeping Willows by River & Birch Trees in Meadow)
const CountrysideTrees: React.FC = () => {
  return (
    <group>
      {/* Weeping Willows along River Bank */}
      {[[-22, 14], [-23, -12], [-22, 28]].map(([wx, wz], idx) => (
        <group key={idx} position={[wx, 0, wz]}>
          {/* Gnarled Willow Trunk */}
          <mesh  position={[0, 1.5, 0]} rotation={[0.05, 0, -0.05]}>
            <cylinderGeometry args={[0.3, 0.5, 3.0, 8]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Drooping Willow Canopy */}
          <group position={[0, 3.2, 0]}>
            <mesh >
              <sphereGeometry args={[2.4, 12, 12]} />
              <meshStandardMaterial color="#4ade80" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[2.6, 2.2, 1.6, 12]} />
              <meshStandardMaterial color="#22c55e" roughness={0.85} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Birch Trees in Southern & Eastern Meadow */}
      {[[12, 34], [-8, 42], [28, 40], [38, 28]].map(([bx, bz], idx) => (
        <group key={idx} position={[bx, 0, bz]}>
          {/* Slender White Birch Trunk */}
          <mesh  position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.15, 0.22, 4.0, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          {/* Birch Dark Bark Rings */}
          {[0.8, 1.6, 2.4, 3.2].map((by, sIdx) => (
            <mesh key={sIdx} position={[0, by, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.06, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
          ))}
          {/* Golden/Lime Birch Leaf Foliage */}
          <group position={[0, 4.2, 0]}>
            <mesh >
              <sphereGeometry args={[1.6, 10, 10]} />
              <meshStandardMaterial color="#facc15" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.8, 0]} >
              <sphereGeometry args={[1.2, 10, 10]} />
              <meshStandardMaterial color="#fef08a" roughness={0.8} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

// Distant decorative cottage
const DistantCottage: React.FC<{ position: [number, number, number]; roofColor: string; wallColor: string }> = ({
  position, roofColor, wallColor,
}) => (
  <group position={position} scale={[1.4, 1.4, 1.4]}>
    <mesh  position={[0, 0.8, 0]}>
      <boxGeometry args={[2.0, 1.6, 1.6]} />
      <meshStandardMaterial color={wallColor} roughness={0.8} />
    </mesh>
    <mesh  position={[0, 2.0, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[1.7, 1.2, 4]} />
      <meshStandardMaterial color={roofColor} roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.45, 0.82]}>
      <boxGeometry args={[0.4, 0.7, 0.04]} />
      <meshStandardMaterial color="#78350f" roughness={0.8} />
    </mesh>
    <mesh position={[0.6, 2.8, -0.2]}>
      <boxGeometry args={[0.35, 0.6, 0.35]} />
      <meshStandardMaterial color="#57534e" roughness={0.9} />
    </mesh>
  </group>
);

// Volumetric cloud cluster
const CloudItem: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1.0 }) => {
  return (
    <group position={position} scale={[scale, scale * 0.55, scale]}>
      <mesh>
        <sphereGeometry args={[2.4, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[1.8, -0.3, 0.4]}>
        <sphereGeometry args={[1.8, 12, 12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[-1.7, -0.4, -0.2]}>
        <sphereGeometry args={[1.7, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[0.4, 0.5, -0.5]}>
        <sphereGeometry args={[1.6, 12, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[-0.8, -0.2, 0.8]}>
        <sphereGeometry args={[1.4, 10, 10]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.95} metalness={0.0} />
      </mesh>
    </group>
  );
};
